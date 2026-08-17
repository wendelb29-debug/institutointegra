-- 1. DELETE CONFLICTING DATA (One of the duplicates)
DELETE FROM public.reservations 
WHERE id = '3582b55e-8f78-4561-8023-c182100a7a73';

-- 2. CLEANUP: Remove previous overly permissive policies
DO $$
BEGIN
    -- Rooms
    DROP POLICY IF EXISTS "Authenticated users can view all rooms" ON public.rooms;
    DROP POLICY IF EXISTS "Anyone authenticated can view rooms" ON public.rooms;
    DROP POLICY IF EXISTS "authenticated_select_rooms" ON public.rooms;
    
    -- Reservations
    DROP POLICY IF EXISTS "Authenticated users can view all reservations" ON public.reservations;
    DROP POLICY IF EXISTS "Authenticated users can create reservations" ON public.reservations;
    DROP POLICY IF EXISTS "Authenticated can view reservations" ON public.reservations;
    DROP POLICY IF EXISTS "Authenticated can create reservations" ON public.reservations;
    DROP POLICY IF EXISTS "global_reservations_select" ON public.reservations;
    DROP POLICY IF EXISTS "global_reservations_insert" ON public.reservations;
    DROP POLICY IF EXISTS "global_reservations_update" ON public.reservations;
    DROP POLICY IF EXISTS "global_reservations_delete" ON public.reservations;
    
    -- Room Blocks
    DROP POLICY IF EXISTS "Authenticated users can view all blocks" ON public.room_blocks;
    DROP POLICY IF EXISTS "Authenticated users can create blocks" ON public.room_blocks;
    DROP POLICY IF EXISTS "Authenticated can view room_blocks" ON public.room_blocks;
    DROP POLICY IF EXISTS "room_blocks_view_tenant" ON public.room_blocks;
    DROP POLICY IF EXISTS "room_blocks_view_global" ON public.room_blocks;
    DROP POLICY IF EXISTS "global_room_blocks_select" ON public.room_blocks;
    DROP POLICY IF EXISTS "global_room_blocks_insert" ON public.room_blocks;
    DROP POLICY IF EXISTS "global_room_blocks_update" ON public.room_blocks;
    DROP POLICY IF EXISTS "global_room_blocks_delete" ON public.room_blocks;
END $$;

-- 3. RESTRICTIVE RLS POLICIES
CREATE POLICY "authenticated_select_rooms" ON public.rooms FOR SELECT TO authenticated USING (true);

CREATE POLICY "reservations_select_scoped" ON public.reservations
FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'socio') OR 
    auth.uid() = user_id
);

CREATE POLICY "reservations_insert_scoped" ON public.reservations
FOR INSERT TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'socio') OR 
    auth.uid() = user_id
);

CREATE POLICY "reservations_modify_scoped" ON public.reservations
FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'socio') OR 
    auth.uid() = user_id
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'socio') OR 
    auth.uid() = user_id
);

CREATE POLICY "room_blocks_select_scoped" ON public.room_blocks
FOR SELECT TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'socio') OR 
    auth.uid() = created_by
);

CREATE POLICY "room_blocks_manage_scoped" ON public.room_blocks
FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'socio')
);

-- 4. INTEGRITY: Prevent Overlapping Reservations (Double-booking)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_no_overlap;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_no_overlap
EXCLUDE USING gist (
  room_id WITH =,
  date WITH =,
  tsrange(
    (date + start_time)::timestamp,
    (date + end_time)::timestamp
  ) WITH &&
)
WHERE (status != 'cancelada');

ALTER TABLE public.room_blocks DROP CONSTRAINT IF EXISTS room_blocks_no_overlap;
ALTER TABLE public.room_blocks ADD CONSTRAINT room_blocks_no_overlap
EXCLUDE USING gist (
  room_id WITH =,
  block_date WITH =,
  tsrange(
    (block_date + COALESCE(start_time, '00:00:00'))::timestamp,
    (block_date + COALESCE(end_time, '23:59:59'))::timestamp
  ) WITH &&
);

-- 5. GRANTS
GRANT SELECT ON public.rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_blocks TO authenticated;
GRANT ALL ON public.rooms TO service_role;
GRANT ALL ON public.reservations TO service_role;
GRANT ALL ON public.room_blocks TO service_role;
