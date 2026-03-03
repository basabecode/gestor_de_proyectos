import { useState, useRef } from 'react';
import { Avatar } from '../../ui';
import CellDropdown from '../../ui/CellDropdown';
import { Plus, X } from 'lucide-react';

const PEOPLE = ['Ana García', 'Carlos López', 'María Torres', 'Juan Pérez', 'Laura Díaz', 'Diego Ruiz'];

export default function PersonCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const person = value || '';

  return (
    <div ref={anchorRef} className="relative w-full flex justify-center">
      {person ? (
        <div className="flex items-center gap-1 cursor-pointer group/person" onClick={() => setOpen(!open)}>
          <Avatar name={person} size="xs" />
          <span className="text-[11px] text-text-secondary truncate max-w-17.5">{person.split(' ')[0]}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="opacity-0 group-hover/person:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 text-text-disabled hover:text-status-red" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="w-6 h-6 rounded-full border border-dashed border-border hover:border-primary flex items-center justify-center transition-colors"
        >
          <Plus className="w-3 h-3 text-text-disabled" />
        </button>
      )}

      <CellDropdown anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} width={160}>
        {PEOPLE.map((p) => (
          <button
            key={p}
            onClick={() => { onChange(p); setOpen(false); }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-surface-secondary text-[12px] text-text-primary"
          >
            <Avatar name={p} size="xs" />
            {p}
          </button>
        ))}
      </CellDropdown>
    </div>
  );
}
