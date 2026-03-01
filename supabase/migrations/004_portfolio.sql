-- ─── M-06: Portfolio Hierarchy ───────────────────────────────────────────────
-- Workspace > Portfolio > Program > Board (Project) > Group > Item

-- 1. Portfolios — top-level containers within a workspace
CREATE TABLE IF NOT EXISTS portfolios (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  color        TEXT        NOT NULL DEFAULT '#579bfc',
  owner_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. Programs — optional grouping within a portfolio
CREATE TABLE IF NOT EXISTS programs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  color        TEXT        NOT NULL DEFAULT '#00c875',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 3. Link boards to portfolio / program (nullable — existing boards unaffected)
ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS program_id   UUID REFERENCES programs(id)   ON DELETE SET NULL;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_workspace ON portfolios(workspace_id);
CREATE INDEX IF NOT EXISTS idx_programs_portfolio   ON programs(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_boards_portfolio     ON boards(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_boards_program       ON boards(program_id);

-- 5. RLS — Portfolios
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "port_select" ON portfolios FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "port_insert" ON portfolios FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
  ));

CREATE POLICY "port_update" ON portfolios FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

CREATE POLICY "port_delete" ON portfolios FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

-- 6. RLS — Programs (inherit access from their portfolio's workspace)
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prog_select" ON programs FOR SELECT
  USING (portfolio_id IN (
    SELECT p.id FROM portfolios p
    WHERE p.workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "prog_insert" ON programs FOR INSERT
  WITH CHECK (portfolio_id IN (
    SELECT p.id FROM portfolios p
    WHERE p.workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
    )
  ));

CREATE POLICY "prog_update" ON programs FOR UPDATE
  USING (portfolio_id IN (
    SELECT p.id FROM portfolios p
    WHERE p.workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  ));

CREATE POLICY "prog_delete" ON programs FOR DELETE
  USING (portfolio_id IN (
    SELECT p.id FROM portfolios p
    WHERE p.workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  ));
