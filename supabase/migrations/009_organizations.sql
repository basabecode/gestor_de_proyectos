-- ═══════════════════════════════════════════════════════════════════════════
-- M-14: Multi-tenancy — Organizaciones (tenants)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Tabla organizations ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,          -- URL-friendly ID único
  logo_url    TEXT,
  owner_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Campos para SSO futuro (M-16)
  sso_enabled   BOOLEAN   NOT NULL DEFAULT false,
  sso_provider  TEXT,                               -- 'saml' | 'oidc'
  sso_domain    TEXT,                               -- dominio de email corporativo
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Miembros de la organización ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_members (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL DEFAULT 'member'
                              CHECK (role IN ('owner','admin','member','viewer')),
  invited_by      UUID        REFERENCES auth.users(id),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- ── 3. Vincular profiles y workspaces a organizations ────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- ── 4. Índices ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS org_members_org_idx   ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS org_members_user_idx  ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS profiles_org_idx      ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS workspaces_org_idx    ON public.workspaces(organization_id);

-- ── 5. Triggers updated_at ───────────────────────────────────────────────────
-- set_updated_at ya existe desde 001_initial_schema.sql

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations: solo miembros pueden ver
CREATE POLICY "org_select_members"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
        AND user_id = auth.uid()
    )
  );

-- Organizations: solo owner/admin pueden modificar
CREATE POLICY "org_update_admins"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
        AND user_id = auth.uid()
        AND role IN ('owner','admin')
    )
  );

-- Organization_members: miembros ven a sus compañeros
CREATE POLICY "org_members_select"
  ON public.organization_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_members om2
      WHERE om2.organization_id = public.organization_members.organization_id
        AND om2.user_id = auth.uid()
    )
  );

-- Organization_members: admins gestionan miembros
CREATE POLICY "org_members_manage"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organization_members.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner','admin')
    )
  );

CREATE POLICY "org_members_delete"
  ON public.organization_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organization_members.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner','admin')
    )
  );
