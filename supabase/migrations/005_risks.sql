-- ─── M-07: Gestión de Riesgos ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.risks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id        UUID        NOT NULL REFERENCES public.boards(id)  ON DELETE CASCADE,
  item_id         UUID                 REFERENCES public.items(id)   ON DELETE SET NULL,
  title           TEXT        NOT NULL,
  description     TEXT,
  probability     SMALLINT    NOT NULL DEFAULT 3 CHECK (probability BETWEEN 1 AND 5),
  impact          SMALLINT    NOT NULL DEFAULT 3 CHECK (impact      BETWEEN 1 AND 5),
  status          TEXT        NOT NULL DEFAULT 'identified'
                              CHECK (status IN ('identified','assessed','mitigated','closed')),
  mitigation_plan TEXT,
  owner_id        UUID                 REFERENCES auth.users(id)     ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risks_board  ON public.risks(board_id);
CREATE INDEX IF NOT EXISTS idx_risks_item   ON public.risks(item_id);
CREATE INDEX IF NOT EXISTS idx_risks_status ON public.risks(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_risks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_risks_updated_at ON public.risks;
CREATE TRIGGER trg_risks_updated_at
  BEFORE UPDATE ON public.risks
  FOR EACH ROW EXECUTE FUNCTION public.touch_risks_updated_at();

-- RLS — risks inherit access from their board's workspace
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_select" ON public.risks FOR SELECT
  USING (board_id IN (
    SELECT b.id FROM public.boards b
    WHERE b.workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "risk_insert" ON public.risks FOR INSERT
  WITH CHECK (board_id IN (
    SELECT b.id FROM public.boards b
    WHERE b.workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
    )
  ));

CREATE POLICY "risk_update" ON public.risks FOR UPDATE
  USING (board_id IN (
    SELECT b.id FROM public.boards b
    WHERE b.workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
    )
  ));

CREATE POLICY "risk_delete" ON public.risks FOR DELETE
  USING (board_id IN (
    SELECT b.id FROM public.boards b
    WHERE b.workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  ));
