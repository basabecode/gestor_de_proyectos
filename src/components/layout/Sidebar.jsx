import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutGrid,
  Search,
  Bell,
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings,
  FolderOpen,
  Inbox,
  Star,
  MoreHorizontal,
  Trash2,
  Edit3,
  Copy,
  BarChart3,
  Briefcase,
  LogOut,
} from 'lucide-react';
import useBoardStore from '../../stores/boardStore';
import useWorkspaceStore from '../../stores/workspaceStore';
import useUIStore from '../../stores/uiStore';
import useNotificationStore from '../../stores/notificationStore';
import useAuthStore from '../../stores/authStore';
import { Guard } from '../auth/Guard';
import { cn } from '../../lib/utils';

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, openModal } = useUIStore();

  const handleNavigate = (path) => {
    navigate(path);
    onNavigate?.();
  };
  const { boards, deleteBoard, duplicateBoard } = useBoardStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const { getUnreadCount } = useNotificationStore();
  const { profile, signOut } = useAuthStore();
  const [boardMenu, setBoardMenu] = useState(null);
  const [hoveredBoard, setHoveredBoard] = useState(null);
  const unreadCount = getUnreadCount();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const workspaceBoards = boards.filter((b) => b.workspaceId === activeWorkspaceId);

  const mainNav = [
    { id: 'home',       icon: Home,       label: 'Inicio',       path: '/' },
    { id: 'boards',     icon: LayoutGrid, label: 'Tableros',     path: '/boards' },
    { id: 'portfolios', icon: Briefcase,  label: 'Portafolios',  path: '/portfolios' },
    { id: 'dashboard',  icon: BarChart3,  label: 'Dashboard',    path: '/dashboard' },
    { id: 'inbox',      icon: Inbox,      label: 'Bandeja',      path: '/inbox' },
  ];

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-sidebar-bg text-sidebar-text transition-all duration-200 shrink-0',
        sidebarCollapsed ? 'w-[52px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-white/10">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigate('/')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-[15px]">Work OS</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-sidebar-hover rounded transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main navigation */}
      <nav className="px-2 py-2 space-y-0.5">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!sidebarCollapsed && item.label}
              {item.id === 'inbox' && unreadCount > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-status-red text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-2 border-t border-white/10" />

      {/* Boards section */}
      {!sidebarCollapsed && (
        <div className="flex-1 overflow-y-auto px-2">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/60">
              Tableros
            </span>
            <Guard action="create:board">
              <button
                onClick={() => openModal('createBoard')}
                className="p-1 hover:bg-sidebar-hover rounded transition-colors"
                title="Nuevo tablero"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </Guard>
          </div>

          <div className="space-y-0.5 mt-1">
            {workspaceBoards.map((board) => {
              const isActive = location.pathname === `/board/${board.id}`;
              return (
                <div
                  key={board.id}
                  className="relative"
                  onMouseEnter={() => setHoveredBoard(board.id)}
                  onMouseLeave={() => { setHoveredBoard(null); setBoardMenu(null); }}
                >
                  <button
                    onClick={() => handleNavigate(`/board/${board.id}`)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors text-left',
                      isActive
                        ? 'bg-sidebar-active text-white'
                        : 'text-sidebar-text hover:bg-sidebar-hover'
                    )}
                  >
                    <FolderOpen className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="truncate">{board.name}</span>
                  </button>

                  {hoveredBoard === board.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setBoardMenu(boardMenu === board.id ? null : board.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-sidebar-hover rounded"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {boardMenu === board.id && (
                    <div className="absolute left-full top-0 ml-1 w-40 bg-white rounded-lg shadow-lg border border-border-light py-1 z-50 text-text-primary">
                      <Guard action="edit:board">
                        <button
                          onClick={() => { openModal('editBoard', board); setBoardMenu(null); }}
                          className="w-full px-3 py-2 text-left text-[13px] hover:bg-surface-secondary flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Editar
                        </button>
                      </Guard>
                      <Guard action="create:board">
                        <button
                          onClick={() => { duplicateBoard(board.id); setBoardMenu(null); }}
                          className="w-full px-3 py-2 text-left text-[13px] hover:bg-surface-secondary flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicar
                        </button>
                      </Guard>
                      <Guard action="delete:board">
                        <hr className="my-1 border-border-light" />
                        <button
                          onClick={() => { deleteBoard(board.id); setBoardMenu(null); }}
                          className="w-full px-3 py-2 text-left text-[13px] text-status-red hover:bg-status-red-light flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </Guard>
                    </div>
                  )}
                </div>
              );
            })}

            {workspaceBoards.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-sidebar-text/40">Sin tableros</p>
            )}
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-white/10 space-y-0.5">
        <button
          onClick={() => handleNavigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-sidebar-text hover:bg-sidebar-hover transition-colors"
          title={sidebarCollapsed ? 'Configuración' : undefined}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          {!sidebarCollapsed && 'Configuración'}
        </button>

        {/* Usuario + Logout */}
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs"
              style={{ backgroundColor: profile?.color || '#00c875' }}
            >
              {(profile?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="text-[12px] font-medium text-sidebar-text/90 truncate flex-1">
              {profile?.full_name || 'Usuario'}
            </span>
            <button
              onClick={handleSignOut}
              title="Cerrar sesión"
              className="p-1.5 hover:bg-status-red/10 rounded-md transition-colors text-sidebar-text/60 hover:text-status-red"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {sidebarCollapsed && (
          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sidebar-text/60 hover:bg-sidebar-hover hover:text-sidebar-text transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    </aside>
  );
}
