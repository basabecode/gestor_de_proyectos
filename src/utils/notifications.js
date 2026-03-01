import { useState, useCallback, createContext, useContext } from 'react';

/**
 * Hook for notification management
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, createdAt: Date.now() };

    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);

    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, notify, dismiss, clearAll };
}

/**
 * Notification type configs
 */
export const NOTIFICATION_STYLES = {
  success: {
    bg: 'bg-emerald-500',
    icon: 'check',
  },
  error: {
    bg: 'bg-rose-500',
    icon: 'alert',
  },
  warning: {
    bg: 'bg-amber-500',
    icon: 'warning',
  },
  info: {
    bg: 'bg-blue-500',
    icon: 'info',
  },
};
