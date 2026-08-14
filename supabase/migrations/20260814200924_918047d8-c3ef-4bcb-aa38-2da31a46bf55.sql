DROP POLICY IF EXISTS rooms_public ON public.rooms;
CREATE POLICY rooms_public_site_read ON public.rooms FOR SELECT TO anon
USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid AND status = 'disponivel');

DROP POLICY IF EXISTS "Anyone can view contract assets" ON storage.objects;
CREATE POLICY "contract assets room images read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'contract-assets' AND (storage.foldername(name))[1] = 'rooms');
CREATE POLICY "contract assets tenant read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contract-assets' AND public.get_user_tenant_id(auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "contract assets authenticated upload" ON storage.objects;
CREATE POLICY "contract assets room upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contract-assets' AND (storage.foldername(name))[1] = 'rooms' AND public.get_user_tenant_id(auth.uid()) IS NOT NULL);

CREATE POLICY "contract signatures photo upload" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'contract-signatures' AND (storage.foldername(name))[1] = 'photos');
CREATE POLICY "contract signatures tenant read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contract-signatures' AND public.get_user_tenant_id(auth.uid()) IS NOT NULL);