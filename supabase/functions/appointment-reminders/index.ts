import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Fetch appointments for tomorrow that haven't had reminders sent
    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select('*, patients(name, phone)')
      .eq('appointment_date', tomorrowStr)
      .eq('reminder_sent', false)
      .in('status', ['agendado', 'confirmado']);

    if (fetchError) throw fetchError;
    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum lembrete para enviar', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sentCount = 0;

    for (const appt of appointments) {
      // Get psychologist's WhatsApp config
      const { data: config } = await supabase
        .from('psychologist_whatsapp_config')
        .select('*')
        .eq('psychologist_id', appt.psychologist_id)
        .single();

      if (!config || !config.is_connected) continue;

      const patient = appt.patients as { name: string; phone: string };
      if (!patient?.phone) continue;

      const message = `Olá ${patient.name}, lembrando da sua consulta amanhã às ${appt.start_time.slice(0, 5)}. Confirma presença? Responda SIM ou NÃO. Instituto Integra.`;

      const baseUrl = `https://api.z-api.io/instances/${config.instance_id}/token/${config.token}`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.client_token) headers['Client-Token'] = config.client_token;

      try {
        const res = await fetch(`${baseUrl}/send-text`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ phone: patient.phone, message }),
        });

        if (res.ok) {
          await supabase.from('appointments').update({ reminder_sent: true }).eq('id', appt.id);
          sentCount++;
        }
      } catch (e) {
        console.error(`Failed to send reminder for appointment ${appt.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ message: `${sentCount} lembretes enviados`, count: sentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Reminder cron error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
