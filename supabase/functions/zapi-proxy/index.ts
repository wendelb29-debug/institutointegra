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
    const { action, phone, message, instanceId, token, clientToken } = await req.json();

    // Use per-psychologist credentials if provided, otherwise fall back to global secrets
    const ZAPI_INSTANCE_ID = instanceId || Deno.env.get('ZAPI_INSTANCE_ID');
    const ZAPI_TOKEN = token || Deno.env.get('ZAPI_TOKEN');
    const ZAPI_CLIENT_TOKEN = clientToken || Deno.env.get('ZAPI_CLIENT_TOKEN');

    console.log('Using ZAPI_INSTANCE_ID:', ZAPI_INSTANCE_ID);
    console.log('Using ZAPI_TOKEN:', ZAPI_TOKEN ? ZAPI_TOKEN.substring(0, 6) + '...' : 'NOT SET');

    const needsConfig = !ZAPI_INSTANCE_ID || !ZAPI_TOKEN;

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
      const res = await fetch(`${baseUrl}/qr-code/image`, { method: 'GET', headers });
      const data = await res.json();
      console.log('Z-API QR response keys:', JSON.stringify(Object.keys(data)));
      // Z-API returns QR in "value" field as data:image/png;base64,...
      const qr = data?.value || null;

      return new Response(JSON.stringify({ qr }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      const res = await fetch(`${baseUrl}/disconnect`, { method: 'DELETE', headers });
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
