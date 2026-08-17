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
        'Authorization', 'Bearer ' || COALESCE(current_setting('request.headers', true)::jsonb->>'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdHBhYnJ1d2t2cGVzcXFpbnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjc4ODIsImV4cCI6MjA4OTYwMzg4Mn0.mWimya2-koHvoiiVn6lDe0AbfFjNN2eIOn6c6wOUoDU')
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