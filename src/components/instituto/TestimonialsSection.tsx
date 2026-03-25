import { useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  { name: "Mariana L.", text: "Hoje me sinto muito mais leve e segura. O acolhimento que recebi no Instituto Integra foi transformador.", stars: 5 },
  { name: "Carlos R.", text: "O atendimento mudou minha forma de lidar com meus problemas. Finalmente consigo enxergar as coisas com clareza.", stars: 5 },
  { name: "Fernanda S.", text: "A terapia de casal foi transformadora. Aprendemos a nos ouvir de verdade.", stars: 5 },
  { name: "Lucas M.", text: "Profissionais incríveis e um espaço que transmite paz. Cada consulta é um passo importante.", stars: 5 },
];

export function TestimonialsSection() {
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => (i + 1) % testimonials.length);
  const prev = () => setIdx((i) => (i - 1 + testimonials.length) % testimonials.length);

  return (
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
                {Array.from({ length: testimonials[idx].stars }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-instituto text-instituto" />
                ))}
              </div>
              <p className="text-lg md:text-xl leading-relaxed text-foreground/90 mb-8 max-w-2xl mx-auto italic">
                "{testimonials[idx].text}"
              </p>
              <p className="font-semibold text-foreground">{testimonials[idx].name}</p>
            </div>
            <div className="flex justify-center gap-3 mt-8">
              <button onClick={prev} className="p-2 rounded-full border border-border hover:bg-instituto/10 transition-colors" aria-label="Anterior">
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === idx ? "bg-instituto w-6" : "bg-border"}`}
                    aria-label={`Depoimento ${i + 1}`}
                  />
                ))}
              </div>
              <button onClick={next} className="p-2 rounded-full border border-border hover:bg-instituto/10 transition-colors" aria-label="Próximo">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
