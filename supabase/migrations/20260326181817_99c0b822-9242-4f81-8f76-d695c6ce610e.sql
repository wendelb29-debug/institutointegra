-- Strict isolation: assigned conversations visible only to assignee, unassigned visible to all, finished visible to admins
DROP POLICY IF EXISTS wc_tenant_select ON public.whatsapp_conversations;
CREATE POLICY wc_tenant_select ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      -- Admin sees everything
      public.has_role(auth.uid(), 'admin'::app_role)
      -- Owner sees their active conversations
      OR (assigned_to = auth.uid())
      -- Everyone sees unassigned conversations
      OR (assigned_to IS NULL AND conversation_status = 'aberto')
    )
  );