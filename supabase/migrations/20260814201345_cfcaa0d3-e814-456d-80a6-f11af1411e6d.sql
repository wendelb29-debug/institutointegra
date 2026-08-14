DROP POLICY IF EXISTS "contract assets room images read" ON storage.objects;
DROP POLICY IF EXISTS "contract assets tenant read" ON storage.objects;
DROP POLICY IF EXISTS "contract assets room upload" ON storage.objects;
DROP POLICY IF EXISTS "contract assets authenticated upload" ON storage.objects;

CREATE POLICY "contract assets room images read"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'contract-assets' AND (storage.foldername(name))[1] = 'rooms');

CREATE POLICY "contract assets tenant read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'contract-assets'
  AND (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
);

CREATE POLICY "contract assets tenant insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contract-assets'
  AND (
    ((storage.foldername(name))[1] = 'rooms' AND (storage.foldername(name))[2] = public.get_user_tenant_id(auth.uid())::text)
    OR (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  )
);

CREATE POLICY "contract assets tenant update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'contract-assets'
  AND (
    ((storage.foldername(name))[1] = 'rooms' AND (storage.foldername(name))[2] = public.get_user_tenant_id(auth.uid())::text)
    OR (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  )
)
WITH CHECK (
  bucket_id = 'contract-assets'
  AND (
    ((storage.foldername(name))[1] = 'rooms' AND (storage.foldername(name))[2] = public.get_user_tenant_id(auth.uid())::text)
    OR (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  )
);

CREATE POLICY "contract assets tenant delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'contract-assets'
  AND (
    ((storage.foldername(name))[1] = 'rooms' AND (storage.foldername(name))[2] = public.get_user_tenant_id(auth.uid())::text)
    OR (storage.foldername(name))[1] = public.get_user_tenant_id(auth.uid())::text
  )
);

REVOKE EXECUTE ON FUNCTION public.increment_unread(text) FROM authenticated, anon, PUBLIC;