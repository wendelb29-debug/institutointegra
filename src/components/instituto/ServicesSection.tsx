import { ScrollReveal } from "@/components/ScrollReveal";
import { MessageCircle, Users, Baby, Brain } from "lucide-react";

const services = [
  { icon: MessageCircle, title: "Psicoterapia Individual", desc: "Sessões individuais para autoconhecimento, superação de desafios e desenvolvimento pessoal." },
  { icon: Users, title: "Terapia de Casal", desc: "Melhore a comunicação, resolva conflitos e fortaleça seu relacionamento." },
  { icon: Baby, title: "Atendimento Infantil", desc: "Cuidado especializado para crianças, respeitando cada fase do desenvolvimento." },
  { icon: Brain, title: "Avaliação Psicológica", desc: "Instrumentos e técnicas para compreensão aprofundada do funcionamento psíquico." },
];

export function ServicesSection() {
  return (
    <section className="section-padding py-24 bg-instituto-light">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-instituto mb-3">Serviços</p>
            <h2 className="text-2xl lg:text-4xl mb-5">Como podemos ajudar você</h2>
            <p className="text-muted-foreground">Oferecemos diferentes modalidades de atendimento para acolher suas necessidades.</p>
          </div>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 80}>
              <div className="bg-card rounded-2xl p-7 shadow-sm border border-border/50 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                <div className="p-3 rounded-xl bg-instituto/10 text-instituto w-fit mb-5 group-hover:bg-instituto group-hover:text-background transition-colors duration-300">
                  <s.icon size={22} />
                </div>
                <h3 className="font-sans font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
