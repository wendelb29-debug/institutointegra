import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  MessageCircle, QrCode, Wifi, WifiOff, Send, RefreshCw,
  Phone, Settings, Users, Bot, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface Message {
  id: string;
  from: string;
  body: string;
  timestamp: string;
  isFromMe: boolean;
}

interface Contact {
  phone: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unread?: number;
}

const WhatsApp = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('zapi-proxy', {
        body: { action: 'status' }
      });
      if (error) throw error;

      if (data?.connected) {
        setStatus('connected');
        setQrCode(null);
        setIsConfigured(true);
      } else if (data?.needsConfig) {
        setIsConfigured(false);
        setStatus('disconnected');
      } else {
        setStatus('disconnected');
        setIsConfigured(true);
      }
    } catch {
      setIsConfigured(false);
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const requestQrCode = async () => {
    setStatus('connecting');
    try {
      const { data, error } = await supabase.functions.invoke('zapi-proxy', {
        body: { action: 'qr' }
      });
      if (error) throw error;
      if (data?.qr) {
        setQrCode(data.qr);
      }
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível gerar o QR Code.', variant: 'destructive' });
      setStatus('disconnected');
    }
  };

  const disconnect = async () => {
    try {
      await supabase.functions.invoke('zapi-proxy', {
        body: { action: 'disconnect' }
      });
      setStatus('disconnected');
      setQrCode(null);
      setContacts([]);
      setMessages([]);
      setSelectedContact(null);
      toast({ title: 'Desconectado', description: 'WhatsApp desconectado com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao desconectar.', variant: 'destructive' });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    try {
      const { error } = await supabase.functions.invoke('zapi-proxy', {
        body: {
          action: 'send',
          phone: selectedContact.phone,
          message: newMessage
        }
      });
      if (error) throw error;

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        from: 'me',
        body: newMessage,
        timestamp: new Date().toISOString(),
        isFromMe: true
      }]);
      setNewMessage('');
      toast({ title: 'Enviado', description: 'Mensagem enviada com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível enviar a mensagem.', variant: 'destructive' });
    }
  };

  const StatusBadge = () => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 gap-1.5"><CheckCircle2 className="h-3 w-3" /> Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 gap-1.5"><Clock className="h-3 w-3 animate-spin" /> Conectando</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground gap-1.5"><WifiOff className="h-3 w-3" /> Desconectado</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not configured screen
  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-foreground">WhatsApp</h1>
            <p className="text-muted-foreground text-sm mt-1">Integração com Z-API para atendimento</p>
          </div>
          <StatusBadge />
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 w-fit mb-4">
              <Settings className="h-8 w-8" />
            </div>
            <CardTitle>Configurar Z-API</CardTitle>
            <CardDescription>
              Para usar o WhatsApp no sistema, você precisa configurar as credenciais do Z-API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-sm">Como configurar:</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Crie uma conta em <a href="https://z-api.io" target="_blank" rel="noopener noreferrer" className="text-primary underline">z-api.io</a></span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Crie uma instância e copie o <strong>Instance ID</strong> e o <strong>Token</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Informe as credenciais ao administrador do sistema para configurar</span>
                </li>
              </ol>
            </div>

            <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                As credenciais devem ser configuradas de forma segura no backend do sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Disconnected / QR Code screen
  if (status !== 'connected') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-foreground">WhatsApp</h1>
            <p className="text-muted-foreground text-sm mt-1">Integração com Z-API para atendimento</p>
          </div>
          <StatusBadge />
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 w-fit mb-4">
              <QrCode className="h-10 w-10" />
            </div>
            <CardTitle>Conectar WhatsApp</CardTitle>
            <CardDescription>
              Escaneie o QR Code com seu WhatsApp para conectar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {qrCode ? (
              <div className="p-4 bg-white rounded-2xl shadow-inner border">
                <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
              </div>
            ) : (
              <div className="w-64 h-64 bg-muted/50 rounded-2xl flex items-center justify-center border border-dashed">
                <p className="text-sm text-muted-foreground text-center px-4">
                  Clique no botão abaixo para gerar o QR Code
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={requestQrCode} className="gap-2" disabled={status === 'connecting'}>
                {status === 'connecting' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                {qrCode ? 'Atualizar QR Code' : 'Gerar QR Code'}
              </Button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                1. Abra o WhatsApp no seu celular
              </p>
              <p className="text-xs text-muted-foreground">
                2. Toque em Menu → Dispositivos conectados
              </p>
              <p className="text-xs text-muted-foreground">
                3. Escaneie o código QR
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected - Chat interface
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground text-sm mt-1">Atendimento via WhatsApp</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge />
          <Button variant="outline" size="sm" onClick={disconnect} className="gap-1.5 text-destructive hover:text-destructive">
            <WifiOff className="h-3.5 w-3.5" />
            Desconectar
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <Wifi className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-semibold text-emerald-600">Online</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contatos</p>
              <p className="text-sm font-semibold">{contacts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/60">
              <Bot className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Automação</p>
              <p className="text-sm font-semibold text-muted-foreground">Em breve</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
        {/* Contacts list */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Conversas</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Input placeholder="Buscar contato..." className="h-8 text-xs" />
          </CardHeader>
          <ScrollArea className="flex-1 h-[380px]">
            <CardContent className="p-2 space-y-1">
              {contacts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-xs">Nenhuma conversa ainda</p>
                  <p className="text-xs mt-1">Envie uma mensagem para iniciar</p>
                </div>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.phone}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedContact?.phone === contact.phone
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-emerald-700">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                      </div>
                      {contact.unread && contact.unread > 0 && (
                        <Badge className="bg-emerald-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">
                          {contact.unread}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Chat messages */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedContact ? (
            <>
              <CardHeader className="p-4 border-b flex-row items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-emerald-700">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-sm">{selectedContact.name}</CardTitle>
                  <CardDescription className="text-xs">{selectedContact.phone}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                  <Phone className="h-4 w-4" />
                </Button>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                          msg.isFromMe
                            ? 'bg-emerald-500 text-white rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        <p>{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${msg.isFromMe ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-3 border-t flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[40px] max-h-[100px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} size="icon" className="shrink-0 bg-emerald-500 hover:bg-emerald-600">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Selecione uma conversa</p>
              <p className="text-xs mt-1">ou envie uma nova mensagem</p>

              <Separator className="my-6 w-48" />

              <div className="space-y-3 w-full max-w-xs">
                <h4 className="text-xs font-semibold text-center">Envio rápido</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: 5511999990000"
                    className="h-9 text-xs"
                    id="quick-phone"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    onClick={() => {
                      const phone = (document.getElementById('quick-phone') as HTMLInputElement)?.value;
                      if (phone) {
                        const contact: Contact = { phone, name: phone, lastMessage: '' };
                        setContacts(prev => {
                          if (prev.find(c => c.phone === phone)) return prev;
                          return [contact, ...prev];
                        });
                        setSelectedContact(contact);
                      }
                    }}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Iniciar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default WhatsApp;
