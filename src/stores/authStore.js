import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

const useAuthStore = create((set, get) => ({
  session:  null,
  user:     null,
  profile:  null,
  loading:  true,   // true hasta que conozcamos el estado de sesión inicial
  ready:    false,  // true cuando _onSignedIn completó (workspace + perfil listos)
  error:    null,

  initialize: async () => {
    // IMPORTANT: register the listener FIRST, before getSession().
    // Supabase fires INITIAL_SESSION synchronously from localStorage when the
    // listener is registered, so if we registered it after _onSignedIn we'd
    // get a double-fire that resets ready→false and repeats all DB queries.
    supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null

      // Silent token refresh — only update the session object, no reload
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        set({ session })
        return
      }

      if (event === 'SIGNED_OUT') {
        set({ session: null, user: null, loading: false, ready: false })
        get()._onSignedOut()
        return
      }

      // INITIAL_SESSION / SIGNED_IN
      // Guard: same user already loaded → just refresh the session token
      const { user: currentUser, ready } = get()
      if (user?.id && user.id === currentUser?.id && ready) {
        set({ session, loading: false })
        return
      }

      set({ session, user, loading: false, ready: false })
      if (user) await get()._onSignedIn(user)
    })

    // Validate session server-side. INITIAL_SESSION from the listener above
    // handles setting loading:false for us; this is just a safety net.
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) set({ loading: false })
    } catch {
      set({ loading: false })
    }
  },

  _onSignedIn: async (user) => {
    try {
      // Parallel: fetch profile + dynamic-import all stores at once
      const [
        ,
        { default: useUserStore },
        { default: useWorkspaceStore },
        { default: useOrganizationStore },
        { default: useLicenseStore },
      ] = await Promise.all([
        get().fetchProfile(user.id),
        import('./userStore'),
        import('./workspaceStore'),
        import('./organizationStore'),
        import('./licenseStore'),
      ])

      const profile = get().profile
      useUserStore.getState().syncFromProfile(profile)

      const orgId = profile?.organization_id

      // Parallel: workspace chain (fetchWorkspaces → ensureDefault)
      //           + org/license fetches (both need orgId from profile)
      const [ws] = await Promise.all([
        useWorkspaceStore.getState()
          .fetchWorkspaces()
          .then(() => useWorkspaceStore.getState().ensureDefaultWorkspace()),
        orgId
          ? Promise.all([
              useOrganizationStore.getState().fetchOrganization(orgId),
              useLicenseStore.getState().fetchLicense(orgId),
            ])
          : Promise.resolve(),
      ])

      if (ws?.id) useUserStore.getState().fetchTeamMembers(ws.id)
    } catch (err) {
      console.error('[authStore] _onSignedIn error:', err)
    } finally {
      set({ ready: true })
    }
  },

  _onSignedOut: async () => {
    set({ profile: null, ready: false })
    try {
      const { default: useWorkspaceStore }    = await import('./workspaceStore')
      const { default: useBoardStore }        = await import('./boardStore')
      const { default: useOrganizationStore } = await import('./organizationStore')
      const { default: useLicenseStore }      = await import('./licenseStore')
      useWorkspaceStore.getState().reset()
      useBoardStore.getState().reset?.()
      useOrganizationStore.getState().reset()
      useLicenseStore.getState().reset()
    } catch { /* silent */ }
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) set({ profile: data })
  },

  signIn: async (email, password) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ error: error.message }); throw error }
    return data
  },

  signUp: async (email, password, fullName) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) { set({ error: error.message }); throw error }
    return data
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null, ready: false })
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (!error && data) set({ profile: data })
    return { data, error }
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
