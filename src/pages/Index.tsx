import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Briefcase, Heart, ArrowRight } from "lucide-react";
import coworkingImg from "@/assets/coworking-hero.jpg";
import institutoImg from "@/assets/instituto-hero.jpg";

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="min-h-[90vh] flex items-center section-padding">
        <div className="max-w-7xl mx-auto w-full py-20">
          <div className="max-w-3xl">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight mb-6 reveal"
            >
              Conectando trabalho, desenvolvimento e bem-estar
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-10 reveal reveal-delay-1">
              A Integra reúne espaços de coworking profissionais e atendimento
              psicológico especializado — tudo o que você precisa para crescer
              com equilíbrio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 reveal reveal-delay-2">
              <Button variant="hero-coworking" asChild>
                <Link to="/coworking">
                  <Briefcase size={18} />
                  Quero um espaço para trabalhar
                </Link>
              </Button>
              <Button variant="hero-instituto" asChild>
                <Link to="/instituto">
                  <Heart size={18} />
                  Quero cuidar da minha saúde emocional
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Two Services */}
      <section className="section-padding py-24 bg-secondary/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          <ScrollReveal>
            <Link to="/coworking" className="group block">
              <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-6">
                <img
                  src={coworkingImg}
                  alt="Espaço de coworking moderno da Integra"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/5 transition-colors duration-500" />
              </div>
              <h2 className="text-2xl lg:text-3xl mb-2 group-hover:text-coworking transition-colors">
                Integra Coworking
              </h2>
              <p className="text-muted-foreground mb-4">
                Salas privativas, espaços compartilhados e infraestrutura
                completa para o seu negócio crescer.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-coworking group-hover:gap-3 transition-all">
                Conhecer espaços <ArrowRight size={16} />
              </span>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <Link to="/instituto" className="group block">
              <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-6">
                <img
                  src={institutoImg}
                  alt="Consultório acolhedor do Instituto Integra"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/5 transition-colors duration-500" />
              </div>
              <h2 className="text-2xl lg:text-3xl mb-2 group-hover:text-instituto transition-colors">
                Instituto Integra
              </h2>
              <p className="text-muted-foreground mb-4">
                Psicoterapia, acolhimento e cuidado com a saúde emocional por
                profissionais especializados.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-instituto group-hover:gap-3 transition-all">
                Saber mais <ArrowRight size={16} />
              </span>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding py-24">
        <div className="max-w-7xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl lg:text-4xl mb-4">Por que a Integra?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-16">
              Acreditamos que produtividade e bem-estar caminham juntos.
            </p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Localização", desc: "Endereço privilegiado com fácil acesso" },
              { title: "Flexibilidade", desc: "Planos por hora, dia ou mês" },
              { title: "Acolhimento", desc: "Ambiente seguro e empático" },
              { title: "Profissionalismo", desc: "Equipe qualificada e dedicada" },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 80}>
                <div className="text-left p-6 rounded-xl bg-card shadow-sm shadow-foreground/5 hover:shadow-md transition-shadow duration-300">
                  <h3 className="font-sans font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
