
-- 1. Drop the old FK on messages referencing phone unique
ALTER TABLE public.whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_conversation_phone_fkey;

-- 2. Drop the old unique constraint on phone (global)
ALTER TABLE public.whatsapp_conversations DROP CONSTRAINT IF EXISTS whatsapp_conversations_phone_key;

-- 3. Add new unique constraint: phone per tenant
ALTER TABLE public.whatsapp_conversations ADD CONSTRAINT whatsapp_conversations_phone_tenant_key UNIQUE (phone, tenant_id);

-- 4. Drop all existing RLS policies on whatsapp_conversations
DROP POLICY IF EXISTS wc_admin ON public.whatsapp_conversations;
DROP POLICY IF EXISTS wc_assigned ON public.whatsapp_conversations;
DROP POLICY IF EXISTS wc_insert ON public.whatsapp_conversations;
DROP POLICY IF EXISTS wc_service ON public.whatsapp_conversations;
DROP POLICY IF EXISTS wc_update_own ON public.whatsapp_conversations;

-- 5. New RLS policies: all tenant users can see all tenant conversations (shared inbox)
CREATE POLICY "wc_tenant_select" ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "wc_tenant_insert" ON public.whatsapp_conversations
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "wc_tenant_update" ON public.whatsapp_conversations
  FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "wc_tenant_delete" ON public.whatsapp_conversations
  FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Service role bypass for webhooks
CREATE POLICY "wc_service" ON public.whatsapp_conversations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 6. Drop all existing RLS policies on whatsapp_messages
DROP POLICY IF EXISTS wm_admin ON public.whatsapp_messages;
DROP POLICY IF EXISTS wm_assigned ON public.whatsapp_messages;
DROP POLICY IF EXISTS wm_insert ON public.whatsapp_messages;
DROP POLICY IF EXISTS wm_service ON public.whatsapp_messages;

-- 7. New RLS policies: all tenant users can see all tenant messages
CREATE POLICY "wm_tenant_select" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "wm_tenant_insert" ON public.whatsapp_messages
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "wm_tenant_update" ON public.whatsapp_messages
  FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Service role bypass for webhooks
CREATE POLICY "wm_service" ON public.whatsapp_messages
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
