import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/utils';

const DEFAULT_MEMBERS = [
  { id: 'user-1', name: 'Admin', email: 'admin@workos.com', role: 'owner', avatar: null, color: '#0073ea' },
  { id: 'user-2', name: 'Ana García', email: 'ana@workos.com', role: 'admin', avatar: null, color: '#00c875' },
  { id: 'user-3', name: 'Carlos López', email: 'carlos@workos.com', role: 'member', avatar: null, color: '#e2445c' },
  { id: 'user-4', name: 'María Torres', email: 'maria@workos.com', role: 'member', avatar: null, color: '#a25ddc' },
  { id: 'user-5', name: 'Pedro Ruiz', email: 'pedro@workos.com', role: 'viewer', avatar: null, color: '#fdab3d' },
];

const useUserStore = create(
  persist(
    (set, get) => ({
      currentUser: DEFAULT_MEMBERS[0],
      teamMembers: DEFAULT_MEMBERS,
      preferences: {
        language: 'es',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        weekStart: 'monday',
        compactMode: false,
        showCompletedItems: true,
        defaultView: 'table',
        emailNotifications: true,
        pushNotifications: true,
        soundEnabled: true,
      },

      // Current user
      updateCurrentUser: (updates) => {
        set((s) => {
          const updated = { ...s.currentUser, ...updates };
          return {
            currentUser: updated,
            teamMembers: s.teamMembers.map((m) => (m.id === updated.id ? updated : m)),
          };
        });
      },

      // Team members
      addMember: (data) => {
        const member = {
          id: generateId('user'),
          name: data.name || 'Nuevo miembro',
          email: data.email || '',
          role: data.role || 'member',
          avatar: null,
          color: data.color || '#579bfc',
          joinedAt: new Date().toISOString(),
        };
        set((s) => ({ teamMembers: [...s.teamMembers, member] }));
        return member;
      },

      updateMember: (memberId, updates) => {
        set((s) => ({
          teamMembers: s.teamMembers.map((m) => (m.id === memberId ? { ...m, ...updates } : m)),
        }));
      },

      removeMember: (memberId) => {
        const { currentUser } = get();
        if (memberId === currentUser.id) return;
        set((s) => ({ teamMembers: s.teamMembers.filter((m) => m.id !== memberId) }));
      },

      // Preferences
      updatePreference: (key, value) => {
        set((s) => ({ preferences: { ...s.preferences, [key]: value } }));
      },

      resetPreferences: () => {
        set({
          preferences: {
            language: 'es',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
            weekStart: 'monday',
            compactMode: false,
            showCompletedItems: true,
            defaultView: 'table',
            emailNotifications: true,
            pushNotifications: true,
            soundEnabled: true,
          },
        });
      },
    }),
    {
      name: 'workos-user',
      version: 1,
    }
  )
);

export default useUserStore;
