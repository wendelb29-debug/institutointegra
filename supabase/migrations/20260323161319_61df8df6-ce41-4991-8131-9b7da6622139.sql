
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  max_parcelas integer NOT NULL DEFAULT 1,
  taxa numeric NOT NULL DEFAULT 0,
  dia_recebimento integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage payment_methods"
ON public.payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa text NOT NULL DEFAULT 'Física',
  nome text NOT NULL,
  razao_social text,
  email text,
  cpf_cnpj text,
  cep text,
  rua text,
  numero text,
  complemento text,
  bairro text,
  estado text,
  cidade text,
  pais text DEFAULT 'Brasil',
  telefone1 text,
  telefone2 text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage suppliers"
ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id),
  nome text NOT NULL,
  descricao text,
  marca text,
  modelo text,
  codigo_barras text,
  unidade_medida text,
  estoque_minimo numeric NOT NULL DEFAULT 0,
  preco_unitario numeric NOT NULL DEFAULT 0,
  validade date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage materials"
ON public.materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
