ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark'));

COMMENT ON COLUMN public.profiles.theme_preference IS 'Preferência de tema do usuário (light ou dark).';