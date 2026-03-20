import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/ScrollReveal';
import { GuidedExperience } from '@/components/landing/GuidedExperience';
import { ReservationSimulator } from '@/components/landing/ReservationSimulator';
import { FloorMap } from '@/components/landing/FloorMap';
import { SocialProof } from '@/components/landing/SocialProof';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowRight, Users, Clock, ChevronRight, ImageIcon, Sparkles,
} from 'lucide-react';
import logoIntegra from '@/assets/logo_integra.png';
import type { Database } from '@/integrations/supabase/types';

type Room = Database['public']['Tables']['rooms']['Row'];

const typeLabels: Record<string, string> = { hora: 'Por Hora', diaria: 'Diária', mensal: 'Mensal' };

const getPrice = (room: Room) => {
  if (Number(room.price_hour) > 0) return `R$ ${Number(room.price_hour).toFixed(2)}/hora`;
  if (Number(room.price_day) > 0) return `R$ ${Number(room.price_day).toFixed(2)}/dia`;
  if (Number(room.price_month) > 0) return `R$ ${Number(room.price_month).toFixed(2)}/mês`;
  return 'Consulte';
};

const Index = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    supabase.from('rooms').select('*').eq('status', 'disponivel').order('name')
      .then(({ data }) => setRooms(data || []));
  }, []);

  const filteredRooms = filter
    ? rooms.filter(r => r.type === filter)
    : rooms;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      {/* HERO — Premium with subtle animated gradient */}
      <section className="relative min-h-[85vh] sm:min-h-[92vh] flex items-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/50 to-surface-warm" />
        <div className="absolute top-0 right-0 w-[60vw] sm:w-[50vw] h-[60vw] sm:h-[50vw] rounded-full bg-gradient-to-bl from-primary/4 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50vw] sm:w-[40vw] h-[50vw] sm:h-[40vw] rounded-full bg-gradient-to-tr from-gold/6 to-transparent blur-3xl" />

        {/* Subtle floating shapes — hidden on small screens */}
        <div className="hidden sm:block absolute top-[20%] right-[15%] w-24 h-24 rounded-2xl border border-primary/10 rotate-12"
          style={{ animation: 'float 6s ease-in-out infinite' }} />
        <div className="hidden sm:block absolute bottom-[25%] left-[10%] w-16 h-16 rounded-full border border-gold/15"
          style={{ animation: 'float 8s ease-in-out infinite reverse' }} />

        <div className="relative z-10 section-padding w-full">
          <div className="max-w-7xl mx-auto py-12 sm:py-20">
            <div className="max-w-3xl">
              <div className="reveal">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-gold bg-gold/8 px-3 sm:px-4 py-1.5 rounded-full mb-6 sm:mb-8">
                  <Sparkles className="h-3.5 w-3.5" /> Espaços premium para profissionais
                </span>
              </div>
              <h1
                className="text-3xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] tracking-tight mb-5 sm:mb-6 text-charcoal reveal reveal-delay-1"
                style={{ lineHeight: '1.08' }}
              >
                Um espaço para profissionais que valorizam{' '}
                <span className="text-primary">experiência</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mb-8 sm:mb-10 reveal reveal-delay-2" style={{ textWrap: 'pretty' }}>
                Consultórios, salas de reunião e espaços de coworking com design sofisticado, infraestrutura completa e
                localização privilegiada.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 reveal reveal-delay-3">
                <Button size="lg" className="gap-2 rounded-xl text-base px-6 sm:px-8 py-5 sm:py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25" onClick={() => scrollTo('experiencia')}>
                  Explorar Espaços <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="gap-2 rounded-xl text-base px-6 sm:px-8 py-5 sm:py-6" onClick={() => scrollTo('simulador')}>
                  Simular Reserva
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof — Numbers */}
      <SocialProof />

      {/* Guided Experience */}
      <GuidedExperience onSelect={(f) => {
        setFilter(f);
        setTimeout(() => scrollTo('salas'), 300);
      }} />

      {/* Rooms Display — Interactive cards */}
      <section className="section-padding py-24 bg-background" id="salas">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-gold mb-3">
                  Nossos espaços
                </p>
                <h2 className="text-3xl lg:text-4xl text-charcoal" style={{ lineHeight: '1.1' }}>
                  {filter ? `Salas recomendadas` : 'Todos os espaços'}
                </h2>
              </div>
              {filter && (
                <button onClick={() => setFilter('')} className="text-sm text-primary hover:underline underline-offset-4">
                  Ver todas
                </button>
              )}
            </div>
          </ScrollReveal>

          {filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Nenhuma sala disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room, idx) => (
                <ScrollReveal key={room.id} delay={idx * 70}>
                  <Link to="/reservas">
                    <Card className="group border-border/40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_0_rgba(0,0,0,0.1)] transition-all duration-500 cursor-pointer overflow-hidden active:scale-[0.98]">
                      {room.image_url ? (
                        <div className="h-52 overflow-hidden">
                          <img src={room.image_url} alt={room.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      ) : (
                        <div className="h-52 bg-gradient-to-br from-primary/8 via-primary/3 to-gold/6 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_60%)]" />
                          <div className="text-center z-10">
                            <div className="h-14 w-14 rounded-2xl bg-card/90 shadow-sm flex items-center justify-center mx-auto mb-2">
                              <Clock className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">{typeLabels[room.type]}</span>
                          </div>
                        </div>
                      )}
                      <CardContent className="p-6 space-y-3">
                        <div>
                          <h3 className="font-semibold text-foreground text-lg leading-snug group-hover:text-primary transition-colors duration-300">
                            {room.name}
                          </h3>
                          {room.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{room.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {room.capacity} pessoa{(room.capacity || 0) > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border/30">
                          <span className="text-lg font-semibold text-foreground tabular-nums">{getPrice(room)}</span>
                          <span className="text-xs text-primary font-medium flex items-center gap-0.5 group-hover:gap-2 transition-all duration-300">
                            Reservar <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reservation Simulator */}
      <ReservationSimulator />

      {/* Floor Map */}
      <FloorMap />

      {/* CTA Final */}
      <section className="section-padding py-24 bg-gradient-to-b from-background to-secondary/50">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl lg:text-4xl text-charcoal mb-4" style={{ lineHeight: '1.1' }}>
              Pronto para elevar sua experiência profissional?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Reserve seu espaço agora ou entre em contato para uma visita ao nosso hub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2 rounded-xl text-base px-8 py-6 shadow-lg shadow-primary/20">
                <Link to="/reservas">
                  Reservar Agora <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 rounded-xl text-base px-8 py-6">
                <Link to="/contato">
                  Fale Conosco
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
