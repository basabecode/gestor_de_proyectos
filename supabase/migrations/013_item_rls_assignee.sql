-- ============================================================
-- Work OS — Restricción de edición por assignee (modo estricto)
-- Añade assigned_to a items y reemplaza items_all con políticas
-- granulares: member solo edita/elimina sus tareas asignadas.
-- ============================================================

-- 1. Agregar columna assigned_to a items
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Helper: rol del usuario actual en el workspace de un board
--    SECURITY DEFINER para evitar recursión en RLS
CREATE OR REPLACE FUNCTION public.my_role_in_board(board_uuid UUID)
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT wm.role
  FROM public.workspace_members wm
  INNER JOIN public.boards b ON b.workspace_id = wm.workspace_id
  WHERE b.id = board_uuid
    AND wm.user_id = auth.uid()
  LIMIT 1
$$;

-- 3. Eliminar política única anterior
DROP POLICY IF EXISTS "items_all" ON public.items;

-- 4. SELECT: cualquier miembro (incluso viewer) puede leer
CREATE POLICY "items_select" ON public.items
  FOR SELECT USING (
    public.my_role_in_board(board_id) IN ('owner', 'admin', 'member', 'viewer')
  );

-- 5. INSERT: owner | admin | member pueden crear ítems
CREATE POLICY "items_insert" ON public.items
  FOR INSERT WITH CHECK (
    public.my_role_in_board(board_id) IN ('owner', 'admin', 'member')
  );

-- 6. UPDATE: owner/admin siempre; member solo si assigned_to = él mismo
CREATE POLICY "items_update" ON public.items
  FOR UPDATE
  USING (
    public.my_role_in_board(board_id) IN ('owner', 'admin')
    OR (
      public.my_role_in_board(board_id) = 'member'
      AND assigned_to = auth.uid()
    )
  )
  WITH CHECK (
    public.my_role_in_board(board_id) IN ('owner', 'admin')
    OR (
      public.my_role_in_board(board_id) = 'member'
      AND assigned_to = auth.uid()
    )
  );

-- 7. DELETE: owner/admin siempre; member solo si assigned_to = él mismo
CREATE POLICY "items_delete" ON public.items
  FOR DELETE USING (
    public.my_role_in_board(board_id) IN ('owner', 'admin')
    OR (
      public.my_role_in_board(board_id) = 'member'
      AND assigned_to = auth.uid()
    )
  );
