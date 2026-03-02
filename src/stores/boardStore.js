import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { COLUMN_DEFAULTS, GROUP_COLORS } from '@/lib/constants'

// ── Helpers ──────────────────────────────────────────────────────────────────

// Convierte la fila de Supabase al formato que usan los componentes
export function rowToBoard(board, groups = [], items = []) {
  return {
    id:           board.id,
    name:         board.name,
    description:  board.description || '',
    workspaceId:  board.workspace_id,
    columns:      board.columns      || [...COLUMN_DEFAULTS],
    views:        board.views        || [{ id: 'main_table', name: 'Vista principal', type: 'table', isDefault: true }],
    activeViewId: board.active_view_id || 'main_table',
    budget:       board.budget       ?? 0,
    actualCost:   board.actual_cost  ?? 0,
    plannedStart: board.planned_start || null,
    plannedEnd:   board.planned_end   || null,
    portfolioId:  board.portfolio_id  || null,
    programId:    board.program_id    || null,
    wipLimits:    board.wip_limits    || {},
    createdAt:    board.created_at,
    updatedAt:    board.updated_at,
    groups: groups
      .filter((g) => g.board_id === board.id)
      .sort((a, b) => a.position - b.position)
      .map((g) => ({ id: g.id, title: g.title, color: g.color, collapsed: g.collapsed })),
    items: items
      .filter((i) => i.board_id === board.id)
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        id:           i.id,
        groupId:      i.group_id,
        title:        i.name,
        columnValues: i.values || {},
        subitems:     [],
        comments:     [],
        activityLog:  [],
        createdAt:    i.created_at,
        updatedAt:    i.updated_at,
      })),
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

