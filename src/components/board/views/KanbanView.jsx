import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, GripVertical } from 'lucide-react';
import useBoardStore from '../../../stores/boardStore';
import { Avatar } from '../../ui';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from '../../../lib/constants';
import { cn, formatDate, getDateSemaphore } from '../../../lib/utils';

const semaphoreColors = {
  overdue: '#e2445c',
  warning: '#fdab3d',
  ok: '#00c875',
  none: 'transparent',
};

function KanbanCard({ item, board, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };

  const priority = item.columnValues?.priority;
  const person = item.columnValues?.person;
  const date = item.columnValues?.date;
  const dateSemaphore = getDateSemaphore(date);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg border border-border-light p-3 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow cursor-default group/card',
        isDragging && 'shadow-[--shadow-lg] rotate-2'
      )}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover/card:opacity-100 transition-opacity"
        >
          <GripVertical className="w-3.5 h-3.5 text-text-disabled" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-text-primary leading-snug">{item.title}</p>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {priority && priority !== 'none' && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm text-white"
                style={{ backgroundColor: PRIORITY_COLORS[priority]?.bg }}
              >
                {PRIORITY_LABELS[priority]}
              </span>
            )}
            {date && (
              <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: semaphoreColors[dateSemaphore] }}
                />
                {formatDate(date, 'dd MMM')}
              </span>
            )}
          </div>
        </div>

        {person && (
          <Avatar name={person} size="xs" className="mt-0.5" />
        )}
      </div>

      {/* Subitems indicator */}
      {item.subitems?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border-light">
          <span className="text-[10px] text-text-disabled">
            {item.subitems.filter(s => s.completed).length}/{item.subitems.length} sub-elementos
          </span>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ status, items, board, color, label, onAddItem }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAddItem(newTitle.trim(), status);
      setNewTitle('');
      setShowAdd(false);
    }
  };

  return (
    <div className="flex flex-col w-[280px] min-w-[280px] max-h-full">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2 mb-2">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[13px] font-semibold text-text-primary">{label}</span>
        <span className="text-[11px] text-text-disabled bg-surface-secondary px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-2">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} board={board} />
          ))}
        </SortableContext>

        {/* Add card */}
        {showAdd ? (
          <div className="bg-white rounded-lg border border-primary p-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowAdd(false); setNewTitle(''); } }}
              placeholder="Nombre del elemento..."
              className="w-full text-[13px] px-1 py-0.5 outline-none"
            />
            <div className="flex justify-end gap-1 mt-2">
              <button onClick={() => { setShowAdd(false); setNewTitle(''); }} className="text-[11px] text-text-secondary px-2 py-1 hover:bg-surface-secondary rounded">
                Cancelar
              </button>
              <button onClick={handleAdd} className="text-[11px] text-white bg-primary px-2 py-1 rounded hover:bg-primary-hover">
                Agregar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center gap-1.5 px-3 py-2 text-[12px] text-text-disabled hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar elemento
          </button>
        )}
      </div>
    </div>
  );
}

export default function KanbanView({ board }) {
  const { updateItemColumn, addItem } = useBoardStore();
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const statuses = Object.keys(STATUS_LABELS);

  const itemsByStatus = {};
  statuses.forEach((status) => {
    itemsByStatus[status] = board.items.filter(
      (i) => (i.columnValues?.status || 'pending') === status
    );
  });

  const activeItem = activeId ? board.items.find((i) => i.id === activeId) : null;

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Determine target status from the over element
    const overItem = board.items.find((i) => i.id === over.id);
    if (overItem) {
      const targetStatus = overItem.columnValues?.status || 'pending';
      const activeItemObj = board.items.find((i) => i.id === active.id);
      if (activeItemObj && (activeItemObj.columnValues?.status || 'pending') !== targetStatus) {
        updateItemColumn(board.id, active.id, 'status', targetStatus);
      }
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeItem = board.items.find((i) => i.id === active.id);
    const overItem = board.items.find((i) => i.id === over.id);

    if (activeItem && overItem) {
      const activeStatus = activeItem.columnValues?.status || 'pending';
      const overStatus = overItem.columnValues?.status || 'pending';
      if (activeStatus !== overStatus) {
        updateItemColumn(board.id, active.id, 'status', overStatus);
      }
    }
  };

  const handleAddItem = (title, status) => {
    const firstGroup = board.groups[0];
    if (!firstGroup) return;
    addItem(board.id, firstGroup.id, {
      title,
      columnValues: { status },
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-4 h-full">
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              items={itemsByStatus[status]}
              board={board}
              color={STATUS_COLORS[status].bg}
              label={STATUS_LABELS[status]}
              onAddItem={handleAddItem}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeItem && (
          <div className="bg-white rounded-lg border border-border-light p-3 shadow-[--shadow-lg] w-[260px] rotate-2">
            <p className="text-[13px] font-medium text-text-primary">{activeItem.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
