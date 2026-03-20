import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/coworking", label: "Coworking" },
    { to: "/instituto", label: "Instituto" },
    { to: "/reservas", label: "Reservas" },
    { to: "/contato", label: "Contato" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 section-padding">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl text-foreground tracking-tight">Integra</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive(link.to)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/auth">
            <Button variant="outline" size="sm" className="gap-1.5 border-border/60">
              <LogIn className="h-3.5 w-3.5" />
              Área de Gestão
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground active:scale-95 transition-transform"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background border-b border-border section-padding pb-6 space-y-4"
          style={{ animation: "fade-in 0.2s ease-out" }}
        >
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`block text-base font-medium py-2 transition-colors ${
                isActive(link.to)
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/auth" onClick={() => setOpen(false)}>
            <Button variant="outline" size="sm" className="w-full gap-1.5 mt-2">
              <LogIn className="h-3.5 w-3.5" />
              Área de Gestão
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
