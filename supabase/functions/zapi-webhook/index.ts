import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

function extractMessageText(body: any): string {
  if (body.text?.message) return body.text.message;
  if (body.body?.message) return body.body.message;
  if (typeof body.body === 'string') return body.body;
  if (typeof body.message === 'string') return body.message;
  if (body.image?.caption) return body.image.caption;
  if (body.image) return '';
  if (body.audio) return '';
  if (body.video) return '';
  if (body.document) return '';
  if (body.sticker) return '[Figurinha]';
  if (body.contact) return '[Contato]';
  if (body.location) return '[Localização]';
  return '';
}

function extractMediaInfo(body: any): { mediaType: string | null; mediaUrl: string | null; mediaName: string | null; mediaMimeType: string | null } {
  if (body.image) {
    return { mediaType: 'image', mediaUrl: body.image.imageUrl || body.image.url || null, mediaName: body.image.caption || 'imagem', mediaMimeType: body.image.mimetype || 'image/jpeg' };
  }
  if (body.audio) {
    return { mediaType: 'audio', mediaUrl: body.audio.audioUrl || body.audio.url || null, mediaName: 'audio', mediaMimeType: body.audio.mimetype || 'audio/ogg' };
  }
  if (body.video) {
    return { mediaType: 'video', mediaUrl: body.video.videoUrl || body.video.url || null, mediaName: body.video.caption || 'video', mediaMimeType: body.video.mimetype || 'video/mp4' };
  }
  if (body.document) {
    return { mediaType: 'document', mediaUrl: body.document.documentUrl || body.document.url || null, mediaName: body.document.fileName || 'documento', mediaMimeType: body.document.mimetype || 'application/pdf' };
  }
  return { mediaType: null, mediaUrl: null, mediaName: null, mediaMimeType: null };
}

function getLastMessagePreview(body: any): string {
  const text = extractMessageText(body);
  if (text) return text;
  const media = extractMediaInfo(body);
  if (media.mediaType === 'image') return '📷 Imagem';
  if (media.mediaType === 'audio') return '🎤 Áudio';
  if (media.mediaType === 'video') return '🎥 Vídeo';
  if (media.mediaType === 'document') return `📄 ${media.mediaName}`;
  return '';
}

// Look up which user owns this Z-API instance
async function findUserByInstance(supabase: any, instanceId: string): Promise<{ userId: string | null; tenantId: string | null; instanceToken: string | null; clientToken: string | null }> {
  if (!instanceId) return { userId: null, tenantId: null, instanceToken: null, clientToken: null };
  
  const { data } = await supabase
    .from('psychologist_whatsapp_config')
    .select('psychologist_id, tenant_id, token, client_token')
    .eq('instance_id', instanceId)
    .maybeSingle();
  
  if (data) {
    return { userId: data.psychologist_id, tenantId: data.tenant_id, instanceToken: data.token, clientToken: data.client_token };
  }
  
  // Fallback: check if instance matches global secret, use first admin tenant
  const globalInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
  const globalToken = Deno.env.get('ZAPI_TOKEN');
  const globalClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
  if (globalInstanceId && instanceId === globalInstanceId) {
    const { data: defaultTenant } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (defaultTenant) {
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('tenant_id', defaultTenant.id)
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();
      
      console.log(`[zapi-webhook] Fallback: resolved to tenant=${defaultTenant.id}, admin=${adminRole?.user_id}`);
      return { userId: adminRole?.user_id || null, tenantId: defaultTenant.id, instanceToken: globalToken || null, clientToken: globalClientToken || null };
    }
  }
  
  return { userId: null, tenantId: null, instanceToken: null, clientToken: null };
}

