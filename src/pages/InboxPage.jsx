import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox, Bell, CheckCheck, Trash2, AtSign, Zap,
  MessageSquare, Calendar, UserPlus, Filter, X,
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { Avatar } from '../components/ui';
import useNotificationStore from '../stores/notificationStore';
import { cn, formatRelativeDate } from '../lib/utils';

const TYPE_CONFIG = {
  mention: { icon: AtSign, label: 'Mención', color: 'text-primary', bg: 'bg-primary/10' },
  assignment: { icon: UserPlus, label: 'Asignación', color: 'text-status-purple', bg: 'bg-status-purple-light' },
  automation: { icon: Zap, label: 'Automatización', color: 'text-status-yellow', bg: 'bg-status-yellow-light' },
  overdue: { icon: Calendar, label: 'Vencido', color: 'text-status-red', bg: 'bg-status-red-light' },
  comment: { icon: MessageSquare, label: 'Comentario', color: 'text-status-blue', bg: 'bg-status-blue-light' },
  info: { icon: Bell, label: 'Info', color: 'text-text-secondary', bg: 'bg-surface-secondary' },
};

const FILTER_OPTIONS = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'No leídas' },
  { id: 'mention', label: 'Menciones' },
  { id: 'assignment', label: 'Asignaciones' },
  { id: 'automation', label: 'Automatizaciones' },
  { id: 'overdue', label: 'Vencidas' },
];

export default function InboxPage() {
  const navigate = useNavigate();
  const {
    notifications, markAsRead, markAllAsRead, deleteNotification, clearAll,
  } = useNotificationStore();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (notif) => {
    markAsRead(notif.id);
    if (notif.boardId) {
      navigate(`/board/${notif.boardId}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Bandeja de entrada" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-bold text-text-primary">Notificaciones</h2>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold text-white bg-status-red px-2 py-0.5 rounded-full">
                  {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todas leídas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-surface-secondary rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 mb-4 flex-wrap">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setActiveFilter(opt.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors',
                  activeFilter === opt.id
                    ? 'bg-primary text-white'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
                )}
              >
                {opt.label}
                {opt.id === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 text-[9px]">({unreadCount})</span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications list */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-16 h-16 text-text-disabled mx-auto mb-3 opacity-20" />
              <h3 className="text-[15px] font-semibold text-text-secondary">
                {activeFilter === 'all' ? 'Bandeja vacía' : 'Sin notificaciones'}
              </h3>
              <p className="text-[13px] text-text-disabled mt-1">
                {activeFilter === 'all'
                  ? 'Las notificaciones de menciones, asignaciones y automatizaciones aparecerán aquí'
                  : 'No hay notificaciones de este tipo'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                const Icon = config.icon;
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors group/notif',
                      notif.read
                        ? 'hover:bg-surface-secondary/50'
                        : 'bg-primary/5 hover:bg-primary/10'
                    )}
                    onClick={() => handleClick(notif)}
                  >
                    {/* Icon */}
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', config.bg)}>
                      <Icon className={cn('w-4 h-4', config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[13px] font-medium', notif.read ? 'text-text-secondary' : 'text-text-primary')}>
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[12px] text-text-secondary mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', config.bg, config.color)}>
                          {config.label}
                        </span>
                        {notif.author && (
                          <span className="text-[10px] text-text-disabled flex items-center gap-1">
                            <Avatar name={notif.author} size="xs" />
                            {notif.author}
                          </span>
                        )}
                        <span className="text-[10px] text-text-disabled">{formatRelativeDate(notif.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover/notif:opacity-100 shrink-0">
                      {!notif.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                          className="p-1 hover:bg-surface-hover rounded"
                          title="Marcar leída"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-text-disabled" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        className="p-1 hover:bg-surface-hover rounded"
                        title="Eliminar"
                      >
                        <X className="w-3.5 h-3.5 text-text-disabled" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
