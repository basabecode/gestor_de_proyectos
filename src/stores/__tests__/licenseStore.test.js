import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase ─────────────────────────────────────────────────────────────
// vi.hoisted garantiza que rpcMock esté disponible cuando vi.mock se eleva (hoist)
const rpcMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    rpc: rpcMock,
  },
}));

import useLicenseStore, { PLAN_LIMITS, PLAN_LABELS } from '../licenseStore';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const ACTIVE_LICENSE = {
  is_valid:   true,
  plan:       'free_trial',
  status:     'active',
  started_at: '2025-01-01T00:00:00Z',
  expires_at: '2025-04-01T00:00:00Z',
  days_left:  45,
  max_users:  5,
  max_boards: 10,
  message:    'Licencia activa.',
};

const EXPIRED_LICENSE = {
  ...ACTIVE_LICENSE,
  is_valid:  false,
  status:    'expired',
  days_left: 0,
  message:   'Licencia expirada.',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function resetStore() {
  useLicenseStore.setState({ license: null, loading: false, error: null });
}

// ═════════════════════════════════════════════════════════════════════════════
describe('licenseStore', () => {

  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  // ── fetchLicense ────────────────────────────────────────────────────────────
  describe('fetchLicense', () => {
    it('llama a RPC validate_license con el org_id correcto', async () => {
      rpcMock.mockResolvedValue({ data: [ACTIVE_LICENSE], error: null });
      await useLicenseStore.getState().fetchLicense('org-1');
      expect(rpcMock).toHaveBeenCalledWith('validate_license', { org_id: 'org-1' });
    });

    it('guarda la licencia en el estado', async () => {
      rpcMock.mockResolvedValue({ data: [ACTIVE_LICENSE], error: null });
      await useLicenseStore.getState().fetchLicense('org-1');
      expect(useLicenseStore.getState().license).toEqual(ACTIVE_LICENSE);
    });

    it('no hace nada si no se pasa orgId', async () => {
      await useLicenseStore.getState().fetchLicense(null);
      expect(rpcMock).not.toHaveBeenCalled();
    });

    it('guarda el error si el RPC falla', async () => {
      rpcMock.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      await useLicenseStore.getState().fetchLicense('org-1');
      expect(useLicenseStore.getState().error).toBe('DB error');
      expect(useLicenseStore.getState().license).toBeNull();
    });

    it('establece loading=true durante la petición y false al terminar', async () => {
      let capturedLoading;
      rpcMock.mockImplementation(async () => {
        capturedLoading = useLicenseStore.getState().loading;
        return { data: [ACTIVE_LICENSE], error: null };
      });
      await useLicenseStore.getState().fetchLicense('org-1');
      expect(capturedLoading).toBe(true);
      expect(useLicenseStore.getState().loading).toBe(false);
    });
  });

  // ── Selectores con licencia activa ──────────────────────────────────────────
  describe('selectores — licencia activa', () => {
    beforeEach(() => {
      useLicenseStore.setState({ license: ACTIVE_LICENSE });
    });

    it('isValid() → true', () => {
      expect(useLicenseStore.getState().isValid()).toBe(true);
    });

    it('daysLeft() → 45', () => {
      expect(useLicenseStore.getState().daysLeft()).toBe(45);
    });

    it('plan() → "free_trial"', () => {
      expect(useLicenseStore.getState().plan()).toBe('free_trial');
    });

    it('status() → "active"', () => {
      expect(useLicenseStore.getState().status()).toBe('active');
    });

    it('maxBoards() → 10', () => {
      expect(useLicenseStore.getState().maxBoards()).toBe(10);
    });

    it('maxUsers() → 5', () => {
      expect(useLicenseStore.getState().maxUsers()).toBe(5);
    });

    it('isExpiringSoon() → false con 45 días restantes', () => {
      expect(useLicenseStore.getState().isExpiringSoon()).toBe(false);
    });

    it('isExpiringSoon() → true con ≤ 14 días restantes', () => {
      useLicenseStore.setState({ license: { ...ACTIVE_LICENSE, days_left: 7 } });
      expect(useLicenseStore.getState().isExpiringSoon()).toBe(true);
    });

    it('isExpiringSoon() → true con exactamente 14 días restantes', () => {
      useLicenseStore.setState({ license: { ...ACTIVE_LICENSE, days_left: 14 } });
      expect(useLicenseStore.getState().isExpiringSoon()).toBe(true);
    });
  });

  // ── Selectores con licencia expirada ────────────────────────────────────────
  describe('selectores — licencia expirada', () => {
    beforeEach(() => {
      useLicenseStore.setState({ license: EXPIRED_LICENSE });
    });

    it('isValid() → false', () => {
      expect(useLicenseStore.getState().isValid()).toBe(false);
    });

    it('daysLeft() → 0', () => {
      expect(useLicenseStore.getState().daysLeft()).toBe(0);
    });

    it('isExpiringSoon() → false (ya expiró)', () => {
      expect(useLicenseStore.getState().isExpiringSoon()).toBe(false);
    });
  });

  // ── Selectores sin licencia cargada ─────────────────────────────────────────
  describe('selectores — sin licencia (defaults)', () => {
    it('isValid() → true (optimista por defecto)', () => {
      expect(useLicenseStore.getState().isValid()).toBe(true);
    });

    it('daysLeft() → 90', () => {
      expect(useLicenseStore.getState().daysLeft()).toBe(90);
    });

    it('plan() → "free_trial"', () => {
      expect(useLicenseStore.getState().plan()).toBe('free_trial');
    });
  });

  // ── canUseFeature ────────────────────────────────────────────────────────────
  describe('canUseFeature', () => {
    it('retorna false si la licencia no es válida', () => {
      useLicenseStore.setState({ license: EXPIRED_LICENSE });
      expect(useLicenseStore.getState().canUseFeature('boards')).toBe(false);
    });

    it('bloquea advanced_analytics en free_trial', () => {
      useLicenseStore.setState({ license: ACTIVE_LICENSE });
      expect(useLicenseStore.getState().canUseFeature('advanced_analytics')).toBe(false);
    });

    it('permite advanced_analytics en plan pro', () => {
      useLicenseStore.setState({ license: { ...ACTIVE_LICENSE, plan: 'pro' } });
      expect(useLicenseStore.getState().canUseFeature('advanced_analytics')).toBe(true);
    });

    it('bloquea SSO en free_trial y pro', () => {
      useLicenseStore.setState({ license: ACTIVE_LICENSE });
      expect(useLicenseStore.getState().canUseFeature('sso')).toBe(false);
      useLicenseStore.setState({ license: { ...ACTIVE_LICENSE, plan: 'pro' } });
      expect(useLicenseStore.getState().canUseFeature('sso')).toBe(false);
    });

    it('permite SSO solo en enterprise', () => {
      useLicenseStore.setState({ license: { ...ACTIVE_LICENSE, plan: 'enterprise' } });
      expect(useLicenseStore.getState().canUseFeature('sso')).toBe(true);
    });

    it('bloquea api_access en free_trial', () => {
      useLicenseStore.setState({ license: ACTIVE_LICENSE });
      expect(useLicenseStore.getState().canUseFeature('api_access')).toBe(false);
    });

    it('permite api_access en pro y enterprise', () => {
      useLicenseStore.setState({ license: { ...ACTIVE_LICENSE, plan: 'pro' } });
      expect(useLicenseStore.getState().canUseFeature('api_access')).toBe(true);
      useLicenseStore.setState({ license: { ...ACTIVE_LICENSE, plan: 'enterprise' } });
      expect(useLicenseStore.getState().canUseFeature('api_access')).toBe(true);
    });

    it('permite features genéricas en cualquier plan válido', () => {
      useLicenseStore.setState({ license: ACTIVE_LICENSE });
      expect(useLicenseStore.getState().canUseFeature('boards')).toBe(true);
      expect(useLicenseStore.getState().canUseFeature('kanban')).toBe(true);
    });
  });

  // ── extendLicense ────────────────────────────────────────────────────────────
  describe('extendLicense', () => {
    it('llama a RPC extend_license con los parámetros correctos', async () => {
      rpcMock.mockResolvedValueOnce({ data: true, error: null });   // extend_license
      rpcMock.mockResolvedValueOnce({ data: [ACTIVE_LICENSE], error: null }); // validate_license
      useLicenseStore.setState({ license: ACTIVE_LICENSE });

      const result = await useLicenseStore.getState().extendLicense('org-1', 30, 'Extensión piloto');
      expect(rpcMock).toHaveBeenCalledWith('extend_license', {
        org_id:     'org-1',
        extra_days: 30,
        admin_id:   'user-1',
        notes:      'Extensión piloto',
      });
      expect(result).toBe(true);
    });

    it('retorna false si no hay usuario autenticado', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      const result = await useLicenseStore.getState().extendLicense('org-1', 30);
      expect(result).toBe(false);
    });
  });

  // ── reset ─────────────────────────────────────────────────────────────────────
  describe('reset', () => {
    it('limpia licencia y error', () => {
      useLicenseStore.setState({ license: ACTIVE_LICENSE, error: 'err' });
      useLicenseStore.getState().reset();
      expect(useLicenseStore.getState().license).toBeNull();
      expect(useLicenseStore.getState().error).toBeNull();
      expect(useLicenseStore.getState().loading).toBe(false);
    });
  });

  // ── PLAN_LIMITS ──────────────────────────────────────────────────────────────
  describe('PLAN_LIMITS', () => {
    it('define límites para todos los planes', () => {
      expect(PLAN_LIMITS.free_trial).toBeDefined();
      expect(PLAN_LIMITS.pro).toBeDefined();
      expect(PLAN_LIMITS.enterprise).toBeDefined();
    });

    it('free_trial tiene menos tableros que pro', () => {
      expect(PLAN_LIMITS.free_trial.maxBoards).toBeLessThan(PLAN_LIMITS.pro.maxBoards);
    });

    it('enterprise tiene más usuarios que pro', () => {
      expect(PLAN_LIMITS.enterprise.maxUsers).toBeGreaterThan(PLAN_LIMITS.pro.maxUsers);
    });
  });

  // ── PLAN_LABELS ──────────────────────────────────────────────────────────────
  describe('PLAN_LABELS', () => {
    it('tiene etiquetas legibles para todos los planes', () => {
      expect(PLAN_LABELS.free_trial).toBe('Free Trial');
      expect(PLAN_LABELS.pro).toBe('Pro');
      expect(PLAN_LABELS.enterprise).toBe('Enterprise');
    });
  });
});
