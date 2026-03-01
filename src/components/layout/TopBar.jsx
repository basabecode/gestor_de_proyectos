import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, HelpCircle, User, CheckCheck, AtSign, Zap, MessageSquare, Calendar, UserPlus, Menu } from 'lucide-react';
import useUIStore from '../../stores/uiStore';
import useNotificationStore from '../../stores/notificationStore';
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
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = getUnreadCount();
  const recentNotifs = notifications.slice(0, 8);

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
          <Search className="w-[18px] h-[18px] text-text-secondary" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 hover:bg-surface-secondary rounded-md transition-colors relative"
            title="Notificaciones"
          >
            <Bell className="w-[18px] h-[18px] text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-status-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 mt-1 w-[calc(100vw-24px)] max-w-[360px] bg-white rounded-lg shadow-lg border border-border-light z-40 animate-slide-down">
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
                <div className="max-h-[380px] overflow-y-auto">
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
          <HelpCircle className="w-[18px] h-[18px] text-text-secondary" />
        </button>
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-[12px] font-semibold ml-1 cursor-pointer">
          U
        </div>
      </div>
    </header>
  );
}
