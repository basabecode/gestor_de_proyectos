export const STATUS_LABELS = {
  working_on_it: 'Trabajando',
  done: 'Listo',
  stuck: 'Detenido',
  pending: 'Pendiente',
  review: 'En revisión',
  not_started: 'Sin iniciar',
};

export const STATUS_COLORS = {
  working_on_it: { bg: '#fdab3d', text: '#fff' },
  done: { bg: '#00c875', text: '#fff' },
  stuck: { bg: '#e2445c', text: '#fff' },
  pending: { bg: '#c4c4c4', text: '#fff' },
  review: { bg: '#a25ddc', text: '#fff' },
  not_started: { bg: '#c4c4c4', text: '#fff' },
};

export const PRIORITY_LABELS = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  none: '',
};

export const PRIORITY_COLORS = {
  critical: { bg: '#333333', text: '#fff' },
  high: { bg: '#401694', text: '#fff' },
  medium: { bg: '#579bfc', text: '#fff' },
  low: { bg: '#579bfc', text: '#fff', opacity: 0.6 },
  none: { bg: '#c4c4c4', text: '#fff' },
};

export const GROUP_COLORS = [
  '#579bfc', '#00c875', '#e2445c', '#a25ddc',
  '#ff642e', '#fdab3d', '#66ccff', '#ff007f',
  '#037f4c', '#00d2d2', '#9cd326', '#cab641',
];

export const COLUMN_TYPES = {
  STATUS: 'status',
  PERSON: 'person',
  DATE: 'date',
  NUMBER: 'number',
  TEXT: 'text',
  PRIORITY: 'priority',
  TIMELINE: 'timeline',
  FILE: 'file',
  CHECKBOX: 'checkbox',
  RATING: 'rating',
  LINK: 'link',
  TAG: 'tag',
};

export const COLUMN_DEFAULTS = [
  { id: 'status', title: 'Estado', type: COLUMN_TYPES.STATUS, width: 140 },
  { id: 'person', title: 'Persona', type: COLUMN_TYPES.PERSON, width: 130 },
  { id: 'date', title: 'Fecha', type: COLUMN_TYPES.DATE, width: 130 },
  { id: 'priority', title: 'Prioridad', type: COLUMN_TYPES.PRIORITY, width: 130 },
];

export const VIEW_TYPES = {
  TABLE: 'table',
  KANBAN: 'kanban',
  CALENDAR: 'calendar',
  TIMELINE: 'timeline',
  GANTT: 'gantt',
};

export const STORAGE_KEYS = {
  WORKSPACES: 'workos-workspaces',
  BOARDS: 'workos-boards',
  SIDEBAR_COLLAPSED: 'workos-sidebar-collapsed',
  THEME: 'workos-theme',
};
