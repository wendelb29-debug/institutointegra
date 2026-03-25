import { MessageCircle } from 'lucide-react';

export const EmptyChatState = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-muted/20">
    <div className="text-center max-w-md space-y-6">
      <div className="mx-auto w-40 h-40 rounded-full bg-primary/5 flex items-center justify-center">
        <MessageCircle className="h-16 w-16 text-primary/40" />
      </div>
      <div>
        <h3 className="text-2xl font-light text-foreground">Orbit Inbox</h3>
        <p className="text-sm mt-3 leading-relaxed text-muted-foreground">
          Centralize suas conversas de WhatsApp.
          <br />
          Selecione uma conversa para começar.
        </p>
      </div>
    </div>
  </div>
);
