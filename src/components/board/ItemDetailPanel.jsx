import { useState, useRef, useMemo, useEffect } from 'react';
import {
  X, MessageSquare, Paperclip, Clock, Plus, Trash2,
  Send, AtSign, FileText, Image, File as FileIcon,
  Download, ChevronRight, CheckCircle2, Circle,
} from 'lucide-react';
import useBoardStore from '../../stores/boardStore';
import useNotificationStore from '../../stores/notificationStore';
import { Avatar } from '../ui';
import { cn, generateId, formatRelativeDate, formatDate } from '../../lib/utils';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../lib/constants';

const TABS = [
  { id: 'updates', label: 'Actualizaciones', icon: MessageSquare },
  { id: 'files', label: 'Archivos', icon: Paperclip },
  { id: 'activity', label: 'Actividad', icon: Clock },
];

const TEAM_MEMBERS = ['Carlos', 'Ana', 'Miguel', 'Laura', 'Pedro', 'Sofia', 'Diego', 'Maria'];

export default function ItemDetailPanel({ open, onClose, boardId, itemId }) {
  const { boards, addComment, deleteComment, addAttachment, deleteAttachment, fetchAttachments, addSubitem, toggleSubitem, deleteSubitem, updateItem } = useBoardStore();
  const { addNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState('updates');
  const [commentText, setCommentText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [newSubitemTitle, setNewSubitemTitle] = useState('');
  const [showAddSubitem, setShowAddSubitem] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);  // { name, progress }
  const commentInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const board = boards.find((b) => b.id === boardId);
  const item = board?.items.find((i) => i.id === itemId);

  const group = board?.groups.find((g) => g.id === item?.groupId);

  // Extract mentions from text
  const mentions = useMemo(() => {
    if (!commentText) return [];
    const regex = /@(\w+)/g;
    const found = [];
    let match;
    while ((match = regex.exec(commentText)) !== null) {
      found.push(match[1]);
    }
    return found;
  }, [commentText]);

  const filteredMembers = TEAM_MEMBERS.filter((m) =>
    m.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Cargar attachments desde DB cuando se abre el panel
  useEffect(() => {
    if (open && itemId && boardId && fetchAttachments) {
      fetchAttachments(boardId, itemId)
    }
  }, [open, itemId, boardId])

  if (!open || !item) return null;

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    addComment(boardId, itemId, {
      text: commentText.trim(),
      author: 'Usuario',
      mentions,
    });

    // Create notifications for mentions
    mentions.forEach((person) => {
      addNotification({
        type: 'mention',
        title: `@${person} mencionado en "${item.title}"`,
        message: commentText.trim(),
        boardId,
        itemId,
        itemTitle: item.title,
        author: 'Usuario',
      });
    });

    // Create notification for comment (if no mentions)
    if (mentions.length === 0) {
      addNotification({
        type: 'comment',
        title: `Nuevo comentario en "${item.title}"`,
        message: commentText.trim(),
        boardId,
        itemId,
        itemTitle: item.title,
        author: 'Usuario',
      });
    }

    setCommentText('');
    setShowMentions(false);
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit();
    }
    if (e.key === '@' || (commentText.endsWith('@') && e.key !== 'Backspace')) {
      setShowMentions(true);
      setMentionSearch('');
    }
  };

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setCommentText(val);
    // Check for @mention trigger
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && lastAt === val.length - 1) {
      setShowMentions(true);
      setMentionSearch('');
    } else if (lastAt !== -1 && showMentions) {
      const after = val.slice(lastAt + 1);
      if (after.includes(' ')) {
        setShowMentions(false);
      } else {
        setMentionSearch(after);
      }
    }
  };

  const insertMention = (name) => {
    const lastAt = commentText.lastIndexOf('@');
    const before = commentText.slice(0, lastAt);
    setCommentText(`${before}@${name} `);
    setShowMentions(false);
    commentInputRef.current?.focus();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        continue;
      }

      // Mostrar indicador de subida
      setUploadingFiles((prev) => [...prev, { name: file.name }]);

      await addAttachment(boardId, itemId, {
        name:   file.name,
        size:   file.size,
        type:   file.type,
        blob:   file,           // El File object real — lo usa Supabase Storage
        author: 'Usuario',
      });

      setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
    }
  };

  const handleAddSubitem = () => {
    if (newSubitemTitle.trim()) {
      addSubitem(boardId, itemId, { title: newSubitemTitle.trim() });
      setNewSubitemTitle('');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return Image;
    if (type?.includes('pdf') || type?.includes('document')) return FileText;
    return FileIcon;
  };

  const comments = item.comments || [];
  const attachments = item.attachments || [];
  const activityLog = (item.activityLog || []).slice().reverse();
  const subitems = item.subitems || [];
  const completedSubitems = subitems.filter((s) => s.completed).length;

  const status = item.columnValues?.status || 'pending';
  const priority = item.columnValues?.priority || 'none';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-140 bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.1)] flex flex-col animate-slide-left">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-light flex items-center gap-3">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: group?.color || '#579bfc' }} />
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-semibold text-text-primary truncate">{item.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-text-disabled">{group?.title}</span>
              <span
                className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-sm"
                style={{ backgroundColor: STATUS_COLORS[status]?.bg }}
              >
                {STATUS_LABELS[status]}
              </span>
              {priority !== 'none' && (
                <span
                  className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-sm"
                  style={{ backgroundColor: PRIORITY_COLORS[priority]?.bg }}
                >
                  {PRIORITY_LABELS[priority]}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-hover rounded transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Subitems section */}
        <div className="px-5 py-3 border-b border-border-light">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-text-secondary">
              Sub-elementos {subitems.length > 0 && `(${completedSubitems}/${subitems.length})`}
            </span>
            <button
              onClick={() => setShowAddSubitem(!showAddSubitem)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Agregar
            </button>
          </div>

          {subitems.length > 0 && (
            <div className="mb-2">
              <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-status-green rounded-full transition-all"
                  style={{ width: `${subitems.length > 0 ? (completedSubitems / subitems.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {subitems.map((sub) => (
            <div key={sub.id} className="flex items-center gap-2 py-1 group/sub">
              <button onClick={() => toggleSubitem(boardId, itemId, sub.id)}>
                {sub.completed
                  ? <CheckCircle2 className="w-4 h-4 text-status-green" />
                  : <Circle className="w-4 h-4 text-text-disabled" />
                }
              </button>
              <span className={cn('text-[12px] flex-1', sub.completed && 'line-through text-text-disabled')}>
                {sub.title}
              </span>
              <button
                onClick={() => deleteSubitem(boardId, itemId, sub.id)}
                className="opacity-0 group-hover/sub:opacity-100 p-0.5 hover:bg-surface-hover rounded"
              >
                <Trash2 className="w-3 h-3 text-text-disabled" />
              </button>
            </div>
          ))}

          {showAddSubitem && (
            <div className="flex items-center gap-2 mt-1">
              <input
                autoFocus
                value={newSubitemTitle}
                onChange={(e) => setNewSubitemTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubitem(); if (e.key === 'Escape') setShowAddSubitem(false); }}
                placeholder="Nombre del sub-elemento"
                className="flex-1 text-[12px] py-1 px-2 border border-primary rounded focus:outline-none"
              />
              <button onClick={handleAddSubitem} className="text-[11px] text-primary font-medium">Agregar</button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light px-5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'updates' ? comments.length : tab.id === 'files' ? attachments.length : activityLog.length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors',
                  isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                    isActive ? 'bg-primary/10 text-primary' : 'bg-surface-secondary text-text-disabled'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {/* Updates / Comments */}
          {activeTab === 'updates' && (
            <div className="p-5">
              {/* Comment input */}
              <div className="mb-4 relative">
                <div className="border border-border rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={handleCommentChange}
                    onKeyDown={handleCommentKeyDown}
                    placeholder="Escribe una actualización... (usa @ para mencionar)"
                    className="w-full px-3 py-2.5 text-[13px] rounded-t-lg resize-none focus:outline-none min-h-20"
                    rows={3}
                  />
                  <div className="flex items-center justify-between px-3 py-1.5 border-t border-border-light bg-surface-secondary/30 rounded-b-lg">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowMentions(!showMentions)}
                        className="p-1 hover:bg-surface-hover rounded text-text-secondary"
                        title="Mencionar persona"
                      >
                        <AtSign className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1 hover:bg-surface-hover rounded text-text-secondary"
                        title="Adjuntar archivo"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={handleCommentSubmit}
                      disabled={!commentText.trim()}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1 rounded text-[12px] font-medium transition-colors',
                        commentText.trim()
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'bg-surface-secondary text-text-disabled cursor-not-allowed'
                      )}
                    >
                      <Send className="w-3 h-3" /> Enviar
                    </button>
                  </div>
                </div>

                {/* Mentions dropdown */}
                {showMentions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMentions(false)} />
                    <div className="absolute left-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20 max-h-50 overflow-auto">
                      <p className="px-3 py-1 text-[10px] font-semibold text-text-disabled uppercase">Mencionar a</p>
                      {filteredMembers.map((member) => (
                        <button
                          key={member}
                          onClick={() => insertMention(member)}
                          className="w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-surface-secondary"
                        >
                          <Avatar name={member} size="xs" />
                          {member}
                        </button>
                      ))}
                      {filteredMembers.length === 0 && (
                        <p className="px-3 py-2 text-[11px] text-text-disabled">No se encontraron personas</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Comments list */}
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-10 h-10 text-text-disabled mx-auto mb-2 opacity-30" />
                  <p className="text-[13px] text-text-disabled">Sin actualizaciones aún</p>
                  <p className="text-[11px] text-text-disabled mt-0.5">Sé el primero en escribir una actualización</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...comments].reverse().map((comment) => (
                    <div key={comment.id} className="group/comment">
                      <div className="flex items-start gap-2.5">
                        <Avatar name={comment.author} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-text-primary">{comment.author}</span>
                            <span className="text-[10px] text-text-disabled">{formatRelativeDate(comment.createdAt)}</span>
                            <button
                              onClick={() => deleteComment(boardId, itemId, comment.id)}
                              className="opacity-0 group-hover/comment:opacity-100 p-0.5 hover:bg-surface-hover rounded ml-auto"
                            >
                              <Trash2 className="w-3 h-3 text-text-disabled" />
                            </button>
                          </div>
                          <p className="text-[13px] text-text-primary mt-0.5 whitespace-pre-wrap">
                            {renderCommentText(comment.text)}
                          </p>
                          {comment.attachments?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {comment.attachments.map((att, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded">
                                  <Paperclip className="w-2.5 h-2.5" /> {att.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Files */}
          {activeTab === 'files' && (
            <div className="p-5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg py-6 text-center hover:border-primary hover:bg-primary/5 transition-colors mb-4"
              >
                <Paperclip className="w-6 h-6 text-text-disabled mx-auto mb-1" />
                <p className="text-[13px] text-text-secondary">Arrastra archivos o haz clic para adjuntar</p>
                <p className="text-[10px] text-text-disabled mt-0.5">Máximo 10MB · Imágenes, PDF, Office, ZIP</p>
              </button>

              {/* Archivos subiendo */}
              {uploadingFiles.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {uploadingFiles.map((f) => (
                    <div key={f.name} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                      <p className="text-[12px] text-primary font-medium truncate">{f.name}</p>
                      <span className="text-[10px] text-primary/60 ml-auto shrink-0">Subiendo...</span>
                    </div>
                  ))}
                </div>
              )}

              {attachments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[13px] text-text-disabled">Sin archivos adjuntos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => {
                    const Icon = getFileIcon(att.type);
                    const isImage = att.type?.startsWith('image/');
                    return (
                      <div key={att.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border-light hover:bg-surface-secondary/30 group/file">
                        {att.type?.startsWith('image/') && att.url ? (
                          <img src={att.url} alt={att.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-surface-secondary rounded flex items-center justify-center">
                            <Icon className="w-5 h-5 text-text-secondary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-text-primary truncate">{att.name}</p>
                          <p className="text-[10px] text-text-disabled">
                            {formatFileSize(att.size)} · {att.author} · {formatRelativeDate(att.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/file:opacity-100">
                          {att.url && (
                            <a
                              href={att.url}
                              download={att.name}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 hover:bg-surface-hover rounded"
                              title="Descargar"
                            >
                              <Download className="w-3.5 h-3.5 text-text-secondary" />
                            </a>
                          )}
                          <button
                            onClick={() => deleteAttachment(boardId, itemId, att.id)}
                            className="p-1 hover:bg-surface-hover rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-status-red" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Activity log */}
          {activeTab === 'activity' && (
            <div className="p-5">
              {activityLog.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-text-disabled mx-auto mb-2 opacity-30" />
                  <p className="text-[13px] text-text-disabled">Sin actividad registrada</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border-light" />

                  <div className="space-y-3">
                    {activityLog.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 relative">
                        <div className={cn(
                          'w-5.5 h-5.5 rounded-full flex items-center justify-center z-[1] shrink-0',
                          entry.type === 'comment' ? 'bg-primary/10' :
                          entry.type === 'attachment' ? 'bg-status-orange-light' :
                          entry.type === 'field_change' ? 'bg-status-green-light' :
                          'bg-surface-secondary'
                        )}>
                          {entry.type === 'comment' && <MessageSquare className="w-3 h-3 text-primary" />}
                          {entry.type === 'attachment' && <Paperclip className="w-3 h-3 text-status-orange" />}
                          {entry.type === 'field_change' && <ChevronRight className="w-3 h-3 text-status-green" />}
                          {entry.type === 'update' && <Clock className="w-3 h-3 text-text-disabled" />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-[12px] text-text-primary">
                            <span className="font-semibold">{entry.author}</span>
                            {' '}{entry.text}
                          </p>
                          {entry.type === 'field_change' && entry.oldValue && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-text-disabled line-through">{formatFieldValue(entry.field, entry.oldValue)}</span>
                              <ChevronRight className="w-2.5 h-2.5 text-text-disabled" />
                              <span className="text-[10px] text-text-primary font-medium">{formatFieldValue(entry.field, entry.newValue)}</span>
                            </div>
                          )}
                          <p className="text-[10px] text-text-disabled mt-0.5">{formatRelativeDate(entry.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Render comment text with highlighted mentions
function renderCommentText(text) {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="text-primary font-medium bg-primary/5 rounded px-0.5">
          {part}
        </span>
      );
    }
    return part;
  });
}

// Format field values for activity log display
function formatFieldValue(field, value) {
  if (field === 'status') return STATUS_LABELS[value] || value;
  if (field === 'priority') return PRIORITY_LABELS[value] || value;
  return value;
}
