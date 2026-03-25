import { useState, useEffect } from 'react';
import { Settings, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const ZApiSettingsModal = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Webhook URLs (read-only, generated from project)
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pktpabruwkvpesqqinxx';
  const baseEdgeFn = `https://${projectId}.supabase.co/functions/v1`;
  
  const webhookReceive = `${baseEdgeFn}/zapi-webhook`;
  const webhookStatus = `${baseEdgeFn}/zapi-webhook?type=status`;
  const webhookDelivery = `${baseEdgeFn}/zapi-webhook?type=delivery`;

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`URL copiada: ${label}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => handleCopy(text, label)}
      className="p-1.5 rounded hover:bg-white/10 transition-colors shrink-0"
      title="Copiar"
    >
      {copied === label ? (
        <Check className="h-4 w-4" style={{ color: '#00a884' }} />
      ) : (
        <Copy className="h-4 w-4" style={{ color: '#8696a0' }} />
      )}
    </button>
  );

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
      <DialogContent className="sm:max-w-lg border-0" style={{ backgroundColor: '#222e35', color: '#e9edef' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#e9edef]">
            <Settings className="h-5 w-5" style={{ color: '#00a884' }} />
            Configurações Z-API
          </DialogTitle>
          <DialogDescription style={{ color: '#8696a0' }}>
            Configure as URLs de webhook no painel da Z-API para receber mensagens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Instructions */}
          <div className="rounded-lg p-3 text-[13px] space-y-2" style={{ backgroundColor: '#1a2730', color: '#8696a0' }}>
            <p className="font-medium" style={{ color: '#e9edef' }}>📋 Como configurar:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Acesse o painel da <span style={{ color: '#00a884' }}>Z-API</span></li>
              <li>Vá em sua instância → <strong>Webhooks</strong></li>
              <li>Cole as URLs abaixo nos campos correspondentes</li>
              <li>Salve as configurações</li>
            </ol>
          </div>

          {/* Webhook: Receber Mensagens */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium" style={{ color: '#aebac1' }}>
              Webhook — Receber Mensagens
            </Label>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#2a3942' }}>
              <code className="text-[12px] flex-1 break-all" style={{ color: '#00a884' }}>
                {webhookReceive}
              </code>
              <CopyButton text={webhookReceive} label="receive" />
            </div>
            <p className="text-[11px]" style={{ color: '#8696a0' }}>
              Cole no campo "URL de recebimento" ou "on-message" da Z-API
            </p>
          </div>

          {/* Webhook: Status da Conexão */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium" style={{ color: '#aebac1' }}>
              Webhook — Status da Conexão
            </Label>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#2a3942' }}>
              <code className="text-[12px] flex-1 break-all" style={{ color: '#00a884' }}>
                {webhookStatus}
              </code>
              <CopyButton text={webhookStatus} label="status" />
            </div>
            <p className="text-[11px]" style={{ color: '#8696a0' }}>
              Cole no campo "on-connection-status" ou "status-instance"
            </p>
          </div>

          {/* Webhook: Confirmação de Entrega */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium" style={{ color: '#aebac1' }}>
              Webhook — Confirmação de Entrega
            </Label>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#2a3942' }}>
              <code className="text-[12px] flex-1 break-all" style={{ color: '#00a884' }}>
                {webhookDelivery}
              </code>
              <CopyButton text={webhookDelivery} label="delivery" />
            </div>
            <p className="text-[11px]" style={{ color: '#8696a0' }}>
              Cole no campo "on-message-status" ou "delivery"
            </p>
          </div>

          {/* Link to Z-API dashboard */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
