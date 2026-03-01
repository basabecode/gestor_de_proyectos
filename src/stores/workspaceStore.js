import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

const useWorkspaceStore = create((set, get) => ({
  workspaces:        [],
  activeWorkspaceId: null,
  loading:           false,
  error:             null,

  // Cargar workspaces del usuario autenticado
  fetchWorkspaces: async () => {
    set({ loading: true, error: null })

    // 1. Obtener las membresías del usuario (sin join recursivo)
    const { data: memberships, error: mErr } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')

    if (mErr) { set({ error: mErr.message, loading: false }); return }
    if (!memberships || memberships.length === 0) {
      set({ workspaces: [], loading: false }); return
    }

    // 2. Obtener los workspaces por IDs
    const ids = memberships.map((m) => m.workspace_id)
    const { data: wsData, error: wsErr } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: true })

    if (wsErr) { set({ error: wsErr.message, loading: false }); return }

    const roleMap = Object.fromEntries(memberships.map((m) => [m.workspace_id, m.role]))
    const workspaces = (wsData || []).map((ws) => ({ ...ws, role: roleMap[ws.id] || 'member' }))

    const activeId = get().activeWorkspaceId || workspaces[0]?.id || null
    set({ workspaces, activeWorkspaceId: activeId, loading: false })
  },

  // Crear workspace y agregarse como owner
  createWorkspace: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: ws, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name:        data.name  || 'Nuevo espacio',
        description: data.description || '',
        color:       data.color || '#0073ea',
        icon:        data.icon  || 'Layout',
        owner_id:    user.id,
      })
      .select()
      .single()

    if (wsError) { set({ error: wsError.message }); return null }

    // Agregar al usuario como owner en workspace_members
    await supabase.from('workspace_members').insert({
      workspace_id: ws.id,
      user_id:      user.id,
      role:         'owner',
    })

    set((s) => ({
      workspaces: [...s.workspaces, { ...ws, role: 'owner' }],
      activeWorkspaceId: s.activeWorkspaceId || ws.id,
    }))
    return ws
  },

  // Crear workspace inicial si el usuario no tiene ninguno
  ensureDefaultWorkspace: async () => {
    const { workspaces } = get()
    if (workspaces.length > 0) return workspaces[0]

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return await get().createWorkspace({
      name:  'Mi espacio de trabajo',
      color: '#0073ea',
      icon:  'Layout',
    })
  },

  updateWorkspace: async (wsId, updates) => {
    const { error } = await supabase
      .from('workspaces')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', wsId)

    if (error) { set({ error: error.message }); return }

    set((s) => ({
      workspaces: s.workspaces.map((w) => w.id === wsId ? { ...w, ...updates } : w),
    }))
  },

  deleteWorkspace: async (wsId) => {
    const { error } = await supabase.from('workspaces').delete().eq('id', wsId)
    if (error) { set({ error: error.message }); return }

    set((s) => {
      const remaining = s.workspaces.filter((w) => w.id !== wsId)
      return {
        workspaces:        remaining,
        activeWorkspaceId: s.activeWorkspaceId === wsId ? (remaining[0]?.id || null) : s.activeWorkspaceId,
      }
    })
  },

  setActiveWorkspace: (wsId) => set({ activeWorkspaceId: wsId }),

  getActiveWorkspace: () => {
    const { workspaces, activeWorkspaceId } = get()
    return workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null
  },

  reset: () => set({ workspaces: [], activeWorkspaceId: null, loading: false, error: null }),
}))

export default useWorkspaceStore
