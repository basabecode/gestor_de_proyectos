/**
 * M-10: Canvas Híbrido Gantt + Kanban
 * Panel izquierdo: Gantt (vista de cronograma)
 * Panel derecho:  Kanban (vista ágil)
 * Divisor arrastrable para ajustar la proporción.
 */
import { useState, useRef, useCallback } from 'react';
import { GanttChart, Columns3, GripVertical } from 'lucide-react';
import GanttView  from './GanttView';
import KanbanView from './KanbanView';

export default function HybridView({ board, activeLens = 'none' }) {
  // splitPct: porcentaje del ancho dedicado al Gantt (30–70%)
  const [splitPct, setSplitPct] = useState(50);
  const containerRef = useRef(null);
  const dragging     = useRef(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;

    const onMove = (ev) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x    = ev.clientX - rect.left;
      const pct  = Math.min(70, Math.max(30, (x / rect.width) * 100));
      setSplitPct(pct);
    };

    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div ref={containerRef} className="flex-1 flex overflow-hidden select-none">
      {/* ── Left: Gantt ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col overflow-hidden border-r border-border-light"
        style={{ width: `${splitPct}%` }}
      >
        {/* Panel label */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary border-b border-border-light shrink-0">
          <GanttChart className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Gantt</span>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <GanttView board={board} />
        </div>
      </div>

      {/* ── Draggable divider ──────────────────────────────────────────── */}
      <div
        onMouseDown={handleMouseDown}
        className="w-2 shrink-0 flex items-center justify-center cursor-col-resize hover:bg-primary/10 active:bg-primary/20 transition-colors group z-10"
        title="Arrastrar para redimensionar"
      >
        <GripVertical className="w-3 h-5 text-text-disabled group-hover:text-primary transition-colors" />
      </div>

      {/* ── Right: Kanban ───────────────────────────────────────────────── */}
      <div className="flex flex-col overflow-hidden flex-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary border-b border-border-light shrink-0">
          <Columns3 className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Kanban</span>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <KanbanView board={board} activeLens={activeLens} />
        </div>
      </div>
    </div>
  );
}
