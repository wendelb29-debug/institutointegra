import { useState } from 'react';
import { QrCode, Loader2, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from '@/components/ui/dialog';
import { ConnectionStatus } from './types';

interface QrCodeModalProps {
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const QrCodeModal = ({ status, onConnect, onDisconnect }: QrCodeModalProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2"
          variant={status === 'connected' ? 'outline' : 'default'}
        >
          {status === 'connected' ? (
            <>
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600">Conectado</span>
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4" />
              Conectar WhatsApp
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code abaixo com o WhatsApp do seu celular.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-4">
          {status === 'connected' ? (
            <div className="text-center space-y-4">
              <div className="mx-auto p-4 rounded-full bg-emerald-500/10 w-fit">
                <Wifi className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">WhatsApp Conectado</p>
                <p className="text-sm text-muted-foreground mt-1">Seu WhatsApp está ativo e recebendo mensagens.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={onDisconnect}>
                Desconectar
              </Button>
            </div>
          ) : status === 'connecting' ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <div>
                <p className="font-semibold text-foreground">Aguardando conexão...</p>
                <p className="text-sm text-muted-foreground mt-1">Escaneie o QR Code com seu celular</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-white rounded-2xl shadow-inner border border-border mx-auto w-fit">
                <div className="w-56 h-56 bg-muted/30 rounded-lg flex items-center justify-center border border-dashed border-border">
                  <QrCode className="h-16 w-16 text-muted-foreground/40" />
                </div>
              </div>
              <Button onClick={onConnect} className="gap-2">
                <QrCode className="h-4 w-4" />
                Gerar QR Code
              </Button>
            </div>
          )}

          {status !== 'connected' && (
            <div className="w-full space-y-2 text-center">
              <p className="text-xs text-muted-foreground">1. Abra o WhatsApp no celular</p>
              <p className="text-xs text-muted-foreground">2. Toque em Menu → Dispositivos conectados</p>
              <p className="text-xs text-muted-foreground">3. Escaneie o código QR</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
