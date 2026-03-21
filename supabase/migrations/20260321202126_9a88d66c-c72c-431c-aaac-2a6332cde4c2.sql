
-- Add assigned_to column to maintenance_requests
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.partners(id) ON DELETE SET NULL;

-- Create maintenance_attachments table
CREATE TABLE public.maintenance_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id uuid NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage maintenance_attachments" ON public.maintenance_attachments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view maintenance_attachments" ON public.maintenance_attachments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert maintenance_attachments" ON public.maintenance_attachments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create storage bucket for maintenance files
INSERT INTO storage.buckets (id, name, public) VALUES ('maintenance-files', 'maintenance-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload maintenance files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'maintenance-files');

CREATE POLICY "Anyone can view maintenance files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'maintenance-files');

CREATE POLICY "Admins can delete maintenance files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'maintenance-files' AND public.has_role(auth.uid(), 'admin'));
