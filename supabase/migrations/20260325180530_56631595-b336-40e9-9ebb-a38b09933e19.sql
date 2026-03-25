-- Add user_id to whatsapp tables
ALTER TABLE public.whatsapp_conversations ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.whatsapp_contacts ADD COLUMN IF NOT EXISTS user_id uuid;

-- Drop old RLS policies on whatsapp_conversations
DROP POLICY IF EXISTS "Authenticated users can manage conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Service role full access conversations" ON public.whatsapp_conversations;

-- New RLS policies for whatsapp_conversations (multi-tenant)
CREATE POLICY "Users can view own conversations"
ON public.whatsapp_conversations FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own conversations"
ON public.whatsapp_conversations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own conversations"
ON public.whatsapp_conversations FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete own conversations"
ON public.whatsapp_conversations FOR DELETE TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service role full access conversations"
ON public.whatsapp_conversations FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Drop old RLS policies on whatsapp_messages
DROP POLICY IF EXISTS "Authenticated users can manage messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Service role full access messages" ON public.whatsapp_messages;

-- New RLS policies for whatsapp_messages (multi-tenant)
CREATE POLICY "Users can view own messages"
ON public.whatsapp_messages FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own messages"
ON public.whatsapp_messages FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own messages"
ON public.whatsapp_messages FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service role full access messages"
ON public.whatsapp_messages FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Drop old RLS policies on whatsapp_contacts
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Service role full access contacts" ON public.whatsapp_contacts;

-- New RLS policies for whatsapp_contacts (multi-tenant)
CREATE POLICY "Users can view own contacts"
ON public.whatsapp_contacts FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own contacts"
ON public.whatsapp_contacts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own contacts"
ON public.whatsapp_contacts FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete own contacts"
ON public.whatsapp_contacts FOR DELETE TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service role full access contacts"
ON public.whatsapp_contacts FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Admin policies
CREATE POLICY "Admins can manage all conversations"
ON public.whatsapp_conversations FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all messages"
ON public.whatsapp_messages FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all contacts"
ON public.whatsapp_contacts FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));