-- ═══════════════════════════════════════════════════════════════════════════
-- M-18: Aprovisionamiento automático al registrarse
--       Trigger en auth.users → crea Org + Licencia + Workspace
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Función de aprovisionamiento ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id    UUID;
  ws_id     UUID;
  user_name TEXT;
  user_slug TEXT;
BEGIN
  -- Nombre del usuario desde metadata de OAuth o email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Mi Organización'
  );

  -- Slug único: parte del email + fragmento del UUID
  user_slug := lower(
    regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]+', '-', 'g')
  ) || '-' || substr(NEW.id::TEXT, 1, 8);

  -- 1. Crear perfil (upsert por si ya existe desde trigger anterior)
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, user_name)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- 2. Crear organización
  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (user_name, user_slug, NEW.id)
  RETURNING id INTO org_id;

  -- 3. Registrar al usuario como owner de la organización
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_id, NEW.id, 'owner');

  -- 4. Crear licencia gratuita de 90 días
  PERFORM public.create_organization_license(org_id, 'free_trial', 90);

  -- 5. Crear workspace inicial ligado a la organización
  INSERT INTO public.workspaces (name, owner_id, organization_id)
  VALUES ('Mi Espacio de Trabajo', NEW.id, org_id)
  RETURNING id INTO ws_id;

  -- 6. Agregar al usuario como miembro del workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, NEW.id, 'owner');

  -- 7. Vincular perfil a la organización
  UPDATE public.profiles
  SET organization_id = org_id
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- No bloquear el registro si hay un error; el onboarding JS lo manejará
  RAISE WARNING '[autoprovision] Error para user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- ── Registrar trigger en auth.users ──────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- Migración para usuarios existentes (sin organización)
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  rec RECORD;
  org_id UUID;
  ws_id  UUID;
  uslug  TEXT;
BEGIN
  FOR rec IN
    SELECT p.id, p.full_name, u.email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.organization_id IS NULL
  LOOP
    -- Slug
    uslug := lower(regexp_replace(split_part(rec.email, '@', 1), '[^a-z0-9]+', '-', 'g'))
           || '-' || substr(rec.id::TEXT, 1, 8);

    -- Organización
    INSERT INTO public.organizations (name, slug, owner_id)
    VALUES (COALESCE(rec.full_name, split_part(rec.email,'@',1)), uslug, rec.id)
    RETURNING id INTO org_id;

    -- Owner
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_id, rec.id, 'owner')
    ON CONFLICT DO NOTHING;

    -- Licencia
    PERFORM public.create_organization_license(org_id, 'free_trial', 90);

    -- Workspace (reutilizar el existente si hay uno del usuario)
    SELECT id INTO ws_id
    FROM public.workspaces
    WHERE owner_id = rec.id
    LIMIT 1;

    IF ws_id IS NOT NULL THEN
      UPDATE public.workspaces SET organization_id = org_id WHERE id = ws_id;
    ELSE
      INSERT INTO public.workspaces (name, owner_id, organization_id)
      VALUES ('Mi Espacio de Trabajo', rec.id, org_id)
      RETURNING id INTO ws_id;

      INSERT INTO public.workspace_members (workspace_id, user_id, role)
      VALUES (ws_id, rec.id, 'owner')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Perfil
    UPDATE public.profiles SET organization_id = org_id WHERE id = rec.id;

    RAISE NOTICE '[migración] Org creada para user %', rec.id;
  END LOOP;
END;
$$;
