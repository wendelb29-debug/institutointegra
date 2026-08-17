DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'reservations_webhook_trigger') THEN
        -- We handle this via standard Supabase Webhooks in the dashboard usually, 
        -- but we can use SQL to define it if we have the permissions.
        -- However, on Lovable Cloud, it's safer to just mention that the Edge Function 
        -- needs to be hooked up to the table.
    END IF;
END $$;
