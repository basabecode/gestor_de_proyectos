import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay, addMonths, subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { STATUS_COLORS } from '../../../lib/constants';
import { Avatar } from '../../ui';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Festivos colombianos 2026
const HOLIDAYS_2026 = [
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
  '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
  '2026-11-16', '2026-12-08', '2026-12-25',
];

function isHoliday(date) {
  return HOLIDAYS_2026.includes(format(date, 'yyyy-MM-dd'));
}

export default function CalendarView({ board }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Map items to dates
  const itemsByDate = {};
  board.items.forEach((item) => {
    const date = item.columnValues?.date;
    if (date) {
      const key = date;
      if (!itemsByDate[key]) itemsByDate[key] = [];
      itemsByDate[key].push(item);
    }
  });

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Header nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1.5 hover:bg-surface-hover rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h2 className="text-[16px] font-semibold text-text-primary capitalize min-w-40 text-center">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1.5 hover:bg-surface-hover rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-[12px] text-primary hover:underline ml-2"
          >
            Hoy
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-status-red" /> Festivo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Elemento
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-lg shadow-[--shadow-sm] border border-border-light overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border-light">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold text-text-secondary uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayItems = itemsByDate[dateKey] || [];
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const holiday = isHoliday(day);
            const isSunday = day.getDay() === 0;

            return (
              <div
                key={dateKey}
                className={`min-h-22.5 border-b border-r border-border-light p-1 ${
                  !inMonth ? 'bg-surface-secondary/50' : ''
                } ${holiday ? 'bg-status-red-light/30' : ''} ${isSunday ? 'bg-surface-secondary/30' : ''}`}
              >
                <div className="flex items-center justify-between px-1">
                  <span
                    className={`text-[12px] font-medium ${
                      today
                        ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center'
                        : !inMonth
                        ? 'text-text-disabled'
                        : 'text-text-primary'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {holiday && <span className="text-[9px] text-status-red font-medium">Festivo</span>}
                </div>

                {/* Items */}
                <div className="mt-1 space-y-0.5">
                  {dayItems.slice(0, 3).map((item) => {
                    const status = item.columnValues?.status || 'pending';
                    const color = STATUS_COLORS[status]?.bg || '#c4c4c4';
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate cursor-default hover:opacity-80"
                        style={{ backgroundColor: color + '20', color }}
                        title={item.title}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate font-medium">{item.title}</span>
                      </div>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <span className="text-[9px] text-text-disabled px-1">+{dayItems.length - 3} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
