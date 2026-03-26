
-- Add media columns to whatsapp_messages
ALTER TABLE public.whatsapp_messages
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_name text,
ADD COLUMN IF NOT EXISTS media_mime_type text;

-- Create storage bucket for whatsapp media
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('whatsapp-media', 'whatsapp-media', true, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to whatsapp-media bucket
CREATE POLICY "Authenticated users can upload whatsapp media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'whatsapp-media');

-- Allow public read access to whatsapp media
CREATE POLICY "Public read access for whatsapp media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'whatsapp-media');
