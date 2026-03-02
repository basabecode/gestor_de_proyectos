import { useState } from 'react';
import {
  FolderOpen,
  Plus,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  Copy,
  MoreVertical,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS = {
  active:    { label: 'En curso',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',    text: '#92400e' },
  completed: { label: 'Completado',  color: '#10b981', bg: 'rgba(16,185,129,0.1)',    text: '#065f46' },
  delayed:   { label: 'Retrasado',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',     text: '#991b1b' },
};

function getStatus(project) {
  if (project.progress === 100) return 'completed';
  if (project.endDate && new Date(project.endDate + 'T23:59:59') < new Date()) return 'delayed';
  return 'active';
}

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s + 'T12:00:00');
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

// ─── Radial ring stat card — signature element ────────────────────────────────
// Avoids the generic "icon-in-colored-box" pattern called out by the skill.
// Each card has: big number + label + radial ring showing relative fill vs max.

function StatRing({ value, max, color, label, sublabel }) {
  const R = 22;
  const C = 2 * Math.PI * R;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const dash = pct * C;

  return (
    <div
      className="flex items-center gap-4 p-5 rounded-xl"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.03)',
      }}
    >
      {/* Radial progress ring */}
      <div className="relative shrink-0">
        <svg width={56} height={56} className="-rotate-90">
          {/* Track */}
          <circle cx={28} cy={28} r={R} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={3.5} />
          {/* Fill */}
          <circle
            cx={28} cy={28} r={R}
            fill="none"
            stroke={color}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        {/* Center icon area — minimal, just a colored dot */}
        <span
          className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
          style={{ color, fontFamily: "'DM Mono', 'Courier New', monospace" }}
        >
          {max > 0 ? `${Math.round(pct * 100)}%` : '—'}
        </span>
      </div>

      {/* Text stack */}
      <div className="min-w-0">
        <p
          className="text-[28px] font-bold leading-none tracking-[-0.04em]"
          style={{ color: 'var(--color-text-primary)', fontFamily: "'Sora', sans-serif" }}
        >
          {value}
        </p>
        <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--color-text-disabled)' }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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

  const delayed = projects.filter(
    (p) => !p.endDate || p.progress !== 100 ? (p.endDate && new Date(p.endDate + 'T23:59:59') < new Date()) : false
  ).length;

  const globalPct = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Metrics — 4 radial ring cards ────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatRing
          value={stats.total}
          max={Math.max(stats.total, 1)}
          color="var(--color-primary)"
          label="Total proyectos"
          sublabel="en este espacio"
        />
        <StatRing
          value={stats.active}
          max={stats.total}
          color="#3b82f6"
          label="En progreso"
          sublabel={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% del total` : undefined}
        />
        <StatRing
          value={stats.completed}
          max={stats.total}
          color="#10b981"
          label="Completados"
          sublabel={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% entregados` : undefined}
        />
        <StatRing
          value={delayed}
          max={stats.total}
          color="#ef4444"
          label="Retrasados"
          sublabel={delayed > 0 ? 'requieren atención' : 'sin retrasos'}
        />
      </div>

      {/* ── Global task progress ──────────────────────────────────────── */}
      {stats.totalTasks > 0 && (
        <div
          className="rounded-xl p-5"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-end justify-between mb-3">
            <div>
              <p
                className="text-[13px] font-semibold"
                style={{ color: 'var(--color-text-primary)', fontFamily: "'Sora', sans-serif" }}
              >
                Progreso global de tareas
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                A lo largo de todos los proyectos activos
              </p>
            </div>
            <span
              className="text-[22px] font-bold tracking-[-0.03em] leading-none"
              style={{ color: 'var(--color-primary)', fontFamily: "'Sora', sans-serif" }}
            >
              {globalPct}%
            </span>
          </div>

          {/* Segmented progress — not just a single bar */}
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
            {/* Completed segment */}
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${globalPct}%`,
                background: 'var(--color-primary)',
              }}
            />
            {/* Remaining */}
            <div
              className="flex-1 h-full"
              style={{ background: 'rgba(0,0,0,0.06)' }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-disabled)', fontVariantNumeric: 'tabular-nums' }}>
              {stats.completedTasks} completadas
            </span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)', fontVariantNumeric: 'tabular-nums' }}>
              {stats.totalTasks - stats.completedTasks} pendientes
            </span>
          </div>
        </div>
      )}

      {/* ── Projects section header ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-[15px] font-semibold tracking-[-0.01em]"
            style={{ color: 'var(--color-text-primary)', fontFamily: "'Sora', sans-serif" }}
          >
            Proyectos
          </h2>
          {filteredProjects.length !== projects.length && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-disabled)' }}>
              {filteredProjects.length} resultado{filteredProjects.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowProjectModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all"
          style={{
            background: 'var(--color-primary)',
            color: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,200,117,0.35)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary)'; }}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          Nuevo proyecto
        </button>
      </div>

      {/* ── Projects table / empty state ─────────────────────────────────── */}
      {filteredProjects.length === 0 ? (
        <div
          className="rounded-xl p-14 text-center"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-surface-secondary)', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <FolderOpen className="w-5 h-5" style={{ color: 'var(--color-text-disabled)' }} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Sin proyectos todavía
          </p>
          <p className="text-[12px] mt-1 mb-5" style={{ color: 'var(--color-text-secondary)' }}>
            Crea tu primer proyecto o importa desde CSV
          </p>
          <button
            onClick={() => setShowProjectModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all"
            style={{
              background: 'var(--color-primary)',
              color: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,200,117,0.3)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Crear proyecto
          </button>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'var(--color-surface-secondary)' }}>
                {/* Accent col indicator */}
                <th className="w-[3px] p-0" />
                <th
                  className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--color-text-disabled)', fontFamily: "'Sora', sans-serif", minWidth: 220 }}
                >
                  Proyecto
                </th>
                <th
                  className="text-center px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--color-text-disabled)', fontFamily: "'Sora', sans-serif", width: 110 }}
                >
                  Estado
                </th>
                <th
                  className="text-center px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--color-text-disabled)', fontFamily: "'Sora', sans-serif", width: 120 }}
                >
                  Avance
                </th>
                <th
                  className="text-center px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--color-text-disabled)', fontFamily: "'Sora', sans-serif", width: 80 }}
                >
                  Tareas
                </th>
                <th
                  className="text-center px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--color-text-disabled)', fontFamily: "'Sora', sans-serif", width: 90 }}
                >
                  Inicio
                </th>
                <th
                  className="text-center px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--color-text-disabled)', fontFamily: "'Sora', sans-serif", width: 90 }}
                >
                  Fin
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, idx) => {
                const status = getStatus(project);
                const cfg = STATUS[status];
                const done = project.tasks?.filter((t) => t.status === 'listo' || t.completed).length || 0;
                const total = project.tasks?.length || 0;
                const pct = project.progress ?? 0;

                return (
                  <tr
                    key={project.id}
                    className="group cursor-pointer transition-colors"
                    style={{ borderBottom: idx < filteredProjects.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
                    onClick={() => openProject(project)}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Accent line — 3px left indicator colored by status */}
                    <td className="p-0 w-[3px]">
                      <div
                        className="w-full h-full min-h-[52px]"
                        style={{ background: cfg.color, opacity: 0.7 }}
                      />
                    </td>

                    {/* Project name + description — 2 type levels */}
                    <td className="px-4 py-3">
                      <span
                        className="text-[13px] font-semibold block leading-snug"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {project.name}
                      </span>
                      {project.description && (
                        <p
                          className="text-[11px] mt-0.5 truncate max-w-[280px]"
                          style={{ color: 'var(--color-text-disabled)' }}
                        >
                          {project.description}
                        </p>
                      )}
                    </td>

                    {/* Status badge — soft background, no solid fill */}
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <span
                          className="px-3 py-1 rounded-md text-[11px] font-semibold"
                          style={{
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.color}30`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </td>

                    {/* Progress — thin bar + pct in monospace */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className="w-full max-w-[80px] h-[3px] rounded-full overflow-hidden"
                          style={{ background: 'rgba(0,0,0,0.08)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: pct === 100 ? '#10b981' : pct > 60 ? 'var(--color-primary)' : '#f59e0b',
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </td>

                    {/* Tasks — monospace tabular */}
                    <td className="px-3 py-3 text-center">
                      <span
                        className="text-[12px]"
                        style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {done}<span style={{ color: 'var(--color-text-disabled)' }}>/{total}</span>
                      </span>
                    </td>

                    {/* Dates — tertiary text */}
                    <td className="px-3 py-3 text-center">
                      <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtDate(project.startDate)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className="text-[11px]"
                        style={{
                          color: status === 'delayed' ? '#ef4444' : 'var(--color-text-secondary)',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: status === 'delayed' ? 600 : 400,
                        }}
                      >
                        {fmtDate(project.endDate)}
                      </span>
                    </td>

                    {/* Context menu */}
                    <td className="px-2 py-3">
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === project.id ? null : project.id); }}
                          className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          style={{ color: 'var(--color-text-disabled)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-disabled)'; }}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {menuOpen === project.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }} />
                            <div
                              className="absolute right-0 mt-1 w-40 rounded-lg py-1 z-20"
                              style={{
                                background: '#ffffff',
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.05)',
                              }}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingProject(project); setMenuOpen(null); }}
                                className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 transition-colors"
                                style={{ color: 'var(--color-text-primary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-secondary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <Edit3 className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                                Editar
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); duplicateProject(project.id); setMenuOpen(null); }}
                                className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 transition-colors"
                                style={{ color: 'var(--color-text-primary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-secondary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <Copy className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                                Duplicar
                              </button>
                              <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteProject(project); setMenuOpen(null); }}
                                className="w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 transition-colors"
                                style={{ color: 'var(--color-status-red)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-status-red-light)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Eliminar
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
