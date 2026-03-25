import { useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { toast } from "sonner";

export function LeadCaptureSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    toast.success("Obrigado! Em breve entraremos em contato.");
    setName("");
    setPhone("");
  };

  return (
    <section className="section-padding py-20 bg-instituto-light">
      <div className="max-w-xl mx-auto text-center">
        <ScrollReveal>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-instituto mb-3">Fique por dentro</p>
          <h2 className="text-2xl lg:text-3xl mb-3">Receba conteúdos para melhorar sua saúde emocional</h2>
          <p className="text-muted-foreground mb-8">Deixe seu contato e receba dicas e materiais exclusivos.</p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
            <Input
              placeholder="Seu WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl"
            />
            <Button type="submit" variant="instituto" className="rounded-xl px-6 shrink-0">
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </form>
        </ScrollReveal>
      </div>
    </section>
  );
}
