import { ScrollReveal } from "@/components/ScrollReveal";
import { Brain, AlertCircle, HeartCrack, Frown, Zap } from "lucide-react";

const painPoints = [
  { icon: Brain, label: "Dificuldade de concentração" },
  { icon: AlertCircle, label: "Ansiedade constante" },
  { icon: Zap, label: "Problemas de memória" },
  { icon: HeartCrack, label: "Dificuldade emocional" },
  { icon: Frown, label: "Sobrecarga mental" },
];

export function PainPointsSection() {
  return (
    <section className="section-padding py-20 bg-instituto-light">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-2xl lg:text-4xl mb-10">Você está passando por isso?</h2>
        </ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
          {painPoints.map((p, i) => (
            <ScrollReveal key={p.label} delay={i * 80}>
              <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="p-3 rounded-xl bg-instituto/10 text-instituto">
                  <p.icon size={24} />
                </div>
                <p className="text-sm font-medium text-foreground text-center">{p.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={400}>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            Você não precisa enfrentar isso sozinho. <span className="text-instituto font-semibold">Podemos te ajudar.</span>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
