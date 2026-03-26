import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, MessageCircle, Send, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  patients?: { name: string; phone: string };
}

interface AppointmentQuickViewProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  userId?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  agendado: { label: 'Pendente', color: 'bg-amber-500/15 text-amber-700 border-amber-200', icon: Clock },
  confirmado: { label: 'Confirmado', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'bg-red-500/15 text-red-700 border-red-200', icon: XCircle },
  realizado: { label: 'Realizado', color: 'bg-blue-500/15 text-blue-700 border-blue-200', icon: CheckCircle2 },
};

export const AppointmentQuickView = ({ appointment, open, onOpenChange, onStatusChange, userId }: AppointmentQuickViewProps) => {
  if (!appointment) return null;

  const cfg = statusConfig[appointment.status] || statusConfig.agendado;
  const patientName = appointment.patients?.name || 'Paciente';
  const patientPhone = appointment.patients?.phone || '';

  const sendWhatsApp = async (message: string) => {
    if (!patientPhone || !userId) return;
    try {
      const { data: config } = await supabase
        .from('psychologist_whatsapp_config')
        .select('*')
        .eq('psychologist_id', userId)
        .single();
      if (!config) {
        toast({ title: 'WhatsApp não configurado', description: 'Configure sua instância Z-API na aba WhatsApp.', variant: 'destructive' });
        return;
      }
      await supabase.functions.invoke('zapi-proxy', {
        body: {
          action: 'send',
          phone: patientPhone,
          message,
          instanceId: config.instance_id,
          token: config.token,
          clientToken: config.client_token,
        }
      });
      toast({ title: 'Enviado!', description: 'Mensagem enviada via WhatsApp.' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao enviar mensagem.', variant: 'destructive' });
    }
  };

  const confirmMsg = `Olá ${patientName}! Estamos confirmando sua consulta do dia ${appointment.appointment_date} às ${appointment.start_time}. Poderia nos confirmar sua presença? Instituto Integra.`;
  const reminderMsg = `Olá ${patientName}! Lembrete: você tem uma consulta agendada amanhã às ${appointment.start_time}. Qualquer dúvida estamos à disposição. Instituto Integra.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{patientName}</span>
            <Badge variant="outline" className={`text-xs ${cfg.color}`}>
              <cfg.icon className="h-3 w-3 mr-1" />
              {cfg.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Horário</p>
              <p className="font-medium">{appointment.start_time} - {appointment.end_time}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Data</p>
              <p className="font-medium">{appointment.appointment_date}</p>
            </div>
          </div>
          {patientPhone && (
            <div className="text-sm">
              <p className="text-muted-foreground text-xs">Telefone</p>
              <p className="font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> {patientPhone}</p>
            </div>
          )}
          {appointment.notes && (
            <div className="text-sm">
              <p className="text-muted-foreground text-xs">Observações</p>
              <p className="text-sm">{appointment.notes}</p>
            </div>
          )}

          {/* Status actions */}
          <div className="flex gap-2">
            {appointment.status !== 'confirmado' && (
              <Button size="sm" className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { onStatusChange(appointment.id, 'confirmado'); onOpenChange(false); }}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar
              </Button>
            )}
            {appointment.status !== 'cancelado' && (
              <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => { onStatusChange(appointment.id, 'cancelado'); onOpenChange(false); }}>
                <XCircle className="h-3.5 w-3.5" /> Cancelar
              </Button>
            )}
            {appointment.status !== 'realizado' && (
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { onStatusChange(appointment.id, 'realizado'); onOpenChange(false); }}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Realizado
              </Button>
            )}
          </div>

          {/* WhatsApp actions */}
          {patientPhone && (
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">WhatsApp</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => sendWhatsApp(confirmMsg)}>
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> Confirmar via WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => sendWhatsApp(reminderMsg)}>
                  <Send className="h-3.5 w-3.5 text-blue-600" /> Lembrar Paciente
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
