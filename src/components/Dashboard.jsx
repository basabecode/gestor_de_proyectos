import { useState } from 'react';
import {
  FolderOpen,
  Plus,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  BarChart3,
  MoreVertical,
  Copy,
  Edit3,
} from 'lucide-react';

const STATUS_COLORS = {
  active: { bg: 'bg-amber-400', label: 'En curso' },
  completed: { bg: 'bg-emerald-500', label: 'Completado' },
  delayed: { bg: 'bg-rose-500', label: 'Retrasado' },
};

function getProjectStatus(project) {
  if (project.progress === 100) return 'completed';
  if (project.endDate && new Date(project.endDate + 'T23:59:59') < new Date()) return 'delayed';
  return 'active';
}

function formatShortDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T12:00:00');
  const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export default function Dashboard({
  projects,
  filteredProjects,
  stats,
  deleteProject,
  duplicateProject,
  openProject,
  setShowProjectModal,
  setEditingProject,
}) {
  const [menuOpen, setMenuOpen] = useState(null);

  const delayedCount = projects.filter((p) => {
    if (!p.endDate || p.progress === 100) return false;
    return new Date(p.endDate + 'T23:59:59') < new Date();
  }).length;

  const statCards = [
    { label: 'Total Proyectos', value: stats.total, icon: FolderOpen, color: 'bg-shatter-accent' },
    { label: 'En Progreso', value: stats.active, icon: TrendingUp, color: 'bg-blue-500' },
    { label: 'Completados', value: stats.completed, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: 'Retrasados', value: delayedCount, icon: AlertTriangle, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global progress */}
      {stats.totalTasks > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-shatter-accent" />
              <h3 className="font-semibold text-gray-900">Progreso Global de Tareas</h3>
            </div>
            <span className="text-sm text-gray-500">{stats.completedTasks} / {stats.totalTasks} tareas</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-shatter-accent h-3 rounded-full transition-all duration-500"
              style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Projects header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Proyectos {filteredProjects.length !== projects.length && <span className="text-sm text-gray-400 font-normal">({filteredProjects.length} resultados)</span>}
        </h2>
        <button
          onClick={() => setShowProjectModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-shatter-accent hover:bg-shatter-accent/80 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Proyecto
        </button>
      </div>

      {/* Projects table */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No hay proyectos</h3>
          <p className="text-sm text-gray-400 mt-1 mb-4">Crea un nuevo proyecto o importa desde CSV/Excel</p>
          <button
            onClick={() => setShowProjectModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-shatter-accent hover:bg-shatter-accent/80 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear primer proyecto
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-1 bg-shatter-accent"></th>
                <th className="text-left text-xs font-semibold text-gray-600 px-4 py-3 min-w-[220px]">Proyecto</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-3 w-[110px]">Estado</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-3 w-[120px]">Progreso</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-3 w-[90px]">Tareas</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-3 w-[100px]">Inicio</th>
                <th className="text-center text-xs font-semibold text-gray-600 px-3 py-3 w-[100px]">Fin</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const status = getProjectStatus(project);
                const statusCfg = STATUS_COLORS[status];
                const completedTasks = project.tasks?.filter((t) => t.status === 'listo' || t.completed).length || 0;
                const totalTasks = project.tasks?.length || 0;

                return (
                  <tr
                    key={project.id}
                    className="border-b border-gray-100 hover:bg-blue-50/30 group cursor-pointer transition-colors"
                    onClick={() => openProject(project)}
                  >
                    <td className="w-1 bg-shatter-accent/70 group-hover:bg-shatter-accent transition-colors"></td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900 block">{project.name}</span>
                      {project.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{project.description}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <span className={`${statusCfg.bg} text-white px-4 py-1 rounded-sm text-xs font-semibold min-w-[90px] text-center inline-block`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-[80px]">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              project.progress === 100 ? 'bg-emerald-500' : project.progress > 50 ? 'bg-shatter-accent' : 'bg-amber-400'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-gray-600">{completedTasks}/{totalTasks}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-gray-600">{formatShortDate(project.startDate)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-gray-600">{formatShortDate(project.endDate)}</span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === project.id ? null : project.id); }}
                          className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {menuOpen === project.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }} />
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingProject(project); setMenuOpen(null); }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit3 className="w-4 h-4" /> Editar
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); duplicateProject(project.id); setMenuOpen(null); }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" /> Duplicar
                              </button>
                              <hr className="my-1 border-gray-100" />
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteProject(project); setMenuOpen(null); }}
                                className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
