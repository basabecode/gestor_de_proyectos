import { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  User,
  Filter,
  ArrowUpDown,
  EyeOff,
  LayoutGrid,
  MoreHorizontal,
  Star,
  ArrowUpRight,
  Clock,
  AlertCircle,
  Trash,
} from 'lucide-react';

const STATUS_CONFIG = {
  en_curso: { label: 'En curso', bg: 'bg-amber-400', text: 'text-white' },
  listo: { label: 'Listo', bg: 'bg-emerald-500', text: 'text-white' },
  detenido: { label: 'Detenido', bg: 'bg-rose-500', text: 'text-white' },
  pendiente: { label: 'Pendiente', bg: 'bg-gray-300', text: 'text-white' },
};

const PRIORITY_CONFIG = {
  high: { icon: AlertCircle, color: 'text-rose-500' },
  medium: { icon: Clock, color: 'text-amber-500' },
  low: { icon: ChevronDown, color: 'text-emerald-500' },
};

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} días`;
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function AvatarCircle({ name, size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
  if (!name) {
    return (
      <div className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center`}>
        <User className="w-3.5 h-3.5 text-gray-400" />
      </div>
    );
  }
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  const colorIdx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className={`${sizeClass} rounded-full ${colors[colorIdx]} flex items-center justify-center text-white font-bold`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pendiente;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`${config.bg} ${config.text} px-4 py-1 rounded-sm text-xs font-semibold min-w-[90px] text-center hover:opacity-90 transition-opacity`}
      >
        {config.label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 min-w-[120px]">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={(e) => { e.stopPropagation(); onChange(key); setOpen(false); }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
              >
                <div className={`w-3 h-3 rounded-sm ${cfg.bg}`} />
                {cfg.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TaskGroup({ title, color, tasks, projectId, onToggleTask, onUpdateTask, onDeleteTask, onAddTask, collapsed, onToggleCollapse }) {
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesValue, setNotesValue] = useState('');

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(projectId, { title: newTaskTitle, status: title === 'Completado' ? 'listo' : 'en_curso' });
    setNewTaskTitle('');
    setAddingTask(false);
  };

  const statusCounts = {
    listo: tasks.filter((t) => t.status === 'listo').length,
    en_curso: tasks.filter((t) => t.status === 'en_curso').length,
    detenido: tasks.filter((t) => t.status === 'detenido').length,
    pendiente: tasks.filter((t) => t.status === 'pendiente').length,
  };
  const totalTasks = tasks.length || 1;

  // Date range
  const dates = tasks.filter((t) => t.dueDate).map((t) => t.dueDate).sort();
  const dateRange = dates.length > 0
    ? dates.length === 1
      ? formatShortDate(dates[0])
      : `${formatShortDate(dates[0])} - ${formatShortDate(dates[dates.length - 1])}`
    : '';

  return (
    <div className="mb-6">
      {/* Group header */}
      <button
        onClick={onToggleCollapse}
        className="flex items-center gap-2 mb-1 group"
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />
        }
        <h3 className={`text-lg font-bold`} style={{ color }}>{title}</h3>
        <span className="text-xs text-gray-400 font-normal">{tasks.length} tareas</span>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Column headers */}
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="w-1" style={{ backgroundColor: color }}></th>
                <th className="w-8 px-2 py-2.5">
                  <input type="checkbox" className="rounded border-gray-300 text-shatter-accent focus:ring-shatter-accent" disabled />
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5 min-w-[180px]">Tarea</th>
                <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2.5 w-[100px]"></th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2.5 w-[120px]">Responsable</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2.5 w-[110px]">
                  Estado <AlertCircle className="w-3 h-3 inline text-gray-400 ml-0.5" />
                </th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2.5 w-[120px]">
                  Vencimiento <AlertCircle className="w-3 h-3 inline text-gray-400 ml-0.5" />
                </th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2.5 w-[160px]">Notas</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2.5 w-[140px]">Última actualización</th>
                <th className="w-8 px-2 py-2.5">
                  <Plus className="w-4 h-4 text-gray-400" />
                </th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => {
                const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const PriorityIcon = priorityCfg.icon;

                return (
                  <tr
                    key={task.id}
                    className="border-b border-gray-100 hover:bg-blue-50/30 group/row transition-colors"
                  >
                    {/* Color bar */}
                    <td className="w-1" style={{ backgroundColor: color }}></td>

                    {/* Checkbox */}
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleTask(projectId, task.id)}
                        className="rounded border-gray-300 text-shatter-accent focus:ring-shatter-accent cursor-pointer"
                      />
                    </td>

                    {/* Task name */}
                    <td className="px-3 py-2">
                      <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                      </span>
                    </td>

                    {/* Priority icons */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <button className="text-gray-300 hover:text-amber-400 transition-colors">
                          <Star className="w-4 h-4" />
                        </button>
                        <button className="text-gray-300 hover:text-blue-400 transition-colors">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="px-3 py-2">
                      <div className="flex justify-center">
                        <AvatarCircle name={task.assignee} />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2">
                      <div className="flex justify-center">
                        <StatusBadge
                          status={task.status}
                          onChange={(newStatus) => onUpdateTask(projectId, task.id, {
                            status: newStatus,
                            completed: newStatus === 'listo',
                          })}
                        />
                      </div>
                    </td>

                    {/* Due date */}
                    <td className="px-3 py-2 text-center">
                      {task.dueDate ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {(() => {
                            const diff = (new Date(task.dueDate + 'T23:59:59') - new Date()) / (1000 * 60 * 60 * 24);
                            if (task.completed) return <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>;
                            if (diff < 0) return <AlertCircle className="w-4 h-4 text-rose-500" />;
                            if (diff < 3) return <Clock className="w-4 h-4 text-amber-500" />;
                            return <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full" /></div>;
                          })()}
                          <span className="text-xs text-gray-600">{formatShortDate(task.dueDate)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-2">
                      {editingNotes === task.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            onBlur={() => {
                              onUpdateTask(projectId, task.id, { notes: notesValue });
                              setEditingNotes(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { onUpdateTask(projectId, task.id, { notes: notesValue }); setEditingNotes(null); }
                              if (e.key === 'Escape') setEditingNotes(null);
                            }}
                            className="w-full px-2 py-0.5 text-xs border border-blue-400 rounded focus:outline-none"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span
                          onClick={() => { setEditingNotes(task.id); setNotesValue(task.notes || ''); }}
                          className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 block truncate max-w-[150px] italic"
                        >
                          {task.notes || <span className="text-gray-300">Agregar nota...</span>}
                        </span>
                      )}
                    </td>

                    {/* Last updated */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <AvatarCircle name={task.assignee} size="sm" />
                        <span className="text-xs text-gray-400">{getTimeAgo(task.lastUpdated)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-2">
                      <button
                        onClick={() => onDeleteTask(projectId, task.id)}
                        className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/row:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Add task row */}
              <tr className="border-b border-gray-100">
                <td className="w-1" style={{ backgroundColor: color, opacity: 0.4 }}></td>
                <td className="px-2 py-2"></td>
                <td colSpan={8} className="px-3 py-2">
                  {addingTask ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTask();
                          if (e.key === 'Escape') { setAddingTask(false); setNewTaskTitle(''); }
                        }}
                        placeholder="Nombre de la tarea"
                        className="flex-1 px-3 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                        autoFocus
                      />
                      <button onClick={handleAddTask} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"><Save className="w-4 h-4" /></button>
                      <button onClick={() => { setAddingTask(false); setNewTaskTitle(''); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTask(true)}
                      className="text-sm text-gray-400 hover:text-shatter-accent transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar tarea
                    </button>
                  )}
                </td>
              </tr>
            </tbody>

            {/* Summary footer */}
            {tasks.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50/50">
                  <td className="w-1"></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  {/* Status summary bar */}
                  <td className="px-3 py-2">
                    <div className="flex h-5 rounded-sm overflow-hidden min-w-[90px]">
                      {statusCounts.listo > 0 && (
                        <div className="bg-emerald-500" style={{ width: `${(statusCounts.listo / totalTasks) * 100}%` }} />
                      )}
                      {statusCounts.en_curso > 0 && (
                        <div className="bg-amber-400" style={{ width: `${(statusCounts.en_curso / totalTasks) * 100}%` }} />
                      )}
                      {statusCounts.detenido > 0 && (
                        <div className="bg-rose-500" style={{ width: `${(statusCounts.detenido / totalTasks) * 100}%` }} />
                      )}
                      {statusCounts.pendiente > 0 && (
                        <div className="bg-gray-300" style={{ width: `${(statusCounts.pendiente / totalTasks) * 100}%` }} />
                      )}
                    </div>
                  </td>
                  {/* Date range */}
                  <td className="px-3 py-2 text-center">
                    {dateRange && (
                      <span className="text-[10px] bg-shatter-accent/10 text-shatter-accent px-2 py-1 rounded-full font-medium">
                        {dateRange}
                      </span>
                    )}
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProjectView({
  project,
  addTask,
  updateTask,
  deleteTask,
  toggleTask,
  changeTaskStatus,
  updateProject,
  setEditingProject,
  deleteProject,
}) {
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (group) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const tasks = project.tasks || [];
  const pendingTasks = tasks.filter((t) => t.status !== 'listo');
  const completedTasks = tasks.filter((t) => t.status === 'listo');

  return (
    <div className="space-y-4">
      {/* Project header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
            {(project.startDate || project.endDate) && (
              <p className="text-xs text-gray-400 mt-1">
                {project.startDate || '...'} → {project.endDate || '...'}
                {' '}&middot; {project.progress}% completado
              </p>
            )}
          </div>
          <button
            onClick={() => setEditingProject(project)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Editar proyecto"
          >
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Toolbar - Monday.com style */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2.5 flex items-center gap-1 flex-wrap">
        <button
          onClick={() => addTask(project.id, { title: 'Nueva tarea', status: 'en_curso' })}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-shatter-accent hover:bg-shatter-accent/80 text-white rounded-md text-sm font-medium transition-colors mr-2"
        >
          Agregar tarea
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {[
          { icon: Search, label: 'Buscar' },
          { icon: User, label: 'Persona' },
          { icon: Filter, label: 'Filtrar' },
          { icon: ArrowUpDown, label: 'Ordenar' },
          { icon: EyeOff, label: 'Ocultar' },
          { icon: LayoutGrid, label: 'Agrupar por' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md text-sm transition-colors"
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}

        <button className="flex items-center px-2 py-1.5 text-gray-400 hover:bg-gray-100 rounded-md transition-colors ml-auto">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Task groups */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <TaskGroup
          title="Pendientes"
          color="#579BFC"
          tasks={pendingTasks}
          projectId={project.id}
          onToggleTask={toggleTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onAddTask={addTask}
          collapsed={collapsedGroups['pending']}
          onToggleCollapse={() => toggleGroup('pending')}
        />

        <TaskGroup
          title="Completado"
          color="#00C875"
          tasks={completedTasks}
          projectId={project.id}
          onToggleTask={toggleTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onAddTask={addTask}
          collapsed={collapsedGroups['completed']}
          onToggleCollapse={() => toggleGroup('completed')}
        />

        {/* Add group button */}
        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-shatter-accent mt-4 transition-colors">
          <Plus className="w-4 h-4" />
          Agregar grupo nuevo
        </button>
      </div>
    </div>
  );
}
