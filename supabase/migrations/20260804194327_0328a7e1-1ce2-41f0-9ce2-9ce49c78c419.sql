-- 1. Tenant-scope table reads
DROP POLICY IF EXISTS "clients_view_global" ON public.clients;
CREATE POLICY "clients_view_tenant" ON public.clients FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "reserv_view_global" ON public.reservations;
CREATE POLICY "reserv_view_tenant" ON public.reservations FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "room_blocks_view_global" ON public.room_blocks;
CREATE POLICY "room_blocks_view_tenant" ON public.room_blocks FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "rooms_view_global" ON public.rooms;
CREATE POLICY "rooms_view_tenant" ON public.rooms FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- 2. Contracts: no blanket anonymous read; token-gated RPC instead
DROP POLICY IF EXISTS "contracts_anon_token" ON public.contracts;
DROP POLICY IF EXISTS "sigs_anon_insert" ON public.contract_signatures;

CREATE OR REPLACE FUNCTION public.get_contract_by_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'id', c.id,
    'status', c.status,
    'start_date', c.start_date,
    'end_date', c.end_date,
    'monthly_value', c.monthly_value,
    'contract_type', c.contract_type,
    'signed_at', c.signed_at,
    'clients', jsonb_build_object('name', cl.name, 'email', cl.email, 'cpf', cl.cpf),
    'rooms', jsonb_build_object('name', r.name)
  ) INTO result
  FROM public.contracts c
  LEFT JOIN public.clients cl ON cl.id = c.client_id
  LEFT JOIN public.rooms r ON r.id = c.room_id
  WHERE c.signing_token = _token
  LIMIT 1;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.sign_contract(
  _token text,
  _signer_name text,
  _signer_cpf text DEFAULT NULL,
  _signer_email text DEFAULT NULL,
  _ip_address text DEFAULT NULL,
  _geolocation text DEFAULT NULL,
  _photo_url text DEFAULT NULL,
  _signature_data text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c record;
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;
  IF _signer_name IS NULL OR length(trim(_signer_name)) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_name');
  END IF;
  IF _signature_data IS NULL OR length(_signature_data) < 50 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_signature');
  END IF;

  SELECT * INTO c FROM public.contracts WHERE signing_token = _token LIMIT 1;
  IF c IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;
  IF c.signed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_signed');
  END IF;

  INSERT INTO public.contract_signatures (
    contract_id, tenant_id, signer_name, signer_cpf, signer_email,
    ip_address, geolocation, photo_url, signature_data, user_agent
  ) VALUES (
    c.id, c.tenant_id, left(_signer_name, 200), left(coalesce(_signer_cpf,''), 20),
    left(coalesce(_signer_email,''), 200), left(coalesce(_ip_address,''), 64),
    left(coalesce(_geolocation,''), 120), left(coalesce(_photo_url,''), 500),
    _signature_data, left(coalesce(_user_agent,''), 500)
  );

  UPDATE public.contracts
  SET status = 'ativo', signed_at = now()
  WHERE id = c.id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.get_contract_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sign_contract(text,text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_contract_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sign_contract(text,text,text,text,text,text,text,text,text) TO anon, authenticated;

-- 3. Storage policies
-- clinical-files: only users of the patient's tenant
DROP POLICY IF EXISTS "Authenticated can view clinical files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload clinical files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete clinical files" ON storage.objects;

CREATE POLICY "clinical files tenant read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'clinical-files' AND EXISTS (
  SELECT 1 FROM public.patients p
  WHERE p.id::text = (storage.foldername(name))[1]
    AND p.tenant_id = public.get_user_tenant_id(auth.uid())
));
CREATE POLICY "clinical files tenant write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'clinical-files' AND EXISTS (
  SELECT 1 FROM public.patients p
  WHERE p.id::text = (storage.foldername(name))[1]
    AND p.tenant_id = public.get_user_tenant_id(auth.uid())
));
CREATE POLICY "clinical files tenant delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'clinical-files' AND EXISTS (
  SELECT 1 FROM public.patients p
  WHERE p.id::text = (storage.foldername(name))[1]
    AND p.tenant_id = public.get_user_tenant_id(auth.uid())
));

-- signatures: owner or same-tenant professional record
DROP POLICY IF EXISTS "Anyone can view signatures" ON storage.objects;
CREATE POLICY "signatures owner or tenant read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'signatures' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.health_professionals hp
      WHERE hp.user_id::text = (storage.foldername(name))[1]
        AND hp.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  )
);

-- maintenance-files: tenant of the maintenance request
DROP POLICY IF EXISTS "Anyone can view maintenance files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload maintenance files" ON storage.objects;
CREATE POLICY "maintenance files tenant read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'maintenance-files' AND EXISTS (
  SELECT 1 FROM public.maintenance_requests m
  WHERE m.id::text = (storage.foldername(name))[1]
    AND m.tenant_id = public.get_user_tenant_id(auth.uid())
));
CREATE POLICY "maintenance files tenant write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'maintenance-files' AND EXISTS (
  SELECT 1 FROM public.maintenance_requests m
  WHERE m.id::text = (storage.foldername(name))[1]
    AND m.tenant_id = public.get_user_tenant_id(auth.uid())
));

-- whatsapp-media: tenant of the conversation
DROP POLICY IF EXISTS "Public read access for whatsapp media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload whatsapp media" ON storage.objects;
CREATE POLICY "whatsapp media tenant read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'whatsapp-media' AND EXISTS (
  SELECT 1 FROM public.whatsapp_conversations w
  WHERE w.phone = (storage.foldername(name))[1]
    AND w.tenant_id = public.get_user_tenant_id(auth.uid())
));
CREATE POLICY "whatsapp media tenant write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'whatsapp-media' AND EXISTS (
  SELECT 1 FROM public.whatsapp_conversations w
  WHERE w.phone = (storage.foldername(name))[1]
    AND w.tenant_id = public.get_user_tenant_id(auth.uid())
));

-- helena-chat-files: no public read; uploads limited to the uploads/ prefix
DROP POLICY IF EXISTS "Anyone can read helena chat files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload helena chat files" ON storage.objects;
CREATE POLICY "helena chat uploads only" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'helena-chat-files' AND (storage.foldername(name))[1] = 'uploads');

-- contract-assets: no anonymous uploads
DROP POLICY IF EXISTS "Anyone can upload contract assets" ON storage.objects;
CREATE POLICY "contract assets authenticated upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contract-assets' AND public.get_user_tenant_id(auth.uid()) IS NOT NULL);