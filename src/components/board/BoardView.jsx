import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Users,
  Eye,
  X,
  LayoutGrid,
  Columns3,
  Calendar,
  Download,
  Upload,
  Clock,
  GanttChart,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useBoardStore from '../../stores/boardStore';
import GroupSection from './GroupSection';
import KanbanView from './views/KanbanView';
import CalendarView from './views/CalendarView';
import TimelineView from './views/TimelineView';
import GanttView from './views/GanttView';
import AutomationsPanel from './AutomationsPanel';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../lib/constants';

const VIEW_TABS = [
  { id: 'table', label: 'Tabla', icon: LayoutGrid },
  { id: 'kanban', label: 'Kanban', icon: Columns3 },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'gantt', label: 'Gantt', icon: GanttChart },
];

export default function BoardView({ board }) {
  const { addGroup } = useBoardStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeView, setActiveView] = useState('table');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState([]);
  const [personFilter, setPersonFilter] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState([]);

  // Sort
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState(null); // column id
  const [sortDir, setSortDir] = useState('asc');

  // Person filter
  const [showPersonFilter, setShowPersonFilter] = useState(false);

  // Automations
  const [showAutomations, setShowAutomations] = useState(false);

  // Unique people in board
  const people = useMemo(() => {
    const set = new Set();
    board.items.forEach((i) => {
      const p = i.columnValues?.person;
      if (p) set.add(p);
    });
    return [...set];
  }, [board.items]);

  const hasActiveFilters = statusFilter.length > 0 || personFilter.length > 0 || priorityFilter.length > 0;

  // Apply filters
  const filteredItems = useMemo(() => {
    let items = board.items;

    if (searchTerm) {
      items = items.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (statusFilter.length > 0) {
      items = items.filter((item) => statusFilter.includes(item.columnValues?.status || 'pending'));
    }

    if (personFilter.length > 0) {
      items = items.filter((item) => personFilter.includes(item.columnValues?.person));
    }

    if (priorityFilter.length > 0) {
      items = items.filter((item) => priorityFilter.includes(item.columnValues?.priority || 'none'));
    }

    // Sort
    if (sortBy) {
      items = [...items].sort((a, b) => {
        const aVal = sortBy === 'title' ? a.title : a.columnValues?.[sortBy] || '';
        const bVal = sortBy === 'title' ? b.title : b.columnValues?.[sortBy] || '';
        const cmp = String(aVal).localeCompare(String(bVal), 'es', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return items;
  }, [board.items, searchTerm, statusFilter, personFilter, priorityFilter, sortBy, sortDir]);

  const filteredBoard = { ...board, items: filteredItems };

  const clearAllFilters = () => {
    setStatusFilter([]);
    setPersonFilter([]);
    setPriorityFilter([]);
    setSearchTerm('');
    setSortBy(null);
  };

  const toggleFilter = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [['Título', 'Estado', 'Persona', 'Fecha', 'Prioridad', 'Grupo']];
    filteredItems.forEach((item) => {
      const group = board.groups.find((g) => g.id === item.groupId);
      rows.push([
        item.title,
        STATUS_LABELS[item.columnValues?.status] || '',
        item.columnValues?.person || '',
        item.columnValues?.date || '',
        PRIORITY_LABELS[item.columnValues?.priority] || '',
        group?.title || '',
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${board.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado a CSV');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-border-light px-2 md:px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto shrink-0 pb-1 sm:pb-0 -mx-1 px-1">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded text-[12px] md:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Search */}
          {showSearch && (
            <div className="relative animate-slide-down">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-disabled" />
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => { if (!searchTerm) setShowSearch(false); }}
                placeholder="Buscar..."
                className="pl-8 pr-3 py-1.5 w-36 md:w-48 text-[13px] rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          )}
          <button onClick={() => setShowSearch(!showSearch)} className="p-1.5 hover:bg-surface-secondary rounded transition-colors" title="Buscar">
            <Search className="w-4 h-4 text-text-secondary" />
          </button>

          {/* Person filter */}
          <div className="relative">
            <button
              onClick={() => { setShowPersonFilter(!showPersonFilter); setShowFilters(false); setShowSort(false); }}
              className={`p-1.5 hover:bg-surface-secondary rounded transition-colors ${personFilter.length > 0 ? 'bg-primary/10 text-primary' : ''}`}
              title="Filtrar por persona"
            >
              <Users className="w-4 h-4 text-text-secondary" />
            </button>
            {showPersonFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPersonFilter(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20 animate-slide-down">
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-text-disabled uppercase">Persona</p>
                  {people.length === 0 && <p className="px-3 py-2 text-[12px] text-text-disabled">Sin asignaciones</p>}
                  {people.map((p) => (
                    <button
                      key={p}
                      onClick={() => toggleFilter(personFilter, setPersonFilter, p)}
                      className={`w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-surface-secondary ${personFilter.includes(p) ? 'bg-primary/5 text-primary' : 'text-text-primary'}`}
                    >
                      <input type="checkbox" checked={personFilter.includes(p)} readOnly className="rounded" />
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => { setShowFilters(!showFilters); setShowPersonFilter(false); setShowSort(false); }}
              className={`p-1.5 hover:bg-surface-secondary rounded transition-colors ${hasActiveFilters ? 'bg-primary/10 text-primary' : ''}`}
              title="Filtrar"
            >
              <Filter className="w-4 h-4 text-text-secondary" />
            </button>
            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20 animate-slide-down max-h-[400px] overflow-y-auto">
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-text-disabled uppercase">Estado</p>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleFilter(statusFilter, setStatusFilter, key)}
                      className={`w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-surface-secondary ${statusFilter.includes(key) ? 'bg-primary/5' : ''}`}
                    >
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS[key]?.bg }} />
                      {label}
                      {statusFilter.includes(key) && <span className="ml-auto text-primary">✓</span>}
                    </button>
                  ))}
                  <hr className="my-1 border-border-light" />
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-text-disabled uppercase">Prioridad</p>
                  {Object.entries(PRIORITY_LABELS).filter(([_, l]) => l).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleFilter(priorityFilter, setPriorityFilter, key)}
                      className={`w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-surface-secondary ${priorityFilter.includes(key) ? 'bg-primary/5' : ''}`}
                    >
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: PRIORITY_COLORS[key]?.bg }} />
                      {label}
                      {priorityFilter.includes(key) && <span className="ml-auto text-primary">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => { setShowSort(!showSort); setShowFilters(false); setShowPersonFilter(false); }}
              className={`p-1.5 hover:bg-surface-secondary rounded transition-colors ${sortBy ? 'bg-primary/10 text-primary' : ''}`}
              title="Ordenar"
            >
              {sortDir === 'asc' ? <SortAsc className="w-4 h-4 text-text-secondary" /> : <SortDesc className="w-4 h-4 text-text-secondary" />}
            </button>
            {showSort && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-border-light py-1 z-20 animate-slide-down">
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-text-disabled uppercase">Ordenar por</p>
                  {[{ id: 'title', label: 'Título' }, ...board.columns.map((c) => ({ id: c.id, label: c.title }))].map((col) => (
                    <button
                      key={col.id}
                      onClick={() => {
                        if (sortBy === col.id) {
                          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy(col.id);
                          setSortDir('asc');
                        }
                      }}
                      className={`w-full px-3 py-1.5 text-left text-[12px] hover:bg-surface-secondary flex items-center justify-between ${sortBy === col.id ? 'text-primary bg-primary/5' : 'text-text-primary'}`}
                    >
                      {col.label}
                      {sortBy === col.id && <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  ))}
                  {sortBy && (
                    <>
                      <hr className="my-1 border-border-light" />
                      <button
                        onClick={() => { setSortBy(null); setShowSort(false); }}
                        className="w-full px-3 py-1.5 text-left text-[12px] text-status-red hover:bg-status-red-light"
                      >
                        Quitar orden
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Automations */}
          <button
            onClick={() => setShowAutomations(true)}
            className="p-1.5 hover:bg-surface-secondary rounded transition-colors"
            title="Automatizaciones"
          >
            <Zap className="w-4 h-4 text-text-secondary" />
          </button>

          {/* Export */}
          <button onClick={handleExportCSV} className="p-1.5 hover:bg-surface-secondary rounded transition-colors" title="Exportar CSV">
            <Download className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Active filters bar */}
      {hasActiveFilters && (
        <div className="bg-primary/5 border-b border-border-light px-4 py-1.5 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-text-secondary">Filtros:</span>
          {statusFilter.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: STATUS_COLORS[s]?.bg }}>
              {STATUS_LABELS[s]}
              <button onClick={() => toggleFilter(statusFilter, setStatusFilter, s)}><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
          {personFilter.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">
              {p}
              <button onClick={() => toggleFilter(personFilter, setPersonFilter, p)}><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
          {priorityFilter.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: PRIORITY_COLORS[p]?.bg }}>
              {PRIORITY_LABELS[p]}
              <button onClick={() => toggleFilter(priorityFilter, setPriorityFilter, p)}><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
          <button onClick={clearAllFilters} className="text-[11px] text-status-red hover:underline ml-auto">
            Limpiar todo
          </button>
        </div>
      )}

      {/* View content */}
      {activeView === 'table' && (
        <div className="flex-1 overflow-auto p-4">
          {board.groups.map((group) => (
            <GroupSection
              key={group.id}
              board={board}
              group={group}
              items={filteredItems.filter((i) => i.groupId === group.id)}
              columns={board.columns}
            />
          ))}
          <button
            onClick={() => addGroup(board.id)}
            className="flex items-center gap-2 px-4 py-2.5 mt-2 text-[13px] text-text-secondary hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar nuevo grupo
          </button>
        </div>
      )}

      {activeView === 'kanban' && <KanbanView board={filteredBoard} />}
      {activeView === 'calendar' && <CalendarView board={filteredBoard} />}
      {activeView === 'timeline' && <TimelineView board={filteredBoard} />}
      {activeView === 'gantt' && <GanttView board={filteredBoard} />}

      {/* Automations panel */}
      {showAutomations && (
        <AutomationsPanel
          open={showAutomations}
          onClose={() => setShowAutomations(false)}
          board={board}
        />
      )}
    </div>
  );
}
