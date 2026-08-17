-- Enable global visibility and creation for Coworking modules
-- This allows all authenticated users to see and manage the shared agenda

-- ROOMS
DROP POLICY IF EXISTS "Authenticated users can view all rooms" ON public.rooms;
CREATE POLICY "Authenticated users can view all rooms" 
ON public.rooms FOR SELECT 
TO authenticated 
USING (true);

-- RESERVATIONS
DROP POLICY IF EXISTS "Authenticated users can view all reservations" ON public.reservations;
CREATE POLICY "Authenticated users can view all reservations" 
ON public.reservations FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reservations" ON public.reservations;
CREATE POLICY "Authenticated users can create reservations" 
ON public.reservations FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
CREATE POLICY "Authenticated users can update reservations" 
ON public.reservations FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- ROOM BLOCKS
DROP POLICY IF EXISTS "Authenticated users can view all blocks" ON public.room_blocks;
CREATE POLICY "Authenticated users can view all blocks" 
ON public.room_blocks FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create blocks" ON public.room_blocks;
CREATE POLICY "Authenticated users can create blocks" 
ON public.room_blocks FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own blocks" ON public.room_blocks;
CREATE POLICY "Authenticated users can update blocks" 
ON public.room_blocks FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Ensure correct grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_blocks TO authenticated;
GRANT ALL ON public.rooms TO service_role;
GRANT ALL ON public.reservations TO service_role;
GRANT ALL ON public.room_blocks TO service_role;
