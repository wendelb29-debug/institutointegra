REVOKE ALL ON public.reservations FROM anon, authenticated, service_role;
REVOKE ALL ON public.rooms FROM anon, authenticated, service_role;
REVOKE ALL ON public.room_blocks FROM anon, authenticated, service_role;

GRANT SELECT ON public.rooms TO authenticated;
GRANT SELECT ON public.rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_blocks TO authenticated;
GRANT ALL ON public.rooms TO service_role;
GRANT ALL ON public.reservations TO service_role;
GRANT ALL ON public.room_blocks TO service_role;

-- Allow anon to select reservations and blocks for availability check in ReservasPublicas
GRANT SELECT ON public.reservations TO anon;
GRANT SELECT ON public.room_blocks TO anon;
GRANT INSERT ON public.reservations TO anon;

-- Explicitly revoke execute on functions mentioned by linter to be safe, 
-- although they weren't part of my migration, they are flagged.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
-- We need authenticated to use has_role in RLS, so we grant it back specifically
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
