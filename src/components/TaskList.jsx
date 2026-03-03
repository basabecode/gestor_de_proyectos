import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  FolderOpen,
  Filter,
  Trash2,
  Search,
  ArrowUpDown,
  AlertCircle,
  Star,
  ArrowUpRight,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { formatRelativeDate, formatShortDate } from '@/lib/utils';

const STATUS_CONFIG = {
  en_curso:  { label: 'En curso',  bg: 'bg-amber-400',   text: 'text-white' },
  listo:     { label: 'Listo',     bg: 'bg-emerald-500', text: 'text-white' },
  detenido:  { label: 'Detenido',  bg: 'bg-rose-500',    text: 'text-white' },
  pendiente: { label: 'Pendiente', bg: 'bg-gray-300',    text: 'text-white' },
};

export default function TaskList({ projects, toggleTask, deleteTask }) {
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [searchLocal,   setSearchLocal]   = useState('');
  const [sortBy,        setSortBy]        = useState('date');

  const allTasks = useMemo(
    () => projects.flatMap((project) =>
      (project.tasks || []).map((task) => ({
        ...task,
        projectId:   project.id,
        projectName: project.name,
      }))
    ),
    [projects]
  );

  const statsLocal = useMemo(() =>
    allTasks.reduce(
      (acc, t) => {
        acc.total++;
        if (t.status in acc) acc[t.status]++;
        if (!t.completed && t.dueDate && new Date(t.dueDate + 'T23:59:59') < new Date()) acc.overdue++;
        return acc;
      },
      { total: 0, listo: 0, en_curso: 0, detenido: 0, overdue: 0 }
    ),
    [allTasks]
  );

  const filtered = useMemo(() => {
    const result = allTasks.filter((t) => {
      if (filterStatus === 'listo'    && t.status !== 'listo')    return false;
      if (filterStatus === 'en_curso' && t.status !== 'en_curso') return false;
      if (filterStatus === 'detenido' && t.status !== 'detenido') return false;
      if (filterStatus === 'overdue') {
        if (t.completed || !t.dueDate) return false;
        if (new Date(t.dueDate + 'T23:59:59') >= new Date()) return false;
      }
      if (filterProject !== 'all' && String(t.projectId) !== filterProject) return false;
      if (searchLocal && !t.title.toLowerCase().includes(searchLocal.toLowerCase())) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'project') return a.projectName.localeCompare(b.projectName);
      if (sortBy === 'status') {
        const order = { detenido: 0, en_curso: 1, pendiente: 2, listo: 3 };
        return (order[a.status] ?? 2) - (order[b.status] ?? 2);
      }
      return 0;
    });

    return result;
  }, [allTasks, filterStatus, filterProject, searchLocal, sortBy]);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',    value: statsLocal.total,    color: 'bg-gray-100 text-gray-700' },
          { label: 'En curso', value: statsLocal.en_curso, color: 'bg-amber-50 text-amber-700' },
          { label: 'Listo',    value: statsLocal.listo,    color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Detenido', value: statsLocal.detenido, color: 'bg-rose-50 text-rose-700' },
          { label: 'Vencidas', value: statsLocal.overdue,  color: 'bg-red-50 text-red-700' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2.5 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchLocal}
            onChange={(e) => setSearchLocal(e.target.value)}
            placeholder="Buscar tareas..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
          />
        </div>

        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
        >
          <option value="all">Todos los estados</option>
          <option value="en_curso">En curso</option>
          <option value="listo">Listo</option>
          <option value="detenido">Detenido</option>
          <option value="overdue">Vencidas</option>
        </select>

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
        >
          <option value="all">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={String(p.id)}>{p.name}</option>
          ))}
        </select>

        <ArrowUpDown className="w-4 h-4 text-gray-500" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
        >
          <option value="date">Por fecha</option>
          <option value="status">Por estado</option>
          <option value="project">Por proyecto</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay tareas que coincidan con los filtros</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-8 px-3 py-2.5">
                  <input type="checkbox" className="rounded border-gray-300" disabled />
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5 min-w-50">Tarea</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5 w-35">Proyecto</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2.5 w-25">Responsable</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2.5 w-27.5">Estado</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2.5 w-30">Vencimiento</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2.5 w-35">Notas</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2.5 w-32.5">Actualización</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => {
                const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pendiente;
                return (
                  <tr key={`${task.projectId}-${task.id}`} className="border-b border-gray-100 hover:bg-blue-50/30 group transition-colors">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.projectId, task.id)}
                        className="rounded border-gray-300 text-app-accent focus:ring-app-accent cursor-pointer"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-gray-300 hover:text-amber-400"><Star className="w-3.5 h-3.5" /></button>
                          <button className="text-gray-300 hover:text-blue-400"><ArrowUpRight className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <span className="text-xs text-app-accent font-medium flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" />
                        {task.projectName}
                      </span>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex justify-center">
                        <Avatar name={task.assignee} size="sm" />
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex justify-center">
                        <span className={`${statusCfg.bg} ${statusCfg.text} px-4 py-1 rounded-sm text-xs font-semibold min-w-22.5 text-center inline-block`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      {task.dueDate ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {(() => {
                            const diff = (new Date(task.dueDate + 'T23:59:59') - new Date()) / (1000 * 60 * 60 * 24);
                            if (task.completed) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                            if (diff < 0) return <AlertCircle className="w-4 h-4 text-rose-500" />;
                            if (diff < 3) return <Clock className="w-4 h-4 text-amber-500" />;
                            return <Circle className="w-4 h-4 text-gray-300" />;
                          })()}
                          <span className="text-xs text-gray-600">{formatShortDate(task.dueDate)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      <span className="text-xs text-gray-500 italic truncate block max-w-32.5">
                        {task.notes || <span className="text-gray-300">-</span>}
                      </span>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <Avatar name={task.assignee} size="sm" />
                        <span className="text-xs text-gray-400">{formatRelativeDate(task.lastUpdated)}</span>
                      </div>
                    </td>

                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => deleteTask(task.projectId, task.id)}
                        className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
