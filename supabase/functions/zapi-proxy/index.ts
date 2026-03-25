import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Global fallback credentials
const GLOBAL_INSTANCE_ID = '3F0A839B3D4A131C158AA248D27FDCD6';
const GLOBAL_TOKEN = 'A714392518FBCFACC066D258';
const GLOBAL_CLIENT_TOKEN = 'F2bd5df5779e047e489ca72f794289888S';

function getSupabase(authHeader?: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

function getAuthSupabase(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const supabase = getAuthSupabase(authHeader);
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims) return null;
    return data.claims.sub as string;
  } catch {
    return null;
  }
}

async function getUserConfig(userId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('psychologist_whatsapp_config')
    .select('instance_id, token, client_token, is_connected')
    .eq('psychologist_id', userId)
    .maybeSingle();
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, phone, message, instanceId, token, clientToken, fileUrl, mimeType } = body;

    // Try to get user-specific config
    const userId = await getUserId(req);
    let ZAPI_INSTANCE_ID = instanceId || GLOBAL_INSTANCE_ID;
    let ZAPI_TOKEN = token || GLOBAL_TOKEN;
    let ZAPI_CLIENT_TOKEN = clientToken || GLOBAL_CLIENT_TOKEN;

    // If user is authenticated, try to load their per-user config
    if (userId && !instanceId) {
      const userConfig = await getUserConfig(userId);
      if (userConfig?.instance_id && userConfig?.token) {
        ZAPI_INSTANCE_ID = userConfig.instance_id;
        ZAPI_TOKEN = userConfig.token;
        ZAPI_CLIENT_TOKEN = userConfig.client_token || ZAPI_CLIENT_TOKEN;
        console.log('Using per-user config for user:', userId);
      }
    }

    console.log('Action:', action);
    console.log('Using ZAPI_INSTANCE_ID:', ZAPI_INSTANCE_ID);
    console.log('Using ZAPI_TOKEN:', ZAPI_TOKEN ? ZAPI_TOKEN.substring(0, 6) + '...' : 'NOT SET');
    console.log('User ID:', userId || 'anonymous');

    const baseUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ZAPI_CLIENT_TOKEN) {
      headers['Client-Token'] = ZAPI_CLIENT_TOKEN;
    }

    // === SAVE CONFIG (per-user) ===
    if (action === 'save-config') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Não autenticado' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { instanceId: newInstanceId, token: newToken, clientToken: newClientToken } = body;
      if (!newInstanceId || !newToken) {
        return new Response(JSON.stringify({ error: 'instanceId e token são obrigatórios' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabase = getSupabase();
      const { error } = await supabase
        .from('psychologist_whatsapp_config')
        .upsert({
          psychologist_id: userId,
          instance_id: newInstanceId,
          token: newToken,
          client_token: newClientToken || null,
          is_connected: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'psychologist_id' });

      if (error) {
        console.error('Error saving config:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === GET CONFIG (per-user) ===
    if (action === 'get-config') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Não autenticado', hasConfig: false }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const config = await getUserConfig(userId);
      return new Response(JSON.stringify({
        hasConfig: !!config?.instance_id,
        instanceId: config?.instance_id || null,
        isConnected: config?.is_connected || false,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === STATUS ===
    if (action === 'status') {
      const res = await fetch(`${baseUrl}/status`, { method: 'GET', headers });
      const data = await res.json();
      console.log('Z-API status response:', JSON.stringify(data));
      const connected = data?.connected === true || data?.status === 'CONNECTED';

      // Update config connection status if user is authenticated
      if (userId) {
        const supabase = getSupabase();
        await supabase
          .from('psychologist_whatsapp_config')
          .update({ is_connected: connected, updated_at: new Date().toISOString() })
          .eq('psychologist_id', userId);
      }

      return new Response(JSON.stringify({ connected, raw: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

      if (userId) {
        const supabase = getSupabase();
        await supabase
          .from('psychologist_whatsapp_config')
          .update({ is_connected: false, updated_at: new Date().toISOString() })
          .eq('psychologist_id', userId);
      }

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

    // === SEND MEDIA ===
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

      const res = await fetch(`${baseUrl}/${endpoint}`, {
        method: 'POST', headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();

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
