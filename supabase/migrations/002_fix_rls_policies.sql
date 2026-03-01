-- ============================================================
-- Fix RLS policies — eliminar recursión infinita
-- El problema: workspace_members referenciaba workspace_members
-- dentro de su propio policy → infinite recursion → 500 error
-- ============================================================

-- 1. WORKSPACE_MEMBERS — política sin auto-referencia
DROP POLICY IF EXISTS "wm_select" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_delete" ON public.workspace_members;

-- SELECT: cada usuario solo ve sus propias filas (sin subquery recursivo)
CREATE POLICY "wm_select" ON public.workspace_members
  FOR SELECT USING (user_id = auth.uid());

-- INSERT: solo el owner del workspace puede invitar
CREATE POLICY "wm_insert" ON public.workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
    OR user_id = auth.uid()   -- el propio usuario puede unirse como owner al crearlo
  );

-- DELETE: owner del workspace o el propio miembro puede salirse
CREATE POLICY "wm_delete" ON public.workspace_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- 2. WORKSPACES — ahora puede referenciar workspace_members sin ciclo
--    porque workspace_members ya NO referencia a workspaces
DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON public.workspaces;

CREATE POLICY "workspaces_select" ON public.workspaces
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspaces_insert" ON public.workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspaces_update" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "workspaces_delete" ON public.workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- 3. BOARDS — mismo patrón: referenciar workspace_members (simple) desde boards
DROP POLICY IF EXISTS "boards_select" ON public.boards;
DROP POLICY IF EXISTS "boards_insert" ON public.boards;
DROP POLICY IF EXISTS "boards_update" ON public.boards;
DROP POLICY IF EXISTS "boards_delete" ON public.boards;

CREATE POLICY "boards_select" ON public.boards
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "boards_insert" ON public.boards
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
    )
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "boards_update" ON public.boards
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "boards_delete" ON public.boards
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
    OR workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- 4. GROUPS, ITEMS, SUB_ITEMS, COMMENTS, AUTOMATIONS
--    Reemplazar referencias de workspace_members dentro de boards
DROP POLICY IF EXISTS "groups_all"     ON public.groups;
DROP POLICY IF EXISTS "items_all"      ON public.items;
DROP POLICY IF EXISTS "sub_items_all"  ON public.sub_items;
DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;
DROP POLICY IF EXISTS "automations_all" ON public.automations;

-- Groups: acceso si puedes acceder al board
CREATE POLICY "groups_all" ON public.groups
  FOR ALL USING (
    board_id IN (SELECT id FROM public.boards WHERE id = groups.board_id)
  );

-- Items
CREATE POLICY "items_all" ON public.items
  FOR ALL USING (
    board_id IN (SELECT id FROM public.boards WHERE id = items.board_id)
  );

-- Sub-items
CREATE POLICY "sub_items_all" ON public.sub_items
  FOR ALL USING (
    item_id IN (SELECT id FROM public.items WHERE id = sub_items.item_id)
  );

-- Comments
CREATE POLICY "comments_all" ON public.comments
  FOR ALL USING (
    user_id = auth.uid()
    OR item_id IN (SELECT id FROM public.items WHERE id = comments.item_id)
  );

-- Automations
CREATE POLICY "automations_all" ON public.automations
  FOR ALL USING (
    board_id IN (SELECT id FROM public.boards WHERE id = automations.board_id)
  );

-- Notifications: sin cambios, ya era correcto
DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
CREATE POLICY "notifications_all" ON public.notifications
  FOR ALL USING (user_id = auth.uid());
