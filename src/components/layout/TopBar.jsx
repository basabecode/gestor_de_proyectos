import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, HelpCircle, User, CheckCheck, AtSign, Zap, MessageSquare, Calendar, UserPlus, Menu, LogOut, Settings } from 'lucide-react';
import useUIStore from '../../stores/uiStore';
import useNotificationStore from '../../stores/notificationStore';
import useAuthStore from '../../stores/authStore';
import { Avatar } from '../ui';
import { cn, formatRelativeDate } from '../../lib/utils';

const TYPE_ICONS = {
  mention: AtSign,
  assignment: UserPlus,
  automation: Zap,
  overdue: Calendar,
  comment: MessageSquare,
  info: Bell,
};

export default function TopBar({ title, children }) {
  const navigate = useNavigate();
  const { openSearch, toggleMobileSidebar } = useUIStore();
  const { notifications, markAsRead, markAllAsRead, getUnreadCount } = useNotificationStore();
  const { profile, signOut } = useAuthStore();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = getUnreadCount();
  const recentNotifs = notifications.slice(0, 8);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-12 bg-white border-b border-border-light flex items-center justify-between px-3 md:px-4 shrink-0">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-1.5 hover:bg-surface-secondary rounded-md transition-colors shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-text-secondary" />
        </button>
        {title && <h1 className="text-[15px] md:text-[16px] font-semibold text-text-primary truncate">{title}</h1>}
        {children}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={openSearch}
          className="p-2 hover:bg-surface-secondary rounded-md transition-colors"
          title="Buscar (Ctrl+K)"
        >
          <Search className="w-4.5 h-4.5 text-text-secondary" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 hover:bg-surface-secondary rounded-md transition-colors relative"
            title="Notificaciones"
          >
            <Bell className="w-4.5 h-4.5 text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-status-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 mt-1 w-[calc(100vw-24px)] max-w-90 bg-white rounded-lg shadow-lg border border-border-light z-40 animate-slide-down">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
                  <span className="text-[13px] font-semibold text-text-primary">Notificaciones</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" /> Leer todas
                      </button>
                    )}
                  </div>
                </div>

                {/* List */}
                <div className="max-h-95 overflow-y-auto">
                  {recentNotifs.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-text-disabled mx-auto mb-2 opacity-20" />
                      <p className="text-[12px] text-text-disabled">Sin notificaciones</p>
                    </div>
                  ) : (
                    recentNotifs.map((notif) => {
                      const Icon = TYPE_ICONS[notif.type] || Bell;
                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            'flex items-start gap-2.5 px-4 py-2.5 cursor-pointer transition-colors border-b border-border-light last:border-0',
                            notif.read ? 'hover:bg-surface-secondary/50' : 'bg-primary/5 hover:bg-primary/10'
                          )}
                          onClick={() => {
                            markAsRead(notif.id);
                            setShowNotifs(false);
                            if (notif.boardId) navigate(`/board/${notif.boardId}`);
                          }}
                        >
                          <div className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-3 h-3 text-text-secondary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[12px] line-clamp-2', notif.read ? 'text-text-secondary' : 'text-text-primary font-medium')}>
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-text-disabled mt-0.5">{formatRelativeDate(notif.createdAt)}</p>
                          </div>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border-light">
                  <button
                    onClick={() => { setShowNotifs(false); navigate('/inbox'); }}
                    className="w-full text-center text-[12px] text-primary font-medium hover:underline"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button className="hidden sm:block p-2 hover:bg-surface-secondary rounded-md transition-colors" title="Ayuda">
          <HelpCircle className="w-4.5 h-4.5 text-text-secondary" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative ml-1">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center text-white text-[12px] font-semibold cursor-pointer transition-colors shadow-sm"
            style={{ backgroundColor: profile?.color || '#00c875' }}
            title={profile?.full_name || 'Mi Perfil'}
          >
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border-light z-40 animate-slide-down py-1">
                <div className="px-4 py-3 border-b border-border-light mb-1">
                  <p className="text-[13px] font-semibold text-text-primary truncate">{profile?.full_name || 'Usuario'}</p>
                  <p className="text-[11px] text-text-secondary truncate mt-0.5">{profile?.email || 'Miembro'}</p>
                </div>

                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className="w-full text-left px-4 py-2 text-[13px] text-text-primary hover:bg-surface-secondary flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4 text-text-secondary" /> Configuración
                </button>

                <div className="my-1 border-t border-border-light" />

                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-[13px] text-status-red hover:bg-status-red-light flex items-center gap-2 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