// Auto-assign: find existing conversation assignment or round-robin among tenant users
async function getOrAssignUser(supabase: any, phone: string, tenantId: string, instanceUserId: string | null): Promise<string | null> {
  // Check if conversation already exists with an assignment
  const { data: existing } = await supabase
    .from('whatsapp_conversations')
    .select('assigned_to')
    .eq('phone', phone)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (existing?.assigned_to) return existing.assigned_to;

  // If instance has a specific user, assign to them
  if (instanceUserId) return instanceUserId;

  // Round-robin: find the user in the tenant with fewest open conversations
  const { data: tenantUsers } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('tenant_id', tenantId);

  if (!tenantUsers || tenantUsers.length === 0) return null;

  let minCount = Infinity;
  let assignTo = tenantUsers[0].user_id;

  for (const u of tenantUsers) {
    const { count } = await supabase
      .from('whatsapp_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('assigned_to', u.user_id)
      .eq('conversation_status', 'aberto');

    if ((count || 0) < minCount) {
      minCount = count || 0;
      assignTo = u.user_id;
    }
  }

  return assignTo;
}

async function fetchProfilePic(phone: string, instanceId: string, token: string, clientToken: string | null): Promise<string | null> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/profile-picture/${cleanPhone}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (clientToken) headers['Client-Token'] = clientToken;
    const res = await fetch(url, { method: 'GET', headers });
    const data = await res.json();
    return data?.link || data?.profilePicUrl || data?.url || null;
  } catch { return null; }
}

async function handleMessage(supabase: any, body: any, tenantId: string | null, instanceUserId: string | null, instanceId?: string, instanceToken?: string, clientToken?: string | null) {
  const phone = body.phone;
  const isGroup = body.isGroup || false;
  const fromMe = body.fromMe || false;
  const messageId = body.messageId || body.id;
  const messageText = extractMessageText(body);
  const lastMsgPreview = getLastMessagePreview(body);
  const media = extractMediaInfo(body);
  let senderPhoto = body.photo || body.senderPhoto || null;

  if (isGroup) {
    console.log('[zapi-webhook] Skipping group message');
    return;
  }

  // Skip @lid phone numbers (internal WhatsApp IDs)
  if (phone && phone.includes('@lid')) {
    console.log('[zapi-webhook] Skipping @lid phone:', phone);
    return;
  }

  if (!tenantId) {
    console.error('[zapi-webhook] No tenant_id resolved, cannot save message');
    return;
  }

  // Auto-assign the conversation to a user
  const assignedTo = await getOrAssignUser(supabase, phone, tenantId, instanceUserId);

  // If no sender photo, try to fetch from Z-API
  if (!senderPhoto && !fromMe && instanceId && instanceToken) {
    senderPhoto = await fetchProfilePic(phone, instanceId, instanceToken, clientToken || null);
    console.log('[zapi-webhook] Fetched profile pic:', senderPhoto ? 'yes' : 'no');
  }

  // Upsert conversation
  const convData: Record<string, any> = {
    phone,
    name: chatName || phone,
    is_group: isGroup,
    last_message: messageText || '',
    last_message_time: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenant_id: tenantId,
  };
  if (senderPhoto) {
    convData.avatar_url = senderPhoto;
    convData.profile_pic_url = senderPhoto;
  }
  if (instanceUserId) convData.user_id = instanceUserId;
  if (assignedTo) convData.assigned_to = assignedTo;
  if (!fromMe) convData.unread_count = 1;

  const { error: convError } = await supabase
    .from('whatsapp_conversations')
    .upsert(convData, { onConflict: 'phone,tenant_id' });

  if (convError) {
    console.error('[zapi-webhook] Conv upsert error:', convError.message);
  } else if (!fromMe) {
    // Increment unread if conversation already existed
    try {
      await supabase.rpc('increment_unread', { p_phone: phone });
    } catch { /* ok */ }
  }

  // Insert message
  const msgData: Record<string, any> = {
    conversation_phone: phone,
    message_id: messageId,
    direction: fromMe ? 'sent' : 'received',
    body: messageText,
    status: fromMe ? 'sent' : 'received',
    from_me: fromMe,
    tenant_id: tenantId,
  };
  if (assignedTo) msgData.user_id = assignedTo;

  const { error: msgError } = await supabase
    .from('whatsapp_messages')
    .insert(msgData);

  if (msgError) {
    console.error('[zapi-webhook] Message insert error:', msgError.message);
  }

  console.log('[zapi-webhook] Saved message:', { phone, fromMe, assignedTo, tenantId, messageText: messageText?.substring(0, 50) });
}

