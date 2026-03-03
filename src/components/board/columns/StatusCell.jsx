import { useState, useRef } from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../../lib/constants';
import CellDropdown from '../../ui/CellDropdown';

const statuses = Object.keys(STATUS_LABELS);

export default function StatusCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const current = value || 'pending';
  const config = STATUS_COLORS[current] || STATUS_COLORS.pending;

  return (
    <div ref={anchorRef} className="relative w-full">
      <div
        className="status-badge w-full"
        style={{ backgroundColor: config.bg, color: config.text }}
        onClick={() => setOpen(!open)}
      >
        {STATUS_LABELS[current] || current}
      </div>

      <CellDropdown anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} width={130}>
        {statuses.map((status) => {
          const cfg = STATUS_COLORS[status];
          return (
            <button
              key={status}
              onClick={() => { onChange(status); setOpen(false); }}
              className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-surface-secondary text-[12px]"
            >
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: cfg.bg }} />
              {STATUS_LABELS[status]}
            </button>
          );
        })}
      </CellDropdown>
    </div>
  );
}
