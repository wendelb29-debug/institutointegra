-- Fix: Allow all tenant users to see ALL conversations (filtering is done in frontend)
DROP POLICY IF EXISTS wc_tenant_select ON public.whatsapp_conversations;
CREATE POLICY wc_tenant_select ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Fix: Allow all tenant users to see ALL messages in their tenant
DROP POLICY IF EXISTS wm_tenant_select ON public.whatsapp_messages;
CREATE POLICY wm_tenant_select ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));