import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Heart, ShieldCheck, Brain, MessageCircle, Sparkles, Users,
  Baby, ClipboardCheck, CalendarCheck, UserCheck, Monitor,
  Star, ChevronLeft, ChevronRight, Phone, MapPin, Instagram,
  Facebook, ArrowRight, Quote
} from "lucide-react";
import institutoHero from "@/assets/instituto-hero.jpg";
import psychologist from "@/assets/psychologist.jpg";
import psychologist2 from "@/assets/psychologist-2.jpg";
import psychologist3 from "@/assets/psychologist-3.jpg";

const WA_LINK = "https://wa.me/5511999990000?text=Olá! Gostaria de agendar uma consulta no Instituto Integra.";

const services = [
  { icon: MessageCircle, title: "Psicoterapia", desc: "Sessões individuais para autoconhecimento, superação de desafios e desenvolvimento pessoal." },
  { icon: Users, title: "Terapia de Casal", desc: "Melhore a comunicação, resolva conflitos e fortaleça seu relacionamento." },
  { icon: Baby, title: "Atendimento Infantil", desc: "Cuidado especializado para crianças, respeitando cada fase do desenvolvimento." },
  { icon: Brain, title: "Avaliação Psicológica", desc: "Instrumentos e técnicas para compreensão aprofundada do funcionamento psíquico." },
];

const aboutCards = [
  { icon: Heart, title: "Atendimento humanizado", desc: "Cada pessoa é única. Nosso atendimento é personalizado e acolhedor." },
  { icon: ShieldCheck, title: "Profissionais qualificados", desc: "Equipe com formação sólida e experiência clínica comprovada." },
  { icon: Sparkles, title: "Ambiente acolhedor", desc: "Espaço seguro, confortável e preparado para o seu bem-estar." },
];

const steps = [
  { icon: CalendarCheck, num: "01", title: "Agende sua consulta", desc: "Escolha o melhor dia e horário pelo WhatsApp ou formulário online." },
  { icon: UserCheck, num: "02", title: "Escolha o profissional", desc: "Conheça nossa equipe e selecione quem mais se identifica." },
  { icon: Monitor, num: "03", title: "Presencial ou online", desc: "Atendimento flexível — no consultório ou por videochamada." },
];

const professionals = [
  { name: "Dra. Ana Beatriz Silva", specialty: "Psicoterapia Cognitivo-Comportamental", crp: "CRP 06/12345", img: psychologist },
  { name: "Dr. Rafael Oliveira", specialty: "Neuropsicologia e Avaliação", crp: "CRP 06/54321", img: psychologist2 },
  { name: "Dra. Camila Santos", specialty: "Terapia de Casal e Família", crp: "CRP 06/67890", img: psychologist3 },
];

const testimonials = [
  { name: "Mariana L.", text: "O Instituto Integra mudou minha vida. Encontrei acolhimento e profissionalismo em cada sessão. Me sinto muito mais segura e equilibrada.", stars: 5 },
  { name: "Carlos R.", text: "Depois de anos adiando, finalmente busquei ajuda. A equipe me recebeu sem julgamento e hoje consigo lidar muito melhor com a ansiedade.", stars: 5 },
  { name: "Fernanda S.", text: "A terapia de casal foi transformadora. Aprendemos a nos ouvir de verdade. Recomendo a todos que buscam melhorar seus relacionamentos.", stars: 5 },
  { name: "Lucas M.", text: "Profissionais incríveis e um espaço que transmite paz. Cada consulta é um passo importante na minha jornada de autoconhecimento.", stars: 5 },
];

