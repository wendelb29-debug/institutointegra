-- Grant select to all authenticated users for rooms, reservations and room_blocks
-- This allows visibility of shared agenda across tenants.

-- ROOMS
DROP POLICY IF EXISTS "Authenticated users can view all rooms" ON public.rooms;
CREATE POLICY "Authenticated users can view all rooms" 
ON public.rooms FOR SELECT 
TO authenticated 
USING (true);

-- RESERVATIONS (Visibility)
DROP POLICY IF EXISTS "Authenticated users can view all reservations" ON public.reservations;
CREATE POLICY "Authenticated users can view all reservations" 
ON public.reservations FOR SELECT 
TO authenticated 
USING (true);

-- ROOM BLOCKS (Visibility)
DROP POLICY IF EXISTS "Authenticated users can view all blocks" ON public.room_blocks;
CREATE POLICY "Authenticated users can view all blocks" 
ON public.room_blocks FOR SELECT 
TO authenticated 
USING (true);

-- ALLOW INSERT FOR ALL AUTHENTICATED USERS
-- Reservations
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON public.reservations;
CREATE POLICY "Authenticated users can create reservations" 
ON public.reservations FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Room Blocks
DROP POLICY IF EXISTS "Authenticated users can create blocks" ON public.room_blocks;
CREATE POLICY "Authenticated users can create blocks" 
ON public.room_blocks FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Ensure grants are in place
GRANT SELECT, INSERT ON public.rooms TO authenticated;
GRANT SELECT, INSERT ON public.reservations TO authenticated;
GRANT SELECT, INSERT ON public.room_blocks TO authenticated;
