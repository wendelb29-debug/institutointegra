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
        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Configurações Z-API">
          <Settings className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configure Webhooks
          </DialogTitle>
          <DialogDescription>
            Configurar webhooks para sua instância permite receber os eventos dela.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
          {webhooks.map(wh => (
            <div key={wh.field} className="space-y-1.5">
              <Label className="text-xs font-semibold">{wh.label}</Label>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer hover:opacity-80 transition-opacity bg-muted border border-border"
                onClick={() => handleCopy(wh.url, wh.field)}
              >
                <wh.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-xs flex-1 truncate text-muted-foreground">{wh.label}</span>
                {copied === wh.field ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg p-3 text-xs space-y-2 bg-muted border border-border">
          <p className="font-medium text-foreground">📋 Como usar:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Clique em cada campo acima para copiar a URL</li>
            <li>No painel da Z-API, cole cada URL no campo de webhook correspondente</li>
            <li>Salve as configurações na Z-API</li>
          </ol>
        </div>

        <a
          href="https://app.z-api.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir Painel Z-API
        </a>
      </DialogContent>
    </Dialog>
  );
};