async function handleSend(supabase: any, body: any, tenantId: string | null, instanceUserId: string | null) {
  const phone = body.phone;
  const messageId = body.messageId || body.id;
  const messageText = extractMessageText(body);
  const isGroup = body.isGroup || false;

  if (isGroup || !phone || !messageText) return;
  if (phone.includes('@lid')) return;
  if (!tenantId) return;

  const assignedTo = await getOrAssignUser(supabase, phone, tenantId, instanceUserId);

  const convData: Record<string, any> = {
    phone,
    name: body.chatName || phone,
    last_message: messageText,
    last_message_time: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenant_id: tenantId,
  };
  if (instanceUserId) convData.user_id = instanceUserId;
  if (assignedTo) convData.assigned_to = assignedTo;

  await supabase
    .from('whatsapp_conversations')
    .upsert(convData, { onConflict: 'phone,tenant_id' });

  const msgData: Record<string, any> = {
    conversation_phone: phone,
    message_id: messageId,
    direction: 'sent',
    body: messageText,
    status: 'sent',
    from_me: true,
    tenant_id: tenantId,
  };
  if (assignedTo) msgData.user_id = assignedTo;

  await supabase
    .from('whatsapp_messages')
    .insert(msgData);

  console.log('[zapi-webhook] Sent message saved:', { phone, messageId, tenantId });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'message';
    const body = await req.json();

    console.log(`[zapi-webhook] type=${type}`, JSON.stringify(body).substring(0, 500));

    const supabase = getSupabase();
    const instanceId = body.instanceId || null;

    // Resolve user and tenant from instance
    const { userId: instanceUserId, tenantId, instanceToken, clientToken: instClientToken } = await findUserByInstance(supabase, instanceId);
    console.log(`[zapi-webhook] instanceId=${instanceId}, userId=${instanceUserId}, tenantId=${tenantId}`);

    switch (type) {
      case 'message':
        await handleMessage(supabase, body, tenantId, instanceUserId, instanceId, instanceToken || undefined, instClientToken);
        break;

      case 'send':
        await handleSend(supabase, body, tenantId, instanceUserId);
        break;

      case 'delivery': {
        const status = body.status;
        const ids = body.ids || [];

        let dbStatus = 'sent';
        if (status === 'DELIVERED' || status === 'RECEIVED') dbStatus = 'delivered';
        if (status === 'READ' || status === 'READ_BY_ME' || status === 'PLAYED') dbStatus = 'read';

        for (const mid of ids) {
          await supabase
            .from('whatsapp_messages')
            .update({ status: dbStatus })
            .eq('message_id', mid);
        }

        console.log('[zapi-webhook] Status update:', { status: dbStatus, ids });
        break;
      }

      case 'connect':
        console.log('[zapi-webhook] Connected:', JSON.stringify(body));
        if (instanceUserId) {
          await supabase
            .from('psychologist_whatsapp_config')
            .update({ is_connected: true, updated_at: new Date().toISOString() })
            .eq('psychologist_id', instanceUserId);
        }
        break;

      case 'disconnect':
        console.log('[zapi-webhook] Disconnected:', JSON.stringify(body));
        if (instanceUserId) {
          await supabase
            .from('psychologist_whatsapp_config')
            .update({ is_connected: false, updated_at: new Date().toISOString() })
            .eq('psychologist_id', instanceUserId);
        }
        break;

      case 'presence': {
        const phone = body.phone;
        const isAvailable = body.status === 'AVAILABLE';

        if (phone && !phone.includes('-group') && !phone.includes('@lid')) {
          await supabase
            .from('whatsapp_conversations')
            .update({ is_online: isAvailable })
            .eq('phone', phone);
        }

        console.log('[zapi-webhook] Presence:', { phone, status: body.status });
        break;
      }

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
