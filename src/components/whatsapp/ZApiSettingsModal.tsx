import { useState } from 'react';
import { Settings, Copy, Check, ExternalLink, Send, Download, LogOut, LogIn, Eye, MessageSquare } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const ZApiSettingsModal = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pktpabruwkvpesqqinxx';
  const base = `https://${projectId}.supabase.co/functions/v1/zapi-webhook`;

  const webhooks = [
    { label: 'Ao enviar', field: 'on-send', icon: Send, url: `${base}?type=send` },
    { label: 'Presença do chat', field: 'chat-presence', icon: Eye, url: `${base}?type=presence` },
    { label: 'Ao desconectar', field: 'on-disconnect', icon: LogOut, url: `${base}?type=disconnect` },
    { label: 'Receber status da mensagem', field: 'message-status', icon: MessageSquare, url: `${base}?type=delivery` },
    { label: 'Ao receber', field: 'on-receive', icon: Download, url: `${base}?type=message` },
    { label: 'Ao conectar', field: 'on-connect', icon: LogIn, url: `${base}?type=connect` },
  ];

  const handleCopy = async (url: string, field: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(field);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          title="Configurações Z-API"
          style={{ color: '#8696a0' }}
        >
          <Settings className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl border-0" style={{ backgroundColor: '#222e35', color: '#e9edef' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#e9edef]">
            <Settings className="h-5 w-5" style={{ color: '#00a884' }} />
            Configure Webhooks
          </DialogTitle>
          <DialogDescription style={{ color: '#8696a0' }}>
            Configurar webhooks para sua instância permite receber os eventos dela.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
          {webhooks.map(wh => (
            <div key={wh.field} className="space-y-1.5">
              <Label className="text-[13px] font-semibold" style={{ color: '#e9edef' }}>
                {wh.label}
              </Label>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#2a3942' }}
                onClick={() => handleCopy(wh.url, wh.field)}
              >
                <wh.icon className="h-4 w-4 shrink-0" style={{ color: '#8696a0' }} />
                <span className="text-[12px] flex-1 truncate" style={{ color: '#8696a0' }}>
                  {wh.label}
                </span>
                {copied === wh.field ? (
                  <Check className="h-4 w-4 shrink-0" style={{ color: '#00a884' }} />
                ) : (
                  <Copy className="h-4 w-4 shrink-0" style={{ color: '#8696a0' }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="rounded-lg p-3 text-[13px] space-y-2" style={{ backgroundColor: '#1a2730', color: '#8696a0' }}>
          <p className="font-medium" style={{ color: '#e9edef' }}>📋 Como usar:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Clique em cada campo acima para copiar a URL</li>
            <li>No painel da Z-API, cole cada URL no campo de webhook correspondente</li>
            <li>Salve as configurações na Z-API</li>
          </ol>
        </div>

        <a
          href="https://app.z-api.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: '#00a884', color: '#111b21' }}
        >
          <ExternalLink className="h-4 w-4" />
          Abrir Painel Z-API
        </a>
      </DialogContent>
    </Dialog>
  );
};
