
-- Add payment_status to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS payment_link text,
ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES public.contracts(id);
