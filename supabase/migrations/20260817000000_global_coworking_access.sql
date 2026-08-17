-- Grant select to all authenticated users for rooms, reservations and room_blocks
-- This allows visibility of shared agenda across tenants.

DO $$
BEGIN
    -- ROOMS
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rooms' AND policyname = 'Authenticated users can view all rooms') THEN
        DROP POLICY "Authenticated users can view all rooms" ON public.rooms;
    END IF;
    CREATE POLICY "Authenticated users can view all rooms" 
    ON public.rooms FOR SELECT 
    TO authenticated 
    USING (true);

    -- RESERVATIONS (Visibility)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reservations' AND policyname = 'Authenticated users can view all reservations') THEN
        DROP POLICY "Authenticated users can view all reservations" ON public.reservations;
    END IF;
    CREATE POLICY "Authenticated users can view all reservations" 
    ON public.reservations FOR SELECT 
    TO authenticated 
    USING (true);

    -- ROOM BLOCKS (Visibility)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_blocks' AND policyname = 'Authenticated users can view all blocks') THEN
        DROP POLICY "Authenticated users can view all blocks" ON public.room_blocks;
    END IF;
    CREATE POLICY "Authenticated users can view all blocks" 
    ON public.room_blocks FOR SELECT 
    TO authenticated 
    USING (true);

    -- ALLOW INSERT FOR ALL AUTHENTICATED USERS
    -- Reservations
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reservations' AND policyname = 'Authenticated users can create reservations') THEN
        DROP POLICY "Authenticated users can create reservations" ON public.reservations;
    END IF;
    CREATE POLICY "Authenticated users can create reservations" 
    ON public.reservations FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

    -- Room Blocks
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_blocks' AND policyname = 'Authenticated users can create blocks') THEN
        DROP POLICY "Authenticated users can create blocks" ON public.room_blocks;
    END IF;
    CREATE POLICY "Authenticated users can create blocks" 
    ON public.room_blocks FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

END $$;

-- Ensure grants are in place
GRANT SELECT, INSERT ON public.rooms TO authenticated;
GRANT SELECT, INSERT ON public.reservations TO authenticated;
GRANT SELECT, INSERT ON public.room_blocks TO authenticated;
