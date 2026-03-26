
CREATE TABLE public.health_professionals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  specialty text NOT NULL DEFAULT '',
  registration_number text,
  phone text,
  email text,
  role_title text,
  signature_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.health_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage health_professionals" ON public.health_professionals
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view health_professionals" ON public.health_professionals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own professional profile" ON public.health_professionals
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
