
-- Migration to fix incomplete user records and ensure robust handle_new_user
-- 1. Redefine handle_new_user with absolute certainty
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  main_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
  invite_record record;
  target_tenant_id uuid;
  target_role app_role;
BEGIN
  -- Check for pending invite
  SELECT * INTO invite_record FROM public.tenant_invites
  WHERE email = NEW.email AND accepted_at IS NULL AND expires_at > now()
  ORDER BY created_at DESC LIMIT 1;

  IF invite_record IS NOT NULL THEN
    target_tenant_id := invite_record.tenant_id;
    target_role := invite_record.role::app_role;
    UPDATE public.tenant_invites SET accepted_at = now() WHERE id = invite_record.id;
  ELSE
    target_tenant_id := main_tenant_id;
    target_role := 'cliente';
  END IF;

  -- Create profile (UPSERT)
  INSERT INTO public.profiles (user_id, full_name, avatar_url, tenant_id, status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), 
    target_tenant_id,
    'ativo'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = COALESCE(profiles.tenant_id, EXCLUDED.tenant_id),
    full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    status = COALESCE(profiles.status, EXCLUDED.status);

  -- Create role (UPSERT)
  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, target_role, target_tenant_id)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Fix existing incomplete profiles
-- Ensure all profiles have the main tenant_id if null
UPDATE public.profiles 
SET tenant_id = '00000000-0000-0000-0000-000000000001' 
WHERE tenant_id IS NULL;

-- Ensure all profiles are 'ativo' if null
UPDATE public.profiles 
SET status = 'ativo' 
WHERE status IS NULL;

-- 3. Fix missing roles for existing users
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT id, 'cliente'::app_role, '00000000-0000-0000-0000-000000000001'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT DO NOTHING;

-- 4. Ensure all users have profiles
INSERT INTO public.profiles (user_id, full_name, tenant_id, status)
SELECT id, split_part(email, '@', 1), '00000000-0000-0000-0000-000000000001', 'ativo'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id)
ON CONFLICT DO NOTHING;