const Instituto = () => {
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const nextTestimonial = () => setTestimonialIdx((i) => (i + 1) % testimonials.length);
  const prevTestimonial = () => setTestimonialIdx((i) => (i - 1 + testimonials.length) % testimonials.length);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center">
        <img
          src={institutoHero}
          alt="Consultório Instituto Integra"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-foreground/20" />
        <div className="relative z-10 section-padding max-w-7xl mx-auto w-full">
          <ScrollReveal>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-instituto-light mb-4">
              Instituto Integra
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.1] text-background max-w-2xl mb-6">
              Cuidar da sua mente é o primeiro passo para transformar sua vida
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-background/80 text-lg max-w-lg mb-10 leading-relaxed">
              Psicologia clínica com acolhimento, ética e profissionalismo. Dê o primeiro passo rumo ao seu bem-estar emocional.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="instituto" size="lg" className="text-base px-8 py-6 rounded-xl shadow-lg" asChild>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  <CalendarCheck className="h-5 w-5 mr-2" />
                  Agendar consulta
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl border-background/30 text-background hover:bg-background/10 backdrop-blur-sm" asChild>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* About */}
      <section className="section-padding py-24">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-instituto mb-3">Sobre nós</p>
              <h2 className="text-2xl lg:text-4xl mb-5">Um espaço dedicado ao cuidado emocional</h2>
              <p className="text-muted-foreground leading-relaxed">
                O Instituto Integra nasceu da crença de que todos merecem um espaço seguro para
                cuidar da saúde mental. Aqui, cada pessoa é acolhida com respeito, ética e empatia.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {aboutCards.map((c, i) => (
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

      {/* Services */}
      <section className="section-padding py-24 bg-instituto-light">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-instituto mb-3">Serviços</p>
              <h2 className="text-2xl lg:text-4xl mb-5">Como podemos ajudar você</h2>
              <p className="text-muted-foreground">
                Oferecemos diferentes modalidades de atendimento para acolher suas necessidades.
              </p>
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

      {/* How it works */}
      <section className="section-padding py-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-instituto mb-3">Como funciona</p>
              <h2 className="text-2xl lg:text-4xl mb-5">Simples, rápido e acolhedor</h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
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

      {/* Professionals */}
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
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
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

      {/* Testimonials */}
      <section className="section-padding py-24">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-14">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-instituto mb-3">Depoimentos</p>
              <h2 className="text-2xl lg:text-4xl">O que dizem nossos pacientes</h2>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="relative bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border/50">
              <Quote className="h-10 w-10 text-instituto/20 absolute top-6 left-6" />
              <div className="text-center">
                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: testimonials[testimonialIdx].stars }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-instituto text-instituto" />
                  ))}
                </div>
                <p className="text-lg md:text-xl leading-relaxed text-foreground/90 mb-8 max-w-2xl mx-auto italic">
                  "{testimonials[testimonialIdx].text}"
                </p>
                <p className="font-semibold text-foreground">{testimonials[testimonialIdx].name}</p>
              </div>
              <div className="flex justify-center gap-3 mt-8">
                <button
                  onClick={prevTestimonial}
                  className="p-2 rounded-full border border-border hover:bg-instituto/10 transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === testimonialIdx ? "bg-instituto w-6" : "bg-border"
                      }`}
                      aria-label={`Depoimento ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextTestimonial}
                  className="p-2 rounded-full border border-border hover:bg-instituto/10 transition-colors"
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative section-padding py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-instituto opacity-95" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <Heart className="h-10 w-10 text-background/40 mx-auto mb-6" />
            <h2 className="text-2xl lg:text-4xl text-background mb-5">
              Você não precisa passar por isso sozinho
            </h2>
            <p className="text-background/80 text-lg mb-10 leading-relaxed">
              Dê o primeiro passo. Agende sua consulta e comece a cuidar de quem mais importa: você.
            </p>
            <Button
              size="lg"
              className="bg-background text-primary hover:bg-background/90 text-base px-10 py-6 rounded-xl shadow-lg"
              asChild
            >
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="h-5 w-5 mr-2" />
                Agendar consulta
              </a>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-background p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </Layout>
  );
};

export default Instituto;
