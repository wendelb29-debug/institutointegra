
-- Fix permissive INSERT policies
DROP POLICY IF EXISTS "Authenticated can create maintenance" ON public.maintenance_requests;
CREATE POLICY "Authenticated can create maintenance" ON public.maintenance_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);

DROP POLICY IF EXISTS "Authenticated can create reservations" ON public.reservations;
CREATE POLICY "Authenticated can create reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
