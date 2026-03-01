import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/utils';
import { COLUMN_DEFAULTS, GROUP_COLORS } from '../lib/constants';

const useBoardStore = create(
  persist(
    (set, get) => ({
      boards: [],
      activeBoard: null,

      // Board CRUD
      createBoard: (data) => {
        const board = {
          id: generateId('board'),
          name: data.name || 'Nuevo tablero',
          description: data.description || '',
          workspaceId: data.workspaceId || 'default',
          columns: data.columns || [...COLUMN_DEFAULTS],
          groups: [
            { id: generateId('grp'), title: 'Nuevo grupo', color: GROUP_COLORS[0], collapsed: false },
          ],
          items: [],
          views: [{ id: 'main_table', name: 'Vista principal', type: 'table', isDefault: true }],
          activeViewId: 'main_table',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ boards: [...s.boards, board] }));
        return board;
      },

      updateBoard: (boardId, updates) => {
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === boardId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
          ),
          activeBoard: s.activeBoard?.id === boardId
            ? { ...s.activeBoard, ...updates, updatedAt: new Date().toISOString() }
            : s.activeBoard,
        }));
      },

      deleteBoard: (boardId) => {
        set((s) => ({
          boards: s.boards.filter((b) => b.id !== boardId),
          activeBoard: s.activeBoard?.id === boardId ? null : s.activeBoard,
        }));
      },

      duplicateBoard: (boardId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        const newBoard = {
          ...board,
          id: generateId('board'),
          name: `${board.name} (copia)`,
          items: board.items.map((item) => ({ ...item, id: generateId('item') })),
          groups: board.groups.map((g) => ({ ...g, id: generateId('grp') })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ boards: [...s.boards, newBoard] }));
        return newBoard;
      },

      setActiveBoard: (boardId) => {
        const board = get().boards.find((b) => b.id === boardId);
        set({ activeBoard: board || null });
      },

      // Group CRUD
      addGroup: (boardId, data = {}) => {
        const groups = get().boards.find((b) => b.id === boardId)?.groups || [];
        const group = {
          id: generateId('grp'),
          title: data.title || 'Nuevo grupo',
          color: data.color || GROUP_COLORS[groups.length % GROUP_COLORS.length],
          collapsed: false,
        };
        get().updateBoard(boardId, {
          groups: [...groups, group],
        });
        return group;
      },

      updateGroup: (boardId, groupId, updates) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          groups: board.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
        });
      },

      deleteGroup: (boardId, groupId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          groups: board.groups.filter((g) => g.id !== groupId),
          items: board.items.filter((i) => i.groupId !== groupId),
        });
      },

      toggleGroupCollapse: (boardId, groupId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          groups: board.groups.map((g) =>
            g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
          ),
        });
      },

      // Item CRUD
      addItem: (boardId, groupId, data = {}) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        const item = {
          id: generateId('item'),
          groupId,
          title: data.title || '',
          columnValues: data.columnValues || {},
          subitems: [],
          comments: [],
          updates: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        get().updateBoard(boardId, { items: [...board.items, item] });
        return item;
      },

      updateItem: (boardId, itemId, updates) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
          ),
        });
      },

      updateItemColumn: (boardId, itemId, columnId, value) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId
              ? { ...i, columnValues: { ...i.columnValues, [columnId]: value }, updatedAt: new Date().toISOString() }
              : i
          ),
        });
      },

      deleteItem: (boardId, itemId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          items: board.items.filter((i) => i.id !== itemId),
        });
      },

      moveItem: (boardId, itemId, targetGroupId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId ? { ...i, groupId: targetGroupId, updatedAt: new Date().toISOString() } : i
          ),
        });
      },

      reorderItems: (boardId, groupId, newOrder) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        const otherItems = board.items.filter((i) => i.groupId !== groupId);
        const reordered = newOrder.map((id) => board.items.find((i) => i.id === id)).filter(Boolean);
        get().updateBoard(boardId, { items: [...otherItems, ...reordered] });
      },

      // Columns
      addColumn: (boardId, column) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        const newCol = {
          id: generateId('col'),
          title: column.title || 'Nueva columna',
          type: column.type || 'text',
          width: column.width || 150,
          ...column,
        };
        get().updateBoard(boardId, { columns: [...board.columns, newCol] });
        return newCol;
      },

      updateColumn: (boardId, columnId, updates) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          columns: board.columns.map((c) => (c.id === columnId ? { ...c, ...updates } : c)),
        });
      },

      deleteColumn: (boardId, columnId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          columns: board.columns.filter((c) => c.id !== columnId),
        });
      },

      // Subitems
      addSubitem: (boardId, itemId, data = {}) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        const subitem = {
          id: generateId('sub'),
          title: data.title || '',
          completed: false,
          createdAt: new Date().toISOString(),
        };
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId ? { ...i, subitems: [...(i.subitems || []), subitem] } : i
          ),
        });
        return subitem;
      },

      // Comments
      addComment: (boardId, itemId, comment) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        const newComment = {
          id: generateId('cmt'),
          text: comment.text || '',
          author: comment.author || 'Usuario',
          mentions: comment.mentions || [],
          attachments: comment.attachments || [],
          createdAt: new Date().toISOString(),
        };
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId ? { ...i, comments: [...(i.comments || []), newComment] } : i
          ),
        });
        get().addActivity(boardId, itemId, {
          type: 'comment',
          author: newComment.author,
          text: `Agregó un comentario`,
        });
        return newComment;
      },

      deleteComment: (boardId, itemId, commentId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId
              ? { ...i, comments: (i.comments || []).filter((c) => c.id !== commentId) }
              : i
          ),
        });
      },

      // Attachments
      addAttachment: (boardId, itemId, file) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        const attachment = {
          id: generateId('att'),
          name: file.name,
          size: file.size,
          type: file.type,
          data: file.data, // base64
          createdAt: new Date().toISOString(),
          author: file.author || 'Usuario',
        };
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId
              ? { ...i, attachments: [...(i.attachments || []), attachment] }
              : i
          ),
        });
        get().addActivity(boardId, itemId, {
          type: 'attachment',
          author: attachment.author,
          text: `Adjuntó "${file.name}"`,
        });
        return attachment;
      },

      deleteAttachment: (boardId, itemId, attachmentId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId
              ? { ...i, attachments: (i.attachments || []).filter((a) => a.id !== attachmentId) }
              : i
          ),
        });
      },

      // Activity log
      addActivity: (boardId, itemId, activity) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        const entry = {
          id: generateId('act'),
          type: activity.type || 'update',
          author: activity.author || 'Usuario',
          text: activity.text || '',
          field: activity.field || null,
          oldValue: activity.oldValue ?? null,
          newValue: activity.newValue ?? null,
          createdAt: new Date().toISOString(),
        };
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId
              ? { ...i, activityLog: [...(i.activityLog || []), entry] }
              : i
          ),
        });
      },

      // Update item column with activity tracking
      updateItemColumnWithActivity: (boardId, itemId, columnId, value, author = 'Usuario') => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        const item = board.items.find((i) => i.id === itemId);
        const oldValue = item?.columnValues?.[columnId];
        get().updateItemColumn(boardId, itemId, columnId, value);
        if (oldValue !== value) {
          get().addActivity(boardId, itemId, {
            type: 'field_change',
            author,
            field: columnId,
            oldValue: oldValue || '',
            newValue: value || '',
            text: `Cambió "${columnId}"`,
          });
        }
      },

      // Toggle subitem
      toggleSubitem: (boardId, itemId, subitemId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  subitems: (i.subitems || []).map((s) =>
                    s.id === subitemId ? { ...s, completed: !s.completed } : s
                  ),
                }
              : i
          ),
        });
      },

      deleteSubitem: (boardId, itemId, subitemId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return;
        get().updateBoard(boardId, {
          items: board.items.map((i) =>
            i.id === itemId
              ? { ...i, subitems: (i.subitems || []).filter((s) => s.id !== subitemId) }
              : i
          ),
        });
      },

      // Stats
      getBoardStats: (boardId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return { total: 0, done: 0, stuck: 0, working: 0 };
        const items = board.items;
        return {
          total: items.length,
          done: items.filter((i) => i.columnValues?.status === 'done').length,
          stuck: items.filter((i) => i.columnValues?.status === 'stuck').length,
          working: items.filter((i) => i.columnValues?.status === 'working_on_it').length,
          groups: board.groups.length,
        };
      },
    }),
    {
      name: 'workos-boards',
      version: 1,
    }
  )
);

export default useBoardStore;
