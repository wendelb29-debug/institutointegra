import { ScrollReveal } from "@/components/ScrollReveal";
import { Brain, MessageCircle, Users, Baby } from "lucide-react";

const services = [
  { icon: Brain, title: "Neuropsicologia", desc: "Avaliação e reabilitação das funções cognitivas como memória, atenção e raciocínio.", highlight: true },
  { icon: MessageCircle, title: "Psicoterapia", desc: "Sessões individuais para autoconhecimento, superação de desafios e desenvolvimento pessoal.", highlight: false },
  { icon: Brain, title: "Avaliação Neuropsicológica", desc: "Instrumentos especializados para compreensão do funcionamento cognitivo e emocional.", highlight: false },
  { icon: Baby, title: "Terapia Infantil", desc: "Cuidado especializado para crianças, respeitando cada fase do desenvolvimento.", highlight: false },
];

export function ServicesSection() {
  return (
    <section className="section-padding py-24 bg-instituto-light">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-instituto mb-3">Serviços</p>
            <h2 className="text-2xl lg:text-4xl mb-5">Como podemos ajudar você</h2>
            <p className="text-muted-foreground">Oferecemos atendimento especializado em neuropsicologia e saúde mental.</p>
          </div>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 80}>
              <div className={`rounded-2xl p-7 shadow-sm border h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer ${
                s.highlight
                  ? "bg-instituto text-background border-instituto ring-2 ring-instituto/30"
                  : "bg-card border-border/50"
              }`}>
                <div className={`p-3 rounded-xl w-fit mb-5 transition-colors duration-300 ${
                  s.highlight
                    ? "bg-background/20 text-background"
                    : "bg-instituto/10 text-instituto group-hover:bg-instituto group-hover:text-background"
                }`}>
                  <s.icon size={22} />
                </div>
                <h3 className="font-sans font-semibold text-lg mb-2">{s.title}</h3>
                <p className={`text-sm leading-relaxed ${s.highlight ? "text-background/80" : "text-muted-foreground"}`}>{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
