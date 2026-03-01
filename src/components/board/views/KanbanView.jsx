import { useState, useMemo } from 'react';
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
import { Plus, GripVertical, Settings2, Check, X } from 'lucide-react';
import useBoardStore from '../../../stores/boardStore';
import useRiskStore, { riskScore, riskLevel, RISK_LEVEL_COLORS } from '../../../stores/riskStore';
import { Avatar } from '../../ui';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from '../../../lib/constants';
import { cn, formatDate, getDateSemaphore } from '../../../lib/utils';

const semaphoreColors = {
  overdue: '#e2445c',
  warning: '#fdab3d',
  ok:      '#00c875',
  none:    'transparent',
};

// ── Assignee load map: person → count of "working_on_it" items ────────────────

function buildLoadMap(items) {
  const map = {};
  items.forEach((i) => {
    if (i.columnValues?.status === 'working_on_it' && i.columnValues?.person) {
      const p = i.columnValues.person;
      map[p] = (map[p] || 0) + 1;
    }
  });
  return map;
}

function loadColor(count) {
  if (count >= 6) return '#e2445c';   // rojo  — sobrecargado
  if (count >= 3) return '#fdab3d';   // naranja — carga alta
  return '#00c875';                    // verde  — ok
}

// ── WIP status helpers ────────────────────────────────────────────────────────

/** Returns 'ok' | 'warning' | 'exceeded' based on count vs limit */
function wipStatus(count, limit) {
  if (!limit || limit === 0) return 'ok';
  if (count > limit)          return 'exceeded';
  if (count >= limit * 0.8)   return 'warning';
  return 'ok';
}

const WIP_STATUS_COLORS = {
  ok:       { bg: 'bg-surface-secondary',  text: 'text-text-disabled' },
  warning:  { bg: 'bg-status-yellow/20',   text: 'text-status-yellow' },
  exceeded: { bg: 'bg-status-red/10',      text: 'text-status-red'    },
};

// ── WIP Limit editor ──────────────────────────────────────────────────────────

function WipLimitEditor({ status, currentLimit, onSave, onClose }) {
  const [value, setValue] = useState(currentLimit || '');

  const handleSave = () => {
    const n = parseInt(value, 10);
    onSave(isNaN(n) || n <= 0 ? 0 : n);
    onClose();
  };

  return (
    <div className="absolute top-full left-0 mt-1 z-30 bg-white rounded-lg shadow-lg border border-border-light p-3 w-44 animate-slide-down">
      <p className="text-[11px] font-medium text-text-secondary mb-2">Límite WIP</p>
      <div className="flex gap-1.5">
        <input
          autoFocus
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
          placeholder="0 = sin límite"
          className="flex-1 w-0 text-[12px] border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={handleSave} className="p-1.5 bg-primary text-white rounded hover:bg-primary/90">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={onClose} className="p-1.5 hover:bg-surface-hover rounded text-text-secondary">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {currentLimit > 0 && (
        <button
          onClick={() => { onSave(0); onClose(); }}
          className="mt-2 text-[11px] text-status-red hover:underline w-full text-left"
        >
          Quitar límite
        </button>
      )}
    </div>
  );
}

// ── Kanban Card ───────────────────────────────────────────────────────────────

function KanbanCard({ item, board, loadMap, lensColor }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
    ...(lensColor ? { borderLeftColor: lensColor, borderLeftWidth: 3 } : {}),
  };

  const priority    = item.columnValues?.priority;
  const person      = item.columnValues?.person;
  const date        = item.columnValues?.date;
  const dateSemaphore = getDateSemaphore(date);
  const personLoad  = person ? (loadMap[person] || 0) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-border-light p-3 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow cursor-default group/card"
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
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: semaphoreColors[dateSemaphore] }} />
                {formatDate(date, 'dd MMM')}
              </span>
            )}
          </div>
        </div>

        {/* Avatar + load indicator */}
        {person && (
          <div className="relative mt-0.5">
            <Avatar name={person} size="xs" />
            {/* Colored dot indicating this person's WIP load */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
              style={{ backgroundColor: loadColor(personLoad) }}
              title={`${person}: ${personLoad} tarea(s) en progreso`}
            />
          </div>
        )}
      </div>

      {item.subitems?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border-light">
          <span className="text-[10px] text-text-disabled">
            {item.subitems.filter((s) => s.completed).length}/{item.subitems.length} sub-elementos
          </span>
        </div>
      )}
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({ status, items, board, color, label, wipLimit, onAddItem, onUpdateWipLimit, loadMap, lensMap }) {
  const [showAdd,      setShowAdd]      = useState(false);
  const [newTitle,     setNewTitle]     = useState('');
  const [showWipEdit,  setShowWipEdit]  = useState(false);

  const count     = items.length;
  const wip       = wipStatus(count, wipLimit);
  const wipColors = WIP_STATUS_COLORS[wip];

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAddItem(newTitle.trim(), status);
      setNewTitle('');
      setShowAdd(false);
    }
  };

  // Column background tint when WIP exceeded
  const columnBg = wip === 'exceeded'
    ? 'bg-status-red/5 border border-status-red/20'
    : wip === 'warning'
    ? 'bg-status-yellow/5'
    : 'bg-surface-secondary/50';

  return (
    <div className={cn('flex flex-col w-[280px] min-w-[280px] max-h-full rounded-xl transition-colors', columnBg)}>
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 mb-1">
        <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[13px] font-semibold text-text-primary flex-1">{label}</span>

        {/* WIP count badge */}
        <div className="relative">
          <button
            onClick={() => setShowWipEdit(!showWipEdit)}
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full transition-colors',
              wipColors.bg, wipColors.text,
              'hover:ring-1 hover:ring-border',
            )}
            title="Click para configurar límite WIP"
          >
            {count}
            {wipLimit > 0 && <span className="opacity-60">/ {wipLimit}</span>}
            <Settings2 className="w-2.5 h-2.5 ml-0.5 opacity-50" />
          </button>

          {showWipEdit && (
            <WipLimitEditor
              status={status}
              currentLimit={wipLimit}
              onSave={(limit) => onUpdateWipLimit(status, limit)}
              onClose={() => setShowWipEdit(false)}
            />
          )}
        </div>

        {/* WIP exceeded badge */}
        {wip === 'exceeded' && (
          <span className="text-[10px] font-bold text-status-red bg-status-red/10 px-1.5 py-0.5 rounded-full">
            ¡Límite!
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 px-2 pb-2">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} board={board} loadMap={loadMap} lensColor={lensMap[item.id]} />
          ))}
        </SortableContext>

        {/* Add card input */}
        {showAdd ? (
          <div className="bg-white rounded-lg border border-primary p-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') { setShowAdd(false); setNewTitle(''); }
              }}
              placeholder="Nombre del elemento..."
              className="w-full text-[13px] px-1 py-0.5 outline-none"
            />
            <div className="flex justify-end gap-1 mt-2">
              <button
                onClick={() => { setShowAdd(false); setNewTitle(''); }}
                className="text-[11px] text-text-secondary px-2 py-1 hover:bg-surface-secondary rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                className="text-[11px] text-white bg-primary px-2 py-1 rounded hover:bg-primary/90"
              >
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

