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
import { Users, Clock, Calendar, MapPin, ChevronRight, Search, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Room = Database['public']['Tables']['rooms']['Row'];

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
  const { toast } = useToast();

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from('rooms').select('*').eq('status', 'disponivel').order('name');
      setRooms(data || []);
      setLoading(false);
    };
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()));

  const getPrice = (room: Room) => {
    if (Number(room.price_hour) > 0) return `R$ ${Number(room.price_hour).toFixed(2)}/hora`;
    if (Number(room.price_day) > 0) return `R$ ${Number(room.price_day).toFixed(2)}/dia`;
    if (Number(room.price_month) > 0) return `R$ ${Number(room.price_month).toFixed(2)}/mês`;
    return 'Consulte';
  };

  const handleReserve = () => {
    if (!form.name || !form.email || !form.date || !form.start_time || !form.end_time) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    const phone = form.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá! Gostaria de reservar a sala "${selectedRoom?.name}".\n\n` +
      `📅 Data: ${form.date}\n🕐 Horário: ${form.start_time} às ${form.end_time}\n` +
      `👤 Nome: ${form.name}\n📧 E-mail: ${form.email}\n📱 Telefone: ${form.phone}`
    );
    window.open(`https://wa.me/55${phone ? phone : ''}?text=${message}`, '_blank');
    toast({ title: 'Redirecionando para WhatsApp!', description: 'Complete sua reserva pelo WhatsApp.' });
    setSelectedRoom(null);
    setForm({ name: '', email: '', phone: '', date: '', start_time: '', end_time: '' });
  };

  return (
    <Layout>
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 section-padding bg-gradient-to-b from-primary/4 to-background">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5 px-3 py-1">
                <MapPin className="h-3 w-3 mr-1" /> Reservas Online
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display text-foreground leading-tight" style={{ lineHeight: '1.1' }}>
                Encontre o espaço perfeito para trabalhar
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-lg" style={{ textWrap: 'pretty' }}>
                Salas modernas e equipadas para reuniões, consultas e trabalho. Reserve agora de forma rápida e prática.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="mt-8 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar salas..." value={filter} onChange={e => setFilter(e.target.value)}
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
                <Card key={i} className="animate-pulse border-border/40">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-5 space-y-3"><div className="h-5 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-1/2" /></CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20"><p className="text-muted-foreground text-lg">Nenhuma sala disponível no momento.</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room, idx) => (
                <ScrollReveal key={room.id} delay={idx * 80}>
                  <Card className="group border-border/40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_0_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedRoom(room)}>
                    {/* Room image */}
                    {room.image_url ? (
                      <div className="h-48 overflow-hidden">
                        <img src={room.image_url} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-primary/8 via-primary/4 to-accent/6 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_60%)]" />
                        <div className="text-center z-10">
                          <div className="h-14 w-14 rounded-2xl bg-card/90 shadow-sm flex items-center justify-center mx-auto mb-2">
                            <Clock className="h-6 w-6 text-primary" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">{typeLabels[room.type]}</span>
                        </div>
                      </div>
                    )}
                    <CardContent className="p-5 space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg leading-snug group-hover:text-primary transition-colors">{room.name}</h3>
                        {room.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{room.description}</p>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{room.capacity} pessoa{room.capacity !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className="text-lg font-semibold text-foreground tabular-nums">{getPrice(room)}</span>
                        <span className="text-xs text-primary font-medium flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                          Reservar <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Reservar {selectedRoom?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedRoom && getPrice(selectedRoom)} · {selectedRoom?.capacity} pessoa{selectedRoom?.capacity !== 1 ? 's' : ''}
            </p>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Nome completo</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Data</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Horário início</Label><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
              <div className="space-y-2"><Label>Horário fim</Label><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
            <Button onClick={handleReserve} className="w-full h-11 text-base mt-2">Reservar via WhatsApp</Button>
            <p className="text-xs text-center text-muted-foreground">Você será redirecionado ao WhatsApp para confirmar a reserva</p>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ReservasPublicas;
