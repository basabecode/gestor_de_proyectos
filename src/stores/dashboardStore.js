import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/utils';

const DEFAULT_WIDGETS = [
  { id: 'w_summary', type: 'summary', title: 'Resumen general', size: 'full', order: 0 },
  { id: 'w_pie', type: 'status_pie', title: 'Distribución por estado', size: 'half', order: 1 },
  { id: 'w_bar', type: 'board_bar', title: 'Elementos por tablero', size: 'half', order: 2 },
  { id: 'w_activity', type: 'recent_activity', title: 'Actividad reciente', size: 'two_thirds', order: 3 },
  { id: 'w_team', type: 'team', title: 'Equipo', size: 'third', order: 4 },
  { id: 'w_workload', type: 'workload', title: 'Carga de trabajo', size: 'half', order: 5 },
  { id: 'w_priority', type: 'priority_dist', title: 'Distribución por prioridad', size: 'half', order: 6 },
];

const WIDGET_TYPES = {
  summary: { label: 'Resumen general', defaultSize: 'full' },
  status_pie: { label: 'Estado (gráfico circular)', defaultSize: 'half' },
  board_bar: { label: 'Elementos por tablero', defaultSize: 'half' },
  recent_activity: { label: 'Actividad reciente', defaultSize: 'two_thirds' },
  team: { label: 'Equipo', defaultSize: 'third' },
  workload: { label: 'Carga de trabajo', defaultSize: 'half' },
  priority_dist: { label: 'Prioridad (gráfico)', defaultSize: 'half' },
  overdue: { label: 'Elementos vencidos', defaultSize: 'half' },
  completion_trend: { label: 'Tendencia de completados', defaultSize: 'half' },
};

const useDashboardStore = create(
  persist(
    (set, get) => ({
      widgets: [...DEFAULT_WIDGETS],
      editMode: false,

      toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

      addWidget: (type) => {
        const config = WIDGET_TYPES[type];
        if (!config) return;
        const widget = {
          id: generateId('w'),
          type,
          title: config.label,
          size: config.defaultSize,
          order: get().widgets.length,
        };
        set((s) => ({ widgets: [...s.widgets, widget] }));
      },

      removeWidget: (widgetId) => {
        set((s) => ({
          widgets: s.widgets.filter((w) => w.id !== widgetId),
        }));
      },

      updateWidget: (widgetId, updates) => {
        set((s) => ({
          widgets: s.widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)),
        }));
      },

      reorderWidgets: (newOrder) => {
        set((s) => ({
          widgets: newOrder.map((id, idx) => {
            const w = s.widgets.find((w) => w.id === id);
            return w ? { ...w, order: idx } : null;
          }).filter(Boolean),
        }));
      },

      resetWidgets: () => set({ widgets: [...DEFAULT_WIDGETS] }),
    }),
    {
      name: 'workos-dashboard',
      version: 1,
    }
  )
);

export { WIDGET_TYPES };
export default useDashboardStore;
