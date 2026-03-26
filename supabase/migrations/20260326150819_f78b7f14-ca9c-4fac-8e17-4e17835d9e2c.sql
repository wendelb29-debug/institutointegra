
-- =============================================
-- MULTI-TENANT ARCHITECTURE MIGRATION
-- =============================================

-- 1. Create tenants table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Insert default tenant for existing data
INSERT INTO public.tenants (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Instituto Integra', 'instituto-integra');

-- 2. Add tenant_id to profiles FIRST
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
UPDATE public.profiles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);

-- 3. Helper functions
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_tenant_id_from_contract()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL AND NEW.contract_id IS NOT NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM public.contracts WHERE id = NEW.contract_id;
  END IF;
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Add tenant_id to all other tables
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'patients','appointments','clinical_records','patient_anamnesis',
    'patient_attendance','patient_diagnoses','patient_evolutions','patient_packages',
    'health_professionals','schedule_settings','schedule_blocks',
    'rooms','reservations','room_blocks','contracts','contract_signatures',
    'clients','partners','partner_costs','partner_invoices','partner_rooms',
    'financial_transactions','maintenance_requests','maintenance_attachments',
    'materials','suppliers','accounts','payment_methods','document_templates',
    'instituto_events','whatsapp_conversations','whatsapp_messages',
    'whatsapp_contacts','psychologist_whatsapp_config',
    'access_profiles','profile_permissions','user_roles'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id)', tbl);
    EXECUTE format('UPDATE public.%I SET tenant_id = %L WHERE tenant_id IS NULL', tbl, '00000000-0000-0000-0000-000000000001');
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET NOT NULL', tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_tenant ON public.%I(tenant_id)', tbl, tbl);
  END LOOP;
END $$;

-- 5. Create auto-set triggers
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'patients','appointments','clinical_records','patient_anamnesis',
    'patient_attendance','patient_diagnoses','patient_evolutions','patient_packages',
    'health_professionals','schedule_settings','schedule_blocks',
    'rooms','reservations','room_blocks','contracts',
    'clients','partners','partner_costs','partner_invoices','partner_rooms',
    'financial_transactions','maintenance_requests','maintenance_attachments',
    'materials','suppliers','accounts','payment_methods','document_templates',
    'instituto_events','whatsapp_conversations','whatsapp_messages',
    'whatsapp_contacts','psychologist_whatsapp_config',
    'access_profiles','profile_permissions','user_roles','profiles'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_tenant_%s ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_set_tenant_%s BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id()', tbl, tbl);
  END LOOP;
END $$;

-- Special trigger for contract_signatures
DROP TRIGGER IF EXISTS trg_set_tenant_contract_signatures ON public.contract_signatures;
CREATE TRIGGER trg_set_tenant_contract_signatures BEFORE INSERT ON public.contract_signatures FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_contract();

-- 6. Create tenant_invites table
CREATE TABLE public.tenant_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'cliente',
  invited_by uuid,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(tenant_id, email)
);
ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

-- 7. Drop ALL existing RLS policies
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 8. Create new multi-tenant RLS policies

-- TENANTS
CREATE POLICY "tenant_select" ON public.tenants FOR SELECT TO authenticated USING (id = get_user_tenant_id(auth.uid()));
CREATE POLICY "tenant_service" ON public.tenants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- USER_ROLES
CREATE POLICY "roles_admin" ON public.user_roles FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_view_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- TENANT_INVITES
CREATE POLICY "invites_admin" ON public.tenant_invites FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Pattern A: Open CRUD within tenant
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['document_templates','accounts','payment_methods','materials','suppliers'] LOOP
    EXECUTE format('CREATE POLICY "tenant_all" ON public.%I FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid())) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()))', tbl);
  END LOOP;
END $$;

-- Pattern B: Admin manages, authenticated views within tenant
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['room_blocks','partners','partner_costs','partner_invoices','partner_rooms','financial_transactions','instituto_events','access_profiles','profile_permissions'] LOOP
    EXECUTE format('CREATE POLICY "tenant_admin_all" ON public.%I FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin'')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin''))', tbl);
    EXECUTE format('CREATE POLICY "tenant_select" ON public.%I FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()))', tbl);
  END LOOP;
END $$;

