import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useUIStore from '../../stores/uiStore';
import useWorkspaceStore from '../../stores/workspaceStore';
import useBoardStore from '../../stores/boardStore';
import usePortfolioStore from '../../stores/portfolioStore';

export default function AppLayout() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const activeWorkspaceId  = useWorkspaceStore((s) => s.activeWorkspaceId);
  const fetchBoards        = useBoardStore((s) => s.fetchBoards);
  const fetchPortfolios    = usePortfolioStore((s) => s.fetchPortfolios);

  // Recargar boards y portafolios cada vez que cambia el workspace activo
  useEffect(() => {
    if (activeWorkspaceId) {
      fetchBoards(activeWorkspaceId);
      fetchPortfolios(activeWorkspaceId);
    }
  }, [activeWorkspaceId, fetchBoards, fetchPortfolios]);

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-secondary">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden sidebar-mobile">
          <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
