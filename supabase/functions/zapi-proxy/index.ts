import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ZAPI_INSTANCE_ID = Deno.env.get('ZAPI_INSTANCE_ID');
  const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN');
  const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN');

  const needsConfig = !ZAPI_INSTANCE_ID || !ZAPI_TOKEN;

  try {
    const { action, phone, message } = await req.json();
    const baseUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ZAPI_CLIENT_TOKEN) {
      headers['Client-Token'] = ZAPI_CLIENT_TOKEN;
    }

    if (action === 'status') {
      if (needsConfig) {
        return new Response(JSON.stringify({ connected: false, needsConfig: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(`${baseUrl}/status`, { method: 'GET', headers });
      const data = await res.json();
      console.log('Z-API status response:', JSON.stringify(data));
      
      const connected = data?.connected === true || data?.status === 'CONNECTED';

      return new Response(JSON.stringify({ connected, raw: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (needsConfig) {
      return new Response(JSON.stringify({ error: 'Z-API não configurado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'qr') {
      // Z-API uses GET for QR code endpoints
      const res = await fetch(`${baseUrl}/qr-code/image`, { method: 'GET', headers });
      const data = await res.json();
      console.log('Z-API QR response:', JSON.stringify(data));

      // The response has a "value" field with base64 image
      const qr = data?.value || data?.qrcode || data?.image || null;

      return new Response(JSON.stringify({ qr }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      const res = await fetch(`${baseUrl}/disconnect`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send') {
      if (!phone || !message) {
        return new Response(JSON.stringify({ error: 'phone e message são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(`${baseUrl}/send-text`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone, message }),
      });
      const data = await res.json();

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Z-API proxy error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
