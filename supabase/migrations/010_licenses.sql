-- ═══════════════════════════════════════════════════════════════════════════
-- M-15: Sistema de Licencias Free Trial
--       (diseñado para integrarse con Stripe en el futuro)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Tabla licenses ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.licenses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Plan
  plan            TEXT        NOT NULL DEFAULT 'free_trial'
                              CHECK (plan IN ('free_trial','pro','enterprise')),

  -- Estado
  status          TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','expired','disabled')),

  -- Vigencia
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days'),

  -- Límites del plan (configurables por plan)
  max_users             INT  NOT NULL DEFAULT 5,
  max_boards            INT  NOT NULL DEFAULT 10,
  max_items_per_board   INT  NOT NULL DEFAULT 200,

  -- Extensiones manuales (sin pagos)
  extended_by     UUID        REFERENCES auth.users(id),
  extended_at     TIMESTAMPTZ,
  total_days_extended INT     NOT NULL DEFAULT 0,
  extension_notes TEXT,

  -- Reservado para Stripe (no se usa aún)
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,

  -- Auditoría
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS licenses_org_idx    ON public.licenses(organization_id);
CREATE INDEX IF NOT EXISTS licenses_status_idx ON public.licenses(status, expires_at);

CREATE TRIGGER licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Solo miembros de la organización ven su licencia
CREATE POLICY "license_select_members"
  ON public.licenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.licenses.organization_id
        AND user_id = auth.uid()
    )
  );

-- ── 3. Función: crear licencia para una organización ─────────────────────────
CREATE OR REPLACE FUNCTION public.create_organization_license(
  org_id   UUID,
  plan     TEXT DEFAULT 'free_trial',
  days     INT  DEFAULT 90
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lid UUID;
BEGIN
  INSERT INTO public.licenses (organization_id, plan, expires_at)
  VALUES (org_id, plan, now() + (days || ' days')::INTERVAL)
  ON CONFLICT (organization_id) DO NOTHING
  RETURNING id INTO lid;
  RETURN lid;
END;
$$;

-- ── 4. Función: validar licencia activa ───────────────────────────────────────
--   Retorna una fila con toda la info de validación.
--   Uso: SELECT * FROM validate_license('<org_id>');
CREATE OR REPLACE FUNCTION public.validate_license(org_id UUID)
RETURNS TABLE (
  is_valid   BOOLEAN,
  plan       TEXT,
  status     TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  days_left  INT,
  max_users  INT,
  max_boards INT,
  message    TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  lic public.licenses%ROWTYPE;
BEGIN
  SELECT * INTO lic FROM public.licenses WHERE organization_id = org_id;

  -- Sin licencia
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false, 'none', 'not_found',
      NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ, 0, 0, 0,
      'Sin licencia asignada. Contacta soporte.';
    RETURN;
  END IF;

  -- Auto-expirar si el tiempo venció y aún figura como activa
  IF lic.status = 'active' AND lic.expires_at < now() THEN
    UPDATE public.licenses
    SET status = 'expired', updated_at = now()
    WHERE id = lic.id;
    lic.status := 'expired';
  END IF;

  RETURN QUERY SELECT
    lic.status = 'active',
    lic.plan,
    lic.status,
    lic.started_at,
    lic.expires_at,
    GREATEST(0, EXTRACT(DAY FROM (lic.expires_at - now()))::INT),
    lic.max_users,
    lic.max_boards,
    CASE lic.status
      WHEN 'active'   THEN
        CASE WHEN EXTRACT(DAY FROM (lic.expires_at - now())) <= 14
          THEN 'Licencia activa. Vence en ' || EXTRACT(DAY FROM (lic.expires_at - now()))::INT || ' días.'
          ELSE 'Licencia activa.'
        END
      WHEN 'expired'  THEN 'Licencia expirada. Contacta soporte para renovar.'
      WHEN 'disabled' THEN 'Licencia deshabilitada por el administrador.'
      ELSE                 'Estado desconocido.'
    END;
END;
$$;

-- ── 5. Función: extender licencia manualmente (sin pagos) ────────────────────
CREATE OR REPLACE FUNCTION public.extend_license(
  org_id     UUID,
  extra_days INT,
  admin_id   UUID,
  notes      TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.licenses
  SET
    -- Si ya expiró, parte desde hoy; si no, extiende desde la fecha actual
    expires_at          = GREATEST(expires_at, now()) + (extra_days || ' days')::INTERVAL,
    status              = 'active',
    extended_by         = admin_id,
    extended_at         = now(),
    total_days_extended = total_days_extended + extra_days,
    extension_notes     = COALESCE(notes, extension_notes),
    updated_at          = now()
  WHERE organization_id = org_id;

  RETURN FOUND;
END;
$$;

-- ── 6. Función: deshabilitar licencia ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.disable_license(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.licenses
  SET status = 'disabled', updated_at = now()
  WHERE organization_id = org_id;
  RETURN FOUND;
END;
$$;
