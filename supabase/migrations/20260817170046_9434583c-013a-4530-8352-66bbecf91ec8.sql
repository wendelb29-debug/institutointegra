CREATE POLICY "anon_select_rooms" ON public.rooms FOR SELECT TO anon USING (true);

-- Allow anon to see confirmed reservations and blocks for availability check
CREATE POLICY "anon_check_reservations" ON public.reservations FOR SELECT TO anon 
USING (status = 'confirmada' OR status = 'pendente');

CREATE POLICY "anon_check_blocks" ON public.room_blocks FOR SELECT TO anon 
USING (true);

-- Allow anon to insert reservations (public booking flow)
CREATE POLICY "anon_insert_reservation" ON public.reservations FOR INSERT TO anon 
WITH CHECK (true);
