import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/utils';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (data) => {
        const notification = {
          id: generateId('notif'),
          type: data.type || 'info', // info | mention | assignment | automation | overdue | comment
          title: data.title || '',
          message: data.message || '',
          boardId: data.boardId || null,
          itemId: data.itemId || null,
          itemTitle: data.itemTitle || null,
          author: data.author || 'Sistema',
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          notifications: [notification, ...s.notifications].slice(0, 200),
        }));
        return notification;
      },

      markAsRead: (notifId) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === notifId ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      deleteNotification: (notifId) => {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== notifId),
        }));
      },

      clearAll: () => set({ notifications: [] }),

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'workos-notifications',
      version: 1,
    }
  )
);

export default useNotificationStore;
