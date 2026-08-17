
-- 1. ROOMS: Everyone authenticated can see all rooms
DROP POLICY IF EXISTS "global_rooms_select" ON public.rooms;
CREATE POLICY "global_rooms_select" ON public.rooms
FOR SELECT TO authenticated USING (true);

-- 2. RESERVATIONS: Everyone authenticated can see all reservations
DROP POLICY IF EXISTS "global_reservations_select" ON public.reservations;
CREATE POLICY "global_reservations_select" ON public.reservations
FOR SELECT TO authenticated USING (true);

-- 3. RESERVATIONS: Everyone authenticated can create reservations
DROP POLICY IF EXISTS "global_reservations_insert" ON public.reservations;
CREATE POLICY "global_reservations_insert" ON public.reservations
FOR INSERT TO authenticated WITH CHECK (true);

-- 4. RESERVATIONS: Everyone authenticated can update/delete
DROP POLICY IF EXISTS "global_reservations_update" ON public.reservations;
CREATE POLICY "global_reservations_update" ON public.reservations
FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "global_reservations_delete" ON public.reservations;
CREATE POLICY "global_reservations_delete" ON public.reservations
FOR DELETE TO authenticated USING (true);

-- 5. ROOM BLOCKS: Shared visibility and management
DROP POLICY IF EXISTS "global_room_blocks_select" ON public.room_blocks;
CREATE POLICY "global_room_blocks_select" ON public.room_blocks
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "global_room_blocks_insert" ON public.room_blocks;
CREATE POLICY "global_room_blocks_insert" ON public.room_blocks
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "global_room_blocks_update" ON public.room_blocks;
CREATE POLICY "global_room_blocks_update" ON public.room_blocks
FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "global_room_blocks_delete" ON public.room_blocks;
CREATE POLICY "global_room_blocks_delete" ON public.room_blocks
FOR DELETE TO authenticated USING (true);

-- Ensure GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_blocks TO authenticated;
GRANT ALL ON public.reservations TO service_role;
GRANT ALL ON public.rooms TO service_role;
GRANT ALL ON public.room_blocks TO service_role;
