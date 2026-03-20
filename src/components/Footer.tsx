import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-foreground text-background/70 py-16 section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <span className="font-display text-2xl text-background mb-4 block">Integra</span>
            <p className="text-sm leading-relaxed max-w-xs">
              Conectando trabalho, desenvolvimento e bem-estar em um único lugar.
            </p>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-background text-sm uppercase tracking-wider mb-4">Navegação</h4>
            <div className="space-y-3">
              <Link to="/coworking" className="block text-sm hover:text-background transition-colors">Coworking</Link>
              <Link to="/instituto" className="block text-sm hover:text-background transition-colors">Instituto</Link>
              <Link to="/contato" className="block text-sm hover:text-background transition-colors">Contato</Link>
            </div>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-background text-sm uppercase tracking-wider mb-4">Contato</h4>
            <div className="space-y-3 text-sm">
              <p>contato@integra.com.br</p>
              <p>(11) 99999-0000</p>
              <p>São Paulo, SP</p>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 pt-8 text-sm text-center">
          © {new Date().getFullYear()} Integra. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
