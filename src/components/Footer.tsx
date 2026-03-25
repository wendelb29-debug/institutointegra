import { Link } from "react-router-dom";
import { Phone, MapPin, MessageCircle } from "lucide-react";

const WA_LINK = "https://wa.me/5511999990000?text=Olá! Gostaria de mais informações sobre o Instituto Integra.";

export function Footer() {
  return (
    <footer className="bg-foreground text-background/70 py-16 section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <span className="font-display text-2xl text-background mb-4 block">Instituto Integra</span>
            <p className="text-sm leading-relaxed max-w-xs">
              Cuidado especializado em neuropsicologia e saúde emocional com acolhimento e profissionalismo.
            </p>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-background text-sm uppercase tracking-wider mb-4">Navegação</h4>
            <div className="space-y-3">
              <Link to="/" className="block text-sm hover:text-background transition-colors">Início</Link>
              <Link to="/instituto" className="block text-sm hover:text-background transition-colors">Instituto</Link>
              <Link to="/coworking" className="block text-sm hover:text-background transition-colors">Locação de Salas</Link>
              <Link to="/contato" className="block text-sm hover:text-background transition-colors">Contato</Link>
            </div>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-background text-sm uppercase tracking-wider mb-4">Contato</h4>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> (11) 99999-0000</p>
              <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> São Paulo, SP</p>
              <p>contato@integra.com.br</p>
            </div>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-background text-sm uppercase tracking-wider mb-4">WhatsApp</h4>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm bg-background/10 hover:bg-background/20 px-4 py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Fale conosco
            </a>
          </div>
        </div>
        <div className="border-t border-background/10 pt-8 text-sm text-center">
          © {new Date().getFullYear()} Instituto Integra. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
