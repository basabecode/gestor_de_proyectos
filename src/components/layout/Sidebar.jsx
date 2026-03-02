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
        'h-full flex flex-col bg-sidebar-bg text-sidebar-text transition-all duration-200 shrink-0',
        sidebarCollapsed ? 'w-[52px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-3 h-14 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavigate('/')}>
            {/* Mark — solid accent square, not a LayoutGrid icon */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #00c875, #00a060)', boxShadow: '0 2px 8px rgba(0,200,117,0.35)' }}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="font-semibold text-white text-[15px] tracking-[-0.02em]"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Work OS
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'rgba(200,214,232,0.4)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main navigation */}
      <nav className="px-2 pt-3 pb-1 space-y-0.5">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              title={sidebarCollapsed ? item.label : undefined}
              className="relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={{
                color: isActive ? '#ffffff' : 'rgba(200,214,232,0.7)',
                background: isActive ? 'rgba(0,200,117,0.12)' : 'transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(0,200,117,0.12)' : 'transparent'; e.currentTarget.style.color = isActive ? '#ffffff' : 'rgba(200,214,232,0.7)'; }}
            >
              {/* Accent pip — visible only on active */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: '#00c875', boxShadow: '0 0 8px rgba(0,200,117,0.7)' }}
                />
              )}
              <Icon
                className="shrink-0"
                size={16}
                strokeWidth={isActive ? 2.2 : 1.8}
                style={{ color: isActive ? '#00c875' : 'inherit' }}
              />
              {!sidebarCollapsed && <span>{item.label}</span>}
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
      <div className="mx-3 my-1" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      {/* Boards section */}
      {!sidebarCollapsed && (
        <div className="flex-1 overflow-y-auto px-2">
          <div className="flex items-center justify-between px-3 py-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(200,214,232,0.35)' }}
            >
              Tableros
            </span>
            <Guard action="create:board">
              <button
                onClick={() => openModal('createBoard')}
                className="p-1 rounded-md transition-colors"
                style={{ color: 'rgba(200,214,232,0.35)' }}
                title="Nuevo tablero"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(200,214,232,0.8)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(200,214,232,0.35)'; }}
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
                    className="relative w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all text-left"
                    style={{
                      color: isActive ? '#ffffff' : 'rgba(200,214,232,0.6)',
                      background: isActive ? 'rgba(0,200,117,0.12)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(200,214,232,0.9)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(0,200,117,0.12)' : 'transparent'; e.currentTarget.style.color = isActive ? '#ffffff' : 'rgba(200,214,232,0.6)'; }}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                        style={{ background: '#00c875', boxShadow: '0 0 6px rgba(0,200,117,0.6)' }}
                      />
                    )}
                    <FolderOpen className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} style={{ color: isActive ? '#00c875' : 'inherit' }} />
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

      {/* Bottom — Settings + User */}
      <div
        className="px-2 py-3 space-y-0.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => handleNavigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all"
          style={{ color: 'rgba(200,214,232,0.6)' }}
          title={sidebarCollapsed ? 'Configuración' : undefined}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(200,214,232,0.9)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(200,214,232,0.6)'; }}
        >
          <Settings className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          {!sidebarCollapsed && 'Configuración'}
        </button>

        {/* Usuario + Logout — zona refinada */}
        {!sidebarCollapsed && (
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-default"
            style={{ marginTop: '4px' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{
                backgroundColor: profile?.color || '#00c875',
                boxShadow: `0 0 0 2px rgba(12,20,32,1), 0 0 0 3px ${profile?.color || '#00c875'}40`,
              }}
            >
              {(profile?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="text-[12px] font-medium truncate flex-1" style={{ color: 'rgba(200,214,232,0.8)' }}>
              {profile?.full_name || 'Usuario'}
            </span>
            <button
              onClick={handleSignOut}
              title="Cerrar sesión"
              className="p-1.5 rounded-md transition-all"
              style={{ color: 'rgba(200,214,232,0.35)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(226,68,92,0.12)'; e.currentTarget.style.color = '#e2445c'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(200,214,232,0.35)'; }}
            >
              <LogOut className="w-3.5 h-3.5" />
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
