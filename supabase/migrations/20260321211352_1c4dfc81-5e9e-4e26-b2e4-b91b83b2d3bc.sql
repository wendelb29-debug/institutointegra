-- Patients table
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  cpf text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists can manage own patients" ON public.patients
  FOR ALL TO authenticated
  USING (auth.uid() = psychologist_id)
  WITH CHECK (auth.uid() = psychologist_id);

CREATE POLICY "Admins can manage all patients" ON public.patients
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Appointments table
CREATE TYPE public.appointment_status AS ENUM ('agendado', 'confirmado', 'cancelado', 'realizado');

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'agendado',
  notes text,
  reminder_sent boolean NOT NULL DEFAULT false,
  confirmation_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists can manage own appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (auth.uid() = psychologist_id)
  WITH CHECK (auth.uid() = psychologist_id);

CREATE POLICY "Admins can manage all appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- WhatsApp config per psychologist
CREATE TABLE public.psychologist_whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  instance_id text NOT NULL,
  token text NOT NULL,
  client_token text,
  is_connected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.psychologist_whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists can manage own whatsapp config" ON public.psychologist_whatsapp_config
  FOR ALL TO authenticated
  USING (auth.uid() = psychologist_id)
  WITH CHECK (auth.uid() = psychologist_id);

CREATE POLICY "Admins can manage all whatsapp configs" ON public.psychologist_whatsapp_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_psychologist_whatsapp_config_updated_at BEFORE UPDATE ON public.psychologist_whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();