-- Remove existing select policies for reservations, rooms, room_blocks and clients
DROP POLICY IF EXISTS "reserv_view" ON public.reservations;
DROP POLICY IF EXISTS "rooms_tenant_view" ON public.rooms;
DROP POLICY IF EXISTS "tenant_select" ON public.room_blocks;
DROP POLICY IF EXISTS "clients_view" ON public.clients;

-- Create new global view policies for authenticated users
CREATE POLICY "reserv_view_global" ON public.reservations 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "rooms_view_global" ON public.rooms 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "room_blocks_view_global" ON public.room_blocks 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "clients_view_global" ON public.clients 
FOR SELECT TO authenticated 
USING (true);
