import { useState, useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getDateSemaphore } from '../../../lib/utils';

const semaphoreColors = {
  overdue: '#e2445c',
  warning: '#fdab3d',
  ok: '#00c875',
  none: '#c4c4c4',
};

export default function DateCell({ value, onChange }) {
  const inputRef = useRef(null);
  const dateStr = value || '';
  const semaphore = getDateSemaphore(dateStr);

  const displayDate = dateStr
    ? format(new Date(dateStr + 'T12:00:00'), 'dd MMM', { locale: es })
    : '';

  return (
    <div className="relative w-full flex justify-center">
      {dateStr ? (
        <div className="flex items-center gap-1.5 group/date cursor-pointer" onClick={() => inputRef.current?.showPicker()}>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: semaphoreColors[semaphore] }}
          />
          <span className="text-[12px] text-text-primary">{displayDate}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="opacity-0 group-hover/date:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 text-text-disabled hover:text-status-red" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.showPicker()}
          className="p-1 hover:bg-surface-hover rounded transition-colors"
        >
          <Calendar className="w-4 h-4 text-text-disabled hover:text-primary" />
        </button>
      )}
      <input
        ref={inputRef}
        type="date"
        value={dateStr}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full cursor-pointer"
      />
    </div>
  );
}
