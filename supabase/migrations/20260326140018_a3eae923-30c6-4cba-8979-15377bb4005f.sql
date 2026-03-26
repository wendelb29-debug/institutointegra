
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true);

CREATE POLICY "Users can upload own signature" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view signatures" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'signatures');

CREATE POLICY "Users can update own signature" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own signature" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);
