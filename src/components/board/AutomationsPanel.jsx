import { useState } from 'react';
import {
  Zap, Plus, Trash2, ToggleLeft, ToggleRight, ChevronRight,
  Clock, Play, Settings2, History,
} from 'lucide-react';
import { Modal } from '../ui';
import useAutomationStore, {
  TRIGGER_TYPES, TRIGGER_LABELS,
  ACTION_TYPES, ACTION_LABELS,
} from '../../stores/automationStore';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../lib/constants';
import { cn, formatRelativeDate } from '../../lib/utils';

export default function AutomationsPanel({ open, onClose, board }) {
  const {
    getAutomationsForBoard, createAutomation, deleteAutomation,
    toggleAutomation, getRecentLogs,
  } = useAutomationStore();

  const [activeTab, setActiveTab] = useState('rules'); // rules | logs | create
  const [creating, setCreating] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState(TRIGGER_TYPES.STATUS_CHANGE);
  const [triggerCondition, setTriggerCondition] = useState({});
  const [actionType, setActionType] = useState(ACTION_TYPES.CHANGE_STATUS);
  const [actionConfig, setActionConfig] = useState({});

  const automations = getAutomationsForBoard(board.id);
  const logs = getRecentLogs(board.id);

  const handleCreate = () => {
    if (!name.trim()) return;
    createAutomation({
      boardId: board.id,
      name: name.trim(),
      triggerType,
      triggerCondition,
      actionType,
      actionConfig,
    });
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setTriggerType(TRIGGER_TYPES.STATUS_CHANGE);
    setTriggerCondition({});
    setActionType(ACTION_TYPES.CHANGE_STATUS);
    setActionConfig({});
    setCreating(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Automatizaciones" size="lg">
      {/* Tabs */}
      <div className="flex border-b border-border-light -mx-6 px-6 -mt-2 mb-4">
        {[
          { id: 'rules', label: 'Reglas', icon: Zap, count: automations.length },
          { id: 'logs', label: 'Historial', icon: History, count: logs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCreating(false); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors',
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-surface-secondary text-text-disabled">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rules tab */}
      {activeTab === 'rules' && !creating && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] text-text-secondary">{automations.length} automatización(es) activa(s)</p>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-white bg-primary rounded hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva
            </button>
          </div>

          {automations.length === 0 ? (
            <div className="text-center py-10">
              <Zap className="w-10 h-10 text-text-disabled mx-auto mb-2 opacity-30" />
              <p className="text-[13px] text-text-disabled">Sin automatizaciones</p>
              <p className="text-[11px] text-text-disabled mt-0.5">Crea reglas para automatizar tu flujo de trabajo</p>
              <button
                onClick={() => setCreating(true)}
                className="mt-3 px-4 py-2 text-[12px] font-medium text-primary bg-primary/10 rounded hover:bg-primary/20 transition-colors"
              >
                Crear primera automatización
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-87.5 overflow-y-auto">
              {automations.map((auto) => (
                <div key={auto.id} className="border border-border-light rounded-lg p-3 hover:bg-surface-secondary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={cn('w-4 h-4', auto.enabled ? 'text-status-yellow' : 'text-text-disabled')} />
                    <span className="text-[13px] font-semibold text-text-primary flex-1">{auto.name}</span>
                    <button
                      onClick={() => toggleAutomation(auto.id)}
                      className="p-0.5"
                      title={auto.enabled ? 'Desactivar' : 'Activar'}
                    >
                      {auto.enabled ? (
                        <ToggleRight className="w-6 h-6 text-status-green" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-text-disabled" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteAutomation(auto.id)}
                      className="p-1 hover:bg-surface-hover rounded text-text-disabled hover:text-status-red"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                    <span className="bg-status-blue-light text-status-blue px-2 py-0.5 rounded-sm font-medium">
                      {TRIGGER_LABELS[auto.trigger.type]?.replace('Cuando ', '') || auto.trigger.type}
                    </span>
                    <ChevronRight className="w-3 h-3 text-text-disabled" />
                    <span className="bg-status-green-light text-status-green px-2 py-0.5 rounded-sm font-medium">
                      {ACTION_LABELS[auto.action.type]?.replace(' a', '') || auto.action.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-text-disabled">
                    <span className="flex items-center gap-1">
                      <Play className="w-2.5 h-2.5" /> {auto.executionCount} ejecuciones
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {formatRelativeDate(auto.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create automation */}
      {activeTab === 'rules' && creating && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={resetForm} className="text-[12px] text-text-secondary hover:text-text-primary">&larr; Volver</button>
            <span className="text-[14px] font-semibold text-text-primary">Nueva automatización</span>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-secondary mb-1">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Mover a Listo cuando se completa"
              className="w-full px-3 py-2 text-[13px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Trigger */}
          <div className="mb-4 p-3 bg-status-blue-light/30 border border-status-blue/20 rounded-lg">
            <label className="block text-[11px] font-semibold text-status-blue mb-2">CUANDO (Trigger)</label>
            <select
              value={triggerType}
              onChange={(e) => { setTriggerType(e.target.value); setTriggerCondition({}); }}
              className="w-full px-3 py-2 text-[12px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary mb-2"
            >
              {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Trigger conditions */}
            {triggerType === TRIGGER_TYPES.STATUS_CHANGE && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-text-secondary mb-0.5">De estado (opcional)</label>
                  <select
                    value={triggerCondition.fromStatus || ''}
                    onChange={(e) => setTriggerCondition({ ...triggerCondition, fromStatus: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 text-[11px] border border-border rounded"
                  >
                    <option value="">Cualquiera</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-text-secondary mb-0.5">A estado (opcional)</label>
                  <select
                    value={triggerCondition.toStatus || ''}
                    onChange={(e) => setTriggerCondition({ ...triggerCondition, toStatus: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 text-[11px] border border-border rounded"
                  >
                    <option value="">Cualquiera</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {triggerType === TRIGGER_TYPES.PRIORITY_CHANGE && (
              <div>
                <label className="block text-[10px] text-text-secondary mb-0.5">A prioridad (opcional)</label>
                <select
                  value={triggerCondition.toPriority || ''}
                  onChange={(e) => setTriggerCondition({ ...triggerCondition, toPriority: e.target.value || undefined })}
                  className="w-full px-2 py-1.5 text-[11px] border border-border rounded"
                >
                  <option value="">Cualquiera</option>
                  {Object.entries(PRIORITY_LABELS).filter(([_, l]) => l).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="mb-4 p-3 bg-status-green-light/30 border border-status-green/20 rounded-lg">
            <label className="block text-[11px] font-semibold text-status-green mb-2">ENTONCES (Acción)</label>
            <select
              value={actionType}
              onChange={(e) => { setActionType(e.target.value); setActionConfig({}); }}
              className="w-full px-3 py-2 text-[12px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary mb-2"
            >
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Action configs */}
            {actionType === ACTION_TYPES.CHANGE_STATUS && (
              <div>
                <label className="block text-[10px] text-text-secondary mb-0.5">Nuevo estado</label>
                <select
                  value={actionConfig.status || ''}
                  onChange={(e) => setActionConfig({ ...actionConfig, status: e.target.value })}
                  className="w-full px-2 py-1.5 text-[11px] border border-border rounded"
                >
                  <option value="">Seleccionar...</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}

            {actionType === ACTION_TYPES.ASSIGN_PERSON && (
              <div>
                <label className="block text-[10px] text-text-secondary mb-0.5">Persona</label>
                <input
                  value={actionConfig.person || ''}
                  onChange={(e) => setActionConfig({ ...actionConfig, person: e.target.value })}
                  placeholder="Nombre de la persona"
                  className="w-full px-2 py-1.5 text-[11px] border border-border rounded"
                />
              </div>
            )}

            {actionType === ACTION_TYPES.CHANGE_PRIORITY && (
              <div>
                <label className="block text-[10px] text-text-secondary mb-0.5">Nueva prioridad</label>
                <select
                  value={actionConfig.priority || ''}
                  onChange={(e) => setActionConfig({ ...actionConfig, priority: e.target.value })}
                  className="w-full px-2 py-1.5 text-[11px] border border-border rounded"
                >
                  <option value="">Seleccionar...</option>
                  {Object.entries(PRIORITY_LABELS).filter(([_, l]) => l).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}

            {actionType === ACTION_TYPES.MOVE_TO_GROUP && (
              <div>
                <label className="block text-[10px] text-text-secondary mb-0.5">Grupo destino</label>
                <select
                  value={actionConfig.groupId || ''}
                  onChange={(e) => {
                    const g = board.groups.find((g) => g.id === e.target.value);
                    setActionConfig({ groupId: e.target.value, groupName: g?.title });
                  }}
                  className="w-full px-2 py-1.5 text-[11px] border border-border rounded"
                >
                  <option value="">Seleccionar...</option>
                  {board.groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
            )}

            {actionType === ACTION_TYPES.NOTIFY && (
              <div>
                <label className="block text-[10px] text-text-secondary mb-0.5">Mensaje</label>
                <input
                  value={actionConfig.message || ''}
                  onChange={(e) => setActionConfig({ ...actionConfig, message: e.target.value })}
                  placeholder="Mensaje de notificación"
                  className="w-full px-2 py-1.5 text-[11px] border border-border rounded"
                />
              </div>
            )}

            {actionType === ACTION_TYPES.SET_DATE && (
              <div>
                <label className="block text-[10px] text-text-secondary mb-0.5">Días desde hoy</label>
                <input
                  type="number"
                  value={actionConfig.daysFromNow ?? 0}
                  onChange={(e) => setActionConfig({ ...actionConfig, daysFromNow: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 text-[11px] border border-border rounded"
                  min={0}
                />
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mb-4 p-3 bg-surface-secondary rounded-lg">
            <p className="text-[11px] font-semibold text-text-secondary mb-1">Vista previa:</p>
            <p className="text-[12px] text-text-primary">
              <span className="text-status-blue font-medium">Cuando</span>{' '}
              {TRIGGER_LABELS[triggerType]?.toLowerCase()}
              {triggerCondition.toStatus && ` a "${STATUS_LABELS[triggerCondition.toStatus]}"`}
              {triggerCondition.fromStatus && ` desde "${STATUS_LABELS[triggerCondition.fromStatus]}"`}
              {triggerCondition.toPriority && ` a "${PRIORITY_LABELS[triggerCondition.toPriority]}"`}
              {' → '}
              <span className="text-status-green font-medium">entonces</span>{' '}
              {ACTION_LABELS[actionType]?.toLowerCase()}
              {actionConfig.status && ` "${STATUS_LABELS[actionConfig.status]}"`}
              {actionConfig.person && ` "${actionConfig.person}"`}
              {actionConfig.priority && ` "${PRIORITY_LABELS[actionConfig.priority]}"`}
              {actionConfig.groupName && ` "${actionConfig.groupName}"`}
              {actionConfig.message && ` "${actionConfig.message}"`}
              {actionConfig.daysFromNow !== undefined && ` (en ${actionConfig.daysFromNow} días)`}
            </p>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button onClick={resetForm} className="px-4 py-2 text-[12px] text-text-secondary hover:bg-surface-secondary rounded transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className={cn(
                'px-4 py-2 text-[12px] font-medium rounded transition-colors',
                name.trim() ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-surface-secondary text-text-disabled cursor-not-allowed'
              )}
            >
              Crear automatización
            </button>
          </div>
        </div>
      )}

      {/* Logs tab */}
      {activeTab === 'logs' && (
        <div>
          {logs.length === 0 ? (
            <div className="text-center py-10">
              <History className="w-10 h-10 text-text-disabled mx-auto mb-2 opacity-30" />
              <p className="text-[13px] text-text-disabled">Sin historial de ejecuciones</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-100 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-surface-secondary/30">
                  <div className="w-6 h-6 rounded-full bg-status-yellow-light flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-status-yellow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-text-primary">{log.automationName}</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      {log.itemTitle && <span className="font-medium">"{log.itemTitle}"</span>}
                      {' → '}{log.result}
                    </p>
                    <p className="text-[10px] text-text-disabled mt-0.5">{formatRelativeDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
