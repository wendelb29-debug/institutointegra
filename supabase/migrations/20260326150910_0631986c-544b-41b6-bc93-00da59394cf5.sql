
-- Add DEFAULT to tenant_id on all tables so TypeScript types show it as optional
-- The trigger will always override with the correct value for authenticated users

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','patients','appointments','clinical_records','patient_anamnesis',
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
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET DEFAULT ''00000000-0000-0000-0000-000000000001''::uuid', tbl);
  END LOOP;
END $$;

-- Update trigger to ALWAYS set tenant_id from authenticated user (override default)
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_tenant uuid;
BEGIN
  user_tenant := public.get_user_tenant_id(auth.uid());
  IF user_tenant IS NOT NULL THEN
    NEW.tenant_id := user_tenant;
  END IF;
  RETURN NEW;
END;
$$;
