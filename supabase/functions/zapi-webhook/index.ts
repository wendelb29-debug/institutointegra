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
  // Z-API sends message text in various fields depending on message type
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

    switch (type) {
      case 'message': {
        const phone = body.phone;
        const isGroup = body.isGroup || false;
        const fromMe = body.fromMe || false;
        const messageId = body.messageId || body.id;
        const messageText = extractMessageText(body);
        const chatName = body.chatName || body.senderName || phone;

        // Skip group messages
        if (isGroup) {
          console.log('[zapi-webhook] Skipping group message');
          break;
        }

        // Upsert conversation
        const { error: convError } = await supabase
          .from('whatsapp_conversations')
          .upsert({
            phone,
            name: chatName || phone,
            avatar_url: body.photo || body.senderPhoto || null,
            is_group: isGroup,
            last_message: messageText || '',
            last_message_time: new Date().toISOString(),
            unread_count: fromMe ? 0 : 1,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'phone' });

        if (convError) {
          console.error('[zapi-webhook] Conv upsert error:', convError.message);
        } else if (!fromMe) {
          // Increment unread count for received messages
          try {
            await supabase.rpc('increment_unread', { p_phone: phone });
          } catch {
            // Function may not exist yet, that's ok
          }
        }

        // Insert message
        const { error: msgError } = await supabase
          .from('whatsapp_messages')
          .insert({
            conversation_phone: phone,
            message_id: messageId,
            direction: fromMe ? 'sent' : 'received',
            body: messageText,
            status: fromMe ? 'sent' : 'received',
            from_me: fromMe,
          });

        if (msgError) {
          console.error('[zapi-webhook] Message insert error:', msgError.message);
        }

        console.log('[zapi-webhook] Saved message:', { phone, fromMe, messageText: messageText?.substring(0, 50) });
        break;
      }

      case 'send': {
        // Outgoing message sent confirmation
        const phone = body.phone;
        const messageId = body.messageId || body.id;
        const messageText = extractMessageText(body);
        const isGroup = body.isGroup || false;

        if (isGroup) break;

        if (phone && messageText) {
          // Upsert conversation
          await supabase
            .from('whatsapp_conversations')
            .upsert({
              phone,
              name: body.chatName || phone,
              last_message: messageText,
              last_message_time: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'phone' });

          // Insert sent message
          await supabase
            .from('whatsapp_messages')
            .insert({
              conversation_phone: phone,
              message_id: messageId,
              direction: 'sent',
              body: messageText,
              status: 'sent',
              from_me: true,
            });
        }

        console.log('[zapi-webhook] Sent message saved:', { phone, messageId });
        break;
      }

      case 'delivery': {
        // Update message delivery status
        const status = body.status; // SENT, DELIVERED, READ, PLAYED, etc.
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
        break;

      case 'disconnect':
        console.log('[zapi-webhook] Disconnected:', JSON.stringify(body));
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
