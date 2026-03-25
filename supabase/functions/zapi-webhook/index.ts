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
  if (body.image?.caption) return `[Imagem] ${body.image.caption}`;
  if (body.image) return '[Imagem]';
  if (body.audio) return '[Áudio]';
  if (body.video) return '[Vídeo]';
  if (body.document) return '[Documento]';
  if (body.sticker) return '[Figurinha]';
  if (body.contact) return '[Contato]';
  if (body.location) return '[Localização]';
  return '';
}

// Look up which user owns this Z-API instance
async function findUserByInstance(supabase: any, instanceId: string): Promise<string | null> {
  if (!instanceId) return null;
  const { data } = await supabase
    .from('psychologist_whatsapp_config')
    .select('psychologist_id')
    .eq('instance_id', instanceId)
    .maybeSingle();
  return data?.psychologist_id || null;
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

    // Find the user who owns this instance
    const userId = await findUserByInstance(supabase, instanceId);
    console.log(`[zapi-webhook] instanceId=${instanceId}, userId=${userId}`);

    switch (type) {
      case 'message': {
        const phone = body.phone;
        const isGroup = body.isGroup || false;
        const fromMe = body.fromMe || false;
        const messageId = body.messageId || body.id;
        const messageText = extractMessageText(body);
        const chatName = body.chatName || body.senderName || phone;
        const senderPhoto = body.photo || body.senderPhoto || null;

        if (isGroup) {
          console.log('[zapi-webhook] Skipping group message');
          break;
        }

        // Upsert conversation with user_id
        const convData: Record<string, any> = {
          phone,
          name: chatName || phone,
          avatar_url: senderPhoto,
          profile_pic_url: senderPhoto,
          is_group: isGroup,
          last_message: messageText || '',
          last_message_time: new Date().toISOString(),
          unread_count: fromMe ? 0 : 1,
          updated_at: new Date().toISOString(),
        };
        if (userId) convData.user_id = userId;

        const { error: convError } = await supabase
          .from('whatsapp_conversations')
          .upsert(convData, { onConflict: 'phone' });

        if (convError) {
          console.error('[zapi-webhook] Conv upsert error:', convError.message);
        } else if (!fromMe) {
          try {
            await supabase.rpc('increment_unread', { p_phone: phone });
          } catch { /* ok */ }
        }

        // Insert message with user_id
        const msgData: Record<string, any> = {
          conversation_phone: phone,
          message_id: messageId,
          direction: fromMe ? 'sent' : 'received',
          body: messageText,
          status: fromMe ? 'sent' : 'received',
          from_me: fromMe,
        };
        if (userId) msgData.user_id = userId;

        const { error: msgError } = await supabase
          .from('whatsapp_messages')
          .insert(msgData);

        if (msgError) {
          console.error('[zapi-webhook] Message insert error:', msgError.message);
        }

        console.log('[zapi-webhook] Saved message:', { phone, fromMe, userId, messageText: messageText?.substring(0, 50) });
        break;
      }

      case 'send': {
        const phone = body.phone;
        const messageId = body.messageId || body.id;
        const messageText = extractMessageText(body);
        const isGroup = body.isGroup || false;

        if (isGroup) break;

        if (phone && messageText) {
          const convData: Record<string, any> = {
            phone,
            name: body.chatName || phone,
            last_message: messageText,
            last_message_time: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (userId) convData.user_id = userId;

          await supabase
            .from('whatsapp_conversations')
            .upsert(convData, { onConflict: 'phone' });

          const msgData: Record<string, any> = {
            conversation_phone: phone,
            message_id: messageId,
            direction: 'sent',
            body: messageText,
            status: 'sent',
            from_me: true,
          };
          if (userId) msgData.user_id = userId;

          await supabase
            .from('whatsapp_messages')
            .insert(msgData);
        }

        console.log('[zapi-webhook] Sent message saved:', { phone, messageId, userId });
        break;
      }

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
        if (userId) {
          await supabase
            .from('psychologist_whatsapp_config')
            .update({ is_connected: true, updated_at: new Date().toISOString() })
            .eq('psychologist_id', userId);
        }
        break;

      case 'disconnect':
        console.log('[zapi-webhook] Disconnected:', JSON.stringify(body));
        if (userId) {
          await supabase
            .from('psychologist_whatsapp_config')
            .update({ is_connected: false, updated_at: new Date().toISOString() })
            .eq('psychologist_id', userId);
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
