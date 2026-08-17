
-- Fix security linter warnings: set search_path and revoke execute on the new function
ALTER FUNCTION public.handle_reservation_notification() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_reservation_notification() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_reservation_notification() TO service_role;

-- Update the function to use the service role key and correct URL logic
CREATE OR REPLACE FUNCTION public.handle_reservation_notification()
RETURNS TRIGGER AS $$
DECLARE
  service_role_key text;
  project_url text;
BEGIN
  -- Fetch the service role key from vault or a safe way if possible, 
  -- but usually for Edge Functions we use the anon/service key depending on the need.
  -- Since this is a system trigger, service role is appropriate.
  -- In Lovable Cloud, we can use the environment variables if set in DB or just hardcode the reference if needed.
  -- However, a more robust way is to use the project's own URL.

  PERFORM
    net.http_post(
      url := 'https://pktpabruwkvpesqqinxx.supabase.co/functions/v1/reservations-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW),
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
      )
    );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't break the transaction if the webhook fails, but log it
  RAISE WARNING 'Reservation webhook failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
