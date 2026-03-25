import { MessageCircle, Bot } from 'lucide-react';

export const EmptyChatState = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
    <div className="p-5 rounded-full bg-primary/5 mb-5">
      <MessageCircle className="h-12 w-12 text-primary/30" />
    </div>
    <h3 className="text-lg font-semibold text-foreground/70">Selecione uma conversa</h3>
    <p className="text-sm mt-1 text-muted-foreground max-w-xs text-center">
      Escolha um contato à esquerda para visualizar e responder mensagens.
    </p>
    <div className="flex items-center gap-2 mt-6 px-4 py-2.5 rounded-full bg-accent/10 border border-accent/20">
      <Bot className="h-4 w-4 text-accent" />
      <span className="text-xs font-medium text-accent">Orbit AI disponível para respostas inteligentes</span>
    </div>
  </div>
);
