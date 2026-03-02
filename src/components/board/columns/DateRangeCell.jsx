import { useState, useRef, useEffect } from 'react';
import { CalendarRange, X, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getDateSemaphore } from '../../../lib/utils';

const semaphoreColors = {
  overdue: '#e2445c',
  warning: '#fdab3d',
  ok:      '#00c875',
  none:    '#c4c4c4',
};

/**
 * DateRangeCell
 * value: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' } | null | undefined
 * onChange: (value) => void  — passes the updated object (or null when cleared)
 */
export default function DateRangeCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(value?.start || '');
  const [end, setEnd]     = useState(value?.end   || '');
  const popoverRef = useRef(null);

  // Sync local state when external value changes
  useEffect(() => {
    setStart(value?.start || '');
    setEnd(value?.end   || '');
  }, [value?.start, value?.end]);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const semaphore = getDateSemaphore(end || start);

  const fmt = (d) =>
    d ? format(new Date(d + 'T12:00:00'), 'dd MMM', { locale: es }) : null;

  const hasAny  = start || end;

  const handleChange = (field, val) => {
    const next = { start: field === 'start' ? val : start, end: field === 'end' ? val : end };
    if (field === 'start') setStart(val);
    else setEnd(val);
    // Only persist if at least one field has a value
    onChange(next.start || next.end ? next : null);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setStart('');
    setEnd('');
    onChange(null);
  };

  return (
    <div className="relative w-full flex justify-center">
      {hasAny ? (
        <div
          className="flex items-center gap-1 group/dr cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: semaphoreColors[semaphore] }}
          />
          <span className="text-[11px] text-text-primary whitespace-nowrap">
            {fmt(start) || '–'}
            <ArrowRight className="inline w-2.5 h-2.5 mx-0.5 text-text-disabled" />
            {fmt(end) || '–'}
          </span>
          <button
            onClick={handleClear}
            className="opacity-0 group-hover/dr:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 text-text-disabled hover:text-status-red" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="p-1 hover:bg-surface-hover rounded transition-colors"
        >
          <CalendarRange className="w-4 h-4 text-text-disabled hover:text-primary" />
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            ref={popoverRef}
            className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl border border-border-light p-4 w-[240px]"
          >
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Rango de fechas
            </p>

            {/* Fecha inicio */}
            <div className="mb-3">
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Fecha de inicio
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={start}
                  max={end || undefined}
                  onChange={(e) => handleChange('start', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                {start && (
                  <button
                    onClick={() => handleChange('start', '')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-disabled hover:text-status-red"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Fecha límite */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Fecha límite
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={end}
                  min={start || undefined}
                  onChange={(e) => handleChange('end', e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                {end && (
                  <button
                    onClick={() => handleChange('end', '')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-disabled hover:text-status-red"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Semáforo / duración */}
            {start && end && (
              <div
                className="text-[11px] text-center py-1.5 rounded-lg font-medium"
                style={{
                  backgroundColor: semaphoreColors[semaphore] + '18',
                  color: semaphoreColors[semaphore],
                }}
              >
                {getDurationLabel(start, end)}
              </div>
            )}

            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full h-[30px] text-[12px] font-semibold text-white rounded-lg bg-primary hover:bg-primary-hover transition-colors"
            >
              Confirmar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function getDurationLabel(start, end) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end   + 'T00:00:00');
  const days = Math.round((e - s) / 86400000);
  if (days < 0)  return 'Rango inválido';
  if (days === 0) return 'Mismo día';
  if (days === 1) return '1 día';
  if (days < 7)  return `${days} días`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? '1 semana' : `${weeks} semanas`;
}
