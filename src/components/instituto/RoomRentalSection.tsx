import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Clock, CheckCircle2, ArrowRight, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { RoomImage } from '@/components/RoomImage';

type Room = Database["public"]["Tables"]["rooms"]["Row"];

const benefits = [
  "Ambiente profissional e acolhedor",
  "Estrutura completa para atendimento",
  "Flexibilidade de horários",
  "Localização privilegiada",
];

export function RoomRentalSection() {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    supabase
      .from("rooms")
      .select("*")
      .eq("status", "disponivel")
      .order("name")
      .limit(3)
      .then(({ data }) => setRooms(data || []));
  }, []);

  return (
    <section className="section-padding py-24 bg-secondary/30 border-t border-border/30">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
            {/* Left - Info */}
            <div className="lg:w-2/5 shrink-0">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary bg-primary/8 px-3 py-1.5 rounded-full mb-4">
                <Building2 className="h-3.5 w-3.5" /> Para profissionais
              </span>
              <h2 className="text-2xl lg:text-3xl mb-4">Espaços profissionais para atendimento</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Se você é psicólogo ou profissional da saúde, conheça nossas salas preparadas para atendimento clínico com infraestrutura completa.
              </p>
              <ul className="space-y-3 mb-8">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button asChild className="rounded-xl gap-2">
                <Link to="/coworking">
                  Quero conhecer as salas <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right - Room cards */}
            <div className="lg:w-3/5 w-full">
              {rooms.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  {rooms.slice(0, 4).map((room, i) => (
                    <ScrollReveal key={room.id} delay={i * 80}>
                      <Link to="/reservas">
                        <Card className="group border-border/40 hover:shadow-lg transition-all duration-300 overflow-hidden">
                          {room.image_url ? (
                            <div className="h-36 overflow-hidden">
                              <RoomImage src={room.image_url} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            </div>
                          ) : (
                            <div className="h-36 bg-gradient-to-br from-primary/8 to-gold/6 flex items-center justify-center">
                              <Clock className="h-8 w-8 text-primary/40" />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{room.name}</h3>
                            {room.capacity && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Users className="h-3 w-3" /> {room.capacity} pessoa{room.capacity > 1 ? "s" : ""}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </ScrollReveal>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-2xl p-12 text-center border border-border/50">
                  <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Salas disponíveis em breve.</p>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
