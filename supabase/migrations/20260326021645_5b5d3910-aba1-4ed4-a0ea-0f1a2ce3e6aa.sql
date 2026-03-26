
-- Access profiles table
CREATE TABLE public.access_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Permissions table
CREATE TABLE public.profile_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.access_profiles(id) ON DELETE CASCADE NOT NULL,
  module text NOT NULL,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  UNIQUE(profile_id, module)
);

-- Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_profile_id uuid REFERENCES public.access_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';

-- Enable RLS
ALTER TABLE public.access_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for access_profiles
CREATE POLICY "Admins can manage access_profiles" ON public.access_profiles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view access_profiles" ON public.access_profiles
  FOR SELECT TO authenticated
  USING (true);

-- RLS policies for profile_permissions
CREATE POLICY "Admins can manage profile_permissions" ON public.profile_permissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view profile_permissions" ON public.profile_permissions
  FOR SELECT TO authenticated
  USING (true);

-- Default admin profile with all permissions
INSERT INTO public.access_profiles (name, is_system) VALUES ('Administrador', true);

INSERT INTO public.profile_permissions (profile_id, module, can_view, can_create, can_edit, can_delete)
SELECT ap.id, m.module, true, true, true, true
FROM public.access_profiles ap
CROSS JOIN (VALUES ('instituto'), ('coworking'), ('cadastros'), ('financeiro'), ('almoxarifado')) AS m(module)
WHERE ap.name = 'Administrador';
