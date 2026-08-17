
-- Re-fix handle_reservation_notification properly with search_path in the CREATE statement
CREATE OR REPLACE FUNCTION public.handle_reservation_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://pktpabruwkvpesqqinxx.supabase.co/functions/v1/reservations-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers', true)::jsonb->>'apikey'
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW),
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
      )
    );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Reservation webhook failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Ensure execute is revoked
REVOKE EXECUTE ON FUNCTION public.handle_reservation_notification() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_reservation_notification() TO service_role;
