
-- Add signing fields to contracts
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS signing_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'mensalista';

-- Create signatures table
CREATE TABLE IF NOT EXISTS public.contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_cpf TEXT,
  signer_email TEXT,
  ip_address TEXT,
  geolocation TEXT,
  photo_url TEXT,
  signature_data TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

-- Admins can manage signatures
CREATE POLICY "Admins can manage signatures" ON public.contract_signatures
FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated can view signatures
CREATE POLICY "Authenticated can view signatures" ON public.contract_signatures
FOR SELECT TO authenticated USING (true);

-- Anon can insert signatures (for public signing link)
CREATE POLICY "Anon can insert signatures" ON public.contract_signatures
FOR INSERT TO anon WITH CHECK (true);

-- Anon can read contracts by signing token (for public signing page)
CREATE POLICY "Anon can view contracts by token" ON public.contracts
FOR SELECT TO anon USING (signing_token IS NOT NULL);

-- Create storage bucket for contract photos and signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-assets', 'contract-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for anon uploads
CREATE POLICY "Anyone can upload contract assets" ON storage.objects
FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'contract-assets');

CREATE POLICY "Anyone can view contract assets" ON storage.objects
FOR SELECT TO anon, authenticated USING (bucket_id = 'contract-assets');
