import { useCallback } from 'react';
import useUserStore from '@/stores/userStore';

/**
 * Hook para gestionar notificaciones push del navegador (Web Notification API).
 * Funciona mientras la pestaña está abierta.
 */
export function useWebPush() {
  const { preferences, updatePreference } = useUserStore();

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const permission = isSupported ? Notification.permission : 'unsupported';

  /**
   * Solicita permiso al navegador y, si se concede, habilita las push en preferencias.
   * @returns {'granted'|'denied'|'default'|'unsupported'}
   */
  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      updatePreference('pushNotifications', true);
    } else {
      updatePreference('pushNotifications', false);
    }
    return result;
  }, [isSupported, updatePreference]);

  /**
   * Muestra una notificación nativa del navegador.
   * Solo funciona si el permiso está concedido y la preferencia está activa.
   * @param {string} title
   * @param {{ body?: string, tag?: string, url?: string }} options
   */
  const showBrowserNotification = useCallback((title, options = {}) => {
    if (!preferences.pushNotifications) return null;
    if (!isSupported || Notification.permission !== 'granted') return null;

    const notif = new Notification(title, {
      body: options.body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag,
      silent: false,
    });

    if (options.url) {
      notif.onclick = () => {
        window.focus();
        notif.close();
        window.location.href = options.url;
      };
    }

    return notif;
  }, [isSupported, preferences.pushNotifications]);

  return {
    isSupported,
    permission,
    requestPermission,
    showBrowserNotification,
  };
}
