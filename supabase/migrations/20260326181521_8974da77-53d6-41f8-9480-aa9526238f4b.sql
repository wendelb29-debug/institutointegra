-- Update SELECT policy: admins see all tenant convos, others see only assigned or unassigned
DROP POLICY IF EXISTS wc_tenant_select ON public.whatsapp_conversations;
CREATE POLICY wc_tenant_select ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR assigned_to = auth.uid()
      OR assigned_to IS NULL
    )
  );

-- Same for messages: only see messages from conversations you can access
DROP POLICY IF EXISTS wm_tenant_select ON public.whatsapp_messages;
CREATE POLICY wm_tenant_select ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.whatsapp_conversations wc
        WHERE wc.phone = conversation_phone
          AND wc.tenant_id = public.get_user_tenant_id(auth.uid())
          AND (wc.assigned_to = auth.uid() OR wc.assigned_to IS NULL)
      )
    )
  );