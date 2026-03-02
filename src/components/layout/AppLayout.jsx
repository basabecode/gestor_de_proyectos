import { useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import LicenseBanner from './LicenseBanner';
import useUIStore from '../../stores/uiStore';
import useWorkspaceStore from '../../stores/workspaceStore';
import useBoardStore from '../../stores/boardStore';
import usePortfolioStore from '../../stores/portfolioStore';
import useNotificationStore from '../../stores/notificationStore';
import useAuthStore from '../../stores/authStore';
import { useWebPush } from '../../hooks/useWebPush';

export default function AppLayout() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const activeWorkspaceId   = useWorkspaceStore((s) => s.activeWorkspaceId);
  const fetchBoards         = useBoardStore((s) => s.fetchBoards);
  const fetchPortfolios     = usePortfolioStore((s) => s.fetchPortfolios);
  const { fetchNotifications, subscribeRealtime, unsubscribeRealtime } = useNotificationStore();
  const { user } = useAuthStore();
  const { showBrowserNotification } = useWebPush();

  // Recargar boards y portafolios cada vez que cambia el workspace activo
  useEffect(() => {
    if (activeWorkspaceId) {
      fetchBoards(activeWorkspaceId);
      fetchPortfolios(activeWorkspaceId);
    }
  }, [activeWorkspaceId, fetchBoards, fetchPortfolios]);

  // Cargar notificaciones y suscribirse a Realtime cuando el usuario está autenticado
  const handleNewNotification = useCallback((notif) => {
    showBrowserNotification(notif.title, {
      body: notif.message,
      tag:  notif.id,
      url:  notif.boardId ? `/board/${notif.boardId}` : '/inbox',
    });
  }, [showBrowserNotification]);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    subscribeRealtime(user.id, handleNewNotification);
    return () => unsubscribeRealtime();
  }, [user?.id, fetchNotifications, subscribeRealtime, unsubscribeRealtime, handleNewNotification]);

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-secondary">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar — animated overlay + drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden sidebar-overlay"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden sidebar-mobile"
            >
              <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <LicenseBanner />
        <Outlet />
      </main>
    </div>
  );
}
