
-- Function to call the webhook
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

-- Grant execute to service_role and ensure it's revoked from public
REVOKE EXECUTE ON FUNCTION public.handle_reservation_notification() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_reservation_notification() TO service_role;

-- Re-create the trigger
DROP TRIGGER IF EXISTS trg_reservation_notification ON public.reservations;
CREATE TRIGGER trg_reservation_notification
AFTER INSERT OR UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_notification();
