import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Risk score = probability × impact (1-25) */
export function riskScore(risk) {
  return risk.probability * risk.impact;
}

/** Colour tier based on score */
export function riskLevel(score) {
  if (score >= 15) return 'critical';   // 15-25 → red
  if (score >= 10) return 'high';       // 10-14 → orange
  if (score >= 5)  return 'medium';     // 5-9   → yellow
  return 'low';                          // 1-4   → green
}

export const RISK_LEVEL_COLORS = {
  critical: { bg: '#e2445c', light: '#fde8ec', label: 'Crítico'  },
  high:     { bg: '#ff642e', light: '#fef0ea', label: 'Alto'     },
  medium:   { bg: '#fdab3d', light: '#fef7e7', label: 'Medio'    },
  low:      { bg: '#00c875', light: '#e6faf3', label: 'Bajo'     },
};

export const RISK_STATUS_LABELS = {
  identified: 'Identificado',
  assessed:   'Evaluado',
  mitigated:  'Mitigado',
  closed:     'Cerrado',
};

// ── Store ─────────────────────────────────────────────────────────────────────

const useRiskStore = create((set, get) => ({
  risks:   [],
  loading: false,
  error:   null,

  // ── Fetch ─────────────────────────────────────────────────────────────────

  fetchRisks: async (boardId) => {
    if (!boardId) return;
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('risks')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });

    if (error) { set({ error: error.message, loading: false }); return; }
    set({ risks: data || [], loading: false });
  },

  // ── CRUD ──────────────────────────────────────────────────────────────────

  createRisk: async (data) => {
    const { data: risk, error } = await supabase
      .from('risks')
      .insert(data)
      .select()
      .single();

    if (error) { set({ error: error.message }); return null; }
    set((s) => ({ risks: [...s.risks, risk] }));
    return risk;
  },

  updateRisk: async (id, updates) => {
    set((s) => ({
      risks: s.risks.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
    const { error } = await supabase.from('risks').update(updates).eq('id', id);
    if (error) set({ error: error.message });
  },

  deleteRisk: async (id) => {
    const { error } = await supabase.from('risks').delete().eq('id', id);
    if (error) { set({ error: error.message }); return; }
    set((s) => ({ risks: s.risks.filter((r) => r.id !== id) }));
  },

  reset: () => set({ risks: [], loading: false, error: null }),
}));

export default useRiskStore;
