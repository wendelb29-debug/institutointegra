import { Lock, Bot } from 'lucide-react';

export const EmptyChatState = () => (
  <div className="flex-1 flex flex-col items-center justify-center" style={{ backgroundColor: '#222e35' }}>
    <div className="text-center max-w-md space-y-6">
      <div className="mx-auto w-[320px] h-[188px] rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2a3942' }}>
        <Bot className="h-20 w-20" style={{ color: '#364147' }} />
      </div>
      <div>
        <h3 className="text-[32px] font-light" style={{ color: '#e9edef' }}>Orbit Inbox</h3>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: '#8696a0' }}>
          Envie e receba mensagens. Gerencie atendimentos e automatize conversas com Orbit AI.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 pt-6">
        <Lock className="h-3 w-3" style={{ color: '#8696a0' }} />
        <span className="text-[13px]" style={{ color: '#8696a0' }}>Suas mensagens são protegidas</span>
      </div>
    </div>
  </div>
);
