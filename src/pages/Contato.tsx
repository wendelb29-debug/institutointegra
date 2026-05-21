import { useState, type FormEvent } from "react";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollReveal } from "@/components/ScrollReveal";
import { MessageCircle, MapPin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

const Contato = () => {
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      (e.target as HTMLFormElement).reset();
    }, 1200);
  };

  return (
    <Layout>
      <Seo
        title="Contato — Instituto Integra"
        description="Fale com o Instituto Integra em Uberlândia-MG. Telefone, WhatsApp e endereço para agendar avaliação neuropsicológica e consultas."
        path="/contato"
      />
      <section className="section-padding py-24">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-4">
              Fale conosco
            </h1>
            <p className="text-muted-foreground max-w-lg mb-16">
              Estamos prontos para ajudar. Entre em contato por WhatsApp, visite-nos ou envie uma mensagem.
            </p>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Info */}
            <div className="space-y-8">
              <ScrollReveal>
                <a
                  href="https://wa.me/5511999990000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-5 rounded-xl bg-card shadow-sm shadow-foreground/5 hover:shadow-md transition-shadow duration-300 group"
                >
                  <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">WhatsApp</h3>
                    <p className="text-muted-foreground text-sm">(11) 99999-0000</p>
                  </div>
                </a>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card shadow-sm shadow-foreground/5">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Localização</h3>
                    <p className="text-muted-foreground text-sm">
                      Rua Exemplo, 123 — Centro<br />
                      São Paulo, SP — CEP 01001-000
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={160}>
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card shadow-sm shadow-foreground/5">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">E-mail</h3>
                    <p className="text-muted-foreground text-sm">contato@integra.com.br</p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={240}>
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card shadow-sm shadow-foreground/5">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Telefone</h3>
                    <p className="text-muted-foreground text-sm">(11) 99999-0000</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Form */}
            <ScrollReveal delay={100}>
              <form onSubmit={handleSubmit} className="space-y-5 bg-card p-8 rounded-2xl shadow-sm shadow-foreground/5">
                <h2 className="text-xl font-display mb-2">Envie uma mensagem</h2>
                <div>
                  <Input placeholder="Seu nome" required className="h-12" />
                </div>
                <div>
                  <Input type="email" placeholder="Seu e-mail" required className="h-12" />
                </div>
                <div>
                  <Input type="tel" placeholder="Seu telefone" className="h-12" />
                </div>
                <div>
                  <Textarea placeholder="Sua mensagem..." required rows={5} />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={sending}>
                  {sending ? "Enviando..." : "Enviar mensagem"}
                </Button>
              </form>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contato;
