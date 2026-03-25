import { ScrollReveal } from "@/components/ScrollReveal";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

const pillars = [
  { icon: Heart, title: "Atendimento humanizado", desc: "Cada pessoa é única. Nosso atendimento é personalizado e acolhedor." },
  { icon: ShieldCheck, title: "Profissionais qualificados", desc: "Equipe com formação sólida e experiência clínica comprovada." },
  { icon: Sparkles, title: "Ambiente acolhedor", desc: "Espaço seguro, confortável e preparado para o seu bem-estar." },
];

export function AboutSection() {
  return (
    <section className="section-padding py-24">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-instituto mb-3">Sobre nós</p>
            <h2 className="text-2xl lg:text-4xl mb-5">Um espaço dedicado ao cuidado emocional</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Instituto Integra nasceu com o propósito de cuidar da saúde emocional de forma acolhedora,
              respeitando a individualidade de cada pessoa.
            </p>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((c, i) => (
            <ScrollReveal key={c.title} delay={i * 100}>
              <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/50 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="p-3 rounded-xl bg-instituto/10 text-instituto w-fit mb-5 group-hover:bg-instituto/20 transition-colors">
                  <c.icon size={24} />
                </div>
                <h3 className="font-sans font-semibold text-lg mb-2">{c.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{c.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
