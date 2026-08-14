-- Fix WhatsApp media storage policies (compare folder against conversation phone)
DROP POLICY IF EXISTS "whatsapp media tenant read" ON storage.objects;
DROP POLICY IF EXISTS "whatsapp media tenant write" ON storage.objects;

CREATE POLICY "whatsapp media tenant read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'whatsapp-media' AND EXISTS (
    SELECT 1 FROM public.whatsapp_conversations w
    WHERE w.phone = (storage.foldername(storage.objects.name))[1]
      AND w.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "whatsapp media tenant write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'whatsapp-media' AND EXISTS (
    SELECT 1 FROM public.whatsapp_conversations w
    WHERE w.phone = (storage.foldername(storage.objects.name))[1]
      AND w.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- Helena chat files: no anonymous uploads
DROP POLICY IF EXISTS "helena chat uploads only" ON storage.objects;

-- Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_tenant_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_tenant_id_from_contract() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_unread(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_unread(text) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_tenant_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;