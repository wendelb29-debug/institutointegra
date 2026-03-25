import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import psychologist from "@/assets/psychologist.jpg";
import psychologist2 from "@/assets/psychologist-2.jpg";
import psychologist3 from "@/assets/psychologist-3.jpg";

const WA_LINK = "https://wa.me/5511999990000?text=Olá! Gostaria de agendar uma consulta no Instituto Integra.";

const professionals = [
  { name: "Dra. Ana Beatriz Silva", specialty: "Psicoterapia Cognitivo-Comportamental", crp: "CRP 06/12345", img: psychologist },
  { name: "Dr. Rafael Oliveira", specialty: "Neuropsicologia e Avaliação", crp: "CRP 06/54321", img: psychologist2 },
  { name: "Dra. Camila Santos", specialty: "Terapia de Casal e Família", crp: "CRP 06/67890", img: psychologist3 },
];

export function ProfessionalsSection() {
  return (
    <section className="section-padding py-24 bg-instituto-light">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-instituto mb-3">Nossa equipe</p>
            <h2 className="text-2xl lg:text-4xl mb-5">Profissionais dedicados ao seu bem-estar</h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-8">
          {professionals.map((p, i) => (
            <ScrollReveal key={p.name} delay={i * 100}>
              <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50 hover:shadow-lg transition-all duration-300 group">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-6">
                  <h3 className="font-sans font-semibold text-lg">{p.name}</h3>
                  <p className="text-instituto text-sm font-medium mb-1">{p.specialty}</p>
                  <p className="text-muted-foreground text-xs mb-4">{p.crp}</p>
                  <Button variant="instituto" size="sm" className="w-full rounded-xl" asChild>
                    <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                      Agendar com este profissional
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
