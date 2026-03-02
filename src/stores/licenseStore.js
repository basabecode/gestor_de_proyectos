import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// Límites por plan (espejo de la DB — usados para validaciones en el cliente)
export const PLAN_LIMITS = {
  free_trial:  { maxUsers: 5,   maxBoards: 10,  maxItemsPerBoard: 200 },
  pro:         { maxUsers: 50,  maxBoards: 100, maxItemsPerBoard: 1000 },
  enterprise:  { maxUsers: 999, maxBoards: 999, maxItemsPerBoard: 9999 },
};

export const PLAN_LABELS = {
  free_trial: 'Free Trial',
  pro:        'Pro',
  enterprise: 'Enterprise',
};

const useLicenseStore = create((set, get) => ({
  license: null,
  loading: false,
  error:   null,

  // ── Fetch / validar ────────────────────────────────────────────────────────

  fetchLicense: async (organizationId) => {
    if (!organizationId) return;
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .rpc('validate_license', { org_id: organizationId });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    set({ license: data?.[0] ?? null, loading: false });
  },

  // ── Extender licencia (sin pago) ───────────────────────────────────────────

  extendLicense: async (organizationId, days, notes = '') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('extend_license', {
      org_id:     organizationId,
      extra_days: days,
      admin_id:   user.id,
      notes,
    });

    if (!error && data) {
      await get().fetchLicense(organizationId);
    }
    return !error;
  },

  // ── Selectores ─────────────────────────────────────────────────────────────

  isValid:      () => get().license?.is_valid  ?? true,
  daysLeft:     () => get().license?.days_left ?? 90,
  plan:         () => get().license?.plan      ?? 'free_trial',
  status:       () => get().license?.status    ?? 'active',
  maxBoards:    () => get().license?.max_boards ?? 10,
  maxUsers:     () => get().license?.max_users  ?? 5,

  isExpiringSoon: () => {
    const l = get().license;
    return l?.is_valid && l?.days_left <= 14;
  },

  // Feature gating: base para future Stripe tiers
  canUseFeature: (feature) => {
    const l = get().license;
    if (!l?.is_valid) return false;
    switch (feature) {
      // Features solo disponibles en planes Pro/Enterprise
      case 'advanced_analytics': return l.plan !== 'free_trial';
      case 'sso':                return l.plan === 'enterprise';
      case 'api_access':         return l.plan !== 'free_trial';
      // Todo lo demás disponible en free_trial
      default: return true;
    }
  },

  reset: () => set({ license: null, loading: false, error: null }),
}));

export default useLicenseStore;
