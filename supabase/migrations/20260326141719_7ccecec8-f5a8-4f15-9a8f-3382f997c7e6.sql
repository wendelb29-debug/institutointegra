
-- Create storage bucket for helena chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('helena-chat-files', 'helena-chat-files', true);

-- Allow anyone to upload files (public chat)
CREATE POLICY "Anyone can upload helena chat files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'helena-chat-files');

-- Allow anyone to read helena chat files
CREATE POLICY "Anyone can read helena chat files" ON storage.objects
  FOR SELECT USING (bucket_id = 'helena-chat-files');
