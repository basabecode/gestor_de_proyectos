import { useState, useEffect, useMemo } from 'react';
import { X, Plus, ShieldAlert, Edit3, Trash2, AlertTriangle, CheckCircle2, Link2 } from 'lucide-react';
import useRiskStore, {
  riskScore,
  riskLevel,
  RISK_LEVEL_COLORS,
  RISK_STATUS_LABELS,
} from '../../stores/riskStore';
import { cn } from '../../lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const PROB_LABELS = { 1: 'Muy baja', 2: 'Baja', 3: 'Media', 4: 'Alta', 5: 'Muy alta' };
const IMPACT_LABELS = { 1: 'Mínimo', 2: 'Bajo', 3: 'Moderado', 4: 'Alto', 5: 'Crítico' };

const STATUS_ORDER = ['identified', 'assessed', 'mitigated', 'closed'];

// ── Risk Matrix ───────────────────────────────────────────────────────────────

function RiskMatrix({ risks }) {
  // Build count grid [impact][probability]
  const grid = useMemo(() => {
    const g = {};
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        g[`${p}-${i}`] = risks.filter(
          (r) => r.probability === p && r.impact === i && r.status !== 'closed',
        ).length;
      }
    }
    return g;
  }, [risks]);

  const cellColor = (p, i) => {
    const s = p * i;
    if (s >= 15) return '#e2445c';
    if (s >= 10) return '#ff642e';
    if (s >= 5)  return '#fdab3d';
    return '#00c875';
  };

  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Matriz de riesgo</p>
      <div className="flex gap-0.5">
        {/* Y-axis label */}
        <div className="flex flex-col justify-center">
          <span className="text-[9px] text-text-disabled writing-mode-vertical rotate-180 origin-center" style={{ writingMode: 'vertical-lr' }}>
            IMPACTO ↑
          </span>
        </div>
        <div className="flex-1">
          {/* Rows from impact 5 down to 1 */}
          {[5, 4, 3, 2, 1].map((imp) => (
            <div key={imp} className="flex gap-0.5 mb-0.5">
              <span className="w-4 text-[9px] text-text-disabled text-right flex items-center justify-end mr-0.5">{imp}</span>
              {[1, 2, 3, 4, 5].map((prob) => {
                const count = grid[`${prob}-${imp}`] || 0;
                const bg    = cellColor(prob, imp);
                return (
                  <div
                    key={prob}
                    className="flex-1 h-7 rounded-sm flex items-center justify-center text-[10px] font-bold text-white transition-all"
                    style={{ backgroundColor: bg, opacity: count > 0 ? 1 : 0.2 }}
                    title={`P=${prob} I=${imp}: ${count} riesgo(s)`}
                  >
                    {count > 0 ? count : ''}
                  </div>
                );
              })}
            </div>
          ))}
          {/* X-axis labels */}
          <div className="flex gap-0.5 mt-1">
            <span className="w-4" />
            {[1, 2, 3, 4, 5].map((p) => (
              <div key={p} className="flex-1 text-center text-[9px] text-text-disabled">{p}</div>
            ))}
          </div>
          <p className="text-center text-[9px] text-text-disabled mt-0.5">PROBABILIDAD →</p>
        </div>
      </div>
    </div>
  );
}

// ── Risk Form ─────────────────────────────────────────────────────────────────

