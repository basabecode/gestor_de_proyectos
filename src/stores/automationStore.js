import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/utils';

// Trigger types
export const TRIGGER_TYPES = {
  STATUS_CHANGE: 'status_change',
  ITEM_CREATED: 'item_created',
  DATE_ARRIVED: 'date_arrived',
  PRIORITY_CHANGE: 'priority_change',
  PERSON_ASSIGNED: 'person_assigned',
};

export const TRIGGER_LABELS = {
  [TRIGGER_TYPES.STATUS_CHANGE]: 'Cuando el estado cambia',
  [TRIGGER_TYPES.ITEM_CREATED]: 'Cuando se crea un elemento',
  [TRIGGER_TYPES.DATE_ARRIVED]: 'Cuando la fecha llega',
  [TRIGGER_TYPES.PRIORITY_CHANGE]: 'Cuando la prioridad cambia',
  [TRIGGER_TYPES.PERSON_ASSIGNED]: 'Cuando se asigna una persona',
};

// Action types
export const ACTION_TYPES = {
  CHANGE_STATUS: 'change_status',
  ASSIGN_PERSON: 'assign_person',
  CHANGE_PRIORITY: 'change_priority',
  MOVE_TO_GROUP: 'move_to_group',
  NOTIFY: 'notify',
  SET_DATE: 'set_date',
};

export const ACTION_LABELS = {
  [ACTION_TYPES.CHANGE_STATUS]: 'Cambiar estado a',
  [ACTION_TYPES.ASSIGN_PERSON]: 'Asignar persona',
  [ACTION_TYPES.CHANGE_PRIORITY]: 'Cambiar prioridad a',
  [ACTION_TYPES.MOVE_TO_GROUP]: 'Mover al grupo',
  [ACTION_TYPES.NOTIFY]: 'Enviar notificación',
  [ACTION_TYPES.SET_DATE]: 'Establecer fecha',
};

const useAutomationStore = create(
  persist(
    (set, get) => ({
      automations: [],
      executionLog: [],

      createAutomation: (data) => {
        const automation = {
          id: generateId('auto'),
          boardId: data.boardId,
          name: data.name || 'Nueva automatización',
          trigger: {
            type: data.triggerType,
            condition: data.triggerCondition || {},
          },
          action: {
            type: data.actionType,
            config: data.actionConfig || {},
          },
          enabled: true,
          createdAt: new Date().toISOString(),
          executionCount: 0,
        };
        set((s) => ({ automations: [...s.automations, automation] }));
        return automation;
      },

      updateAutomation: (autoId, updates) => {
        set((s) => ({
          automations: s.automations.map((a) =>
            a.id === autoId ? { ...a, ...updates } : a
          ),
        }));
      },

      deleteAutomation: (autoId) => {
        set((s) => ({
          automations: s.automations.filter((a) => a.id !== autoId),
        }));
      },

      toggleAutomation: (autoId) => {
        set((s) => ({
          automations: s.automations.map((a) =>
            a.id === autoId ? { ...a, enabled: !a.enabled } : a
          ),
        }));
      },

      // Execute automations for a given trigger
      executeAutomations: (boardId, triggerType, context, boardStore) => {
        const { automations } = get();
        const matching = automations.filter(
          (a) => a.boardId === boardId && a.trigger.type === triggerType && a.enabled
        );

        const results = [];

        matching.forEach((auto) => {
          const shouldRun = evaluateTrigger(auto.trigger, context);
          if (!shouldRun) return;

          const result = executeAction(auto.action, context, boardStore);
          if (result) {
            results.push({ automationId: auto.id, ...result });
            // Increment execution count
            set((s) => ({
              automations: s.automations.map((a) =>
                a.id === auto.id ? { ...a, executionCount: a.executionCount + 1 } : a
              ),
              executionLog: [
                {
                  id: generateId('log'),
                  automationId: auto.id,
                  automationName: auto.name,
                  boardId,
                  triggerType,
                  actionType: auto.action.type,
                  itemId: context.itemId,
                  itemTitle: context.itemTitle,
                  result: result.message,
                  createdAt: new Date().toISOString(),
                },
                ...s.executionLog.slice(0, 99), // Keep last 100
              ],
            }));
          }
        });

        return results;
      },

      getAutomationsForBoard: (boardId) => {
        return get().automations.filter((a) => a.boardId === boardId);
      },

      getRecentLogs: (boardId, limit = 20) => {
        return get().executionLog
          .filter((l) => !boardId || l.boardId === boardId)
          .slice(0, limit);
      },
    }),
    {
      name: 'workos-automations',
      version: 1,
    }
  )
);

