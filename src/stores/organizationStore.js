import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

const useOrganizationStore = create((set, get) => ({
  organization: null,
  members:      [],
  loading:      false,
  error:        null,

  // ── Fetch ──────────────────────────────────────────────────────────────────

  fetchOrganization: async (orgId) => {
    if (!orgId) return;
    set({ loading: true, error: null });

    const [{ data: org, error: orgErr }, { data: members }] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      supabase
        .from('organization_members')
        .select('*, profiles(id, full_name, avatar_url, color)')
        .eq('organization_id', orgId),
    ]);

    if (orgErr) { set({ error: orgErr.message, loading: false }); return; }
    set({ organization: org || null, members: members || [], loading: false });
  },

  // ── CRUD ───────────────────────────────────────────────────────────────────

  updateOrganization: async (orgId, updates) => {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();

    if (!error && data) set({ organization: data });
    return { data, error };
  },

  addMember: async (orgId, userId, role = 'member') => {
    const { data, error } = await supabase
      .from('organization_members')
      .insert({ organization_id: orgId, user_id: userId, role })
      .select('*, profiles(id, full_name, avatar_url, color)')
      .single();

    if (!error && data) {
      set((s) => ({ members: [...s.members, data] }));
    }
    return { data, error };
  },

  updateMemberRole: async (orgId, userId, role) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('organization_id', orgId)
      .eq('user_id', userId);

    if (!error) {
      set((s) => ({
        members: s.members.map((m) =>
          m.user_id === userId ? { ...m, role } : m
        ),
      }));
    }
    return { error };
  },

  removeMember: async (orgId, userId) => {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', userId);

    if (!error) {
      set((s) => ({ members: s.members.filter((m) => m.user_id !== userId) }));
    }
    return { error };
  },

  reset: () => set({ organization: null, members: [], loading: false, error: null }),
}));

export default useOrganizationStore;
