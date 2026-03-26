
-- Schedule blocks for time blocking
CREATE TABLE public.schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  psychologist_id UUID NOT NULL,
  block_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  block_type TEXT NOT NULL DEFAULT 'partial' CHECK (block_type IN ('full_day', 'partial')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists can manage own blocks" ON public.schedule_blocks
  FOR ALL TO authenticated
  USING (auth.uid() = psychologist_id)
  WITH CHECK (auth.uid() = psychologist_id);

CREATE POLICY "Admins can manage all blocks" ON public.schedule_blocks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Schedule settings per psychologist
CREATE TABLE public.schedule_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  psychologist_id UUID NOT NULL UNIQUE,
  work_start_time TIME NOT NULL DEFAULT '08:00',
  work_end_time TIME NOT NULL DEFAULT '18:00',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 50,
  break_duration_minutes INTEGER NOT NULL DEFAULT 10,
  working_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists can manage own settings" ON public.schedule_settings
  FOR ALL TO authenticated
  USING (auth.uid() = psychologist_id)
  WITH CHECK (auth.uid() = psychologist_id);

CREATE POLICY "Admins can manage all settings" ON public.schedule_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
