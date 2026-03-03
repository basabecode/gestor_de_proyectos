import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths,
  differenceInDays, isSameMonth, isToday, isWeekend, startOfWeek, endOfWeek,
  addWeeks, subWeeks, eachWeekOfInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { STATUS_COLORS, STATUS_LABELS } from '../../../lib/constants';
import { Avatar } from '../../ui';
import { cn } from '../../../lib/utils';

const DAY_WIDTH = 36;

export default function TimelineView({ board }) {
  const scrollRef = useRef(null);
  const [baseDate, setBaseDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month | quarter

  const monthStart = startOfMonth(baseDate);
  const monthEnd = viewMode === 'quarter'
    ? endOfMonth(addMonths(baseDate, 2))
    : endOfMonth(baseDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Items with date ranges (date = start, we simulate end as +duration or +7 days)
  const timelineItems = useMemo(() => {
    return board.items
      .filter((item) => item.columnValues?.date)
      .map((item) => {
        const startDate = new Date(item.columnValues.date + 'T12:00:00');
        // Use timeline end if available, otherwise default 5 days
        const endDateStr = item.columnValues?.timeline_end;
        const endDate = endDateStr
          ? new Date(endDateStr + 'T12:00:00')
          : new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
        const group = board.groups.find((g) => g.id === item.groupId);
        return {
          ...item,
          startDate,
          endDate,
          groupColor: group?.color || '#579bfc',
          groupName: group?.title || '',
        };
      })
      .sort((a, b) => a.startDate - b.startDate);
  }, [board.items, board.groups]);

  const getBarPosition = (startDate, endDate) => {
    const startOffset = differenceInDays(startDate, monthStart);
    const duration = Math.max(1, differenceInDays(endDate, startDate) + 1);
    return {
      left: startOffset * DAY_WIDTH,
      width: duration * DAY_WIDTH,
    };
  };

  // Group items by group
  const groupedItems = useMemo(() => {
    const groups = {};
    board.groups.forEach((g) => {
      groups[g.id] = {
        group: g,
        items: timelineItems.filter((i) => i.groupId === g.id),
      };
    });
    return Object.values(groups).filter((g) => g.items.length > 0);
  }, [timelineItems, board.groups]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header controls */}
      <div className="bg-white border-b border-border-light px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setBaseDate(viewMode === 'quarter' ? subMonths(baseDate, 3) : subMonths(baseDate, 1))} className="p-1.5 hover:bg-surface-hover rounded">
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <h3 className="text-[14px] font-semibold text-text-primary min-w-45 text-center capitalize">
            {viewMode === 'quarter'
              ? `${format(monthStart, 'MMM', { locale: es })} - ${format(monthEnd, 'MMM yyyy', { locale: es })}`
              : format(baseDate, 'MMMM yyyy', { locale: es })
            }
          </h3>
          <button onClick={() => setBaseDate(viewMode === 'quarter' ? addMonths(baseDate, 3) : addMonths(baseDate, 1))} className="p-1.5 hover:bg-surface-hover rounded">
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={() => setBaseDate(new Date())} className="text-[12px] text-primary hover:underline">Hoy</button>
        </div>
        <div className="flex items-center gap-1">
          {['month', 'quarter'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-3 py-1 rounded text-[12px] font-medium transition-colors',
                viewMode === mode ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-secondary'
              )}
            >
              {mode === 'month' ? 'Mes' : 'Trimestre'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div style={{ minWidth: days.length * DAY_WIDTH + 240 }}>
          {/* Days header */}
          <div className="flex sticky top-0 z-10 bg-white border-b border-border-light">
            {/* Left label column */}
            <div className="w-60 min-w-60 px-3 py-2 border-r border-border-light bg-surface-secondary text-[11px] font-semibold text-text-secondary">
              Elemento
            </div>
            {/* Day columns */}
            <div className="flex">
              {days.map((day) => {
                const today = isToday(day);
                const weekend = isWeekend(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'text-center border-r border-border-light py-1',
                      today && 'bg-primary/10',
                      weekend && !today && 'bg-surface-secondary/50'
                    )}
                    style={{ width: DAY_WIDTH, minWidth: DAY_WIDTH }}
                  >
                    <div className="text-[9px] text-text-disabled uppercase">{format(day, 'EEE', { locale: es }).slice(0, 2)}</div>
                    <div className={cn(
                      'text-[11px] font-medium',
                      today ? 'text-primary font-bold' : 'text-text-secondary'
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline rows */}
          {groupedItems.map(({ group, items }) => (
            <div key={group.id}>
              {/* Group header */}
              <div className="flex border-b border-border-light bg-surface-secondary/30">
                <div className="w-60 min-w-60 px-3 py-1.5 border-r border-border-light flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: group.color }} />
                  <span className="text-[12px] font-semibold" style={{ color: group.color }}>{group.title}</span>
                  <span className="text-[10px] text-text-disabled">{items.length}</span>
                </div>
                <div style={{ width: days.length * DAY_WIDTH }} />
              </div>

              {/* Item rows */}
              {items.map((item) => {
                const pos = getBarPosition(item.startDate, item.endDate);
                const status = item.columnValues?.status || 'pending';
                const barColor = STATUS_COLORS[status]?.bg || item.groupColor;
                const person = item.columnValues?.person;

                return (
                  <div key={item.id} className="flex border-b border-border-light hover:bg-surface-secondary/30 group/row">
                    {/* Label */}
                    <div className="w-60 min-w-60 px-3 py-2 border-r border-border-light flex items-center gap-2">
                      {person && <Avatar name={person} size="xs" />}
                      <span className="text-[12px] text-text-primary truncate">{item.title}</span>
                    </div>
                    {/* Bar area */}
                    <div className="relative" style={{ width: days.length * DAY_WIDTH, height: 36 }}>
                      {/* Today line */}
                      {days.some(isToday) && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-primary/40 z-[1]"
                          style={{ left: differenceInDays(new Date(), monthStart) * DAY_WIDTH + DAY_WIDTH / 2 }}
                        />
                      )}
                      {/* Bar */}
                      <div
                        className="absolute top-1.5 h-5 rounded-full flex items-center px-2 text-[10px] text-white font-medium cursor-default hover:opacity-90 transition-opacity"
                        style={{
                          left: Math.max(0, pos.left),
                          width: Math.max(DAY_WIDTH, pos.width),
                          backgroundColor: barColor,
                        }}
                        title={`${item.title}: ${format(item.startDate, 'dd MMM', { locale: es })} → ${format(item.endDate, 'dd MMM', { locale: es })}`}
                      >
                        <span className="truncate">{item.title}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {timelineItems.length === 0 && (
            <div className="px-6 py-12 text-center text-[13px] text-text-disabled">
              No hay elementos con fecha asignada para mostrar en el timeline.
              <br />
              Asigna fechas a los elementos del tablero para verlos aquí.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
