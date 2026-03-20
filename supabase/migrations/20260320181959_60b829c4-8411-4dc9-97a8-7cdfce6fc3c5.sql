
-- Allow anonymous users to view available rooms for public booking page
CREATE POLICY "Public can view rooms" ON public.rooms FOR SELECT TO anon USING (true);
