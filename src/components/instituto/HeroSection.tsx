import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { CalendarCheck, MessageCircle } from "lucide-react";
import heroImg from "@/assets/instituto-hero-new.jpg";

const WA_LINK = "https://wa.me/5511999990000?text=Olá! Gostaria de agendar uma consulta no Instituto Integra.";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center">
      <img
        src={heroImg}
        alt="Acolhimento e bem-estar emocional"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/60 to-charcoal/30" />
      <div className="relative z-10 section-padding max-w-7xl mx-auto w-full py-20">
        <ScrollReveal>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.3em] text-instituto-light bg-instituto/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6">
            Instituto Integra · Neuropsicologia Clínica
          </span>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.1] text-background max-w-2xl mb-6">
            Cuidar da sua mente é o primeiro passo para transformar sua vida.
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <p className="text-background/75 text-lg max-w-lg mb-10 leading-relaxed">
            Atendimento especializado em neuropsicologia com acolhimento e profissionalismo.
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
            <Button size="lg" className="text-base px-8 py-6 rounded-xl bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 hover:bg-[#1ebe5a] hover:shadow-xl hover:shadow-[#25D366]/40" asChild>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5 mr-2" />
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
