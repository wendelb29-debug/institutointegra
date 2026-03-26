
-- Allow admins to delete clients
CREATE POLICY "Admins can delete clients" ON public.clients
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete maintenance_requests
CREATE POLICY "Admins can delete maintenance_requests" ON public.maintenance_requests
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