function RiskForm({ boardId, items, initial, onSave, onCancel }) {
  const [title,           setTitle]           = useState(initial?.title           || '');
  const [description,     setDescription]     = useState(initial?.description     || '');
  const [probability,     setProbability]     = useState(initial?.probability     ?? 3);
  const [impact,          setImpact]          = useState(initial?.impact          ?? 3);
  const [status,          setStatus]          = useState(initial?.status          || 'identified');
  const [mitigationPlan,  setMitigationPlan]  = useState(initial?.mitigation_plan || '');
  const [itemId,          setItemId]          = useState(initial?.item_id         || '');
  const [error,           setError]           = useState('');
  const [saving,          setSaving]          = useState(false);

  const score = probability * impact;
  const level = riskLevel(score);
  const colors = RISK_LEVEL_COLORS[level];

  const handleSave = async () => {
    if (!title.trim()) { setError('El título es requerido'); return; }
    setSaving(true);
    await onSave({
      board_id:        boardId,
      title:           title.trim(),
      description:     description.trim() || null,
      probability,
      impact,
      status,
      mitigation_plan: mitigationPlan.trim() || null,
      item_id:         itemId || null,
    });
    setSaving(false);
  };

  return (
    <div className="border border-border-light rounded-lg p-4 bg-surface-secondary/50 space-y-3">
      {/* Title */}
      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">Título *</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(''); }}
          placeholder="Descripción breve del riesgo..."
          className="w-full px-2.5 py-1.5 text-[13px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {error && <p className="text-[11px] text-status-red mt-0.5">{error}</p>}
      </div>

      {/* Probability + Impact */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Probabilidad</label>
          <select
            value={probability}
            onChange={(e) => setProbability(Number(e.target.value))}
            className="w-full px-2 py-1.5 text-[12px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          >
            {[1,2,3,4,5].map((v) => (
              <option key={v} value={v}>{v} – {PROB_LABELS[v]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Impacto</label>
          <select
            value={impact}
            onChange={(e) => setImpact(Number(e.target.value))}
            className="w-full px-2 py-1.5 text-[12px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          >
            {[1,2,3,4,5].map((v) => (
              <option key={v} value={v}>{v} – {IMPACT_LABELS[v]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Score preview */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-secondary">Puntuación:</span>
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
          style={{ backgroundColor: colors.bg }}
        >
          {score} — {colors.label}
        </span>
      </div>

      {/* Status */}
      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">Estado</label>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                status === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border hover:border-primary',
              )}
            >
              {RISK_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Linked item */}
      {items.length > 0 && (
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Vincular a tarea (opcional)</label>
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="w-full px-2 py-1.5 text-[12px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          >
            <option value="">— Sin tarea vinculada —</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Contexto o detalles adicionales..."
          className="w-full px-2.5 py-1.5 text-[12px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Mitigation */}
      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">Plan de mitigación</label>
        <textarea
          value={mitigationPlan}
          onChange={(e) => setMitigationPlan(e.target.value)}
          rows={2}
          placeholder="Acciones para reducir o eliminar el riesgo..."
          className="w-full px-2.5 py-1.5 text-[12px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-[12px] text-text-secondary hover:bg-surface-hover rounded-md transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 text-[12px] bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : initial ? 'Actualizar' : 'Agregar riesgo'}
        </button>
      </div>
    </div>
  );
}

// ── Risk Card ─────────────────────────────────────────────────────────────────

function RiskCard({ risk, items, onEdit, onDelete }) {
  const score  = riskScore(risk);
  const level  = riskLevel(score);
  const colors = RISK_LEVEL_COLORS[level];
  const linkedItem = items.find((i) => i.id === risk.item_id);

  return (
    <div className="border border-border-light rounded-lg p-3 bg-white group hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-2">
        {/* Score badge */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold shrink-0"
          style={{ backgroundColor: colors.bg }}
          title={colors.label}
        >
          {score}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="text-[13px] font-medium text-text-primary leading-tight">{risk.title}</p>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onEdit(risk)}
                className="p-1 hover:bg-surface-hover rounded transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-text-secondary" />
              </button>
              <button
                onClick={() => onDelete(risk.id)}
                className="p-1 hover:bg-status-red-light rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-status-red" />
              </button>
            </div>
          </div>

          {risk.description && (
            <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{risk.description}</p>
          )}

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Status */}
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
              risk.status === 'closed' ? 'bg-surface-secondary text-text-disabled' : 'bg-primary/10 text-primary',
            )}>
              {RISK_STATUS_LABELS[risk.status]}
            </span>

            {/* Prob/Impact */}
            <span className="text-[10px] text-text-disabled">
              P:{risk.probability} × I:{risk.impact}
            </span>

            {/* Linked item */}
            {linkedItem && (
              <span className="flex items-center gap-0.5 text-[10px] text-text-secondary">
                <Link2 className="w-3 h-3" />
                {linkedItem.title}
              </span>
            )}
          </div>

          {/* Mitigation plan */}
          {risk.mitigation_plan && (
            <div className="mt-2 px-2 py-1 bg-surface-secondary rounded text-[11px] text-text-secondary">
              <span className="font-medium">Mitigación: </span>{risk.mitigation_plan}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function RiskPanel({ board, onClose }) {
  const { risks, loading, fetchRisks, createRisk, updateRisk, deleteRisk } = useRiskStore();
  const [showForm,    setShowForm]    = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRisks(board.id);
  }, [board.id, fetchRisks]);

  const items = board.items ?? [];

  const boardRisks = risks.filter((r) => r.board_id === board.id);

  const filtered = statusFilter === 'all'
    ? boardRisks
    : boardRisks.filter((r) => r.status === statusFilter);

  // Summary counters by level
  const openRisks = boardRisks.filter((r) => r.status !== 'closed');
  const criticalCount = openRisks.filter((r) => riskLevel(riskScore(r)) === 'critical').length;
  const highCount     = openRisks.filter((r) => riskLevel(riskScore(r)) === 'high').length;

  const handleCreate = async (data) => {
    await createRisk(data);
    setShowForm(false);
  };

  const handleUpdate = async (data) => {
    await updateRisk(editingRisk.id, data);
    setEditingRisk(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este riesgo?')) return;
    await deleteRisk(id);
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-xl border-l border-border-light flex flex-col z-40 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-status-red" />
          <h2 className="text-[15px] font-bold text-text-primary">Registro de Riesgos</h2>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-surface-hover rounded transition-colors">
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Summary bar */}
      {openRisks.length > 0 && (
        <div className="px-4 py-2 bg-surface-secondary border-b border-border-light flex items-center gap-3 shrink-0">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-[12px] font-medium text-status-red">
              <AlertTriangle className="w-3.5 h-3.5" />
              {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          {highCount > 0 && (
            <span className="text-[12px] font-medium" style={{ color: RISK_LEVEL_COLORS.high.bg }}>
              {highCount} alto{highCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-[12px] text-text-disabled ml-auto">
            {openRisks.length} riesgo{openRisks.length > 1 ? 's' : ''} abierto{openRisks.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Risk matrix */}
        {boardRisks.length > 0 && <RiskMatrix risks={boardRisks} />}

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {['all', ...STATUS_ORDER].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                statusFilter === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border hover:border-primary',
              )}
            >
              {s === 'all' ? 'Todos' : RISK_STATUS_LABELS[s]}
              {s !== 'all' && (
                <span className="ml-1 opacity-60">
                  ({boardRisks.filter((r) => r.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Form (new or edit) */}
        {showForm && !editingRisk && (
          <RiskForm
            boardId={board.id}
            items={items}
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Risk list */}
        {loading && (
          <div className="py-6 text-center text-[13px] text-text-disabled">Cargando riesgos…</div>
        )}

        {!loading && filtered.length === 0 && !showForm && (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-status-green mx-auto mb-2 opacity-50" />
            <p className="text-[13px] text-text-secondary">
              {boardRisks.length === 0
                ? 'Sin riesgos registrados'
                : 'Sin riesgos con este estado'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((risk) =>
            editingRisk?.id === risk.id ? (
              <RiskForm
                key={risk.id}
                boardId={board.id}
                items={items}
                initial={editingRisk}
                onSave={handleUpdate}
                onCancel={() => setEditingRisk(null)}
              />
            ) : (
              <RiskCard
                key={risk.id}
                risk={risk}
                items={items}
                onEdit={setEditingRisk}
                onDelete={handleDelete}
              />
            ),
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border-light shrink-0">
        <button
          onClick={() => { setShowForm(true); setEditingRisk(null); }}
          className="w-full flex items-center justify-center gap-2 py-2 text-[13px] font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar nuevo riesgo
        </button>
      </div>
    </div>
  );
}
