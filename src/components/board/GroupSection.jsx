import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Trash2,
  Palette,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useBoardStore from '../../stores/boardStore';
import useAutomationStore, { TRIGGER_TYPES } from '../../stores/automationStore';
import BoardRow from './BoardRow';
import AddColumnButton from './AddColumnButton';
import { cn } from '../../lib/utils';
import { GROUP_COLORS, STATUS_COLORS, STATUS_LABELS } from '../../lib/constants';

export default function GroupSection({ board, group, items, columns }) {
  const { toggleGroupCollapse, updateGroup, deleteGroup, addItem, reorderItems } = useBoardStore();
  const { executeAutomations } = useAutomationStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(group.title);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleTitleSubmit = () => {
    if (titleValue.trim()) {
      updateGroup(board.id, group.id, { title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const handleAddItem = () => {
    if (newItemTitle.trim()) {
      const newItem = addItem(board.id, group.id, { title: newItemTitle.trim() });
      setNewItemTitle('');

      // Trigger item_created automations
      if (newItem) {
        const boardStoreState = useBoardStore.getState();
        const results = executeAutomations(board.id, TRIGGER_TYPES.ITEM_CREATED, {
          itemId: newItem.id,
          itemTitle: newItem.title,
        }, boardStoreState);
        results.forEach((r) => {
          if (r.message) toast.success(`⚡ ${r.message}`, { duration: 3000 });
        });
      }
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = items.map((i) => i.id);
    const [removed] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);
    reorderItems(board.id, group.id, newOrder);
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  // Status summary
  const statusCounts = {};
  items.forEach((item) => {
    const status = item.columnValues?.status || 'pending';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const totalItems = items.length;

  return (
    <div className="mb-4">
      {/* Group header */}
      <div className="flex items-center gap-1 mb-1 group/header">
        <button
          onClick={() => toggleGroupCollapse(board.id, group.id)}
          className="p-0.5 hover:bg-surface-hover rounded transition-colors"
        >
          {group.collapsed ? (
            <ChevronRight className="w-4 h-4" style={{ color: group.color }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: group.color }} />
          )}
        </button>

        {editingTitle ? (
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSubmit(); if (e.key === 'Escape') { setTitleValue(group.title); setEditingTitle(false); } }}
            className="text-[15px] font-bold px-1 py-0.5 rounded border border-primary outline-none"
            style={{ color: group.color }}
          />
        ) : (
          <span
            className="text-[15px] font-bold cursor-pointer hover:opacity-80"
            style={{ color: group.color }}
            onClick={() => setEditingTitle(true)}
          >
            {group.title}
          </span>
        )}

        <span className="text-[12px] text-text-disabled ml-2">{totalItems} elementos</span>

        <div className="relative ml-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-surface-hover rounded">
            <MoreHorizontal className="w-3.5 h-3.5 text-text-secondary" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute left-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20">
                <button
                  onClick={() => { setShowColorPicker(!showColorPicker); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-[13px] text-text-primary hover:bg-surface-secondary flex items-center gap-2"
                >
                  <Palette className="w-4 h-4" /> Cambiar color
                </button>
                <hr className="my-1 border-border-light" />
                <button
                  onClick={() => { deleteGroup(board.id, group.id); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-[13px] text-status-red hover:bg-status-red-light flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar grupo
                </button>
              </div>
            </>
          )}
        </div>

        {showColorPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
            <div className="absolute ml-32 mt-8 bg-white rounded-lg shadow-lg border border-border-light p-2 z-20 flex gap-1 flex-wrap w-[140px]">
              {GROUP_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => { updateGroup(board.id, group.id, { color }); setShowColorPicker(false); }}
                  className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Table */}
      {!group.collapsed && (
        <div className="bg-white rounded-lg shadow-[--shadow-sm] border border-border-light overflow-hidden">
          {/* Horizontal scroll wrapper for table */}
          <div className="board-table-scroll">
          {/* Table header */}
          <div className="flex items-center bg-surface-secondary border-b border-border-light text-[11px] font-semibold text-text-secondary uppercase tracking-wider min-w-fit">
            <div className="group-indicator" style={{ backgroundColor: group.color }} />
            <div className="w-8 px-2 py-2.5 flex items-center justify-center cell-border shrink-0">
              <input type="checkbox" className="rounded" disabled />
            </div>
            <div className="flex-1 min-w-[200px] md:min-w-[250px] px-3 py-2.5 cell-border">Elemento</div>
            {columns.map((col) => (
              <div
                key={col.id}
                className="px-2 py-2.5 text-center cell-border shrink-0"
                style={{ width: col.width, minWidth: col.width }}
              >
                {col.title}
              </div>
            ))}
            <div className="w-10 shrink-0" />
            <AddColumnButton boardId={board.id} />
          </div>

          {/* Sortable rows */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((item) => (
                <BoardRow
                  key={item.id}
                  board={board}
                  item={item}
                  columns={columns}
                  groupColor={group.color}
                  sortable
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeItem && (
                <div className="bg-white border border-primary/30 shadow-lg rounded px-4 py-2 text-[13px] font-medium text-text-primary opacity-90">
                  {activeItem.title}
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Add item row */}
          <div className="flex items-center border-t border-border-light min-w-fit">
            <div className="group-indicator" style={{ backgroundColor: group.color, opacity: 0.4 }} />
            <div className="w-8 shrink-0" />
            <div className="flex-1 min-w-[200px] px-3 py-1.5">
              {showAddRow ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); if (e.key === 'Escape') { setShowAddRow(false); setNewItemTitle(''); } }}
                    placeholder="Nombre del elemento"
                    className="flex-1 text-[13px] py-1 px-2 border border-primary rounded focus:outline-none"
                  />
                  <button onClick={handleAddItem} className="text-[12px] text-primary font-medium hover:underline whitespace-nowrap">
                    Agregar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddRow(true)}
                  className="flex items-center gap-1.5 text-[13px] text-text-disabled hover:text-primary transition-colors py-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar elemento
                </button>
              )}
            </div>
          </div>
          </div>{/* Close board-table-scroll */}

          {/* Status summary bar */}
          {totalItems > 0 && (
            <div className="flex h-1.5">
              <div className="group-indicator" style={{ backgroundColor: group.color, opacity: 0.3, borderRadius: 0 }} />
              {Object.entries(statusCounts).map(([status, count]) => (
                <div
                  key={status}
                  style={{
                    width: `${(count / totalItems) * 100}%`,
                    backgroundColor: STATUS_COLORS[status]?.bg || '#c4c4c4',
                  }}
                  title={`${STATUS_LABELS[status] || status}: ${count}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
