DROP POLICY IF EXISTS "contract signatures tenant read" ON storage.objects;
DROP POLICY IF EXISTS "contract signatures photo upload" ON storage.objects;

CREATE POLICY "contract signatures tenant read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'contract-signatures'
  AND EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND c.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "contract signatures photo upload"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'contract-signatures'
  AND (storage.foldername(name))[1] = 'photos'
  AND EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND c.signed_at IS NULL
  )
);

CREATE POLICY "contract signatures tenant delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'contract-signatures'
  AND EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND c.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

REVOKE EXECUTE ON FUNCTION public.get_contract_by_token(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sign_contract(text, text, text, text, text, text, text, text, text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_contract_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.sign_contract(text, text, text, text, text, text, text, text, text) TO anon;