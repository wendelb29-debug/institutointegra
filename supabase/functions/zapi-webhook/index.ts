import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'message';
    const body = await req.json();

    console.log(`[zapi-webhook] type=${type}`, JSON.stringify(body).substring(0, 500));

    if (type === 'message' || type === null) {
      // Incoming message from Z-API
      // body typically contains: { phone, body: { message, ... }, ... }
      console.log('[zapi-webhook] Incoming message:', JSON.stringify({
        phone: body.phone,
        message: body.body?.message || body.text?.message || body.message,
        isGroup: body.isGroup,
        fromMe: body.fromMe,
      }));
    }

    if (type === 'status') {
      // Connection status change
      console.log('[zapi-webhook] Connection status:', JSON.stringify(body));
    }

    if (type === 'delivery') {
      // Message delivery status
      console.log('[zapi-webhook] Delivery status:', JSON.stringify({
        messageId: body.id || body.messageId,
        status: body.status,
      }));
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[zapi-webhook] Error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
