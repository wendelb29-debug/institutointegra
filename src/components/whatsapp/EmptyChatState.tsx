import { Sparkles } from 'lucide-react';
import logoIntegra from '@/assets/logo-integra.png';

export const EmptyChatState = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-muted/20">
    <div className="text-center max-w-md space-y-6">
      <div className="mx-auto">
        <img
          src={logoIntegra}
          alt="Instituto Integra"
          className="w-48 h-auto mx-auto opacity-80"
        />
      </div>
      <div>
        <h3 className="text-2xl font-light text-foreground">Orbit Inbox</h3>
        <p className="text-sm mt-3 leading-relaxed text-muted-foreground">
          Envie mensagens, gerencie conversas e use inteligência artificial para se comunicar melhor.
        </p>
        <p className="text-xs mt-2 text-muted-foreground">
          Selecione uma conversa ou crie uma nova para começar.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 pt-2">
        <Sparkles className="h-4 w-4 text-primary/50" />
        <span className="text-xs text-muted-foreground">Powered by Orbit AI</span>
      </div>
    </div>
  </div>
);
