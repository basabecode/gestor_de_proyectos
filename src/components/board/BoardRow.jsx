import { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Trash2, GripVertical, MessageSquare, ChevronRight, Paperclip, ShieldAlert } from 'lucide-react';
import { riskLevel, RISK_LEVEL_COLORS } from '../../stores/riskStore';
import toast from 'react-hot-toast';
import useBoardStore from '../../stores/boardStore';
import useAutomationStore, { TRIGGER_TYPES } from '../../stores/automationStore';
import useNotificationStore from '../../stores/notificationStore';
import StatusCell from './columns/StatusCell';
import PersonCell from './columns/PersonCell';
import DateCell from './columns/DateCell';
import PriorityCell from './columns/PriorityCell';
import TextCell from './columns/TextCell';
import NumberCell from './columns/NumberCell';
import CheckboxCell from './columns/CheckboxCell';
import RatingCell from './columns/RatingCell';
import LinkCell from './columns/LinkCell';
import TagCell from './columns/TagCell';
import ItemDetailPanel from './ItemDetailPanel';
import { COLUMN_TYPES } from '../../lib/constants';

const cellComponents = {
  [COLUMN_TYPES.STATUS]: StatusCell,
  [COLUMN_TYPES.PERSON]: PersonCell,
  [COLUMN_TYPES.DATE]: DateCell,
  [COLUMN_TYPES.PRIORITY]: PriorityCell,
  [COLUMN_TYPES.TEXT]: TextCell,
  [COLUMN_TYPES.NUMBER]: NumberCell,
  [COLUMN_TYPES.CHECKBOX]: CheckboxCell,
  [COLUMN_TYPES.RATING]: RatingCell,
  [COLUMN_TYPES.LINK]: LinkCell,
  [COLUMN_TYPES.TAG]: TagCell,
};

export default function BoardRow({ board, item, columns, groupColor, sortable, lensColor, riskScore: itemRiskScore }) {
  const { updateItem, updateItemColumn, deleteItem } = useBoardStore();
  const { executeAutomations } = useAutomationStore();
  const { addNotification } = useNotificationStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(item.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Wrapper to trigger automations on column changes
  const handleColumnChange = useCallback((colId, value) => {
    const oldValue = item.columnValues?.[colId];
    updateItemColumn(board.id, item.id, colId, value);

    // Determine trigger type
    let triggerType = null;
    if (colId === 'status') triggerType = TRIGGER_TYPES.STATUS_CHANGE;
    else if (colId === 'priority') triggerType = TRIGGER_TYPES.PRIORITY_CHANGE;
    else if (colId === 'person' && value) triggerType = TRIGGER_TYPES.PERSON_ASSIGNED;

    // Person assignment notification
    if (colId === 'person' && value && value !== oldValue) {
      addNotification({
        type: 'assignment',
        title: `${value} asignado a "${item.title}"`,
        message: `Se asignó a ${value} al elemento "${item.title}"`,
        boardId: board.id,
        itemId: item.id,
        itemTitle: item.title,
        author: 'Usuario',
      });
    }

    if (triggerType) {
      const boardStoreState = useBoardStore.getState();
      const results = executeAutomations(board.id, triggerType, {
        itemId: item.id,
        itemTitle: item.title,
        columnId: colId,
        oldValue: oldValue || '',
        newValue: value,
      }, boardStoreState);

      // Show toast and create notifications for executed automations
      results.forEach((r) => {
        if (r.message) {
          toast.success(`⚡ ${r.message}`, { duration: 3000 });
          addNotification({
            type: 'automation',
            title: `Automatización ejecutada`,
            message: `"${item.title}": ${r.message}`,
            boardId: board.id,
            itemId: item.id,
            itemTitle: item.title,
            author: 'Sistema',
          });
        }
      });
    }
  }, [board.id, item.id, item.title, item.columnValues, updateItemColumn, executeAutomations]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !sortable });

  const style = sortable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  } : {};

  const handleTitleSubmit = () => {
    if (titleValue.trim()) {
      updateItem(board.id, item.id, { title: titleValue.trim() });
    } else {
      setTitleValue(item.title);
    }
    setEditingTitle(false);
  };

  return (
    <>
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center border-b border-border-light board-row group/row min-w-fit"
    >
      <div className="group-indicator" style={{ backgroundColor: lensColor ?? groupColor }} />

      {/* Drag handle + Checkbox */}
      <div className="w-8 px-1 py-2.5 flex items-center justify-center cell-border gap-0.5">
        {sortable && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <GripVertical className="w-3 h-3 text-text-disabled" />
          </div>
        )}
        <input
          type="checkbox"
          checked={item.columnValues?.status === 'done'}
          onChange={() => {
            const newStatus = item.columnValues?.status === 'done' ? 'pending' : 'done';
            handleColumnChange('status', newStatus);
          }}
          className="rounded cursor-pointer"
        />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-[250px] px-3 py-2 cell-border">
        {editingTitle ? (
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSubmit(); if (e.key === 'Escape') { setTitleValue(item.title); setEditingTitle(false); } }}
            className="w-full text-[13px] font-medium px-1 py-0.5 rounded border border-primary outline-none"
          />
        ) : (
          <div className="flex items-center gap-2">
            {itemRiskScore != null && (
              <span
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: RISK_LEVEL_COLORS[riskLevel(itemRiskScore)].bg }}
                title={`Riesgo: ${itemRiskScore}`}
              >
                <ShieldAlert className="w-3 h-3" />
                {itemRiskScore}
              </span>
            )}
            <span
              className="text-[13px] font-medium text-text-primary cursor-pointer hover:text-primary transition-colors"
              onClick={() => setEditingTitle(true)}
            >
              {item.title || <span className="text-text-disabled italic">Sin título</span>}
            </span>
            <div className="row-actions opacity-0 flex items-center gap-0.5 ml-auto">
              {item.subitems?.length > 0 && (
                <span className="text-[10px] text-text-disabled flex items-center gap-0.5">
                  <ChevronRight className="w-3 h-3" />
                  {item.subitems.length}
                </span>
              )}
              {(item.comments?.length > 0 || item.attachments?.length > 0) && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDetail(true); }}
                  className="flex items-center gap-1 text-[10px] text-text-disabled hover:text-primary"
                >
                  {item.comments?.length > 0 && (
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="w-3 h-3" />
                      {item.comments.length}
                    </span>
                  )}
                  {item.attachments?.length > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Paperclip className="w-3 h-3" />
                      {item.attachments.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic columns */}
      {columns.map((col) => {
        const CellComponent = cellComponents[col.type] || TextCell;
        return (
          <div
            key={col.id}
            className="px-1 py-1.5 cell-border flex items-center justify-center"
            style={{ width: col.width, minWidth: col.width }}
          >
            <CellComponent
              value={item.columnValues?.[col.id]}
              onChange={(value) => handleColumnChange(col.id, value)}
              column={col}
            />
          </div>
        );
      })}

      {/* Actions */}
      <div className="w-10 flex items-center justify-center relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover:bg-surface-hover rounded row-actions opacity-0 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4 text-text-secondary" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20">
              <button
                onClick={() => { setShowDetail(true); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-[13px] text-text-primary hover:bg-surface-secondary flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Abrir detalle
              </button>
              <hr className="my-1 border-border-light" />
              <button
                onClick={() => { deleteItem(board.id, item.id); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-[13px] text-status-red hover:bg-status-red-light flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Item detail panel */}
    {showDetail && (
      <ItemDetailPanel
        open={showDetail}
        onClose={() => setShowDetail(false)}
        boardId={board.id}
        itemId={item.id}
      />
    )}
    </>
  );
}
