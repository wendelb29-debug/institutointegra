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
    const body = await req.json();
    const { action, phone, message, instanceId, token, clientToken, fileUrl, mimeType } = body;

    const ZAPI_INSTANCE_ID = instanceId || Deno.env.get('ZAPI_INSTANCE_ID') || '3F0A839B3D4A131C158AA248D27FDCD6';
    const ZAPI_TOKEN = token || Deno.env.get('ZAPI_TOKEN') || 'A714392518FBCFACC066D258';
    const ZAPI_CLIENT_TOKEN = clientToken || Deno.env.get('ZAPI_CLIENT_TOKEN') || 'F2bd5df5779e047e489ca72f794289888S';

    console.log('Action:', action);
    console.log('Using ZAPI_INSTANCE_ID:', ZAPI_INSTANCE_ID);
    console.log('Using ZAPI_TOKEN:', ZAPI_TOKEN ? ZAPI_TOKEN.substring(0, 6) + '...' : 'NOT SET');
    console.log('Using ZAPI_CLIENT_TOKEN:', ZAPI_CLIENT_TOKEN ? 'SET' : 'NOT SET');

    const needsConfig = !ZAPI_INSTANCE_ID || !ZAPI_TOKEN;

    const baseUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ZAPI_CLIENT_TOKEN) {
      headers['Client-Token'] = ZAPI_CLIENT_TOKEN;
    }

    // === STATUS ===
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
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === QR CODE ===
    if (action === 'qr') {
      const res = await fetch(`${baseUrl}/qr-code/image`, { method: 'GET', headers });
      const data = await res.json();
      const qr = data?.value || null;
      return new Response(JSON.stringify({ qr }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === DISCONNECT ===
    if (action === 'disconnect') {
      const res = await fetch(`${baseUrl}/disconnect`, { method: 'DELETE', headers });
      const data = await res.json();
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === SEND TEXT ===
    if (action === 'send') {
      if (!phone || !message) {
        return new Response(JSON.stringify({ error: 'phone e message são obrigatórios' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Normalize phone: remove all non-digits
      const cleanPhone = String(phone).replace(/\D/g, '');
      console.log('Sending text to:', cleanPhone, 'message:', message.substring(0, 50));

      const res = await fetch(`${baseUrl}/send-text`, {
        method: 'POST', headers,
        body: JSON.stringify({ phone: cleanPhone, message }),
      });
      const data = await res.json();
      console.log('Z-API send-text response:', JSON.stringify(data));

      if (!res.ok) {
        return new Response(JSON.stringify({ error: data?.message || 'Erro ao enviar', raw: data }), {
          status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === SEND MEDIA (image, audio, document) ===
    if (action === 'send-media') {
      if (!phone || !fileUrl) {
        return new Response(JSON.stringify({ error: 'phone e fileUrl são obrigatórios' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const cleanPhone = String(phone).replace(/\D/g, '');
      const mime = mimeType || '';
      
      let endpoint: string;
      let payload: Record<string, string>;

      if (mime.startsWith('image/')) {
        endpoint = 'send-image';
        payload = { phone: cleanPhone, image: fileUrl, caption: message || '' };
      } else if (mime.startsWith('audio/')) {
        endpoint = 'send-audio';
        payload = { phone: cleanPhone, audio: fileUrl };
      } else {
        endpoint = 'send-document/pdf';
        payload = { phone: cleanPhone, document: fileUrl, fileName: message || 'document' };
      }

      console.log('Sending media:', endpoint, 'to:', cleanPhone);

      const res = await fetch(`${baseUrl}/${endpoint}`, {
        method: 'POST', headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('Z-API send-media response:', JSON.stringify(data));

      if (!res.ok) {
        return new Response(JSON.stringify({ error: data?.message || 'Erro ao enviar mídia', raw: data }), {
          status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Z-API proxy error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
