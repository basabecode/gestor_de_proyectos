-- ─── M-05: PMIS Metrics ───────────────────────────────────────────────────────
-- Adds budget, cost, and date tracking to boards + progress snapshot history.

-- 1. Extend boards table with PMIS columns
ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS budget       NUMERIC  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_cost  NUMERIC  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS planned_start DATE,
  ADD COLUMN IF NOT EXISTS planned_end   DATE;

-- 2. Progress snapshots — one row per board per day
CREATE TABLE IF NOT EXISTS progress_snapshots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id      UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  snapshot_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  pct_complete  NUMERIC     NOT NULL DEFAULT 0,
  actual_cost   NUMERIC     NOT NULL DEFAULT 0,
  ev            NUMERIC,
  pv            NUMERIC,
  cpi           NUMERIC,
  spi           NUMERIC,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (board_id, snapshot_date)   -- one snapshot per board per day
);

-- 3. RLS for progress_snapshots
ALTER TABLE progress_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_select" ON progress_snapshots
  FOR SELECT USING (
    board_id IN (
      SELECT b.id FROM boards b
      WHERE b.workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "snapshots_insert" ON progress_snapshots
  FOR INSERT WITH CHECK (
    board_id IN (
      SELECT b.id FROM boards b
      WHERE b.workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "snapshots_delete" ON progress_snapshots
  FOR DELETE USING (
    board_id IN (
      SELECT b.id FROM boards b
      WHERE b.workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );
