import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

const usePortfolioStore = create((set, get) => ({
  portfolios: [],
  loading:    false,
  error:      null,

  // ── Fetch ──────────────────────────────────────────────────────────────────

  fetchPortfolios: async (workspaceId) => {
    if (!workspaceId) return;
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('portfolios')
      .select('*, programs(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) { set({ error: error.message, loading: false }); return; }
    set({ portfolios: data || [], loading: false });
  },

  // ── Portfolio CRUD ─────────────────────────────────────────────────────────

  createPortfolio: async (data) => {
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert(data)
      .select('*, programs(*)')
      .single();

    if (error) { set({ error: error.message }); return null; }
    set((s) => ({ portfolios: [...s.portfolios, portfolio] }));
    return portfolio;
  },

  updatePortfolio: async (id, updates) => {
    set((s) => ({
      portfolios: s.portfolios.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    }));
    await supabase.from('portfolios').update(updates).eq('id', id);
  },

  deletePortfolio: async (id) => {
    const { error } = await supabase.from('portfolios').delete().eq('id', id);
    if (error) { set({ error: error.message }); return; }
    set((s) => ({ portfolios: s.portfolios.filter((p) => p.id !== id) }));
  },

  // ── Program CRUD ───────────────────────────────────────────────────────────

  createProgram: async (portfolioId, data) => {
    const { data: program, error } = await supabase
      .from('programs')
      .insert({ ...data, portfolio_id: portfolioId })
      .select()
      .single();

    if (error) { set({ error: error.message }); return null; }
    set((s) => ({
      portfolios: s.portfolios.map((p) =>
        p.id === portfolioId
          ? { ...p, programs: [...(p.programs ?? []), program] }
          : p,
      ),
    }));
    return program;
  },

  updateProgram: async (portfolioId, programId, updates) => {
    set((s) => ({
      portfolios: s.portfolios.map((p) =>
        p.id === portfolioId
          ? {
              ...p,
              programs: (p.programs ?? []).map((pr) =>
                pr.id === programId ? { ...pr, ...updates } : pr,
              ),
            }
          : p,
      ),
    }));
    await supabase.from('programs').update(updates).eq('id', programId);
  },

  deleteProgram: async (portfolioId, programId) => {
    await supabase.from('programs').delete().eq('id', programId);
    set((s) => ({
      portfolios: s.portfolios.map((p) =>
        p.id === portfolioId
          ? { ...p, programs: (p.programs ?? []).filter((pr) => pr.id !== programId) }
          : p,
      ),
    }));
  },

  reset: () => set({ portfolios: [], loading: false, error: null }),
}));

export default usePortfolioStore;
