import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  LayoutGrid, TrendingUp, CheckCircle2, AlertTriangle,
  Clock, Users, GripVertical, X, Plus, Settings2, RotateCcw,
  AlertCircle, ShieldAlert, Flame, DollarSign, CalendarClock,
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { Avatar } from '../components/ui';
import useBoardStore from '../stores/boardStore';
import useRiskStore, { riskScore, riskLevel, RISK_LEVEL_COLORS } from '../stores/riskStore';
import useDashboardStore, { WIDGET_TYPES } from '../stores/dashboardStore';
import { calculateEVM, getHealthStatus, getPctPlanned, formatCurrency, HEALTH_CONFIG } from '../lib/pmis';
import { supabase } from '../lib/supabase';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../lib/constants';
import { formatRelativeDate, cn } from '../lib/utils';

const SIZE_CLASSES = {
  full: 'col-span-full',
  two_thirds: 'col-span-full lg:col-span-2',
  half: 'col-span-full lg:col-span-1',
  third: 'col-span-full lg:col-span-1',
};

function SortableWidget({ widget, children, editMode }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: widget.id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(SIZE_CLASSES[widget.size] || 'col-span-1')}>
      {children({ attributes, listeners, isDragging })}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { boards } = useBoardStore();
  const { widgets, editMode, toggleEditMode, removeWidget, addWidget, reorderWidgets, resetWidgets } = useDashboardStore();
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  const stats = useMemo(() => {
    const allItems = boards.flatMap((b) => b.items);
    const statusCounts = {};
    Object.keys(STATUS_LABELS).forEach((s) => { statusCounts[s] = 0; });
    allItems.forEach((i) => {
      const s = i.columnValues?.status || 'pending';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const priorityCounts = {};
    Object.keys(PRIORITY_LABELS).forEach((p) => { priorityCounts[p] = 0; });
    allItems.forEach((i) => {
      const p = i.columnValues?.priority || 'none';
      priorityCounts[p] = (priorityCounts[p] || 0) + 1;
    });

    const boardStats = boards.map((b) => ({
      name: b.name.length > 12 ? b.name.slice(0, 12) + '...' : b.name,
      total: b.items.length,
      done: b.items.filter((i) => i.columnValues?.status === 'done').length,
      stuck: b.items.filter((i) => i.columnValues?.status === 'stuck').length,
    }));

    const peopleCounts = {};
    const peopleStatus = {};
    allItems.forEach((i) => {
      const person = i.columnValues?.person;
      if (person) {
        peopleCounts[person] = (peopleCounts[person] || 0) + 1;
        if (!peopleStatus[person]) peopleStatus[person] = { done: 0, working: 0, stuck: 0, other: 0 };
        const s = i.columnValues?.status || 'pending';
        if (s === 'done') peopleStatus[person].done++;
        else if (s === 'working_on_it') peopleStatus[person].working++;
        else if (s === 'stuck') peopleStatus[person].stuck++;
        else peopleStatus[person].other++;
      }
    });
    const topPeople = Object.entries(peopleCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const recent = [...allItems].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8);

    const overdue = allItems.filter((i) => {
      const date = i.columnValues?.date;
      if (!date) return false;
      const d = new Date(date);
      const status = i.columnValues?.status;
      return d < new Date() && status !== 'done';
    });

    return { allItems, statusCounts, priorityCounts, boardStats, topPeople, peopleStatus, recent, overdue };
  }, [boards]);

  const handleDragStart = (e) => setActiveId(e.active.id);
  const handleDragEnd = (e) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = sortedWidgets.map((w) => w.id);
    const oldIdx = ids.indexOf(active.id);
    const newIdx = ids.indexOf(over.id);
    const newIds = [...ids];
    const [removed] = newIds.splice(oldIdx, 1);
    newIds.splice(newIdx, 0, removed);
    reorderWidgets(newIds);
  };

  const existingTypes = widgets.map((w) => w.type);
  const availableTypes = Object.entries(WIDGET_TYPES).filter(([type]) => !existingTypes.includes(type));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Dashboard toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h2 className="text-[16px] font-semibold text-text-primary">Mi Dashboard</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {editMode && (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowAddWidget(!showAddWidget)}
                    className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-primary bg-primary/10 rounded hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar widget
                  </button>
                  {showAddWidget && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowAddWidget(false)} />
                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20">
                        {availableTypes.length > 0 ? availableTypes.map(([type, config]) => (
                          <button
                            key={type}
                            onClick={() => { addWidget(type); setShowAddWidget(false); }}
                            className="w-full px-3 py-2 text-left text-[12px] text-text-primary hover:bg-surface-secondary"
                          >
                            {config.label}
                          </button>
                        )) : (
                          <p className="px-3 py-2 text-[12px] text-text-disabled">Todos los widgets agregados</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={resetWidgets}
                  className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-surface-secondary rounded transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restablecer
                </button>
              </>
            )}
            <button
              onClick={toggleEditMode}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded transition-colors',
                editMode ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-secondary'
              )}
            >
              <Settings2 className="w-3.5 h-3.5" /> {editMode ? 'Listo' : 'Editar'}
            </button>
          </div>
        </div>

        {/* Widget grid */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sortedWidgets.map((widget) => (
                <SortableWidget key={widget.id} widget={widget} editMode={editMode}>
                  {({ attributes, listeners }) => (
                    <WidgetCard
                      widget={widget}
                      editMode={editMode}
                      onRemove={() => removeWidget(widget.id)}
                      dragHandleProps={{ ...attributes, ...listeners }}
                      stats={stats}
                      boards={boards}
                      navigate={navigate}
                    />
                  )}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId && (
              <div className="bg-white border border-primary/30 shadow-lg rounded-lg px-4 py-3 text-[13px] font-medium text-text-primary opacity-90">
                {widgets.find((w) => w.id === activeId)?.title || 'Widget'}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function WidgetCard({ widget, editMode, onRemove, dragHandleProps, stats, boards, navigate }) {
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-[--shadow-sm] border border-border-light overflow-hidden',
      editMode && 'ring-2 ring-dashed ring-primary/20'
    )}>
      {/* Widget header */}
      <div className="flex items-center px-4 py-3 border-b border-border-light">
        {editMode && (
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing mr-2">
            <GripVertical className="w-4 h-4 text-text-disabled" />
          </div>
        )}
        <h3 className="text-[13px] font-semibold text-text-primary flex-1">{widget.title}</h3>
        {editMode && (
          <button onClick={onRemove} className="p-1 hover:bg-surface-hover rounded text-text-disabled hover:text-status-red">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Widget content */}
      <div className="p-4">
        {widget.type === 'summary'         && <SummaryWidget stats={stats} />}
        {widget.type === 'project_health'  && <ProjectHealthWidget boards={boards} navigate={navigate} />}
        {widget.type === 'evm_trend'       && <EVMTrendWidget boards={boards} />}
        {widget.type === 'risk_overview'   && <RiskOverviewWidget boards={boards} navigate={navigate} />}
        {widget.type === 'status_pie'      && <StatusPieWidget stats={stats} />}
        {widget.type === 'board_bar'       && <BoardBarWidget stats={stats} />}
        {widget.type === 'recent_activity' && <RecentActivityWidget stats={stats} boards={boards} navigate={navigate} />}
        {widget.type === 'team'            && <TeamWidget stats={stats} />}
        {widget.type === 'workload'        && <WorkloadWidget stats={stats} />}
        {widget.type === 'priority_dist'   && <PriorityWidget stats={stats} />}
        {widget.type === 'overdue'         && <OverdueWidget stats={stats} boards={boards} navigate={navigate} />}
        {widget.type === 'completion_trend'&& <CompletionTrendWidget boards={boards} />}
      </div>
    </div>
  );
}

// --- Widget Components ---

function SummaryWidget({ stats }) {
  const totalItems = stats.allItems.length;
  const doneItems = stats.statusCounts.done || 0;
  const workingItems = stats.statusCounts.working_on_it || 0;
  const stuckItems = stats.statusCounts.stuck || 0;

  const cards = [
    { label: 'Total elementos', value: totalItems, icon: LayoutGrid, color: 'bg-primary' },
    { label: 'En progreso', value: workingItems, icon: TrendingUp, color: 'bg-status-yellow' },
    { label: 'Completados', value: doneItems, icon: CheckCircle2, color: 'bg-status-green' },
    { label: 'Detenidos', value: stuckItems, icon: AlertTriangle, color: 'bg-status-red' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary/50">
            <div className={`${card.color} p-2 rounded-lg`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-text-secondary">{card.label}</p>
              <p className="text-[22px] font-bold text-text-primary">{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusPieWidget({ stats }) {
  const pieData = Object.entries(stats.statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status],
      value: count,
      color: STATUS_COLORS[status]?.bg || '#c4c4c4',
    }));

  if (pieData.length === 0) return <p className="text-[13px] text-text-disabled py-6 text-center">Sin datos</p>;

  return (
    <div className="flex items-center gap-4">
      <div className="w-35 h-35">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
              {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}`, name]} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {pieData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[11px] text-text-secondary flex-1">{entry.name}</span>
            <span className="text-[11px] font-semibold text-text-primary">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardBarWidget({ stats }) {
  if (stats.boardStats.length === 0) return <p className="text-[13px] text-text-disabled py-6 text-center">Sin datos</p>;

  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={stats.boardStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
        <Bar dataKey="done" name="Listo" fill="#00c875" radius={[2, 2, 0, 0]} />
        <Bar dataKey="stuck" name="Detenido" fill="#e2445c" radius={[2, 2, 0, 0]} />
        <Bar dataKey="total" name="Total" fill="#579bfc" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RecentActivityWidget({ stats, boards, navigate }) {
  if (stats.recent.length === 0) return <p className="text-[13px] text-text-disabled py-6 text-center">Sin actividad</p>;

  return (
    <div className="space-y-1">
      {stats.recent.map((item) => {
        const status = item.columnValues?.status || 'pending';
        const board = boards.find((b) => b.items.some((i) => i.id === item.id));
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 px-2 py-1.5 hover:bg-surface-secondary rounded-md cursor-pointer transition-colors"
            onClick={() => board && navigate(`/board/${board.id}`)}
          >
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: STATUS_COLORS[status]?.bg }} />
            <span className="text-[12px] text-text-primary flex-1 truncate">{item.title}</span>
            <span className="text-[10px] text-text-disabled shrink-0">{formatRelativeDate(item.updatedAt)}</span>
          </div>
        );
      })}
    </div>
  );
}

function TeamWidget({ stats }) {
  if (stats.topPeople.length === 0) return <p className="text-[13px] text-text-disabled py-6 text-center">Sin asignaciones</p>;

  return (
    <div className="space-y-2">
      {stats.topPeople.map(([person, count]) => (
        <div key={person} className="flex items-center gap-2.5">
          <Avatar name={person} size="sm" />
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-medium text-text-primary block truncate">{person}</span>
            <span className="text-[10px] text-text-disabled">{count} elementos</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkloadWidget({ stats }) {
  if (stats.topPeople.length === 0) return <p className="text-[13px] text-text-disabled py-6 text-center">Sin datos</p>;

  const data = stats.topPeople.map(([person, total]) => {
    const ps = stats.peopleStatus[person] || {};
    return {
      name: person.length > 8 ? person.slice(0, 8) + '..' : person,
      Listo: ps.done || 0,
      'En progreso': ps.working || 0,
      Detenido: ps.stuck || 0,
      Otro: ps.other || 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={65} />
        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
        <Bar dataKey="Listo" stackId="a" fill="#00c875" />
        <Bar dataKey="En progreso" stackId="a" fill="#fdab3d" />
        <Bar dataKey="Detenido" stackId="a" fill="#e2445c" />
        <Bar dataKey="Otro" stackId="a" fill="#c4c4c4" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PriorityWidget({ stats }) {
  const data = Object.entries(stats.priorityCounts)
    .filter(([key, count]) => count > 0 && PRIORITY_LABELS[key])
    .map(([key, count]) => ({
      name: PRIORITY_LABELS[key],
      value: count,
      color: PRIORITY_COLORS[key]?.bg || '#c4c4c4',
    }));

  if (data.length === 0) return <p className="text-[13px] text-text-disabled py-6 text-center">Sin datos</p>;

  return (
    <div className="flex items-center gap-4">
      <div className="w-35 h-35">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
              {data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}`, name]} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[11px] text-text-secondary flex-1">{entry.name}</span>
            <span className="text-[11px] font-semibold text-text-primary">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverdueWidget({ stats, boards, navigate }) {
  if (stats.overdue.length === 0) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-8 h-8 text-status-green mx-auto mb-1 opacity-50" />
        <p className="text-[13px] text-text-disabled">Sin elementos vencidos</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {stats.overdue.slice(0, 6).map((item) => {
        const board = boards.find((b) => b.items.some((i) => i.id === item.id));
        return (
          <div
            key={item.id}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-status-red-light rounded cursor-pointer"
            onClick={() => board && navigate(`/board/${board.id}`)}
          >
            <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0" />
            <span className="text-[12px] text-text-primary flex-1 truncate">{item.title}</span>
            <span className="text-[10px] text-status-red font-medium">{formatRelativeDate(item.columnValues?.date)}</span>
          </div>
        );
      })}
      {stats.overdue.length > 6 && (
        <p className="text-[10px] text-text-disabled text-center pt-1">+{stats.overdue.length - 6} más</p>
      )}
    </div>
  );
}

function CompletionTrendWidget({ boards }) {
  const data = useMemo(() => {
    const allItems = boards.flatMap((b) => b.items);
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const completed = allItems.filter((item) => {
        const updated = item.updatedAt?.split('T')[0];
        return item.columnValues?.status === 'done' && updated === dateStr;
      }).length;
      last7.push({
        day: d.toLocaleDateString('es', { weekday: 'short' }),
        Completados: completed,
      });
    }
    return last7;
  }, [boards]);

  return (
    <ResponsiveContainer width="100%" height={170}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" />
        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
        <Line type="monotone" dataKey="Completados" stroke="#00c875" strokeWidth={2} dot={{ r: 3, fill: '#00c875' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── M-08 NEW WIDGETS ──────────────────────────────────────────────────────────

// Helper: compute per-board health using PMIS
function boardHealth(board) {
  const items      = board.items ?? [];
  const total      = items.length;
  const done       = items.filter((i) => i.columnValues?.status === 'done').length;
  const pctComplete = total > 0 ? (done / total) * 100 : 0;
  const pctPlanned  = getPctPlanned(board.plannedStart, board.plannedEnd);
  const evm         = calculateEVM({
    bac:         board.budget,
    pctComplete,
    pctPlanned,
    actualCost:  board.actualCost,
  });
  const status = evm
    ? getHealthStatus(evm.cpi, evm.spi)
    : (total === 0 ? 'unknown' : pctComplete >= 90 ? 'healthy' : 'unknown');

  return { evm, status, pctComplete, pctPlanned };
}

// 1 ── Project Health Heatmap ──────────────────────────────────────────────────

function ProjectHealthWidget({ boards, navigate }) {
  if (boards.length === 0) {
    return <p className="text-[13px] text-text-disabled py-6 text-center">Sin tableros</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {boards.map((board) => {
        const { evm, status, pctComplete, pctPlanned } = boardHealth(board);
        const cfg = HEALTH_CONFIG[status];

        return (
          <div
            key={board.id}
            onClick={() => navigate(`/board/${board.id}`)}
            className="rounded-lg border border-border-light overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
            style={{ borderTopColor: cfg.color, borderTopWidth: 3 }}
          >
            {/* Name row */}
            <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="text-[13px] font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                  {board.name}
                </span>
              </div>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>

            {/* Pillars */}
            <div className="grid grid-cols-3 divide-x divide-border-light border-t border-border-light">
              {/* Scope */}
              <PillarCell
                icon={Flame}
                label="Alcance"
                value={`${Math.round(pctComplete)}%`}
                color={pctComplete >= 90 ? '#00c875' : pctComplete >= 50 ? '#fdab3d' : '#e2445c'}
                title="% de tareas completadas"
              />
              {/* Schedule */}
              <PillarCell
                icon={CalendarClock}
                label="Tiempo"
                value={evm?.spi != null ? evm.spi.toFixed(2) : '—'}
                color={evm?.spi == null ? '#9ca3af' : evm.spi >= 0.9 ? '#00c875' : evm.spi >= 0.7 ? '#fdab3d' : '#e2445c'}
                title="SPI (Schedule Performance Index)"
              />
              {/* Budget */}
              <PillarCell
                icon={DollarSign}
                label="Costo"
                value={evm?.cpi != null ? evm.cpi.toFixed(2) : '—'}
                color={evm?.cpi == null ? '#9ca3af' : evm.cpi >= 0.9 ? '#00c875' : evm.cpi >= 0.7 ? '#fdab3d' : '#e2445c'}
                title="CPI (Cost Performance Index)"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PillarCell({ icon: Icon, label, value, color, title }) {
  return (
    <div className="flex flex-col items-center py-2 px-1" title={title}>
      <Icon className="w-3.5 h-3.5 mb-0.5" style={{ color }} />
      <span className="text-[12px] font-bold" style={{ color }}>{value}</span>
      <span className="text-[9px] text-text-disabled uppercase tracking-wide">{label}</span>
    </div>
  );
}

// 2 ── EVM Trend ───────────────────────────────────────────────────────────────

function EVMTrendWidget({ boards }) {
  const [selectedBoard, setSelectedBoard] = useState(boards[0]?.id || '');
  const [snapshots, setSnapshots]         = useState([]);
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    if (!selectedBoard) return;
    setLoading(true);
    supabase
      .from('progress_snapshots')
      .select('*')
      .eq('board_id', selectedBoard)
      .order('snapshot_date', { ascending: true })
      .then(({ data }) => {
        setSnapshots(data || []);
        setLoading(false);
      });
  }, [selectedBoard]);

  // Compute current metrics for reference lines
  const board = boards.find((b) => b.id === selectedBoard);
  const currentHealth = board ? boardHealth(board) : null;

  const chartData = snapshots.map((s) => ({
    date: new Date(s.snapshot_date).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
    CPI:  s.cpi  != null ? parseFloat(s.cpi.toFixed(3))  : null,
    SPI:  s.spi  != null ? parseFloat(s.spi.toFixed(3))  : null,
    'EV%': s.pct_complete != null ? parseFloat(s.pct_complete.toFixed(1)) : null,
  }));

  return (
    <div>
      {/* Board selector */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={selectedBoard}
          onChange={(e) => setSelectedBoard(e.target.value)}
          className="text-[12px] border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
        >
          {boards.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {board && (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: HEALTH_CONFIG[currentHealth?.status || 'unknown'].bg,
              color:           HEALTH_CONFIG[currentHealth?.status || 'unknown'].color,
            }}
          >
            {HEALTH_CONFIG[currentHealth?.status || 'unknown'].label}
          </span>
        )}
      </div>

      {loading && <p className="text-[12px] text-text-disabled text-center py-6">Cargando snapshots…</p>}

      {!loading && snapshots.length === 0 && (
        <div className="text-center py-6">
          <p className="text-[13px] text-text-secondary mb-1">Sin snapshots registrados</p>
          <p className="text-[11px] text-text-disabled">
            Abre el panel PMIS del tablero y guarda un snapshot para ver la tendencia histórica.
          </p>
        </div>
      )}

      {!loading && snapshots.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              domain={[0, 1.5]}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              formatter={(v, name) => [v?.toFixed(2) ?? '—', name]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {/* Healthy threshold reference */}
            <ReferenceLine y={1.0} stroke="#e6e9ef" strokeDasharray="4 2" label={{ value: '1.0', fontSize: 9, fill: '#9ca3af' }} />
            <ReferenceLine y={0.9} stroke="#fdab3d" strokeDasharray="3 2" label={{ value: '0.9', fontSize: 9, fill: '#fdab3d' }} />
            <Line
              type="monotone" dataKey="CPI" name="CPI (costo)"
              stroke="#579bfc" strokeWidth={2} dot={{ r: 3 }}
              connectNulls
            />
            <Line
              type="monotone" dataKey="SPI" name="SPI (cronograma)"
              stroke="#00c875" strokeWidth={2} dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Budget summary for selected board */}
      {board && board.budget > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-border-light">
          {[
            { label: 'Presupuesto', value: formatCurrency(board.budget, true), color: '#579bfc' },
            { label: 'Costo actual', value: formatCurrency(board.actualCost, true), color: '#fdab3d' },
            { label: 'EAC estimado', value: formatCurrency(currentHealth?.evm?.eac, true), color: currentHealth?.evm?.vac < 0 ? '#e2445c' : '#00c875' },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-[14px] font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-[10px] text-text-disabled">{m.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 3 ── Risk Overview ───────────────────────────────────────────────────────────

function RiskOverviewWidget({ boards, navigate }) {
  const { risks } = useRiskStore();

  const boardRisks = useMemo(() => {
    return boards
      .map((b) => {
        const boardRisks = risks.filter((r) => r.board_id === b.id && r.status !== 'closed');
        const byLevel = { critical: 0, high: 0, medium: 0, low: 0 };
        boardRisks.forEach((r) => {
          byLevel[riskLevel(riskScore(r))]++;
        });
        return { id: b.id, name: b.name.length > 14 ? b.name.slice(0, 14) + '…' : b.name, ...byLevel, total: boardRisks.length };
      })
      .filter((b) => b.total > 0);
  }, [boards, risks]);

  const totalCritical = boardRisks.reduce((s, b) => s + b.critical, 0);
  const totalHigh     = boardRisks.reduce((s, b) => s + b.high,     0);

  if (boardRisks.length === 0) {
    return (
      <div className="text-center py-6">
        <ShieldAlert className="w-8 h-8 text-status-green mx-auto mb-2 opacity-40" />
        <p className="text-[13px] text-text-disabled">Sin riesgos abiertos registrados</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary badges */}
      {(totalCritical > 0 || totalHigh > 0) && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {totalCritical > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: RISK_LEVEL_COLORS.critical.bg }}>
              <AlertTriangle className="w-3 h-3" /> {totalCritical} crítico{totalCritical > 1 ? 's' : ''}
            </span>
          )}
          {totalHigh > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: RISK_LEVEL_COLORS.high.bg }}>
              {totalHigh} alto{totalHigh > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      <ResponsiveContainer width="100%" height={Math.min(180, boardRisks.length * 36 + 20)}>
        <BarChart
          data={boardRisks}
          layout="vertical"
          margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
          onClick={(d) => d?.activePayload && navigate(`/board/${d.activePayload[0]?.payload?.id}`)}
          style={{ cursor: 'pointer' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
          <Tooltip
            contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
            formatter={(v, name) => [v, name]}
          />
          <Bar dataKey="critical" name="Crítico"  stackId="a" fill={RISK_LEVEL_COLORS.critical.bg} />
          <Bar dataKey="high"     name="Alto"     stackId="a" fill={RISK_LEVEL_COLORS.high.bg}     />
          <Bar dataKey="medium"   name="Medio"    stackId="a" fill={RISK_LEVEL_COLORS.medium.bg}   />
          <Bar dataKey="low"      name="Bajo"     stackId="a" fill={RISK_LEVEL_COLORS.low.bg}      radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-3 mt-2 justify-center flex-wrap">
        {Object.entries(RISK_LEVEL_COLORS).map(([level, cfg]) => (
          <span key={level} className="flex items-center gap-1 text-[10px] text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cfg.bg }} />
            {cfg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
