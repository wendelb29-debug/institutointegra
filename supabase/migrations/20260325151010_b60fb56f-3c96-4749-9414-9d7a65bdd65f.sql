
-- Contacts table
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  name text NOT NULL,
  profile_pic_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contacts"
  ON public.whatsapp_contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access contacts"
  ON public.whatsapp_contacts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Add columns to whatsapp_conversations for multi-attendant
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS conversation_status text DEFAULT 'aberto',
  ADD COLUMN IF NOT EXISTS profile_pic_url text;

-- Enable realtime for contacts
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_contacts;