// ── KanbanView (main) ─────────────────────────────────────────────────────────

export default function KanbanView({ board, activeLens = 'none' }) {
  const { updateItemColumn, addItem, updateWipLimit } = useBoardStore();
  const { risks } = useRiskStore();
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const statuses = Object.keys(STATUS_LABELS);
  const wipLimits = board.wipLimits || {};

  // Compute kanban lens map: itemId → color string
  const lensMap = useMemo(() => {
    if (activeLens === 'risk') {
      const map = {};
      risks
        .filter((r) => r.board_id === board.id && r.status !== 'closed' && r.item_id)
        .forEach((r) => {
          const s = riskScore(r);
          if (!map[r.item_id] || s > map[r.item_id].score) {
            map[r.item_id] = { color: RISK_LEVEL_COLORS[riskLevel(s)].bg, score: s };
          }
        });
      return Object.fromEntries(Object.entries(map).map(([id, v]) => [id, v.color]));
    }
    if (activeLens === 'workload') {
      const loadCounts = {};
      (board.items ?? []).forEach((i) => {
        if (i.columnValues?.status === 'working_on_it' && i.columnValues?.person) {
          const p = i.columnValues.person;
          loadCounts[p] = (loadCounts[p] || 0) + 1;
        }
      });
      const map = {};
      (board.items ?? []).forEach((i) => {
        const person = i.columnValues?.person;
        if (person) {
          const count = loadCounts[person] || 0;
          map[i.id] = count >= 6 ? '#e2445c' : count >= 3 ? '#fdab3d' : '#00c875';
        }
      });
      return map;
    }
    if (activeLens === 'date') {
      const semColors = { overdue: '#e2445c', warning: '#fdab3d', ok: '#00c875' };
      const map = {};
      (board.items ?? []).forEach((i) => {
        const sem = getDateSemaphore(i.columnValues?.date);
        if (semColors[sem]) map[i.id] = semColors[sem];
      });
      return map;
    }
    return {};
  }, [activeLens, risks, board.id, board.items]);

  const itemsByStatus = {};
  statuses.forEach((status) => {
    itemsByStatus[status] = (board.items ?? []).filter(
      (i) => (i.columnValues?.status || 'pending') === status,
    );
  });

  // Build load map from all items (across all statuses)
  const loadMap = buildLoadMap(board.items ?? []);

  const activeItem = activeId ? (board.items ?? []).find((i) => i.id === activeId) : null;

  const handleDragStart = (e) => setActiveId(e.active.id);

  const handleDragEnd = (e) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const overItem = (board.items ?? []).find((i) => i.id === over.id);
    if (overItem) {
      const targetStatus = overItem.columnValues?.status || 'pending';
      const activeItemObj = (board.items ?? []).find((i) => i.id === active.id);
      if (activeItemObj && (activeItemObj.columnValues?.status || 'pending') !== targetStatus) {
        updateItemColumn(board.id, active.id, 'status', targetStatus);
      }
    }
  };

  const handleDragOver = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeItemObj = (board.items ?? []).find((i) => i.id === active.id);
    const overItem      = (board.items ?? []).find((i) => i.id === over.id);
    if (activeItemObj && overItem) {
      const activeStatus = activeItemObj.columnValues?.status || 'pending';
      const overStatus   = overItem.columnValues?.status     || 'pending';
      if (activeStatus !== overStatus) {
        updateItemColumn(board.id, active.id, 'status', overStatus);
      }
    }
  };

  const handleAddItem = (title, status) => {
    const firstGroup = (board.groups ?? [])[0];
    if (!firstGroup) return;
    addItem(board.id, firstGroup.id, { title, columnValues: { status } });
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
              wipLimit={wipLimits[status] || 0}
              onAddItem={handleAddItem}
              onUpdateWipLimit={(s, limit) => updateWipLimit(board.id, s, limit)}
              loadMap={loadMap}
              lensMap={lensMap}
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
