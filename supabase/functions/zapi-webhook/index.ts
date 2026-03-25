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

    // Handle each webhook type from Z-API
    switch (type) {
      case 'message':
        // "Ao receber" — incoming message
        console.log('[zapi-webhook] Received message:', JSON.stringify({
          phone: body.phone,
          message: body.body?.message || body.text?.message || body.message,
          isGroup: body.isGroup,
          fromMe: body.fromMe,
          messageId: body.messageId || body.id,
        }));
        break;

      case 'send':
        // "Ao enviar" — outgoing message confirmation
        console.log('[zapi-webhook] Sent message:', JSON.stringify({
          phone: body.phone,
          messageId: body.messageId || body.id,
        }));
        break;

      case 'delivery':
        // "Receber status da mensagem"
        console.log('[zapi-webhook] Message status:', JSON.stringify({
          messageId: body.id || body.messageId,
          status: body.status,
          phone: body.phone,
        }));
        break;

      case 'connect':
        // "Ao conectar"
        console.log('[zapi-webhook] Connected:', JSON.stringify(body));
        break;

      case 'disconnect':
        // "Ao desconectar"
        console.log('[zapi-webhook] Disconnected:', JSON.stringify(body));
        break;

      case 'presence':
        // "Presença do chat"
        console.log('[zapi-webhook] Chat presence:', JSON.stringify({
          phone: body.phone,
          status: body.status,
        }));
        break;

      default:
        console.log(`[zapi-webhook] Unknown type: ${type}`, JSON.stringify(body));
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
