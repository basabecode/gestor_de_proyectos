import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths,
  differenceInDays, isToday, isWeekend, eachWeekOfInterval, startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../../../lib/constants';
import { cn } from '../../../lib/utils';

const DAY_WIDTH = 28;

export default function GanttView({ board }) {
  const scrollRef = useRef(null);
  const [baseDate, setBaseDate] = useState(new Date());

  // Show 2 months
  const rangeStart = startOfMonth(baseDate);
  const rangeEnd = endOfMonth(addMonths(baseDate, 1));
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 });

  // Build gantt items with dependencies
  const ganttItems = useMemo(() => {
    return board.items
      .filter((item) => item.columnValues?.date)
      .map((item) => {
        const startDate = new Date(item.columnValues.date + 'T12:00:00');
        const endDateStr = item.columnValues?.timeline_end;
        const endDate = endDateStr
          ? new Date(endDateStr + 'T12:00:00')
          : new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);

        const status = item.columnValues?.status || 'pending';
        const isDone = status === 'done';
        const progress = isDone ? 100 : status === 'working_on_it' ? 50 : status === 'stuck' ? 25 : 0;
        const group = board.groups.find((g) => g.id === item.groupId);

        return {
          ...item,
          startDate,
          endDate,
          status,
          isDone,
          progress,
          groupColor: group?.color || '#579bfc',
          groupName: group?.title || '',
        };
      })
      .sort((a, b) => a.startDate - b.startDate);
  }, [board.items, board.groups]);

  // Group by board groups
  const groupedItems = useMemo(() => {
    const result = [];
    board.groups.forEach((g) => {
      const items = ganttItems.filter((i) => i.groupId === g.id);
      if (items.length > 0) {
        result.push({ group: g, items });
      }
    });
    return result;
  }, [ganttItems, board.groups]);

  const getBarStyle = (startDate, endDate) => {
    const startOffset = differenceInDays(startDate, rangeStart);
    const duration = Math.max(1, differenceInDays(endDate, startDate) + 1);
    return {
      left: startOffset * DAY_WIDTH,
      width: duration * DAY_WIDTH,
    };
  };

  const todayOffset = differenceInDays(new Date(), rangeStart) * DAY_WIDTH + DAY_WIDTH / 2;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Controls */}
      <div className="bg-white border-b border-border-light px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setBaseDate(subMonths(baseDate, 1))} className="p-1.5 hover:bg-surface-hover rounded">
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <h3 className="text-[14px] font-semibold text-text-primary min-w-[200px] text-center capitalize">
            {format(rangeStart, 'MMM', { locale: es })} - {format(rangeEnd, 'MMM yyyy', { locale: es })}
          </h3>
          <button onClick={() => setBaseDate(addMonths(baseDate, 1))} className="p-1.5 hover:bg-surface-hover rounded">
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={() => setBaseDate(new Date())} className="text-[12px] text-primary hover:underline">Hoy</button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-text-secondary">
          {Object.entries(STATUS_LABELS).slice(0, 4).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[key]?.bg }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Gantt content */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div style={{ minWidth: days.length * DAY_WIDTH + 280 }}>
          {/* Week header */}
          <div className="flex sticky top-0 z-10 bg-white">
            <div className="w-[280px] min-w-[280px] border-r border-b border-border-light bg-surface-secondary" />
            <div className="flex border-b border-border-light">
              {weeks.map((weekStart) => {
                const weekDays = eachDayOfInterval({
                  start: weekStart,
                  end: new Date(Math.min(new Date(weekStart).getTime() + 6 * 86400000, rangeEnd.getTime())),
                });
                return (
                  <div
                    key={weekStart.toISOString()}
                    className="text-center text-[10px] text-text-disabled py-1 border-r border-border-light bg-surface-secondary"
                    style={{ width: weekDays.length * DAY_WIDTH }}
                  >
                    Sem {format(weekStart, 'w')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day numbers header */}
          <div className="flex sticky top-[25px] z-10 bg-white">
            <div className="w-[280px] min-w-[280px] border-r border-b border-border-light bg-white flex">
              <div className="flex-1 px-3 py-1 text-[10px] font-semibold text-text-secondary">Elemento</div>
              <div className="w-[60px] px-2 py-1 text-[10px] font-semibold text-text-secondary text-center">Estado</div>
              <div className="w-[50px] px-2 py-1 text-[10px] font-semibold text-text-secondary text-center">%</div>
            </div>
            <div className="flex border-b border-border-light">
              {days.map((day) => {
                const today = isToday(day);
                const weekend = isWeekend(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'text-center py-1 border-r border-border-light',
                      today && 'bg-primary/10',
                      weekend && !today && 'bg-surface-secondary/40'
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <div className={cn('text-[10px]', today ? 'text-primary font-bold' : 'text-text-disabled')}>
                      {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gantt rows */}
          {groupedItems.map(({ group, items }) => (
            <div key={group.id}>
              {/* Group row */}
              <div className="flex border-b border-border-light bg-surface-secondary/30">
                <div className="w-[280px] min-w-[280px] px-3 py-1.5 border-r border-border-light flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: group.color }} />
                  <span className="text-[12px] font-bold" style={{ color: group.color }}>{group.title}</span>
                </div>
                <div style={{ width: days.length * DAY_WIDTH }} />
              </div>

              {items.map((item) => {
                const barStyle = getBarStyle(item.startDate, item.endDate);
                const barColor = STATUS_COLORS[item.status]?.bg || item.groupColor;

                return (
                  <div key={item.id} className="flex border-b border-border-light hover:bg-surface-secondary/20">
                    {/* Left info */}
                    <div className="w-[280px] min-w-[280px] border-r border-border-light flex items-center">
                      <div className="flex-1 px-3 py-1.5 flex items-center gap-1.5 min-w-0">
                        {item.isDone && <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />}
                        <span className={cn('text-[12px] truncate', item.isDone && 'line-through text-text-disabled')}>
                          {item.title}
                        </span>
                      </div>
                      <div className="w-[60px] flex justify-center">
                        <span
                          className="text-[9px] font-semibold text-white px-1.5 py-0.5 rounded-sm"
                          style={{ backgroundColor: barColor }}
                        >
                          {STATUS_LABELS[item.status]?.slice(0, 4)}
                        </span>
                      </div>
                      <div className="w-[50px] text-center text-[11px] text-text-secondary font-medium">
                        {item.progress}%
                      </div>
                    </div>

                    {/* Bar area */}
                    <div className="relative" style={{ width: days.length * DAY_WIDTH, height: 32 }}>
                      {/* Weekend shading */}
                      {days.map((day) => isWeekend(day) && (
                        <div
                          key={day.toISOString()}
                          className="absolute top-0 bottom-0 bg-surface-secondary/30"
                          style={{ left: differenceInDays(day, rangeStart) * DAY_WIDTH, width: DAY_WIDTH }}
                        />
                      ))}

                      {/* Today line */}
                      <div
                        className="absolute top-0 bottom-0 w-px bg-primary/50 z-[1]"
                        style={{ left: todayOffset }}
                      />

                      {/* Gantt bar with progress */}
                      <div
                        className="absolute top-1.5 h-5 rounded overflow-hidden"
                        style={{
                          left: Math.max(0, barStyle.left),
                          width: Math.max(DAY_WIDTH, barStyle.width),
                        }}
                      >
                        {/* Background */}
                        <div className="absolute inset-0 rounded" style={{ backgroundColor: barColor, opacity: 0.25 }} />
                        {/* Progress fill */}
                        <div
                          className="absolute top-0 left-0 bottom-0 rounded-l"
                          style={{ width: `${item.progress}%`, backgroundColor: barColor }}
                        />
                        {/* Label */}
                        <span className="relative z-[1] text-[9px] font-medium text-text-primary px-1.5 leading-5 truncate block">
                          {format(item.startDate, 'dd/MM')} → {format(item.endDate, 'dd/MM')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {ganttItems.length === 0 && (
            <div className="px-6 py-12 text-center text-[13px] text-text-disabled">
              No hay elementos con fecha asignada.<br />
              Asigna fechas para visualizar el diagrama de Gantt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
