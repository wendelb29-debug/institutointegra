DROP POLICY IF EXISTS "Authenticated users can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can view all blocks" ON public.room_blocks;
DROP POLICY IF EXISTS "Authenticated users can create blocks" ON public.room_blocks;
DROP POLICY IF EXISTS "Authenticated users can view all rooms" ON public.rooms;