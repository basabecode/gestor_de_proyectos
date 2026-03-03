import { useState, useRef } from 'react';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../../lib/constants';
import CellDropdown from '../../ui/CellDropdown';

const priorities = Object.keys(PRIORITY_LABELS);

export default function PriorityCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const current = value || 'none';
  const config = PRIORITY_COLORS[current] || PRIORITY_COLORS.none;

  return (
    <div ref={anchorRef} className="relative w-full">
      <div
        className="status-badge w-full"
        style={{ backgroundColor: config.bg, color: config.text, opacity: config.opacity || 1 }}
        onClick={() => setOpen(!open)}
      >
        {PRIORITY_LABELS[current] || '-'}
      </div>

      <CellDropdown anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} width={120}>
        {priorities.map((p) => {
          const cfg = PRIORITY_COLORS[p];
          return (
            <button
              key={p}
              onClick={() => { onChange(p); setOpen(false); }}
              className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-surface-secondary text-[12px]"
            >
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: cfg.bg, opacity: cfg.opacity || 1 }}
              />
              {PRIORITY_LABELS[p] || '-'}
            </button>
          );
        })}
      </CellDropdown>
    </div>
  );
}
