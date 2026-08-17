import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Seo } from '@/components/Seo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Users, Clock, Calendar, MapPin, ChevronRight, Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { RoomImage } from '@/components/RoomImage';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

type Room = Database['public']['Tables']['rooms']['Row'];
type Reservation = Database['public']['Tables']['reservations']['Row'];

const typeLabels: Record<string, string> = {
  hora: 'Por Hora',
  diaria: 'Diária',
  mensal: 'Mensal',
};

const ReservasPublicas = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', start_time: '', end_time: '' });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [conflict, setConflict] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from('rooms').select('*').eq('status', 'disponivel').order('name');
      setRooms(data || []);
      setLoading(false);
    };
    fetchRooms();
  }, []);

  // Check availability when date or time changes
  useEffect(() => {
    const checkConflict = async () => {
      if (!selectedRoom || !form.date || !form.start_time || !form.end_time) {
        setConflict(false);
        return;
      }
      
      setAvailabilityLoading(true);
      try {
        // 1. Check reservations
        const { data: reservations } = await supabase
          .from('reservations')
          .select('id')
          .eq('room_id', selectedRoom.id)
          .eq('date', form.date)
          .eq('status', 'confirmada')
          .filter('start_time', 'lt', form.end_time)
          .filter('end_time', 'gt', form.start_time);
        
        // 2. Check room blocks
        const { data: blocks } = await supabase
          .from('room_blocks')
          .select('id')
          .eq('room_id', selectedRoom.id)
          .eq('block_date', form.date)
          .filter('start_time', 'lt', form.end_time)
          .filter('end_time', 'gt', form.start_time);

        // 3. Check full day blocks
        const { data: fullDayBlocks } = await supabase
          .from('room_blocks')
          .select('id')
          .eq('room_id', selectedRoom.id)
          .eq('block_date', form.date)
          .eq('block_type', 'full_day');

        setConflict((reservations?.length || 0) > 0 || (blocks?.length || 0) > 0 || (fullDayBlocks?.length || 0) > 0);
      } catch (err) {
        console.error('Error checking availability:', err);
      } finally {
        setAvailabilityLoading(false);
      }
    };

    const timer = setTimeout(checkConflict, 500);
    return () => clearTimeout(timer);
  }, [selectedRoom, form.date, form.start_time, form.end_time]);

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()));

  const getPrice = (room: Room) => {
    if (Number(room.price_hour) > 0) return `R$ ${Number(room.price_hour).toFixed(2)}/hora`;
    if (Number(room.price_day) > 0) return `R$ ${Number(room.price_day).toFixed(2)}/dia`;
    if (Number(room.price_month) > 0) return `R$ ${Number(room.price_month).toFixed(2)}/mês`;
    return 'Consulte';
  };

  const handleReserve = async () => {
    if (!form.name || !form.email || !form.date || !form.start_time || !form.end_time) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    if (conflict) {
      toast({ title: 'Horário indisponível', description: 'Por favor, escolha outro horário ou sala.', variant: 'destructive' });
      return;
    }

    setAvailabilityLoading(true);
    try {
      // 1. Create a client entry if it doesn't exist or just use details
      // For simplicity, we create a record in reservations directly
      const { data: reservation, error } = await supabase.from('reservations').insert({
        room_id: selectedRoom?.id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        status: 'pendente',
        notes: `Nome: ${form.name}\nEmail: ${form.email}\nFone: ${form.phone}\n(Reserva via Site Publico)`,
        user_id: user?.id || null, // Optional link to auth user
      }).select().single();

      if (error) {
        if (error.code === '23P01') {
          toast({ title: 'Conflito de horário', description: 'Alguém acabou de reservar este horário. Tente outro.', variant: 'destructive' });
          setConflict(true);
        } else {
          throw error;
        }
        return;
      }

      const phone = form.phone.replace(/\D/g, '');
      const message = encodeURIComponent(
        `Olá! Acabei de solicitar a reserva da sala "${selectedRoom?.name}" pelo site.\n\n` +
        `📝 Protocolo: ${reservation.id.slice(0, 8)}\n` +
        `📅 Data: ${format(new Date(form.date + 'T12:00:00'), 'dd/MM/yyyy')}\n` +
        `🕐 Horário: ${form.start_time} às ${form.end_time}\n` +
        `👤 Nome: ${form.name}`
      );

      window.open(`https://wa.me/55${phone ? phone : ''}?text=${message}`, '_blank');
      toast({ title: 'Solicitação enviada!', description: 'Sua reserva está pendente. Finalize pelo WhatsApp.' });
      setSelectedRoom(null);
      setForm({ name: '', email: '', phone: '', date: '', start_time: '', end_time: '' });
    } catch (err: any) {
      toast({ title: 'Erro ao processar reserva', description: err.message, variant: 'destructive' });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  return (
    <Layout>
      <Seo
        title="Reservas de Salas — Integra Coworking"
        description="Consulte a disponibilidade em tempo real e reserve salas do Integra Coworking em Uberlândia-MG."
        path="/reservas"
      />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 section-padding bg-gradient-to-b from-primary/4 to-background">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5 px-3 py-1">
                <MapPin className="h-3 w-3 mr-1" /> Reservas em Tempo Real
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display text-foreground leading-tight">
                Seu espaço, do seu jeito
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                Verifique a disponibilidade e garanta seu horário instantaneamente.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="mt-8 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar salas por nome..." value={filter} onChange={e => setFilter(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-border/60 bg-card shadow-sm" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="pb-24 section-padding">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20"><p className="text-muted-foreground text-lg">Nenhuma sala disponível no momento.</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room, idx) => (
                <ScrollReveal key={room.id} delay={idx * 80}>
                  <Card className="group border-border/40 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                    onClick={() => setSelectedRoom(room)}>
                    <div className="h-48 overflow-hidden relative">
                      {room.image_url ? (
                        <RoomImage src={room.image_url} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                          <Clock className="h-8 w-8 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-background/90 text-foreground backdrop-blur-sm border-none shadow-sm">{typeLabels[room.type]}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-5 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{room.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{room.description || 'Sala equipada para atendimento.'}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className="text-lg font-bold text-primary">{getPrice(room)}</span>
                        <Button size="sm" variant="ghost" className="gap-1 px-0 hover:bg-transparent text-primary">
                          Ver Disponibilidade <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!selectedRoom} onOpenChange={() => { setSelectedRoom(null); setConflict(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Reserva: {selectedRoom?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">{selectedRoom && getPrice(selectedRoom)}</p>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Seu Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
            </div>
            <div className="space-y-2">
              <Label>Data da Reserva</Label>
              <Input type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Início</Label><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
              <div className="space-y-2"><Label>Término</Label><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>

            {availabilityLoading && <p className="text-xs text-center text-muted-foreground animate-pulse">Verificando disponibilidade...</p>}
            {conflict && !availabilityLoading && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>Este horário já está ocupado nesta sala. Por favor, escolha outro.</p>
              </div>
            )}

            <Button onClick={handleReserve} disabled={availabilityLoading || conflict} className="w-full h-11 text-base">
              {availabilityLoading ? 'Processando...' : 'Confirmar Reserva'}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Sua reserva será gravada como pendente e você falará conosco no WhatsApp para finalização.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ReservasPublicas;