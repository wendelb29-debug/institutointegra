
-- Clinical Records (Prontuário)
CREATE TABLE public.clinical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  observations TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage clinical_records" ON public.clinical_records FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Psychologists manage own clinical_records" ON public.clinical_records FOR ALL TO authenticated USING (auth.uid() = psychologist_id) WITH CHECK (auth.uid() = psychologist_id);

-- Patient Evolutions
CREATE TABLE public.patient_evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  comparison_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_evolutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage patient_evolutions" ON public.patient_evolutions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Psychologists manage own evolutions" ON public.patient_evolutions FOR ALL TO authenticated USING (auth.uid() = psychologist_id) WITH CHECK (auth.uid() = psychologist_id);

-- Patient Diagnoses
CREATE TABLE public.patient_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL,
  diagnosis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  cid_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage patient_diagnoses" ON public.patient_diagnoses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Psychologists manage own diagnoses" ON public.patient_diagnoses FOR ALL TO authenticated USING (auth.uid() = psychologist_id) WITH CHECK (auth.uid() = psychologist_id);

-- Patient Attendance (Faltas)
CREATE TABLE public.patient_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  psychologist_id UUID NOT NULL,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'compareceu' CHECK (status IN ('compareceu', 'faltou', 'cancelou')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage patient_attendance" ON public.patient_attendance FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Psychologists manage own attendance" ON public.patient_attendance FOR ALL TO authenticated USING (auth.uid() = psychologist_id) WITH CHECK (auth.uid() = psychologist_id);

-- Patient Packages (Planos e Pacotes)
CREATE TABLE public.patient_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_sessions INTEGER NOT NULL DEFAULT 10,
  used_sessions INTEGER NOT NULL DEFAULT 0,
  price NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage patient_packages" ON public.patient_packages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Psychologists manage own packages" ON public.patient_packages FOR ALL TO authenticated USING (auth.uid() = psychologist_id) WITH CHECK (auth.uid() = psychologist_id);

-- Patient Anamnesis
CREATE TABLE public.patient_anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL,
  queixa_principal TEXT,
  historico_doenca TEXT,
  historico_familiar TEXT,
  medicamentos TEXT,
  alergias TEXT,
  habitos TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_anamnesis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage patient_anamnesis" ON public.patient_anamnesis FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Psychologists manage own anamnesis" ON public.patient_anamnesis FOR ALL TO authenticated USING (auth.uid() = psychologist_id) WITH CHECK (auth.uid() = psychologist_id);

-- Storage bucket for clinical files
INSERT INTO storage.buckets (id, name, public) VALUES ('clinical-files', 'clinical-files', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated can upload clinical files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clinical-files');
CREATE POLICY "Authenticated can view clinical files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'clinical-files');
CREATE POLICY "Authenticated can delete clinical files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'clinical-files');
