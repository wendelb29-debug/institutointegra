import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type Room = Database['public']['Tables']['rooms']['Row'];

const statusColors: Record<string, string> = {
  disponivel: '#3E5B4F',
  ocupada: '#C2503D',
  manutencao: '#C2A66D',
};
const statusLabels: Record<string, string> = {
  disponivel: 'Disponível',
  ocupada: 'Ocupada',
  manutencao: 'Manutenção',
};

// Grid positions for up to 8 rooms on a stylized floor plan
const positions = [
  { x: 30, y: 40, w: 130, h: 100 },
  { x: 180, y: 40, w: 130, h: 100 },
  { x: 330, y: 40, w: 130, h: 100 },
  { x: 480, y: 40, w: 130, h: 100 },
  { x: 30, y: 170, w: 130, h: 100 },
  { x: 180, y: 170, w: 130, h: 100 },
  { x: 330, y: 170, w: 190, h: 100 },
  { x: 540, y: 170, w: 70, h: 100 },
];

export function FloorMap() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selected, setSelected] = useState<Room | null>(null);

  useEffect(() => {
    supabase.from('rooms').select('*').order('name')
      .then(({ data }) => setRooms(data || []));
  }, []);

  return (
    <section className="section-padding py-24 bg-secondary/30" id="mapa">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-sm font-medium uppercase tracking-widest text-gold mb-3">
              Mapa interativo
            </p>
            <h2 className="text-3xl lg:text-4xl text-charcoal mb-3" style={{ lineHeight: '1.1' }}>
              Conheça nossos espaços
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Clique em uma sala para ver detalhes e reservar.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="relative bg-card rounded-3xl shadow-lg border border-border/40 p-6 overflow-hidden">
            {/* Legend */}
            <div className="flex gap-5 mb-4 text-sm">
              {Object.entries(statusLabels).map(([key, label]) => (
                <span key={key} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusColors[key] }} />
                  {label}
                </span>
              ))}
            </div>

            {/* SVG Floor Plan */}
            <svg viewBox="0 0 640 310" className="w-full h-auto" style={{ maxHeight: 360 }}>
              {/* Background */}
              <rect x="10" y="20" width="620" height="275" rx="16" fill="hsl(30 30% 97%)" stroke="hsl(30 16% 88%)" strokeWidth="2" />
              {/* Corridor */}
              <rect x="10" y="145" width="620" height="20" fill="hsl(30 16% 93%)" />
              <text x="320" y="159" textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="9" fontFamily="DM Sans">Corredor</text>

              {rooms.slice(0, 8).map((room, i) => {
                const pos = positions[i];
                if (!pos) return null;
                const color = statusColors[room.status] || statusColors.disponivel;
                const isSelected = selected?.id === room.id;
                return (
                  <g key={room.id}
                    onClick={() => setSelected(isSelected ? null : room)}
                    className="cursor-pointer"
                    style={{ transition: 'transform 0.2s' }}
                  >
                    <rect
                      x={pos.x} y={pos.y} width={pos.w} height={pos.h}
                      rx="10" fill={color} fillOpacity={isSelected ? 0.25 : 0.12}
                      stroke={color} strokeWidth={isSelected ? 2.5 : 1.5}
                      style={{ transition: 'all 0.3s' }}
                    />
                    <text
                      x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 - 6}
                      textAnchor="middle" fill="hsl(0 0% 11%)"
                      fontSize="11" fontWeight="600" fontFamily="DM Sans"
                    >
                      {room.name.length > 14 ? room.name.slice(0, 14) + '…' : room.name}
                    </text>
                    <text
                      x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 + 10}
                      textAnchor="middle" fill="hsl(0 0% 40%)"
                      fontSize="9" fontFamily="DM Sans"
                    >
                      {room.capacity} pessoa{(room.capacity || 0) > 1 ? 's' : ''}
                    </text>
                    {/* Status dot */}
                    <circle cx={pos.x + pos.w - 12} cy={pos.y + 14} r="5" fill={color} />
                  </g>
                );
              })}
            </svg>

            {/* Detail Panel */}
            {selected && (
              <div className="absolute bottom-6 left-6 right-6 bg-card/95 backdrop-blur-sm rounded-2xl border border-border/60 shadow-xl p-6 flex items-center justify-between gap-4"
                style={{ animation: 'reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {selected.capacity} pessoa{(selected.capacity || 0) > 1 ? 's' : ''}</span>
                    <span className="h-3 w-px bg-border" />
                    <span style={{ color: statusColors[selected.status] }}>{statusLabels[selected.status]}</span>
                    {Number(selected.price_hour) > 0 && <><span className="h-3 w-px bg-border" /> R$ {Number(selected.price_hour).toFixed(2)}/hora</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status === 'disponivel' && (
                    <Button asChild size="sm" className="gap-1.5 rounded-xl">
                      <Link to="/reservas">Reservar</Link>
                    </Button>
                  )}
                  <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
