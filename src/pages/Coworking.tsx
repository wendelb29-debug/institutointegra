import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Wifi, Coffee, Monitor, Users, Clock, MapPin } from "lucide-react";
import coworkingHero from "@/assets/coworking-hero.jpg";
import coworkingRoom from "@/assets/coworking-room.jpg";

const plans = [
  {
    name: "Por Hora",
    price: "R$ 25",
    unit: "/hora",
    features: ["Wi-Fi de alta velocidade", "Café e água", "Recepção compartilhada"],
  },
  {
    name: "Diária",
    price: "R$ 89",
    unit: "/dia",
    features: ["Tudo do plano por hora", "Acesso à sala de reunião (1h)", "Armário individual"],
    highlight: true,
  },
  {
    name: "Mensal",
    price: "R$ 890",
    unit: "/mês",
    features: ["Acesso ilimitado", "Endereço comercial", "Sala de reunião (4h/mês)", "Desconto em eventos"],
  },
];

const benefits = [
  { icon: Wifi, label: "Internet de alta velocidade" },
  { icon: Coffee, label: "Café e copa equipada" },
  { icon: Monitor, label: "Salas com monitor e projetor" },
  { icon: Users, label: "Networking com outros profissionais" },
  { icon: Clock, label: "Horários flexíveis" },
  { icon: MapPin, label: "Localização privilegiada" },
];

const Coworking = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end">
        <img
          src={coworkingHero}
          alt="Espaço de coworking Integra"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="relative z-10 section-padding pb-16 pt-32 max-w-7xl mx-auto w-full">
          <ScrollReveal>
            <p className="text-sm font-medium uppercase tracking-widest text-coworking-light mb-3">
              Integra Coworking
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-[1.1] text-background max-w-2xl">
              Seu espaço de trabalho ideal
            </h1>
          </ScrollReveal>
        </div>
      </section>

      {/* Intro */}
      <section className="section-padding py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <ScrollReveal>
            <h2 className="text-2xl lg:text-3xl mb-4">
              Trabalhe com infraestrutura profissional, sem burocracia
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              O Integra Coworking oferece salas privativas e espaços compartilhados
              com toda a infraestrutura que você precisa. Ideal para profissionais
              autônomos, startups e equipes que buscam flexibilidade e um ambiente
              inspirador.
            </p>
            <Button variant="coworking" size="lg" asChild>
              <a href="https://wa.me/5511999990000?text=Olá! Gostaria de reservar uma sala no Integra Coworking." target="_blank" rel="noopener noreferrer">
                Reservar sala
              </a>
            </Button>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="rounded-2xl overflow-hidden shadow-xl shadow-foreground/5">
              <img src={coworkingRoom} alt="Sala de reunião Integra" className="w-full h-auto object-cover" loading="lazy" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding py-20 bg-coworking-light">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl lg:text-3xl mb-12 text-center">O que oferecemos</h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <ScrollReveal key={b.label} delay={i * 70}>
                <div className="flex items-start gap-4 p-5 bg-card rounded-xl shadow-sm shadow-foreground/5">
                  <div className="p-2.5 rounded-lg bg-coworking/10 text-coworking shrink-0">
                    <b.icon size={20} />
                  </div>
                  <span className="font-medium text-sm">{b.label}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding py-24">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl lg:text-3xl mb-4 text-center">Planos flexíveis</h2>
            <p className="text-muted-foreground text-center mb-14 max-w-md mx-auto">
              Escolha o formato que melhor se encaixa na sua rotina.
            </p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 80}>
                <div
                  className={`rounded-2xl p-7 flex flex-col h-full transition-shadow duration-300 hover:shadow-lg ${
                    plan.highlight
                      ? "bg-coworking text-primary-foreground shadow-lg shadow-coworking/20 ring-2 ring-coworking"
                      : "bg-card shadow-sm shadow-foreground/5 ring-1 ring-border"
                  }`}
                >
                  <h3 className="font-sans font-semibold text-lg mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-display">{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.unit}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className={`text-sm flex items-start gap-2 ${plan.highlight ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                        <span className="mt-0.5">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.highlight ? "secondary" : "coworking"}
                    className="w-full"
                    asChild
                  >
                    <a href="https://wa.me/5511999990000?text=Olá! Tenho interesse no plano {plan.name} do Integra Coworking." target="_blank" rel="noopener noreferrer">
                      Reservar
                    </a>
                  </Button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Coworking;
