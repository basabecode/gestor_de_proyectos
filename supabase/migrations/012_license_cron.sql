-- ═══════════════════════════════════════════════════════════════════════════
-- M-17: Jobs en segundo plano — Expiración de licencias
--
-- REQUISITO: Habilitar pg_cron en Supabase Dashboard
--   → Database → Extensions → buscar "pg_cron" → Enable
--
-- Ejecutar DESPUÉS de habilitar la extensión.
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar extensión (si no está activa)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Job 1: Marcar licencias expiradas ─────────────────────────────────────────
-- Se ejecuta todos los días a las 02:00 UTC
SELECT cron.schedule(
  'expire-licenses',         -- nombre único del job
  '0 2 * * *',              -- cron expression: daily at 02:00 UTC
  $$
    UPDATE public.licenses
    SET    status     = 'expired',
           updated_at = now()
    WHERE  status     = 'active'
      AND  expires_at < now();
  $$
);

-- ── Job 2: Log de licencias próximas a vencer (opcional) ─────────────────────
-- Útil para enviar alertas en el futuro (email, Slack, etc.)
-- Se ejecuta todos los lunes a las 08:00 UTC
SELECT cron.schedule(
  'warn-expiring-licenses',
  '0 8 * * 1',
  $$
    -- Placeholder: en el futuro disparar un webhook o Edge Function
    -- para notificar a owners de orgs que expiran en ≤ 14 días
    SELECT
      o.name   AS org_name,
      l.expires_at,
      EXTRACT(DAY FROM (l.expires_at - now()))::INT AS days_left
    FROM public.licenses  l
    JOIN public.organizations o ON o.id = l.organization_id
    WHERE l.status = 'active'
      AND l.expires_at BETWEEN now() AND now() + INTERVAL '14 days';
  $$
);
