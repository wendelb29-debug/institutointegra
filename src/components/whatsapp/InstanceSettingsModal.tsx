import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Wifi, WifiOff, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InstanceConfig {
  instanceId: string;
  token: string;
  clientToken: string;
}

interface InstanceSettingsModalProps {
  onConfigSaved?: () => void;
}

export const InstanceSettingsModal = ({ onConfigSaved }: InstanceSettingsModalProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<InstanceConfig>({ instanceId: '', token: '', clientToken: '' });
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    if (open && user) loadConfig();
  }, [open, user]);

  const getProxyUrl = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pktpabruwkvpesqqinxx';
    return `https://${projectId}.supabase.co/functions/v1/zapi-proxy`;
  };

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    };
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('psychologist_whatsapp_config')
        .select('instance_id, token, client_token')
        .eq('psychologist_id', user!.id)
        .maybeSingle();

      if (data) {
        setConfig({
          instanceId: data.instance_id || '',
          token: data.token || '',
          clientToken: data.client_token || '',
        });
        setHasExisting(true);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config.instanceId || !config.token) {
      toast.error('Instance ID e Token são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(getProxyUrl(), {
        method: 'POST', headers,
        body: JSON.stringify({
          action: 'save-config',
          instanceId: config.instanceId.trim(),
          token: config.token.trim(),
          clientToken: config.clientToken.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Configuração salva com sucesso!');
        setHasExisting(true);
        onConfigSaved?.();
        setOpen(false);
      }
    } catch (err) {
      toast.error('Erro ao salvar configuração');
      console.error(err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      await supabase
        .from('psychologist_whatsapp_config')
        .delete()
        .eq('psychologist_id', user.id);
      setConfig({ instanceId: '', token: '', clientToken: '' });
      setHasExisting(false);
      toast.success('Configuração removida');
      onConfigSaved?.();
    } catch (err) {
      toast.error('Erro ao remover');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Configurar instância Z-API">
          <Settings className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Configure sua instância Z-API para conectar seu WhatsApp pessoal.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="instanceId" className="text-sm font-medium">Instance ID *</Label>
              <Input
                id="instanceId"
                value={config.instanceId}
                onChange={e => setConfig(prev => ({ ...prev, instanceId: e.target.value }))}
                placeholder="Ex: 3F0A839B3D4A131C158AA248D27FDCD6"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium">Token *</Label>
              <Input
                id="token"
                value={config.token}
                onChange={e => setConfig(prev => ({ ...prev, token: e.target.value }))}
                placeholder="Ex: A714392518FBCFACC066D258"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientToken" className="text-sm font-medium">Client Token (opcional)</Label>
              <Input
                id="clientToken"
                value={config.clientToken}
                onChange={e => setConfig(prev => ({ ...prev, clientToken: e.target.value }))}
                placeholder="Token de segurança"
                className="font-mono text-xs"
              />
            </div>

            <div className="rounded-lg p-3 text-xs space-y-2 bg-muted border border-border">
              <p className="font-medium text-foreground">📋 Onde encontrar:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Acesse <a href="https://app.z-api.io" target="_blank" rel="noopener noreferrer" className="text-primary underline">app.z-api.io</a></li>
                <li>Vá em "Dados da instância web"</li>
                <li>Copie o Instance ID e Token</li>
                <li>O Client Token está em "Segurança"</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
              {hasExisting && (
                <Button variant="destructive" size="icon" onClick={handleDelete} title="Remover configuração">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
