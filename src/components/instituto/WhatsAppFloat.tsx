import { MessageCircle } from "lucide-react";

const WA_LINK = "https://wa.me/5511999990000?text=Olá! Gostaria de agendar uma consulta no Instituto Integra.";

export function WhatsAppFloat() {
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-background p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
