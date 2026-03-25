import { ScrollReveal } from "@/components/ScrollReveal";
import { CalendarCheck, UserCheck, Monitor } from "lucide-react";

const steps = [
  { icon: CalendarCheck, num: "01", title: "Agende sua consulta", desc: "Escolha o melhor dia e horário pelo WhatsApp ou formulário online." },
  { icon: UserCheck, num: "02", title: "Escolha o profissional", desc: "Conheça nossa equipe e selecione quem mais se identifica." },
  { icon: Monitor, num: "03", title: "Presencial ou online", desc: "Atendimento flexível — no consultório ou por videochamada." },
];

export function HowItWorksSection() {
  return (
    <section className="section-padding py-24">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-instituto mb-3">Como funciona</p>
            <h2 className="text-2xl lg:text-4xl mb-5">Simples, rápido e acolhedor</h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-instituto/20 via-instituto/40 to-instituto/20" />
          {steps.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 120}>
              <div className="text-center relative">
                <div className="mx-auto w-24 h-24 rounded-full bg-instituto/10 flex items-center justify-center mb-6 relative">
                  <s.icon className="h-8 w-8 text-instituto" />
                  <span className="absolute -top-1 -right-1 bg-instituto text-background text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
                    {s.num}
                  </span>
                </div>
                <h3 className="font-sans font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
