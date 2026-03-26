-- Insert the admin's WhatsApp config so the webhook can resolve the instance
INSERT INTO psychologist_whatsapp_config (psychologist_id, instance_id, token, client_token, is_connected, tenant_id)
VALUES (
  'c156d1ed-cd3e-4700-9692-231c7f8ec60c',
  '3F0A839B3D4A131C158AA248D27FDCD6',
  'A714392518FBCFACC066D258',
  'F2bd5df5779e047e489ca72f794289888S',
  true,
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- Create the increment_unread function
CREATE OR REPLACE FUNCTION public.increment_unread(p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE phone = p_phone;
END;
$$;