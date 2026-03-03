import { useState, useEffect, useCallback } from 'react';
import {
  X,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Minus,
  Camera,
  Pencil,
  Check,
  AlertTriangle,
  DollarSign,
  CalendarDays,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import {
  calculateEVM,
  getHealthStatus,
  getPctPlanned,
  formatCurrency,
  HEALTH_CONFIG,
} from '../../lib/pmis';
import useBoardStore from '../../stores/boardStore';
import { cn } from '../../lib/utils';

export default function PMISPanel({ board, onClose }) {
  const { updateBoard } = useBoardStore();

  // Local editable state
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    budget:      board.budget      ?? 0,
    actualCost:  board.actualCost  ?? 0,
    plannedStart: board.plannedStart ?? '',
    plannedEnd:   board.plannedEnd   ?? '',
  });

  const [snapshots, setSnapshots] = useState([]);
  const [saving, setSaving]       = useState(false);
  const [snapping, setSnapping]   = useState(false);

  // Sync form when board prop changes
  useEffect(() => {
    setForm({
      budget:      board.budget      ?? 0,
      actualCost:  board.actualCost  ?? 0,
      plannedStart: board.plannedStart ?? '',
      plannedEnd:   board.plannedEnd   ?? '',
    });
  }, [board.budget, board.actualCost, board.plannedStart, board.plannedEnd]);

  // Fetch snapshots on mount
  const fetchSnapshots = useCallback(async () => {
    const { data } = await supabase
      .from('progress_snapshots')
      .select('snapshot_date, pct_complete, cpi, spi, ev, pv, actual_cost')
      .eq('board_id', board.id)
      .order('snapshot_date', { ascending: true })
      .limit(30);
    setSnapshots(data || []);
  }, [board.id]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // ── Derived metrics ────────────────────────────────────────────────────────

  const boardItems  = board.items ?? [];
  const pctComplete = boardItems.length > 0
    ? Math.round(
        (boardItems.filter((i) => i.columnValues?.status === 'done').length /
          boardItems.length) * 100,
      )
    : 0;

  const pctPlanned = getPctPlanned(board.plannedStart, board.plannedEnd);
  const metrics    = calculateEVM({
    bac:        board.budget,
    pctComplete,
    pctPlanned,
    actualCost: board.actualCost,
  });
  const health     = getHealthStatus(metrics?.cpi ?? null, metrics?.spi ?? null);
  const healthCfg  = HEALTH_CONFIG[health];

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    await updateBoard(board.id, {
      budget:      parseFloat(form.budget)      || 0,
      actualCost:  parseFloat(form.actualCost)  || 0,
      plannedStart: form.plannedStart || null,
      plannedEnd:   form.plannedEnd   || null,
    });
    setSaving(false);
    setEditMode(false);
  };

  const handleSnapshot = async () => {
    if (!board.budget) return;
    setSnapping(true);
    const ev  = metrics?.ev  ?? 0;
    const pv  = metrics?.pv  ?? null;
    const cpi = metrics?.cpi ?? null;
    const spi = metrics?.spi ?? null;

    await supabase.from('progress_snapshots').upsert(
      {
        board_id:     board.id,
        snapshot_date: new Date().toISOString().split('T')[0],
        pct_complete: pctComplete,
        actual_cost:  board.actualCost,
        ev,
        pv,
        cpi,
        spi,
      },
      { onConflict: 'board_id,snapshot_date' },
    );
    await fetchSnapshots();
    setSnapping(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-30 sm:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-95 bg-white border-l border-border-light shadow-2xl z-40 flex flex-col animate-slide-in-right overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary leading-tight">
                Métricas PMIS
              </h3>
              <p className="text-[10px] text-text-disabled">
                Earned Value Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="p-1.5 hover:bg-surface-secondary rounded transition-colors"
                title="Editar presupuesto y fechas"
              >
                <Pencil className="w-3.5 h-3.5 text-text-secondary" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-2 py-1 bg-primary text-white text-[11px] rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-secondary rounded transition-colors"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

          {/* Health status */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: healthCfg.bg, borderLeft: `4px solid ${healthCfg.color}` }}
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: healthCfg.color }}
            />
            <span
              className="text-[13px] font-semibold"
              style={{ color: healthCfg.color }}
            >
              {healthCfg.label}
            </span>
            <span className="ml-auto text-[11px] text-text-disabled">
              {pctComplete}% completado
            </span>
          </div>

          {/* No budget warning */}
          {!board.budget ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <DollarSign className="w-8 h-8 text-text-disabled mx-auto mb-2" />
              <p className="text-[13px] font-medium text-text-primary mb-1">
                Sin presupuesto configurado
              </p>
              <p className="text-[11px] text-text-secondary">
                Haz clic en <strong>✏️</strong> para ingresar el presupuesto y activar las métricas EVM.
              </p>
            </div>
          ) : (
            <>
              {/* KPI cards: CPI + SPI */}
              <div className="grid grid-cols-2 gap-3">
                <KPICard
                  label="CPI"
                  sublabel="Eficiencia de costo"
                  value={metrics?.cpi}
                  threshold={1}
                />
                <KPICard
                  label="SPI"
                  sublabel="Eficiencia de tiempo"
                  value={metrics?.spi}
                  threshold={1}
                />
              </div>

              {/* Budget breakdown */}
              <div className="bg-surface-secondary rounded-xl p-4 space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-disabled mb-3">
                  Desglose de valor
                </p>
                <BudgetRow label="Presupuesto total (BAC)"   value={metrics?.bac}  bold />
                <BudgetRow label="Valor planificado (PV)"    value={metrics?.pv}   />
                <BudgetRow label="Valor ganado (EV)"         value={metrics?.ev}   />
                <BudgetRow label="Costo real (AC)"           value={metrics?.ac}   />
                <div className="border-t border-border-light pt-2 space-y-2">
                  <BudgetRow label="Estimado final (EAC)"    value={metrics?.eac}  bold />
                  <BudgetRow
                    label="Variación final (VAC)"
                    value={metrics?.vac}
                    signed
                    bold
                  />
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-3">
                <ProgressBar
                  label="Completado"
                  value={pctComplete}
                  color="#00c875"
                />
                {pctPlanned != null && (
                  <ProgressBar
                    label="Tiempo transcurrido"
                    value={Math.round(pctPlanned)}
                    color="#579bfc"
                  />
                )}
              </div>

              {/* Historical chart */}
              {snapshots.length >= 2 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-disabled mb-2">
                    Tendencia histórica
                  </p>
                  <div className="bg-surface-secondary rounded-xl p-3">
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={snapshots} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <XAxis
                          dataKey="snapshot_date"
                          tick={{ fontSize: 9 }}
                          tickFormatter={(d) => d.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 9 }} domain={[0, 'auto']} />
                        <Tooltip
                          contentStyle={{ fontSize: 11 }}
                          formatter={(v) => (v ? v.toFixed(2) : '—')}
                        />
                        <ReferenceLine y={1} stroke="#e5e7eb" strokeDasharray="4 2" />
                        <Line
                          type="monotone"
                          dataKey="cpi"
                          stroke="#0073ea"
                          dot={false}
                          name="CPI"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="spi"
                          stroke="#00c875"
                          dot={false}
                          name="SPI"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-1">
                      <LegendDot color="#0073ea" label="CPI" />
                      <LegendDot color="#00c875" label="SPI" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Edit form */}
          {editMode && (
            <div className="border border-primary/30 rounded-xl p-4 space-y-3 bg-primary/5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Configuración PMIS
              </p>
              <FormField
                label="Presupuesto total (BAC)"
                icon={DollarSign}
                type="number"
                value={form.budget}
                onChange={(v) => setForm((f) => ({ ...f, budget: v }))}
                prefix="$"
              />
              <FormField
                label="Costo real acumulado (AC)"
                icon={DollarSign}
                type="number"
                value={form.actualCost}
                onChange={(v) => setForm((f) => ({ ...f, actualCost: v }))}
                prefix="$"
              />
              <FormField
                label="Inicio planificado"
                icon={CalendarDays}
                type="date"
                value={form.plannedStart}
                onChange={(v) => setForm((f) => ({ ...f, plannedStart: v }))}
              />
              <FormField
                label="Fin planificado"
                icon={CalendarDays}
                type="date"
                value={form.plannedEnd}
                onChange={(v) => setForm((f) => ({ ...f, plannedEnd: v }))}
              />
            </div>
          )}

          {/* Snapshot section */}
          {board.budget > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-text-primary">
                  Guardar snapshot
                </p>
                <p className="text-[10px] text-text-disabled">
                  {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} registrados
                </p>
              </div>
              <button
                onClick={handleSnapshot}
                disabled={snapping}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-light hover:border-primary hover:bg-primary/5 text-[12px] text-text-secondary hover:text-primary transition-all disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                {snapping ? 'Guardando…' : 'Snapshot hoy'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KPICard({ label, sublabel, value, threshold }) {
  const color =
    value === null || value === undefined
      ? '#9ca3af'
      : value >= threshold
        ? '#00c875'
        : value >= threshold * 0.8
          ? '#fdab3d'
          : '#e2445c';

  const Icon =
    value === null || value === undefined
      ? Minus
      : value >= threshold
        ? TrendingUp
        : TrendingDown;

  return (
    <div className="border border-border-light rounded-xl p-3 text-center bg-white">
      <p className="text-[10px] text-text-disabled uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-[26px] font-bold leading-none mb-1" style={{ color }}>
        {value != null ? value.toFixed(2) : '—'}
      </p>
      <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color }} />
      <p className="text-[10px] text-text-disabled">{sublabel}</p>
    </div>
  );
}

function BudgetRow({ label, value, bold, signed }) {
  const fmt = formatCurrency(value, true);
  const isNeg = signed && value < 0;
  const isPos = signed && value > 0;

  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-[12px] text-text-secondary', bold && 'font-semibold text-text-primary')}>
        {label}
      </span>
      <span
        className={cn(
          'text-[12px] font-mono',
          bold ? 'font-bold text-text-primary' : 'text-text-secondary',
          isNeg && 'text-status-red',
          isPos && 'text-status-green',
        )}
      >
        {signed && value > 0 ? '+' : ''}{fmt}
      </span>
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[11px] text-text-secondary">{label}</span>
        <span className="text-[11px] font-medium text-text-primary">{value}%</span>
      </div>
      <div className="w-full bg-surface-secondary rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-text-disabled">{label}</span>
    </div>
  );
}

function FormField({ label, icon: Icon, type, value, onChange, prefix }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-text-secondary flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-text-disabled">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full text-[13px] border border-border rounded-lg py-1.5 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white',
            prefix ? 'pl-6' : 'pl-3',
          )}
        />
      </div>
    </div>
  );
}
