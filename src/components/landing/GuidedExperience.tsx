import { useState } from 'react';
import { Stethoscope, Users, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

interface GuidedExperienceProps {
  onSelect: (filter: string) => void;
}

const options = [
  {
    id: 'clinico',
    icon: Stethoscope,
    title: 'Atendimento Clínico',
    desc: 'Consultórios equipados para psicólogos, terapeutas e profissionais da saúde.',
    filter: 'hora',
    color: 'hsl(var(--instituto))',
    bg: 'bg-instituto/10',
  },
  {
    id: 'reuniao',
    icon: Users,
    title: 'Reunião Profissional',
    desc: 'Salas amplas com monitor, projetor e infraestrutura para encontros de negócios.',
    filter: 'diaria',
    color: 'hsl(var(--coworking))',
    bg: 'bg-coworking/10',
  },
  {
    id: 'rapido',
    icon: Zap,
    title: 'Atendimento Rápido',
    desc: 'Espaços por hora para consultas pontuais, mentorias e sessões breves.',
    filter: 'hora',
    color: 'hsl(var(--gold))',
    bg: 'bg-gold/10',
  },
];

export function GuidedExperience({ onSelect }: GuidedExperienceProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="section-padding py-24 bg-card" id="experiencia">
      <div className="max-w-5xl mx-auto text-center">
        <ScrollReveal>
          <p className="text-sm font-medium uppercase tracking-widest text-gold mb-3">
            Experiência personalizada
          </p>
          <h2 className="text-3xl lg:text-4xl mb-3 text-charcoal" style={{ lineHeight: '1.1' }}>
            Qual experiência você busca hoje?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-12">
            Selecione abaixo e mostraremos os espaços ideais para você.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {options.map((opt, i) => {
            const isSelected = selected === opt.id;
            return (
              <ScrollReveal key={opt.id} delay={i * 80}>
                <button
                  onClick={() => {
                    setSelected(opt.id);
                    onSelect(opt.filter);
                  }}
                  className={`group w-full text-left p-7 rounded-2xl border-2 transition-all duration-300 active:scale-[0.97] ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                      : 'border-border/50 bg-card hover:border-primary/30 hover:shadow-md shadow-sm'
                  }`}
                >
                  <div className={`h-12 w-12 rounded-xl ${opt.bg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                    <opt.icon className="h-5 w-5" style={{ color: opt.color }} />
                  </div>
                  <h3 className="font-sans font-semibold text-lg text-foreground mb-2">{opt.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{opt.desc}</p>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium mt-4 transition-all duration-300 ${
                    isSelected ? 'text-primary gap-2.5' : 'text-muted-foreground group-hover:text-primary group-hover:gap-2.5'
                  }`}>
                    {isSelected ? 'Selecionado' : 'Selecionar'} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