-- ROOMS: admin manage + authenticated view + anon view
CREATE POLICY "rooms_admin" ON public.rooms FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "rooms_tenant_view" ON public.rooms FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "rooms_public" ON public.rooms FOR SELECT TO anon USING (true);

-- CLIENTS
CREATE POLICY "clients_admin" ON public.clients FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "clients_view" ON public.clients FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));

-- CONTRACTS
CREATE POLICY "contracts_admin" ON public.contracts FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "contracts_view" ON public.contracts FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "contracts_anon_token" ON public.contracts FOR SELECT TO anon USING (signing_token IS NOT NULL);

-- CONTRACT_SIGNATURES
CREATE POLICY "sigs_admin" ON public.contract_signatures FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "sigs_view" ON public.contract_signatures FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "sigs_anon_insert" ON public.contract_signatures FOR INSERT TO anon WITH CHECK (true);

-- RESERVATIONS
CREATE POLICY "reserv_admin" ON public.reservations FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "reserv_insert" ON public.reservations FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "reserv_view" ON public.reservations FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));

-- MAINTENANCE
CREATE POLICY "maint_admin" ON public.maintenance_requests FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "maint_insert" ON public.maintenance_requests FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() = requested_by);
CREATE POLICY "maint_view" ON public.maintenance_requests FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "maint_att_admin" ON public.maintenance_attachments FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin')) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "maint_att_insert" ON public.maintenance_attachments FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "maint_att_view" ON public.maintenance_attachments FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Pattern C: User-specific (psychologist) + admin within tenant
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['patients','appointments','clinical_records','patient_anamnesis','patient_attendance','patient_diagnoses','patient_evolutions','patient_packages','schedule_settings','schedule_blocks'] LOOP
    EXECUTE format('CREATE POLICY "tenant_psy_all" ON public.%I FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() = psychologist_id) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() = psychologist_id)', tbl);
    EXECUTE format('CREATE POLICY "tenant_admin_all" ON public.%I FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), ''admin''))', tbl);
  END LOOP;
END $$;

-- HEALTH_PROFESSIONALS
CREATE POLICY "hp_own" ON public.health_professionals FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() = user_id) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "hp_admin" ON public.health_professionals FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "hp_view" ON public.health_professionals FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Pattern D: WhatsApp (user-specific + admin + service_role)
CREATE POLICY "wc_admin" ON public.whatsapp_conversations FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "wc_own" ON public.whatsapp_conversations FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL));
CREATE POLICY "wc_service" ON public.whatsapp_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "wm_admin" ON public.whatsapp_messages FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "wm_own" ON public.whatsapp_messages FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL));
CREATE POLICY "wm_service" ON public.whatsapp_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "wcont_admin" ON public.whatsapp_contacts FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "wcont_own" ON public.whatsapp_contacts FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL));
CREATE POLICY "wcont_service" ON public.whatsapp_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "pwc_own" ON public.psychologist_whatsapp_config FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() = psychologist_id) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() = psychologist_id);
CREATE POLICY "pwc_admin" ON public.psychologist_whatsapp_config FOR ALL TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- 9. Update handle_new_user to support multi-tenant (create tenant or join via invite)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
  invite_record record;
BEGIN
  -- Check for pending invite
  SELECT * INTO invite_record FROM public.tenant_invites
  WHERE email = NEW.email AND accepted_at IS NULL AND expires_at > now()
  ORDER BY created_at DESC LIMIT 1;

  IF invite_record IS NOT NULL THEN
    -- Join existing tenant via invite
    new_tenant_id := invite_record.tenant_id;
    UPDATE public.tenant_invites SET accepted_at = now() WHERE id = invite_record.id;

    INSERT INTO public.profiles (user_id, full_name, avatar_url, tenant_id)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), new_tenant_id);

    INSERT INTO public.user_roles (user_id, role, tenant_id)
    VALUES (NEW.id, invite_record.role::app_role, new_tenant_id);
  ELSE
    -- Create new tenant
    INSERT INTO public.tenants (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
    RETURNING id INTO new_tenant_id;

    INSERT INTO public.profiles (user_id, full_name, avatar_url, tenant_id)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), new_tenant_id);

    INSERT INTO public.user_roles (user_id, role, tenant_id)
    VALUES (NEW.id, 'admin', new_tenant_id);
  END IF;

  RETURN NEW;
END;
$$;

-- 10. Recreate the trigger for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
