import { useState } from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../../lib/constants';

const statuses = Object.keys(STATUS_LABELS);

export default function StatusCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = value || 'pending';
  const config = STATUS_COLORS[current] || STATUS_COLORS.pending;

  return (
    <div className="relative w-full">
      <div
        className="status-badge w-full"
        style={{ backgroundColor: config.bg, color: config.text }}
        onClick={() => setOpen(!open)}
      >
        {STATUS_LABELS[current] || current}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20 w-[130px] animate-slide-down">
            {statuses.map((status) => {
              const cfg = STATUS_COLORS[status];
              return (
                <button
                  key={status}
                  onClick={() => { onChange(status); setOpen(false); }}
                  className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-surface-secondary text-[12px]"
                >
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: cfg.bg }}
                  />
                  {STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
