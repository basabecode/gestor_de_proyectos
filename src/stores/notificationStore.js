import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// Convierte fila de Supabase al formato interno
function rowToNotif(row) {
  return {
    id:        row.id,
    type:      row.type      || 'info',
    title:     row.title     || '',
    message:   row.message   || '',
    boardId:   row.board_id  || null,
    itemId:    row.item_id   || null,
    itemTitle: row.item_title || null,
    author:    row.author    || 'Sistema',
    read:      row.read      || false,
    createdAt: row.created_at,
  };
}

const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading:       false,
  _channel:      null,   // canal Realtime activo

  // ── Fetch ──────────────────────────────────────────────────────────────────

  fetchNotifications: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ loading: true });
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) {
      set({ notifications: data.map(rowToNotif) });
    }
    set({ loading: false });
  },

  // ── CRUD ───────────────────────────────────────────────────────────────────

  addNotification: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: notif, error } = await supabase
      .from('notifications')
      .insert({
        user_id:    user.id,
        type:       data.type      || 'info',
        title:      data.title     || '',
        message:    data.message   || '',
        board_id:   data.boardId   || null,
        item_id:    data.itemId    || null,
        item_title: data.itemTitle || null,
        author:     data.author    || 'Sistema',
        read:       false,
      })
      .select()
      .single();

    if (error) {
      console.error('[notificationStore] addNotification:', error.message);
      return null;
    }

    const mapped = rowToNotif(notif);
    // Evitar duplicado si ya llegó por Realtime
    set((s) => {
      if (s.notifications.find((n) => n.id === mapped.id)) return s;
      return { notifications: [mapped, ...s.notifications].slice(0, 200) };
    });
    return mapped;
  },

  markAsRead: async (notifId) => {
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === notifId ? { ...n, read: true } : n
      ),
    }));
    await supabase.from('notifications').update({ read: true }).eq('id', notifId);
  },

  markAllAsRead: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
  },

  deleteNotification: async (notifId) => {
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== notifId),
    }));
    await supabase.from('notifications').delete().eq('id', notifId);
  },

  clearAll: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    set({ notifications: [] });
    await supabase.from('notifications').delete().eq('user_id', user.id);
  },

  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,

  // ── Realtime ───────────────────────────────────────────────────────────────

  /**
   * Abre una suscripción Realtime a la tabla notifications para el usuario dado.
   * @param {string} userId  - ID del usuario autenticado
   * @param {Function} [onNew] - callback(notif) cuando llega una notificación nueva
   */
  subscribeRealtime: (userId, onNew) => {
    get().unsubscribeRealtime();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = rowToNotif(payload.new);
          set((s) => {
            if (s.notifications.find((n) => n.id === notif.id)) return s;
            return { notifications: [notif, ...s.notifications].slice(0, 200) };
          });
          if (onNew) onNew(notif);
        }
      )
      .subscribe();

    set({ _channel: channel });
  },

  unsubscribeRealtime: () => {
    const ch = get()._channel;
    if (ch) {
      supabase.removeChannel(ch);
      set({ _channel: null });
    }
  },
}));

export default useNotificationStore;
