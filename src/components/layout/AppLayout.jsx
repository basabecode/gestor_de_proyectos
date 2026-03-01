import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useUIStore from '../../stores/uiStore';

export default function AppLayout() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

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
