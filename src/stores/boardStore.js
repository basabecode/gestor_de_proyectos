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
        assignedTo:   i.assigned_to || null,
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
    // Sincronizar assigned_to cuando cambia la columna persona
    if (columnId === 'person') {
      await supabase.from('items').update({ assigned_to: value || null }).eq('id', itemId)
      // Actualizar estado local
      set((s) => ({
        boards: s.boards.map((b) =>
          b.id === boardId
            ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, assignedTo: value || null } : i) }
            : b
        ),
      }))
    }
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

  // ── Sub-items — tabla public.sub_items ─────────────────────────────────────

  addSubitem: async (boardId, itemId, data = {}) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return null
    const pos = (board.items.find((i) => i.id === itemId)?.subitems || []).length

    const { data: row, error } = await supabase
      .from('sub_items')
      .insert({ item_id: itemId, name: data.title || '', completed: false, position: pos })
      .select()
      .single()

    if (error) { set({ error: error.message }); return null }

    const sub = { id: row.id, title: row.name, completed: row.completed, createdAt: row.created_at }
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, subitems: [...(i.subitems || []), sub] } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
    return sub
  },

  toggleSubitem: async (boardId, itemId, subitemId) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    const item = board.items.find((i) => i.id === itemId)
    if (!item) return
    const sub = (item.subitems || []).find((s) => s.id === subitemId)
    if (!sub) return

    const newCompleted = !sub.completed
    await supabase.from('sub_items').update({ completed: newCompleted }).eq('id', subitemId)

    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId
            ? { ...i, subitems: (i.subitems || []).map((s) => s.id === subitemId ? { ...s, completed: newCompleted } : s) }
            : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  deleteSubitem: async (boardId, itemId, subitemId) => {
    await supabase.from('sub_items').delete().eq('id', subitemId)
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId
            ? { ...i, subitems: (i.subitems || []).filter((s) => s.id !== subitemId) }
            : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  // Carga sub-items desde DB (llamar al abrir ItemDetailPanel)
  fetchSubitems: async (boardId, itemId) => {
    const { data, error } = await supabase
      .from('sub_items')
      .select('*')
      .eq('item_id', itemId)
      .order('position', { ascending: true })

    if (error || !data) return

    const subitems = data.map((row) => ({
      id:        row.id,
      title:     row.name,
      completed: row.completed,
      createdAt: row.created_at,
    }))

    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, subitems } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
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

  // ── Attachments — Supabase Storage + tabla attachments ───────────────────

  addAttachment: async (boardId, itemId, rawFile) => {
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Subir el archivo al bucket "attachments"
    const ext          = rawFile.name.split('.').pop()
    const storagePath  = `${boardId}/${itemId}/${crypto.randomUUID()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('attachments')
      .upload(storagePath, rawFile.blob, {
        contentType: rawFile.type,
        upsert: false,
      })

    if (uploadErr) {
      set({ error: uploadErr.message })
      return null
    }

    // 2. Generar URL firmada (válida 1 hora)
    const { data: signedData } = await supabase.storage
      .from('attachments')
      .createSignedUrl(storagePath, 3600)

    // 3. Guardar metadatos en tabla attachments
    const { data: row, error: dbErr } = await supabase
      .from('attachments')
      .insert({
        item_id:      itemId,
        board_id:     boardId,
        user_id:      user?.id,
        name:         rawFile.name,
        size:         rawFile.size,
        mime_type:    rawFile.type,
        storage_path: storagePath,
        url:          signedData?.signedUrl || null,
        author:       rawFile.author || user?.email || 'Usuario',
      })
      .select()
      .single()

    if (dbErr) {
      // Revertir upload si falla el guardado en DB
      await supabase.storage.from('attachments').remove([storagePath])
      set({ error: dbErr.message })
      return null
    }

    const att = {
      id:          row.id,
      name:        row.name,
      size:        row.size,
      type:        row.mime_type,
      url:         row.url,
      storagePath: row.storage_path,
      author:      row.author,
      createdAt:   row.created_at,
    }

    // 4. Actualizar estado local
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, attachments: [...(i.attachments || []), att] } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
    return att
  },

  deleteAttachment: async (boardId, itemId, attachmentId) => {
    // Obtener el storagePath antes de borrar del estado
    const board = get().boards.find((b) => b.id === boardId)
    const item  = board?.items.find((i) => i.id === itemId)
    const att   = item?.attachments?.find((a) => a.id === attachmentId)

    // 1. Borrar de Supabase Storage (si conocemos la ruta)
    if (att?.storagePath) {
      await supabase.storage.from('attachments').remove([att.storagePath])
    }

    // 2. Borrar de la tabla attachments
    await supabase.from('attachments').delete().eq('id', attachmentId)

    // 3. Actualizar estado local
    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, attachments: (i.attachments || []).filter((a) => a.id !== attachmentId) } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  // Carga los attachments desde DB para un item dado (útil al abrir el panel)
  fetchAttachments: async (boardId, itemId) => {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })

    if (error || !data) return

    // Regenerar URLs firmadas si ya expiraron
    const atts = await Promise.all(data.map(async (row) => {
      let url = row.url
      if (row.storage_path) {
        const { data: signed } = await supabase.storage
          .from('attachments')
          .createSignedUrl(row.storage_path, 3600)
        url = signed?.signedUrl || url
      }
      return {
        id:          row.id,
        name:        row.name,
        size:        row.size,
        type:        row.mime_type,
        url,
        storagePath: row.storage_path,
        author:      row.author,
        createdAt:   row.created_at,
      }
    }))

    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, attachments: atts } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  // ── Activity log — tabla public.activity_logs ───────────────────────────────

  addActivity: async (boardId, itemId, activity) => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: row, error } = await supabase
      .from('activity_logs')
      .insert({
        item_id:   itemId,
        board_id:  boardId,
        user_id:   user?.id,
        type:      activity.type      || 'update',
        text:      activity.text      || '',
        author:    activity.author    || user?.email || 'Usuario',
        field:     activity.field     || null,
        old_value: activity.oldValue  || null,
        new_value: activity.newValue  || null,
      })
      .select()
      .single()

    if (error) {
      // Fallo silencioso: el activity log nunca debe bloquear operaciones
      console.warn('[activity_logs] insert error:', error.message)
      return
    }

    const entry = {
      id:        row.id,
      type:      row.type,
      text:      row.text,
      author:    row.author,
      field:     row.field,
      oldValue:  row.old_value,
      newValue:  row.new_value,
      createdAt: row.created_at,
    }

    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, activityLog: [...(i.activityLog || []), entry] } : i) }
        : b
      return { boards: s.boards.map(patch), activeBoard: s.activeBoard?.id === boardId ? patch(s.activeBoard) : s.activeBoard }
    })
  },

  // Carga el activity log desde DB (llamar al abrir ItemDetailPanel)
  fetchActivityLog: async (boardId, itemId) => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error || !data) return

    const activityLog = data.map((row) => ({
      id:        row.id,
      type:      row.type,
      text:      row.text,
      author:    row.author,
      field:     row.field,
      oldValue:  row.old_value,
      newValue:  row.new_value,
      createdAt: row.created_at,
    }))

    set((s) => {
      const patch = (b) => b.id === boardId
        ? { ...b, items: b.items.map((i) => i.id === itemId ? { ...i, activityLog } : i) }
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
