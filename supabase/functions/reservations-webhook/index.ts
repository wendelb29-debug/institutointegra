import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { ReservationNotificationEmail } from '../_shared/email-templates/reservation-notification.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Z-API Global Fallback (from project config)
const GLOBAL_INSTANCE_ID = '3F0A839B3D4A131C158AA248D27FDCD6';
const GLOBAL_TOKEN = 'A714392518FBCFACC066D258';
const GLOBAL_CLIENT_TOKEN = 'F2bd5df5779e047e489ca72f794289888S';

const SITE_NAME = "Integra Spaces & Minds"
const FROM_DOMAIN = "institutointegra.site"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { record, old_record, type } = await req.json();
    console.log(`Processing ${type} for reservation ${record.id}`);

    // Only notify on status change or specific events
    if (type === 'UPDATE' && record.status === old_record.status) {
      return new Response(JSON.stringify({ message: 'No status change' }), { headers: corsHeaders });
    }

    // Get client and room details
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*, rooms(name), clients(name, phone, email)')
      .eq('id', record.id)
      .single();

    if (resError || !reservation) {
      throw new Error('Reservation not found');
    }

    const clientPhone = reservation.clients?.phone?.replace(/\D/g, '');
    if (!clientPhone) {
      return new Response(JSON.stringify({ message: 'No client phone' }), { headers: corsHeaders });
    }

    let message = '';
    const dateStr = new Date(reservation.date + 'T12:00:00').toLocaleDateString('pt-BR');
    const timeStr = `${reservation.start_time.slice(0, 5)} às ${reservation.end_time.slice(0, 5)}`;

    if (reservation.status === 'confirmada') {
      message = `✅ *Reserva Confirmada!*\n\nOlá ${reservation.clients.name}, sua reserva para a sala *${reservation.rooms.name}* foi confirmada.\n\n📅 Data: ${dateStr}\n🕐 Horário: ${timeStr}\n\nEsperamos por você!`;
    } else if (reservation.status === 'cancelada') {
      message = `❌ *Reserva Cancelada*\n\nOlá ${reservation.clients.name}, sua reserva para a sala *${reservation.rooms.name}* no dia ${dateStr} foi cancelada.\n\nCaso tenha dúvidas, entre em contato conosco.`;
    } else if (type === 'INSERT' && reservation.status === 'pendente') {
      message = `⏳ *Reserva Recebida*\n\nOlá ${reservation.clients.name}, recebemos sua solicitação de reserva para a sala *${reservation.rooms.name}*.\n\n📅 Data: ${dateStr}\n🕐 Horário: ${timeStr}\n\nAguarde a confirmação em breve!`;
    }

    if (message) {
      console.log(`Sending WhatsApp to ${clientPhone}`);
      const zapiRes = await fetch(`https://api.z-api.io/instances/${GLOBAL_INSTANCE_ID}/token/${GLOBAL_TOKEN}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': GLOBAL_CLIENT_TOKEN
        },
        body: JSON.stringify({
          phone: clientPhone,
          message: message
        }),
      });
      
      const zapiData = await zapiRes.json();
      console.log('Z-API Response:', zapiData);
    }

    // Email Notification logic
    if (type === 'INSERT') {
      try {
        console.log('Fetching all users for email notification...');
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('email')
          .not('email', 'is', null);

        if (usersError) throw usersError;

        const recipientEmails = users.map(u => u.email).filter(Boolean);
        console.log(`Sending notification to ${recipientEmails.length} users`);

        const emailHtml = await renderAsync(
          React.createElement(ReservationNotificationEmail, {
            siteName: SITE_NAME,
            clientName: reservation.clients.name,
            roomName: reservation.rooms.name,
            date: dateStr,
            time: timeStr,
            status: reservation.status
          })
        );

        // Call the transactional email sender via Lovable API
        const sendRes = await fetch(Deno.env.get('LOVABLE_SEND_URL')!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
          },
          body: JSON.stringify({
            from: `${SITE_NAME} <notifications@${FROM_DOMAIN}>`,
            to: recipientEmails,
            subject: `⚠️ IMPORTANTE: Nova Reserva - ${reservation.rooms.name}`,
            html: emailHtml,
            // Header hint for "Important" (Some clients honor this)
            headers: {
              'X-Priority': '1 (Highest)',
              'X-MSMail-Priority': 'High',
              'Importance': 'High'
            }
          })
        });

        const sendData = await sendRes.json();
        console.log('Email Send Response:', sendData);
      } catch (emailErr) {
        console.error('Failed to send emails:', emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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