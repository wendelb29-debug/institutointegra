
-- 1. Redefine handle_new_user to always use the main tenant for internal creation
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
    -- Join specific tenant via invite
    target_tenant_id := invite_record.tenant_id;
    target_role := invite_record.role::app_role;
    UPDATE public.tenant_invites SET accepted_at = now() WHERE id = invite_record.id;
  ELSE
    -- Default to main tenant for all new users (unless invited otherwise)
    target_tenant_id := main_tenant_id;
    target_role := 'cliente'; -- Default role
  END IF;

  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, avatar_url, tenant_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), 
    target_tenant_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END;

  -- Create role if not exists
  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, target_role, target_tenant_id)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Grant permissions to handle_new_user for both authenticated and anon (needed during signup)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 3. Consolidate existing users into the main tenant
UPDATE public.profiles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id != '00000000-0000-0000-0000-000000000001';
UPDATE public.user_roles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id != '00000000-0000-0000-0000-000000000001';
