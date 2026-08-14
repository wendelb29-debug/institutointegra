
DROP POLICY IF EXISTS "reserv_view_global_v2" ON public.reservations;
DROP POLICY IF EXISTS "rooms_view_global_v2" ON public.rooms;
DROP POLICY IF EXISTS "room_blocks_view_global_v2" ON public.room_blocks;

CREATE POLICY "reserv_view_tenant"
ON public.reservations FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "rooms_view_tenant"
ON public.rooms FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "room_blocks_view_tenant"
ON public.room_blocks FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));
