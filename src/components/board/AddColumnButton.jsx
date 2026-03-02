import { useState } from 'react';
import { Plus, Type, Hash, Calendar, CalendarRange, CheckSquare, Star, Link, Tag, Users, ListTodo, Flag } from 'lucide-react';
import useBoardStore from '../../stores/boardStore';
import { COLUMN_TYPES } from '../../lib/constants';

const COLUMN_OPTIONS = [
  { type: COLUMN_TYPES.STATUS, label: 'Estado', icon: ListTodo },
  { type: COLUMN_TYPES.PERSON, label: 'Persona', icon: Users },
  { type: COLUMN_TYPES.DATE, label: 'Fecha límite', icon: Calendar },
  { type: COLUMN_TYPES.DATE_RANGE, label: 'Rango de fechas', icon: CalendarRange },
  { type: COLUMN_TYPES.PRIORITY, label: 'Prioridad', icon: Flag },
  { type: COLUMN_TYPES.TEXT, label: 'Texto', icon: Type },
  { type: COLUMN_TYPES.NUMBER, label: 'Número', icon: Hash },
  { type: COLUMN_TYPES.CHECKBOX, label: 'Checkbox', icon: CheckSquare },
  { type: COLUMN_TYPES.RATING, label: 'Calificación', icon: Star },
  { type: COLUMN_TYPES.LINK, label: 'Enlace', icon: Link },
  { type: COLUMN_TYPES.TAG, label: 'Etiquetas', icon: Tag },
];

export default function AddColumnButton({ boardId }) {
  const [open, setOpen] = useState(false);
  const { addColumn } = useBoardStore();

  const handleAdd = (option) => {
    addColumn(boardId, {
      title: option.label,
      type: option.type,
      width: option.type === COLUMN_TYPES.TAG ? 180 : option.type === COLUMN_TYPES.DATE_RANGE ? 200 : 130,
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-full flex items-center justify-center hover:bg-surface-hover transition-colors"
        title="Agregar columna"
      >
        <Plus className="w-4 h-4 text-text-disabled hover:text-primary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20 animate-slide-down">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-text-disabled uppercase tracking-wider">
              Tipo de columna
            </p>
            {COLUMN_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.type}
                  onClick={() => handleAdd(option)}
                  className="w-full px-3 py-2 text-left text-[13px] text-text-primary hover:bg-surface-secondary flex items-center gap-2 transition-colors"
                >
                  <Icon className="w-4 h-4 text-text-secondary" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
