-- ─── M-09: WIP Limits en Kanban ───────────────────────────────────────────────
-- Almacena los límites de trabajo en progreso por columna de estado
-- Formato: { "working_on_it": 3, "pending": 0, ... }  (0 = sin límite)

ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS wip_limits JSONB NOT NULL DEFAULT '{}'::jsonb;
