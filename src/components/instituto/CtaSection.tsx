import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Heart, CalendarCheck } from "lucide-react";

const WA_LINK = "https://wa.me/5511999990000?text=Olá! Gostaria de agendar uma consulta no Instituto Integra.";

export function CtaSection() {
  return (
    <section className="relative section-padding py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-instituto opacity-95" />
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <Heart className="h-10 w-10 text-background/40 mx-auto mb-6" />
          <h2 className="text-2xl lg:text-4xl text-background mb-3">
            Você não precisa passar por isso sozinho.
          </h2>
          <p className="text-background/70 text-lg mb-10 leading-relaxed">
            Comece seu processo de transformação hoje.
          </p>
          <Button size="lg" className="bg-background text-primary hover:bg-background/90 text-base px-10 py-6 rounded-xl shadow-lg" asChild>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              <CalendarCheck className="h-5 w-5 mr-2" />
              Agendar consulta
            </a>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
