import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { ReservationNotificationEmail } from '../_shared/email-templates/reservation-notification.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_NAME = "Instituto Integra"
const FROM_DOMAIN = "institutointegra.site"
const FROM_EMAIL = `Instituto Integra <noreply@${FROM_DOMAIN}>`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload = await req.json();
    const { record, old_record, type, manual_recipient } = payload;
    
    // Type can be INSERT, UPDATE or MANUAL_RESEND
    const eventType = manual_recipient ? 'MANUAL_RESEND' : type;
    console.log(`Processing ${eventType} for reservation ${record.id}`);

    // Fetch full reservation data with relations
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*, rooms(name, type), clients(name, phone, email), profiles:user_id(full_name, email)')
      .eq('id', record.id)
      .single();

    if (resError || !reservation) {
      throw new Error('Reservation not found');
    }

    // Determine if email should be sent
    let shouldSend = false;
    let subject = '';
    
    const dateStr = new Date(reservation.date + 'T12:00:00').toLocaleDateString('pt-BR');
    const timeStr = `${reservation.start_time.slice(0, 5)} às ${reservation.end_time.slice(0, 5)}`;
    
    if (eventType === 'INSERT') {
      shouldSend = true;
      subject = `Nova reserva realizada - ${dateStr} às ${reservation.start_time.slice(0, 5)}`;
    } else if (eventType === 'UPDATE') {
      // Check for significant changes
      const statusChanged = record.status !== old_record.status;
      const dateChanged = record.date !== old_record.date;
      const timeChanged = record.start_time !== old_record.start_time || record.end_time !== old_record.end_time;
      const roomChanged = record.room_id !== old_record.room_id;

      if (statusChanged || dateChanged || timeChanged || roomChanged) {
        shouldSend = true;
        if (statusChanged && record.status === 'confirmada') {
          subject = `Reserva confirmada — ${dateStr} às ${reservation.start_time.slice(0, 5)}`;
        } else if (statusChanged && record.status === 'cancelada') {
          subject = `Reserva cancelada — ${dateStr} às ${reservation.start_time.slice(0, 5)}`;
        } else {
          subject = `Reserva atualizada — ${dateStr} às ${reservation.start_time.slice(0, 5)}`;
        }
      }
    } else if (eventType === 'MANUAL_RESEND') {
      shouldSend = true;
      subject = `Reenvio: Reserva ${reservation.status} - ${dateStr}`;
    }

    if (!shouldSend) {
      return new Response(JSON.stringify({ message: 'No notification needed' }), { headers: corsHeaders });
    }

    // Determine recipients
    let recipients: string[] = [];
    if (manual_recipient) {
      recipients = [manual_recipient];
    } else {
      // Admin list from auth.users (simplification for this multi-tenant structure)
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      recipients = (authUsers?.users || []).map(u => u.email).filter(Boolean) as string[];
      
      // Also include the user who made the reservation if not in list
      if (reservation.profiles?.email && !recipients.includes(reservation.profiles.email)) {
        recipients.push(reservation.profiles.email);
      }
      
      // And the client if they have an email
      if (reservation.clients?.email && !recipients.includes(reservation.clients.email)) {
        recipients.push(reservation.clients.email);
      }
    }

    if (recipients.length === 0) {
      console.log('No recipients found');
      return new Response(JSON.stringify({ message: 'No recipients' }), { headers: corsHeaders });
    }

    // Render Template
    const emailHtml = await renderAsync(
      React.createElement(ReservationNotificationEmail, {
        siteName: SITE_NAME,
        clientName: reservation.clients?.name || reservation.notes || 'N/A',
        roomName: reservation.rooms?.name || 'Sala',
        date: dateStr,
        time: timeStr,
        status: reservation.status,
      })
    );

    // Send via Lovable Transactional Email
    const results = await Promise.all(recipients.map(async (email) => {
      try {
        const sendRes = await fetch(Deno.env.get('LOVABLE_SEND_URL')!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [email],
            subject: subject,
            html: emailHtml,
            headers: {
              'X-Priority': '1 (Highest)',
              'X-MSMail-Priority': 'High',
              'Importance': 'High',
              'X-Idempotency-Key': `${reservation.id}-${eventType}-${reservation.updated_at || reservation.created_at}`
            }
          })
        });

        const data = await sendRes.json();
        
        // Log to email_logs
        await supabase.from('email_logs').insert({
          reservation_id: reservation.id,
          tenant_id: reservation.tenant_id,
          template_name: 'reservation-notification',
          recipient: email,
          subject: subject,
          event_type: eventType,
          status: sendRes.ok ? 'sent' : 'failed',
          provider_message_id: data.id || null,
          error_message: sendRes.ok ? null : JSON.stringify(data),
          sent_by: reservation.user_id,
        });

        return { email, success: sendRes.ok };
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err);
        return { email, success: false, error: err.message };
      }
    }));

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
