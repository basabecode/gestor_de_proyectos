-- ============================================================
-- Work OS — Schema inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PERFILES DE USUARIO
-- Extiende auth.users con datos del perfil Work OS
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  color       TEXT    DEFAULT '#579bfc',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT    NOT NULL,
  description TEXT,
  color       TEXT    DEFAULT '#0073ea',
  icon        TEXT    DEFAULT 'Layout',
  owner_id    UUID    REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. MIEMBROS DEL WORKSPACE (con roles)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.profiles(id)   ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner','admin','member','viewer')),
  joined_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- 4. BOARDS (tableros)
CREATE TABLE IF NOT EXISTS public.boards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'Nuevo tablero',
  description     TEXT,
  columns         JSONB DEFAULT '[]',
  views           JSONB DEFAULT '[{"id":"main_table","name":"Vista principal","type":"table","isDefault":true}]',
  active_view_id  TEXT DEFAULT 'main_table',
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. GRUPOS (dentro de un board)
CREATE TABLE IF NOT EXISTS public.groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'Nuevo grupo',
  color      TEXT DEFAULT '#579bfc',
  collapsed  BOOLEAN DEFAULT false,
  position   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ITEMS (tareas)
CREATE TABLE IF NOT EXISTS public.items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  group_id   UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Nueva tarea',
  values     JSONB DEFAULT '{}',
  position   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. SUB-ITEMS
CREATE TABLE IF NOT EXISTS public.sub_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID REFERENCES public.items(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Sub-tarea',
  values     JSONB DEFAULT '{}',
  position   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. COMENTARIOS
CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID REFERENCES public.items(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT,
  type       TEXT DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  read       BOOLEAN DEFAULT false,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. AUTOMATIZACIONES
CREATE TABLE IF NOT EXISTS public.automations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  enabled     BOOLEAN DEFAULT true,
  trigger     JSONB NOT NULL DEFAULT '{}',
  actions     JSONB NOT NULL DEFAULT '[]',
  run_count   INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations       ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuario ve y edita solo su propio perfil
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Workspaces: solo miembros ven el workspace
CREATE POLICY "workspaces_select" ON public.workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );
CREATE POLICY "workspaces_insert" ON public.workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "workspaces_update" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "workspaces_delete" ON public.workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- Workspace members
CREATE POLICY "wm_select" ON public.workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "wm_insert" ON public.workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces
      WHERE owner_id = auth.uid()
    )
  );
CREATE POLICY "wm_delete" ON public.workspace_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Boards: miembros del workspace pueden ver; owner/admin pueden modificar
CREATE POLICY "boards_select" ON public.boards
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "boards_insert" ON public.boards
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
    )
  );
CREATE POLICY "boards_update" ON public.boards
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  );
CREATE POLICY "boards_delete" ON public.boards
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  );

-- Groups: misma lógica que boards (heredada por workspace)
CREATE POLICY "groups_all" ON public.groups
  FOR ALL USING (
    board_id IN (
      SELECT b.id FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Items
CREATE POLICY "items_all" ON public.items
  FOR ALL USING (
    board_id IN (
      SELECT b.id FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Sub-items
CREATE POLICY "sub_items_all" ON public.sub_items
  FOR ALL USING (
    item_id IN (
      SELECT i.id FROM public.items i
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Comments
CREATE POLICY "comments_select" ON public.comments
  FOR SELECT USING (
    item_id IN (
      SELECT i.id FROM public.items i
      JOIN public.boards b ON b.id = i.board_id
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );
CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_delete" ON public.comments
  FOR DELETE USING (user_id = auth.uid());

-- Notifications: cada usuario solo ve las suyas
CREATE POLICY "notifications_all" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Automations: miembros del board
CREATE POLICY "automations_all" ON public.automations
  FOR ALL USING (
    board_id IN (
      SELECT b.id FROM public.boards b
      JOIN public.workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner','admin')
    )
  );

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sub_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
