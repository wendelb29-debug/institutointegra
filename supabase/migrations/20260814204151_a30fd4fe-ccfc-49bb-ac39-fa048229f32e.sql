
-- Remover as políticas restritivas atuais para reservas e salas
DROP POLICY IF EXISTS "reserv_view_tenant" ON public.reservations;
DROP POLICY IF EXISTS "rooms_view_tenant" ON public.rooms;
DROP POLICY IF EXISTS "room_blocks_view_tenant" ON public.room_blocks;
DROP POLICY IF EXISTS "reserv_view_global" ON public.reservations;
DROP POLICY IF EXISTS "rooms_view_global" ON public.rooms;
DROP POLICY IF EXISTS "room_blocks_view_global" ON public.room_blocks;

-- Criar novas políticas permitindo que qualquer usuário autenticado visualize
CREATE POLICY "reserv_view_global_v2" 
ON public.reservations FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "rooms_view_global_v2" 
ON public.rooms FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "room_blocks_view_global_v2" 
ON public.room_blocks FOR SELECT 
TO authenticated 
USING (true);

-- Garantir privilégios de SELECT para usuários autenticados
GRANT SELECT ON public.reservations TO authenticated;
GRANT SELECT ON public.rooms TO authenticated;
GRANT SELECT ON public.room_blocks TO authenticated;
