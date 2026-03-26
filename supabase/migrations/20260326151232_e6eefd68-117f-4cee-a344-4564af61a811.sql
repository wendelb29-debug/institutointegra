
-- Update WhatsApp RLS: non-admin users see only conversations assigned to them
-- Messages access follows conversation assignment

-- Drop existing WhatsApp policies
DROP POLICY IF EXISTS "wc_admin" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "wc_own" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "wc_service" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "wm_admin" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "wm_own" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "wm_service" ON public.whatsapp_messages;

-- whatsapp_conversations: visibility by assigned_to
CREATE POLICY "wc_admin" ON public.whatsapp_conversations
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "wc_assigned" ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND assigned_to = auth.uid());

CREATE POLICY "wc_insert" ON public.whatsapp_conversations
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "wc_update_own" ON public.whatsapp_conversations
  FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (assigned_to = auth.uid() OR assigned_to IS NULL));

CREATE POLICY "wc_service" ON public.whatsapp_conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- whatsapp_messages: access follows conversation assignment
CREATE POLICY "wm_admin" ON public.whatsapp_messages
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "wm_assigned" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.whatsapp_conversations wc
      WHERE wc.phone = conversation_phone
      AND wc.assigned_to = auth.uid()
      AND wc.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

CREATE POLICY "wm_insert" ON public.whatsapp_messages
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "wm_service" ON public.whatsapp_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
