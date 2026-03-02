import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

const useAuthStore = create((set, get) => ({
  session:  null,
  user:     null,
  profile:  null,
  loading:  true,   // true hasta que initialize() termine
  ready:    false,  // true cuando _onSignedIn completó (workspace + perfil listos)
  error:    null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null
      set({ session, user, loading: false })
      if (user) await get()._onSignedIn(user)
    } catch {
      set({ loading: false })
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null
      // Siempre actualizar sesión inmediatamente
      set({ session, user, ready: false })
      if (user) {
        await get()._onSignedIn(user)
      } else {
        get()._onSignedOut()
      }
    })
  },

  _onSignedIn: async (user) => {
    try {
      await get().fetchProfile(user.id)
      const profile = get().profile

      const { default: useUserStore }        = await import('./userStore')
      const { default: useWorkspaceStore }   = await import('./workspaceStore')
      const { default: useOrganizationStore} = await import('./organizationStore')
      const { default: useLicenseStore }     = await import('./licenseStore')

      useUserStore.getState().syncFromProfile(profile)

      await useWorkspaceStore.getState().fetchWorkspaces()
      const ws = await useWorkspaceStore.getState().ensureDefaultWorkspace()
      if (ws?.id) useUserStore.getState().fetchTeamMembers(ws.id)

      // Cargar organización y licencia
      const orgId = profile?.organization_id
      if (orgId) {
        await Promise.all([
          useOrganizationStore.getState().fetchOrganization(orgId),
          useLicenseStore.getState().fetchLicense(orgId),
        ])
      }
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

  // Espera a que haya sesión activa (útil en LoginPage)
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
