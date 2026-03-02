import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const ORG = { id: 'org-1', name: 'Acme Corp', slug: 'acme', owner_id: 'user-1' };
const MEMBER = {
  id:      'm1',
  user_id: 'user-1',
  role:    'owner',
  organization_id: 'org-1',
  profiles: { id: 'user-1', full_name: 'Ana García', avatar_url: null, color: '#0073ea' },
};

// ── Mock Supabase ─────────────────────────────────────────────────────────────
// Usamos una fábrica de mocks reutilizable por llamada
const makeMockBuilder = (finalValue) => {
  const builder = {
    select:  vi.fn().mockReturnThis(),
    insert:  vi.fn().mockReturnThis(),
    update:  vi.fn().mockReturnThis(),
    delete:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    single:  vi.fn().mockResolvedValue(finalValue),
    // Para consultas que no terminan en .single()
    then: (resolve) => Promise.resolve(finalValue).then(resolve),
  };
  return builder;
};

let orgBuilder;
let membersBuilder;
let fromCallCount = 0;

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'organizations')     return orgBuilder;
      if (table === 'organization_members') return membersBuilder;
      return makeMockBuilder({ data: null, error: null });
    }),
  },
}));

import useOrganizationStore from '../organizationStore';

function resetStore() {
  useOrganizationStore.setState({ organization: null, members: [], loading: false, error: null });
}

// ═════════════════════════════════════════════════════════════════════════════
describe('organizationStore', () => {

  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    fromCallCount = 0;
    orgBuilder     = makeMockBuilder({ data: ORG, error: null });
    membersBuilder = makeMockBuilder({ data: [MEMBER], error: null });
  });

  // ── fetchOrganization ───────────────────────────────────────────────────────
  describe('fetchOrganization', () => {
    it('no llama a Supabase si no hay orgId', async () => {
      const { supabase } = await import('@/lib/supabase');
      await useOrganizationStore.getState().fetchOrganization(null);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('guarda la organización en el estado', async () => {
      await useOrganizationStore.getState().fetchOrganization('org-1');
      expect(useOrganizationStore.getState().organization).toEqual(ORG);
    });

    it('guarda los miembros en el estado', async () => {
      await useOrganizationStore.getState().fetchOrganization('org-1');
      expect(useOrganizationStore.getState().members).toEqual([MEMBER]);
    });

    it('establece error si la organización no existe', async () => {
      orgBuilder = makeMockBuilder({ data: null, error: { message: 'Not found' } });
      await useOrganizationStore.getState().fetchOrganization('org-1');
      expect(useOrganizationStore.getState().error).toBe('Not found');
    });
  });

  // ── updateOrganization ──────────────────────────────────────────────────────
  describe('updateOrganization', () => {
    it('actualiza el nombre de la organización', async () => {
      const updatedOrg = { ...ORG, name: 'Acme Corp 2.0' };
      orgBuilder = makeMockBuilder({ data: updatedOrg, error: null });
      useOrganizationStore.setState({ organization: ORG });

      await useOrganizationStore.getState().updateOrganization('org-1', { name: 'Acme Corp 2.0' });
      expect(useOrganizationStore.getState().organization.name).toBe('Acme Corp 2.0');
    });

    it('retorna error si la actualización falla', async () => {
      orgBuilder = makeMockBuilder({ data: null, error: { message: 'Unauthorized' } });
      const { error } = await useOrganizationStore.getState().updateOrganization('org-1', {});
      expect(error).toEqual({ message: 'Unauthorized' });
    });
  });

  // ── addMember ───────────────────────────────────────────────────────────────
  describe('addMember', () => {
    it('añade el miembro al estado', async () => {
      const newMember = { ...MEMBER, id: 'm2', user_id: 'user-2', role: 'member' };
      membersBuilder = makeMockBuilder({ data: newMember, error: null });
      useOrganizationStore.setState({ members: [MEMBER] });

      await useOrganizationStore.getState().addMember('org-1', 'user-2', 'member');
      expect(useOrganizationStore.getState().members).toHaveLength(2);
    });

    it('no modifica el estado si hay error', async () => {
      membersBuilder = makeMockBuilder({ data: null, error: { message: 'Duplicate' } });
      useOrganizationStore.setState({ members: [MEMBER] });

      await useOrganizationStore.getState().addMember('org-1', 'user-2');
      expect(useOrganizationStore.getState().members).toHaveLength(1);
    });
  });

  // ── updateMemberRole ────────────────────────────────────────────────────────
  describe('updateMemberRole', () => {
    it('actualiza el rol del miembro en el estado', async () => {
      membersBuilder = makeMockBuilder({ error: null });
      useOrganizationStore.setState({ members: [MEMBER] });

      await useOrganizationStore.getState().updateMemberRole('org-1', 'user-1', 'admin');
      const updated = useOrganizationStore.getState().members.find((m) => m.user_id === 'user-1');
      expect(updated.role).toBe('admin');
    });
  });

  // ── removeMember ────────────────────────────────────────────────────────────
  describe('removeMember', () => {
    it('elimina al miembro del estado', async () => {
      membersBuilder = makeMockBuilder({ error: null });
      useOrganizationStore.setState({ members: [MEMBER] });

      await useOrganizationStore.getState().removeMember('org-1', 'user-1');
      expect(useOrganizationStore.getState().members).toHaveLength(0);
    });

    it('no elimina si hay error en Supabase', async () => {
      membersBuilder = makeMockBuilder({ error: { message: 'Forbidden' } });
      useOrganizationStore.setState({ members: [MEMBER] });

      await useOrganizationStore.getState().removeMember('org-1', 'user-1');
      expect(useOrganizationStore.getState().members).toHaveLength(1);
    });
  });

  // ── reset ────────────────────────────────────────────────────────────────────
  describe('reset', () => {
    it('limpia todo el estado', () => {
      useOrganizationStore.setState({ organization: ORG, members: [MEMBER], error: 'err' });
      useOrganizationStore.getState().reset();
      expect(useOrganizationStore.getState().organization).toBeNull();
      expect(useOrganizationStore.getState().members).toHaveLength(0);
      expect(useOrganizationStore.getState().error).toBeNull();
    });
  });
});
