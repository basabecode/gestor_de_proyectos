-- ─── M-13: Full-Text Search en tableros y elementos ─────────────────────────

-- 1. Columna generada search_vector en boards
ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('spanish',
      coalesce(name, '') || ' ' || coalesce(description, '')
    )
  ) STORED;

-- 2. Columna generada search_vector en items
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('spanish', coalesce(name, ''))
  ) STORED;

-- 3. Índices GIN para búsqueda eficiente
CREATE INDEX IF NOT EXISTS boards_search_vector_idx
  ON public.boards USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS items_search_vector_idx
  ON public.items USING GIN(search_vector);

-- 4. Función auxiliar: convierte texto libre en tsquery con prefijos
--    "reunión eq" → 'reunion:* & eq:*'
CREATE OR REPLACE FUNCTION public.text_to_prefix_tsquery(query TEXT)
RETURNS tsquery
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized TEXT;
  lexemes    TEXT;
BEGIN
  -- Extraer lexemas normalizados del texto (maneja acentos, stemming)
  SELECT string_agg(lexeme || ':*', ' & ')
  INTO lexemes
  FROM unnest(to_tsvector('spanish', query));

  IF lexemes IS NULL OR lexemes = '' THEN
    RETURN NULL;
  END IF;

  RETURN to_tsquery('spanish', lexemes);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 5. Función de búsqueda global en el workspace
CREATE OR REPLACE FUNCTION public.search_workspace(
  search_query TEXT,
  ws_id        UUID
)
RETURNS TABLE (
  result_type TEXT,
  result_id   UUID,
  title       TEXT,
  subtitle    TEXT,
  board_id    UUID,
  rank        REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  tsq tsquery;
BEGIN
  -- Construir query de prefijos
  tsq := public.text_to_prefix_tsquery(search_query);
  IF tsq IS NULL THEN RETURN; END IF;

  RETURN QUERY
    -- Tableros
    SELECT
      'board'::TEXT,
      b.id,
      b.name,
      coalesce(nullif(b.description, ''), b.id::TEXT),
      b.id,
      ts_rank(b.search_vector, tsq)
    FROM public.boards b
    WHERE b.workspace_id = ws_id
      AND b.search_vector @@ tsq

    UNION ALL

    -- Elementos (items)
    SELECT
      'item'::TEXT,
      i.id,
      i.name,
      b.name,
      b.id,
      ts_rank(i.search_vector, tsq)
    FROM public.items  i
    JOIN public.boards b ON b.id = i.board_id
    WHERE b.workspace_id = ws_id
      AND i.search_vector @@ tsq

    ORDER BY rank DESC
    LIMIT 20;
END;
$$;
