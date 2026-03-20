import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Calculator, Clock, CalendarDays, Building2, ArrowRight } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';

type Room = Database['public']['Tables']['rooms']['Row'];

const timeOptions = [
  { label: '1 hora', value: 'hora', multiplier: 1, field: 'price_hour' as const },
  { label: 'Diária', value: 'diaria', multiplier: 1, field: 'price_day' as const },
  { label: 'Mensal', value: 'mensal', multiplier: 1, field: 'price_month' as const },
];

export function ReservationSimulator() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState('hora');
  const [hours, setHours] = useState(1);

  useEffect(() => {
    supabase.from('rooms').select('*').eq('status', 'disponivel').order('name')
      .then(({ data }) => setRooms(data || []));
  }, []);

  const room = rooms.find(r => r.id === selectedRoom);
  const timeOpt = timeOptions.find(t => t.value === selectedTime)!;

  const getPrice = () => {
    if (!room) return 0;
    if (selectedTime === 'hora') return (Number(room.price_hour) || 0) * hours;
    if (selectedTime === 'diaria') return Number(room.price_day) || 0;
    return Number(room.price_month) || 0;
  };

  const price = getPrice();

  return (
    <section className="section-padding py-24 bg-gradient-to-b from-background to-secondary/40" id="simulador">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-sm font-medium uppercase tracking-widest text-gold mb-3">
              <Calculator className="inline h-4 w-4 mr-1 -mt-0.5" /> Simulador
            </p>
            <h2 className="text-3xl lg:text-4xl text-charcoal mb-3" style={{ lineHeight: '1.1' }}>
              Monte sua experiência
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Escolha a sala e o período para ver o valor em tempo real.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="bg-card rounded-2xl sm:rounded-3xl shadow-xl shadow-foreground/5 border border-border/40 p-5 sm:p-8 md:p-10">
            {/* Room Select */}
            <div className="mb-6 sm:mb-8">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Building2 className="h-4 w-4 text-primary" /> Escolha a sala
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {rooms.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoom(r.id)}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all duration-200 active:scale-[0.97] ${
                      selectedRoom === r.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border/40 hover:border-primary/30'
                    }`}
                  >
                    <span className="text-sm font-medium block truncate">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{r.capacity} pessoa{(r.capacity || 0) > 1 ? 's' : ''}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Select */}
            <div className="mb-6 sm:mb-8">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Clock className="h-4 w-4 text-primary" /> Período
              </label>
              <div className="flex gap-2 sm:gap-3">
                {timeOptions.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setSelectedTime(t.value)}
                    className={`flex-1 py-2.5 sm:py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                      selectedTime === t.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border/40 text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hours slider */}
            {selectedTime === 'hora' && (
              <div className="mb-6 sm:mb-8">
                <label className="flex items-center justify-between text-sm font-semibold text-foreground mb-3">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" /> Quantidade de horas
                  </span>
                  <span className="text-primary tabular-nums">{hours}h</span>
                </label>
                <input
                  type="range" min={1} max={12} value={hours}
                  onChange={e => setHours(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1h</span><span>6h</span><span>12h</span>
                </div>
              </div>
            )}

            {/* Price Display */}
            <div className="bg-gradient-to-r from-primary/8 to-gold/8 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor total estimado</p>
                <p className="text-3xl sm:text-4xl font-display text-charcoal tabular-nums">
                  {price > 0 ? `R$ ${price.toFixed(2)}` : '—'}
                </p>
              </div>
              <Button asChild size="lg" disabled={!room || price === 0} className="gap-2 rounded-xl w-full sm:w-auto">
                <Link to="/reservas">
                  Continuar reserva <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
