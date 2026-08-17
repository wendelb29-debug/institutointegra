
-- Verify if the net.http_post extension is available or if we should use a simpler trigger
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Create the trigger function for reservation emails
CREATE OR REPLACE FUNCTION public.handle_reservation_notification()
RETURNS TRIGGER AS $$
DECLARE
  project_url text;
  anon_key text;
BEGIN
  -- Get credentials from environment or settings if possible, 
  -- but on Lovable Cloud we usually target the local Edge Function.
  -- The URL is usually: http://localhost:54321/functions/v1/reservations-webhook
  -- Or the public project URL.
  
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if we can just use the standard Supabase Webhooks UI approach (which creates triggers in the 'supabase_functions' schema)
-- Since I don't have access to that schema easily via read_query, I will create a standard trigger.
-- However, Lovable Cloud users often have "Webhooks" enabled.

-- Let's try to create a standard trigger that calls the function.
DROP TRIGGER IF EXISTS trg_reservation_notification ON public.reservations;
CREATE TRIGGER trg_reservation_notification
AFTER INSERT OR UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.handle_reservation_notification();
