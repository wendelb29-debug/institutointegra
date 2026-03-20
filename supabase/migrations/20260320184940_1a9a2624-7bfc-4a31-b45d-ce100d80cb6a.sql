
-- Add status to partners
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativo';

-- Monthly cost entries
CREATE TABLE IF NOT EXISTS public.partner_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_value NUMERIC NOT NULL,
  reference_month TEXT NOT NULL,
  description TEXT,
  num_partners INTEGER NOT NULL DEFAULT 1,
  value_per_partner NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(reference_month)
);

ALTER TABLE public.partner_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage partner_costs" ON public.partner_costs
FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view partner_costs" ON public.partner_costs
FOR SELECT TO authenticated USING (true);

-- Individual invoices per partner per month
CREATE TABLE IF NOT EXISTS public.partner_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  cost_id UUID NOT NULL REFERENCES public.partner_costs(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  reference_month TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  payment_link TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partner_id, reference_month)
);

ALTER TABLE public.partner_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage partner_invoices" ON public.partner_invoices
FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view partner_invoices" ON public.partner_invoices
FOR SELECT TO authenticated USING (true);
