import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

const useUserStore = create(
  persist(
    (set, get) => ({
      // currentUser se sincroniza desde authStore.profile
      currentUser: null,
      // teamMembers se cargan desde workspace_members
      teamMembers: [],
      preferences: {
        language:             'es',
        dateFormat:           'DD/MM/YYYY',
        timeFormat:           '24h',
        weekStart:            'monday',
        compactMode:          false,
        showCompletedItems:   true,
        defaultView:          'table',
        emailNotifications:   true,
        pushNotifications:    true,
        soundEnabled:         true,
      },

      // Sincronizar el usuario actual desde el perfil de Supabase
      syncFromProfile: (profile) => {
        if (!profile) return
        set({
          currentUser: {
            id:        profile.id,
            name:      profile.full_name || 'Usuario',
            email:     profile.email || '',
            role:      profile.role  || 'member',
            avatar:    profile.avatar_url || null,
            color:     profile.color      || '#579bfc',
          },
        })
      },

      // Cargar miembros del workspace desde Supabase
      fetchTeamMembers: async (workspaceId) => {
        if (!workspaceId) return
        const { data, error } = await supabase
          .from('workspace_members')
          .select('role, profiles(*)')
          .eq('workspace_id', workspaceId)

        if (error || !data) return

        const members = data.map((row) => ({
          id:     row.profiles.id,
          name:   row.profiles.full_name  || 'Usuario',
          email:  row.profiles.email      || '',
          role:   row.role,
          avatar: row.profiles.avatar_url || null,
          color:  row.profiles.color      || '#579bfc',
        }))
        set({ teamMembers: members })
      },

      // Invitar miembro al workspace
      inviteMember: async (workspaceId, email, role = 'member') => {
        // Buscar el perfil por email
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single()

        if (!profile) return { error: 'Usuario no encontrado. Debe registrarse primero.' }

        const { error } = await supabase.from('workspace_members').insert({
          workspace_id: workspaceId,
          user_id:      profile.id,
          role,
        })
        if (error) return { error: error.message }

        await get().fetchTeamMembers(workspaceId)
        return { success: true }
      },

      removeMember: async (workspaceId, userId) => {
        const { currentUser } = get()
        if (userId === currentUser?.id) return
        await supabase.from('workspace_members')
          .delete()
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
        set((s) => ({ teamMembers: s.teamMembers.filter((m) => m.id !== userId) }))
      },

      updateCurrentUser: async (updates) => {
        const { currentUser } = get()
        if (!currentUser) return
        set((s) => ({ currentUser: { ...s.currentUser, ...updates } }))

        // Persistir en Supabase
        const dbUpdates = {}
        if (updates.name   !== undefined) dbUpdates.full_name  = updates.name
        if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar
        if (updates.color  !== undefined) dbUpdates.color      = updates.color
        if (Object.keys(dbUpdates).length > 0) {
          await supabase.from('profiles').update(dbUpdates).eq('id', currentUser.id)
        }
      },

      updatePreference: (key, value) => {
        set((s) => ({ preferences: { ...s.preferences, [key]: value } }))
      },

      resetPreferences: () => {
        set({
          preferences: {
            language:           'es',
            dateFormat:         'DD/MM/YYYY',
            timeFormat:         '24h',
            weekStart:          'monday',
            compactMode:        false,
            showCompletedItems: true,
            defaultView:        'table',
            emailNotifications: true,
            pushNotifications:  true,
            soundEnabled:       true,
          },
        })
      },
    }),
    {
      name: 'workos-user',
      version: 2,
      // Solo persistir preferencias; usuario y miembros vienen de Supabase
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
)

export default useUserStore