// Evaluate if a trigger condition is met
function evaluateTrigger(trigger, context) {
  switch (trigger.type) {
    case TRIGGER_TYPES.STATUS_CHANGE: {
      if (trigger.condition.fromStatus && trigger.condition.fromStatus !== context.oldValue) return false;
      if (trigger.condition.toStatus && trigger.condition.toStatus !== context.newValue) return false;
      return true;
    }
    case TRIGGER_TYPES.ITEM_CREATED:
      return true;
    case TRIGGER_TYPES.DATE_ARRIVED:
      return true;
    case TRIGGER_TYPES.PRIORITY_CHANGE: {
      if (trigger.condition.toPriority && trigger.condition.toPriority !== context.newValue) return false;
      return true;
    }
    case TRIGGER_TYPES.PERSON_ASSIGNED:
      return true;
    default:
      return false;
  }
}

// Execute an action
function executeAction(action, context, boardStore) {
  const { boardId, itemId } = context;

  switch (action.type) {
    case ACTION_TYPES.CHANGE_STATUS: {
      if (action.config.status) {
        boardStore.updateItemColumn(boardId, itemId, 'status', action.config.status);
        return { message: `Estado cambiado a "${action.config.status}"` };
      }
      return null;
    }
    case ACTION_TYPES.ASSIGN_PERSON: {
      if (action.config.person) {
        boardStore.updateItemColumn(boardId, itemId, 'person', action.config.person);
        return { message: `Persona asignada: "${action.config.person}"` };
      }
      return null;
    }
    case ACTION_TYPES.CHANGE_PRIORITY: {
      if (action.config.priority) {
        boardStore.updateItemColumn(boardId, itemId, 'priority', action.config.priority);
        return { message: `Prioridad cambiada a "${action.config.priority}"` };
      }
      return null;
    }
    case ACTION_TYPES.MOVE_TO_GROUP: {
      if (action.config.groupId) {
        boardStore.moveItem(boardId, itemId, action.config.groupId);
        return { message: `Movido al grupo "${action.config.groupName || action.config.groupId}"` };
      }
      return null;
    }
    case ACTION_TYPES.NOTIFY: {
      const msg = action.config.message || 'Notificación de automatización';
      // Insertar notificación persistente de forma asíncrona
      import('./notificationStore').then(({ default: useNotificationStore }) => {
        useNotificationStore.getState().addNotification({
          type:      'automation',
          title:     'Automatización',
          message:   msg,
          boardId,
          itemId,
          itemTitle: context.itemTitle || null,
          author:    'Automatización',
        });
      }).catch(() => {});
      return { message: msg, notify: true };
    }
    case ACTION_TYPES.SET_DATE: {
      if (action.config.daysFromNow !== undefined) {
        const date = new Date();
        date.setDate(date.getDate() + (action.config.daysFromNow || 0));
        const dateStr = date.toISOString().split('T')[0];
        boardStore.updateItemColumn(boardId, itemId, 'date', dateStr);
        return { message: `Fecha establecida: ${dateStr}` };
      }
      return null;
    }
    default:
      return null;
  }
}

export default useAutomationStore;
