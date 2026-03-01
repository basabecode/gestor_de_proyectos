import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/utils';

const useWorkspaceStore = create(
  persist(
    (set, get) => ({
      workspaces: [
        {
          id: 'default',
          name: 'Espacio principal',
          icon: 'home',
          color: '#0073ea',
          createdAt: new Date().toISOString(),
        },
      ],
      activeWorkspaceId: 'default',

      createWorkspace: (data) => {
        const ws = {
          id: generateId('ws'),
          name: data.name || 'Nuevo espacio',
          icon: data.icon || 'folder',
          color: data.color || '#0073ea',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ workspaces: [...s.workspaces, ws] }));
        return ws;
      },

      updateWorkspace: (wsId, updates) => {
        set((s) => ({
          workspaces: s.workspaces.map((w) => (w.id === wsId ? { ...w, ...updates } : w)),
        }));
      },

      deleteWorkspace: (wsId) => {
        if (wsId === 'default') return;
        set((s) => ({
          workspaces: s.workspaces.filter((w) => w.id !== wsId),
          activeWorkspaceId: s.activeWorkspaceId === wsId ? 'default' : s.activeWorkspaceId,
        }));
      },

      setActiveWorkspace: (wsId) => {
        set({ activeWorkspaceId: wsId });
      },

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
      },
    }),
    {
      name: 'workos-workspaces',
      version: 1,
    }
  )
);

export default useWorkspaceStore;
