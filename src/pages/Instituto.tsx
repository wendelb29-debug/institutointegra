import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Heart, ShieldCheck, Brain, MessageCircle, Sparkles, Users } from "lucide-react";
import institutoHero from "@/assets/instituto-hero.jpg";
import psychologist from "@/assets/psychologist.jpg";

const services = [
  { icon: MessageCircle, title: "Psicoterapia Individual", desc: "Sessões personalizadas para autoconhecimento e superação de desafios emocionais." },
  { icon: Users, title: "Terapia de Casal", desc: "Acompanhamento para melhorar a comunicação e fortalecer relacionamentos." },
  { icon: Brain, title: "Avaliação Psicológica", desc: "Instrumentos e técnicas para compreensão aprofundada do funcionamento psíquico." },
];

const benefits = [
  { icon: ShieldCheck, title: "Ambiente seguro", desc: "Sigilo e acolhimento em todas as etapas." },
  { icon: Heart, title: "Autoconhecimento", desc: "Entenda suas emoções e padrões de comportamento." },
  { icon: Sparkles, title: "Qualidade de vida", desc: "Melhore relacionamentos, trabalho e bem-estar." },
];

const Instituto = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end">
        <img
          src={institutoHero}
          alt="Consultório Instituto Integra"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="relative z-10 section-padding pb-16 pt-32 max-w-7xl mx-auto w-full">
          <ScrollReveal>
            <p className="text-sm font-medium uppercase tracking-widest text-instituto-light mb-3">
              Instituto Integra
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-[1.1] text-background max-w-2xl">
              Cuidado com a sua saúde emocional
            </h1>
          </ScrollReveal>
        </div>
      </section>

      {/* About */}
      <section className="section-padding py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <ScrollReveal>
            <div className="rounded-2xl overflow-hidden shadow-xl shadow-foreground/5 max-w-sm">
              <img src={psychologist} alt="Psicóloga do Instituto Integra" className="w-full h-auto object-cover" loading="lazy" />
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="text-sm font-medium uppercase tracking-widest text-instituto mb-3">
              Conheça a profissional
            </p>
            <h2 className="text-2xl lg:text-3xl mb-4">
              Dra. Ana Beatriz Silva
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              CRP 06/12345 — Psicóloga clínica com mais de 10 anos de experiência
              em psicoterapia cognitivo-comportamental. Especialista em ansiedade,
              depressão e gestão emocional.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              "Acredito que o autoconhecimento é o caminho mais poderoso para uma
              vida plena. Meu objetivo é oferecer um espaço seguro onde cada pessoa
              possa se reconectar consigo mesma."
            </p>
            <Button variant="instituto" size="lg" asChild>
              <a href="https://wa.me/5511999990000?text=Olá! Gostaria de agendar uma consulta no Instituto Integra." target="_blank" rel="noopener noreferrer">
                Agendar consulta
              </a>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding py-20 bg-instituto-light">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl lg:text-3xl mb-4 text-center">Tipos de atendimento</h2>
            <p className="text-muted-foreground text-center mb-14 max-w-md mx-auto">
              Oferecemos diferentes modalidades para atender às suas necessidades.
            </p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {services.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 80}>
                <div className="bg-card rounded-2xl p-7 shadow-sm shadow-foreground/5 h-full hover:shadow-md transition-shadow duration-300">
                  <div className="p-3 rounded-xl bg-instituto/10 text-instituto w-fit mb-5">
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

      {/* Benefits */}
      <section className="section-padding py-24">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl lg:text-3xl mb-12 text-center">
              Benefícios do acompanhamento psicológico
            </h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefits.map((b, i) => (
              <ScrollReveal key={b.title} delay={i * 80}>
                <div className="text-center">
                  <div className="mx-auto p-3 rounded-xl bg-instituto/10 text-instituto w-fit mb-4">
                    <b.icon size={24} />
                  </div>
                  <h3 className="font-sans font-semibold mb-2">{b.title}</h3>
                  <p className="text-muted-foreground text-sm">{b.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding py-20 bg-instituto-light">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-2xl lg:text-3xl mb-4">Pronto para dar o primeiro passo?</h2>
            <p className="text-muted-foreground mb-8">
              Agende uma sessão e comece sua jornada de autoconhecimento e bem-estar.
            </p>
            <Button variant="instituto" size="lg" asChild>
              <a href="https://wa.me/5511999990000?text=Olá! Gostaria de agendar uma consulta no Instituto Integra." target="_blank" rel="noopener noreferrer">
                Agendar consulta
              </a>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Instituto;