const useBoardStore = create((set, get) => ({
  boards:      [],
  activeBoard: null,
  loading:     false,
  error:       null,

  // ── Fetch ──────────────────────────────────────────────────────────────────

  fetchBoards: async (workspaceId) => {
    if (!workspaceId) return
    set({ loading: true, error: null })

    const [{ data: boardsData, error: bErr }, { data: groupsData }, { data: itemsData }] =
      await Promise.all([
        supabase.from('boards').select('*').eq('workspace_id', workspaceId).order('created_at'),
        supabase.from('groups').select('*').order('position'),
        supabase.from('items').select('*').order('position'),
      ])

    if (bErr) { set({ error: bErr.message, loading: false }); return }

    const boards = (boardsData || []).map((b) =>
      rowToBoard(b, groupsData || [], itemsData || [])
    )
    set({ boards, loading: false })
  },

  // ── Board CRUD ─────────────────────────────────────────────────────────────

  createBoard: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: board, error } = await supabase
      .from('boards')
      .insert({
        workspace_id:   data.workspaceId,
        name:           data.name        || 'Nuevo tablero',
        description:    data.description || '',
        columns:        data.columns     || [...COLUMN_DEFAULTS],
        views:          [{ id: 'main_table', name: 'Vista principal', type: 'table', isDefault: true }],
        active_view_id: 'main_table',
        created_by:     user?.id,
      })
      .select()
      .single()

    if (error) { set({ error: error.message }); return null }

    // Crear grupo inicial
    const { data: group } = await supabase
      .from('groups')
      .insert({ board_id: board.id, title: 'Nuevo grupo', color: GROUP_COLORS[0], position: 0 })
      .select()
      .single()

    const newBoard = rowToBoard(board, group ? [group] : [], [])
    set((s) => ({ boards: [...s.boards, newBoard] }))
    return newBoard
  },

  updateBoard: async (boardId, updates) => {
    // Actualización local optimista
    set((s) => ({
      boards: s.boards.map((b) =>
        b.id === boardId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      ),
      activeBoard: s.activeBoard?.id === boardId
        ? { ...s.activeBoard, ...updates, updatedAt: new Date().toISOString() }
        : s.activeBoard,
    }))

    // Campos que van a la tabla boards (no grupos ni items)
    const dbUpdates = {}
    if (updates.name        !== undefined) dbUpdates.name           = updates.name
    if (updates.description !== undefined) dbUpdates.description    = updates.description
    if (updates.columns     !== undefined) dbUpdates.columns        = updates.columns
    if (updates.views       !== undefined) dbUpdates.views          = updates.views
    if (updates.activeViewId!== undefined) dbUpdates.active_view_id = updates.activeViewId
    // PMIS fields
    if (updates.budget       !== undefined) dbUpdates.budget        = updates.budget
    if (updates.actualCost   !== undefined) dbUpdates.actual_cost   = updates.actualCost
    if (updates.plannedStart !== undefined) dbUpdates.planned_start = updates.plannedStart
    if (updates.plannedEnd   !== undefined) dbUpdates.planned_end   = updates.plannedEnd
    // Portfolio fields
    if (updates.portfolioId  !== undefined) dbUpdates.portfolio_id  = updates.portfolioId
    if (updates.programId    !== undefined) dbUpdates.program_id    = updates.programId

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('boards').update(dbUpdates).eq('id', boardId)
    }
  },

  // ── WIP Limits ───────────────────────────────────────────────────────────────

  updateWipLimit: async (boardId, status, limit) => {
    // Merge the new limit into the existing wipLimits map
    set((s) => ({
      boards: s.boards.map((b) => {
        if (b.id !== boardId) return b
        const newLimits = { ...b.wipLimits, [status]: limit }
        if (limit === 0) delete newLimits[status]   // 0 = remove limit
        return { ...b, wipLimits: newLimits }
      }),
      activeBoard: s.activeBoard?.id === boardId
        ? { ...s.activeBoard, wipLimits: { ...s.activeBoard.wipLimits, [status]: limit } }
        : s.activeBoard,
    }))

    // Build updated wipLimits from current state and persist
    const board = get().boards.find((b) => b.id === boardId)
    if (board) {
      await supabase.from('boards').update({ wip_limits: board.wipLimits }).eq('id', boardId)
    }
  },

  deleteBoard: async (boardId) => {
    const { error } = await supabase.from('boards').delete().eq('id', boardId)
    if (error) { set({ error: error.message }); return }
    set((s) => ({
      boards:      s.boards.filter((b) => b.id !== boardId),
      activeBoard: s.activeBoard?.id === boardId ? null : s.activeBoard,
    }))
  },

  duplicateBoard: async (boardId) => {
    const original = get().boards.find((b) => b.id === boardId)
    if (!original) return null
    const { data: { user } } = await supabase.auth.getUser()

    const { data: newBoard, error } = await supabase
      .from('boards')
      .insert({
        workspace_id:   original.workspaceId,
        name:           `${original.name} (copia)`,
        description:    original.description,
        columns:        original.columns,
        views:          original.views,
        active_view_id: original.activeViewId,
        created_by:     user?.id,
      })
      .select()
      .single()

    if (error) { set({ error: error.message }); return null }

    // Duplicar grupos
    const groupMap = {}
    for (const [idx, g] of original.groups.entries()) {
      const { data: ng } = await supabase
        .from('groups')
        .insert({ board_id: newBoard.id, title: g.title, color: g.color, position: idx })
        .select().single()
      if (ng) groupMap[g.id] = ng.id
    }

    // Duplicar items
    for (const [idx, item] of original.items.entries()) {
      await supabase.from('items').insert({
        board_id: newBoard.id,
        group_id: groupMap[item.groupId] || Object.values(groupMap)[0],
        name:     item.title,
        values:   item.columnValues,
        position: idx,
      })
    }

    await get().fetchBoards(original.workspaceId)
    return newBoard
  },

  setActiveBoard: async (boardId) => {
    if (!boardId) { set({ activeBoard: null }); return }
    const existing = get().boards.find((b) => b.id === boardId)
    if (existing) { set({ activeBoard: existing }); return }

    // Si no está en caché, cargarlo
    const { data: board } = await supabase.from('boards').select('*').eq('id', boardId).single()
    if (!board) return
    const { data: groups } = await supabase.from('groups').select('*').eq('board_id', boardId).order('position')
    const { data: items  } = await supabase.from('items').select('*').eq('board_id', boardId).order('position')
    const full = rowToBoard(board, groups || [], items || [])
    set((s) => ({
      boards:      s.boards.find((b) => b.id === boardId) ? s.boards : [...s.boards, full],
      activeBoard: full,
    }))
  },

  // ── Group CRUD ─────────────────────────────────────────────────────────────

  addGroup: async (boardId, data = {}) => {
    const board  = get().boards.find((b) => b.id === boardId)
    if (!board) return null
    const pos = board.groups.length

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        board_id:  boardId,
        title:     data.title || 'Nuevo grupo',
        color:     data.color || GROUP_COLORS[pos % GROUP_COLORS.length],
        position:  pos,
        collapsed: false,
      })
      .select().single()

    if (error) { set({ error: error.message }); return null }

    const g = { id: group.id, title: group.title, color: group.color, collapsed: false }
    set((s) => ({
      boards: s.boards.map((b) =>
        b.id === boardId ? { ...b, groups: [...b.groups, g] } : b
      ),
      activeBoard: s.activeBoard?.id === boardId
        ? { ...s.activeBoard, groups: [...s.activeBoard.groups, g] }
        : s.activeBoard,
    }))
    return g
  },

  updateGroup: async (boardId, groupId, updates) => {
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, groups: b.groups.map((g) => g.id === groupId ? { ...g, ...updates } : g) }
        : b
      return { boards: s.boards.map(patch), activeBoard: patch(s.activeBoard || {}) || s.activeBoard }
    })
    await supabase.from('groups').update(updates).eq('id', groupId)
  },

  deleteGroup: async (boardId, groupId) => {
    await supabase.from('groups').delete().eq('id', groupId)
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, groups: b.groups.filter((g) => g.id !== groupId), items: b.items.filter((i) => i.groupId !== groupId) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  toggleGroupCollapse: (boardId, groupId) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    const group = board.groups.find((g) => g.id === groupId)
    if (!group) return
    get().updateGroup(boardId, groupId, { collapsed: !group.collapsed })
  },

  // ── Item CRUD ──────────────────────────────────────────────────────────────

  addItem: async (boardId, groupId, data = {}) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return null
    const pos = board.items.filter((i) => i.groupId === groupId).length

    const { data: item, error } = await supabase
      .from('items')
      .insert({
        board_id: boardId,
        group_id: groupId,
        name:     data.title || '',
        values:   data.columnValues || {},
        position: pos,
      })
      .select().single()

    if (error) { set({ error: error.message }); return null }

    const newItem = {
      id: item.id, groupId, title: item.name, columnValues: item.values || {},
      subitems: [], comments: [], activityLog: [],
      createdAt: item.created_at, updatedAt: item.updated_at,
    }

    set((s) => {
      const patch = (b) => b.id === boardId ? { ...b, items: [...b.items, newItem] } : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
    return newItem
  },

  updateItem: async (boardId, itemId, updates) => {
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
    const dbUpdates = {}
    if (updates.title        !== undefined) dbUpdates.name   = updates.title
    if (updates.columnValues !== undefined) dbUpdates.values = updates.columnValues
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('items').update(dbUpdates).eq('id', itemId)
    }
  },

  updateItemColumn: async (boardId, itemId, columnId, value) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    const item = board.items.find((i) => i.id === itemId)
    if (!item) return
    const newValues = { ...item.columnValues, [columnId]: value }
    await get().updateItem(boardId, itemId, { columnValues: newValues })
  },

  updateItemColumnWithActivity: async (boardId, itemId, columnId, value) => {
    const board = get().boards.find((b) => b.id === boardId)
    const item  = board?.items.find((i) => i.id === itemId)
    const oldValue = item?.columnValues?.[columnId]

    await get().updateItemColumn(boardId, itemId, columnId, value)

    // Disparar notificación en cambios relevantes
    try {
      const { default: useNotificationStore } = await import('./notificationStore')
      const addNotification = useNotificationStore.getState().addNotification

      if (columnId === 'person' && value && value !== oldValue) {
        await addNotification({
          type:      'assignment',
          title:     'Nueva asignación',
          message:   `Se te asignó "${item?.title || 'un elemento'}" en el tablero`,
          boardId,
          itemId,
          itemTitle: item?.title || null,
          author:    'Sistema',
        })
      }

      if (columnId === 'status' && value && value !== oldValue) {
        await addNotification({
          type:      'info',
          title:     'Estado actualizado',
          message:   `"${item?.title || 'Elemento'}" cambió de estado a "${value}"`,
          boardId,
          itemId,
          itemTitle: item?.title || null,
          author:    'Sistema',
        })
      }
    } catch { /* no bloquear la actualización si falla la notificación */ }
  },

  deleteItem: async (boardId, itemId) => {
    await supabase.from('items').delete().eq('id', itemId)
    set((s) => {
      const patch = (b) => b.id === boardId ? { ...b, items: b.items.filter((i) => i.id !== itemId) } : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  moveItem: async (boardId, itemId, targetGroupId) => {
    await supabase.from('items').update({ group_id: targetGroupId }).eq('id', itemId)
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, groupId: targetGroupId } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  reorderItems: async (boardId, groupId, newOrder) => {
    set((s) => {
      const patch = (b) => {
        if (b.id !== boardId) return b
        const others   = b.items.filter((i) => i.groupId !== groupId)
        const reordered = newOrder.map((id) => b.items.find((i) => i.id === id)).filter(Boolean)
        return { ...b, items: [...others, ...reordered] }
      }
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
    // Persistir posiciones
    await Promise.all(
      newOrder.map((id, idx) => supabase.from('items').update({ position: idx }).eq('id', id))
    )
  },

  // ── Columns ────────────────────────────────────────────────────────────────

  addColumn: async (boardId, column) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return null
    const newCol = {
      id:    `col_${Date.now()}`,
      title: column.title || 'Nueva columna',
      type:  column.type  || 'text',
      width: column.width || 150,
      ...column,
    }
    const newColumns = [...board.columns, newCol]
    await get().updateBoard(boardId, { columns: newColumns })
    return newCol
  },

  updateColumn: async (boardId, columnId, updates) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    const newColumns = board.columns.map((c) => c.id === columnId ? { ...c, ...updates } : c)
    await get().updateBoard(boardId, { columns: newColumns })
  },

  deleteColumn: async (boardId, columnId) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    await get().updateBoard(boardId, { columns: board.columns.filter((c) => c.id !== columnId) })
  },

  // ── Sub-items (en memoria, sin tabla propia por ahora) ────────────────────

  addSubitem: (boardId, itemId, data = {}) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    const sub = { id: `sub_${Date.now()}`, title: data.title || '', completed: false, createdAt: new Date().toISOString() }
    const item = board.items.find((i) => i.id === itemId)
    if (!item) return
    const newValues = { ...item.columnValues, __subitems: [...(item.columnValues.__subitems || []), sub] }
    get().updateItemColumn(boardId, itemId, '__subitems', newValues.__subitems)
    return sub
  },

  toggleSubitem: (boardId, itemId, subitemId) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    const item = board.items.find((i) => i.id === itemId)
    if (!item) return
    const subs = (item.columnValues.__subitems || []).map((s) =>
      s.id === subitemId ? { ...s, completed: !s.completed } : s
    )
    get().updateItemColumn(boardId, itemId, '__subitems', subs)
  },

  deleteSubitem: (boardId, itemId, subitemId) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    const item = board.items.find((i) => i.id === itemId)
    if (!item) return
    const subs = (item.columnValues.__subitems || []).filter((s) => s.id !== subitemId)
    get().updateItemColumn(boardId, itemId, '__subitems', subs)
  },

  // ── Comments ───────────────────────────────────────────────────────────────

  addComment: async (boardId, itemId, comment) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: row, error } = await supabase
      .from('comments')
      .insert({ item_id: itemId, user_id: user?.id, content: comment.text || '' })
      .select().single()
    if (error) return null

    const newComment = { id: row.id, text: row.content, author: comment.author || user?.email, createdAt: row.created_at }
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, comments: [...(i.comments || []), newComment] } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
    return newComment
  },

  deleteComment: async (boardId, itemId, commentId) => {
    await supabase.from('comments').delete().eq('id', commentId)
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, comments: (i.comments || []).filter((c) => c.id !== commentId) } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  // ── Attachments (en memoria hasta conectar Storage) ────────────────────────

  addAttachment: (boardId, itemId, file) => {
    const att = { id: `att_${Date.now()}`, name: file.name, size: file.size, type: file.type, data: file.data, createdAt: new Date().toISOString() }
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, attachments: [...(i.attachments || []), att] } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
    return att
  },

  deleteAttachment: (boardId, itemId, attachmentId) => {
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, attachments: (i.attachments || []).filter((a) => a.id !== attachmentId) } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  // ── Activity log ───────────────────────────────────────────────────────────

  addActivity: (boardId, itemId, activity) => {
    const entry = { id: `act_${Date.now()}`, ...activity, createdAt: new Date().toISOString() }
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, activityLog: [...(i.activityLog || []), entry] } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  // ── Stats ──────────────────────────────────────────────────────────────────

  getBoardStats: (boardId) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return { total: 0, done: 0, stuck: 0, working: 0 }
    const items = board.items
    return {
      total:   items.length,
      done:    items.filter((i) => i.columnValues?.status === 'done').length,
      stuck:   items.filter((i) => i.columnValues?.status === 'stuck').length,
      working: items.filter((i) => i.columnValues?.status === 'working_on_it').length,
      groups:  board.groups.length,
    }
  },

  // ── Reset (logout) ─────────────────────────────────────────────────────────

  reset: () => set({ boards: [], activeBoard: null, loading: false, error: null }),
}))

export default useBoardStore
