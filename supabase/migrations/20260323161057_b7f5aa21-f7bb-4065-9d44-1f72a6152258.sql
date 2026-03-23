
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  descricao text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage accounts"
ON public.accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  associar_cid text,
  associar_ciap text,
  associar_cipe text,
  texto text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage document_templates"
ON public.document_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
