
-- Conversations table to store WhatsApp contacts
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  name text,
  avatar_url text,
  is_group boolean DEFAULT false,
  last_message text,
  last_message_time timestamptz,
  unread_count integer DEFAULT 0,
  is_online boolean DEFAULT false,
  status text DEFAULT 'all',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table to store all WhatsApp messages
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_phone text NOT NULL REFERENCES public.whatsapp_conversations(phone) ON DELETE CASCADE,
  message_id text,
  direction text NOT NULL CHECK (direction IN ('sent', 'received')),
  body text,
  status text DEFAULT 'sent',
  from_me boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast message lookup
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(conversation_phone, created_at);
CREATE INDEX idx_whatsapp_messages_message_id ON public.whatsapp_messages(message_id);

-- Enable RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write (admin-level access for now)
CREATE POLICY "Authenticated users can manage conversations"
  ON public.whatsapp_conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage messages"
  ON public.whatsapp_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow service role (edge functions) full access
CREATE POLICY "Service role full access conversations"
  ON public.whatsapp_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access messages"
  ON public.whatsapp_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
