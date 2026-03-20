import { ScrollReveal } from '@/components/ScrollReveal';
import { AnimatedCounter } from './AnimatedCounter';
import { Building2, Users, CalendarCheck, Star } from 'lucide-react';

const stats = [
  { icon: CalendarCheck, value: 847, suffix: '+', label: 'Reservas realizadas' },
  { icon: Users, value: 124, suffix: '+', label: 'Profissionais ativos' },
  { icon: Building2, value: 12, suffix: '', label: 'Espaços disponíveis' },
  { icon: Star, value: 98, suffix: '%', label: 'Satisfação dos clientes' },
];

export function SocialProof() {
  return (
    <section className="section-padding py-20 bg-card border-y border-border/30">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 80}>
              <div className="text-center group">
                <div className="h-12 w-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/12 transition-colors duration-300">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-display text-charcoal mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
