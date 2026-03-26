import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Search, Trash2, FileText, Eye, Copy, Send,
  DollarSign, Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

interface OrcamentoItem {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

interface Orcamento {
  id: string;
  numero: string;
  paciente_nome: string;
  paciente_telefone: string;
  paciente_email: string;
  profissional_nome: string;
  items: OrcamentoItem[];
  subtotal: number;
  desconto: number;
  total: number;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'expirado';
  validade: string;
  observacoes: string;
  forma_pagamento: string;
  parcelas: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  rascunho: { label: 'Rascunho', variant: 'secondary', icon: Clock },
  enviado: { label: 'Enviado', variant: 'default', icon: Send },
  aprovado: { label: 'Aprovado', variant: 'default', icon: CheckCircle2 },
  recusado: { label: 'Recusado', variant: 'destructive', icon: XCircle },
  expirado: { label: 'Expirado', variant: 'outline', icon: AlertCircle },
};

const Orcamentos = () => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Orcamento | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [form, setForm] = useState<any>({
    paciente_nome: '', paciente_telefone: '', paciente_email: '',
    profissional_nome: '', observacoes: '', forma_pagamento: '',
    parcelas: 1, desconto: 0, validade: '',
    items: [{ descricao: '', quantidade: 1, valor_unitario: 0 }],
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Use localStorage for persistence since we don't have a dedicated table
  const STORAGE_KEY = 'orcamentos_data';

  const loadOrcamentos = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) setOrcamentos(JSON.parse(data));
    } catch { /* ignore */ }
  };

  const saveOrcamentos = (list: Orcamento[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setOrcamentos(list);
  };

  const fetchRelated = async () => {
    const [pRes, hRes, pmRes] = await Promise.all([
      supabase.from('patients').select('id, name, phone, email').order('name'),
      supabase.from('health_professionals').select('id, full_name').order('full_name'),
      supabase.from('payment_methods').select('*').order('nome'),
    ]);
    setPatients(pRes.data || []);
    setProfessionals(hRes.data || []);
    setPaymentMethods(pmRes.data || []);
  };

  useEffect(() => { loadOrcamentos(); fetchRelated(); }, []);

  const generateNumero = () => {
    const now = new Date();
    return `ORC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
  };

  const calcSubtotal = (items: OrcamentoItem[]) =>
    items.reduce((sum, i) => sum + i.quantidade * i.valor_unitario, 0);

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { descricao: '', quantidade: 1, valor_unitario: 0 }] });
  };

  const handleRemoveItem = (idx: number) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_: any, i: number) => i !== idx) });
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const handleSave = () => {
    if (!form.paciente_nome || form.items.some((i: OrcamentoItem) => !i.descricao)) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    const subtotal = calcSubtotal(form.items);
    const total = subtotal - (form.desconto || 0);
    const newOrc: Orcamento = {
      id: crypto.randomUUID(),
      numero: generateNumero(),
      paciente_nome: form.paciente_nome,
      paciente_telefone: form.paciente_telefone,
      paciente_email: form.paciente_email,
      profissional_nome: form.profissional_nome,
      items: form.items,
      subtotal,
      desconto: form.desconto || 0,
      total,
      status: 'rascunho',
      validade: form.validade || '',
      observacoes: form.observacoes || '',
      forma_pagamento: form.forma_pagamento || '',
      parcelas: form.parcelas || 1,
      created_at: new Date().toISOString(),
    };
    saveOrcamentos([newOrc, ...orcamentos]);
    toast({ title: 'Orçamento criado!' });
    setOpen(false);
    setForm({
      paciente_nome: '', paciente_telefone: '', paciente_email: '',
      profissional_nome: '', observacoes: '', forma_pagamento: '',
      parcelas: 1, desconto: 0, validade: '',
      items: [{ descricao: '', quantidade: 1, valor_unitario: 0 }],
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    const updated = orcamentos.map(o => o.id === id ? { ...o, status: newStatus as any } : o);
    saveOrcamentos(updated);
    toast({ title: `Status atualizado para ${statusConfig[newStatus]?.label}` });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Deseja excluir este orçamento?')) return;
    saveOrcamentos(orcamentos.filter(o => o.id !== id));
    toast({ title: 'Orçamento excluído!' });
  };

  const handleDuplicate = (orc: Orcamento) => {
    const dup: Orcamento = {
      ...orc,
      id: crypto.randomUUID(),
      numero: generateNumero(),
      status: 'rascunho',
      created_at: new Date().toISOString(),
    };
    saveOrcamentos([dup, ...orcamentos]);
    toast({ title: 'Orçamento duplicado!' });
  };

  const handleSelectPatient = (patientId: string) => {
    const p = patients.find(x => x.id === patientId);
    if (p) setForm({ ...form, paciente_nome: p.name, paciente_telefone: p.phone || '', paciente_email: p.email || '' });
  };

  const filtered = orcamentos.filter(o => {
    const matchSearch = o.paciente_nome.toLowerCase().includes(search.toLowerCase()) ||
      o.numero.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = {
    total: orcamentos.length,
    aprovados: orcamentos.filter(o => o.status === 'aprovado').length,
    pendentes: orcamentos.filter(o => o.status === 'enviado' || o.status === 'rascunho').length,
    valorAprovado: orcamentos.filter(o => o.status === 'aprovado').reduce((s, o) => s + o.total, 0),
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-foreground">Orçamentos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Novo Orçamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {/* Patient selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paciente / Cliente</Label>
                  <Select onValueChange={handleSelectPatient}>
                    <SelectTrigger><SelectValue placeholder="Selecionar paciente" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Ou digite o nome" value={form.paciente_nome} onChange={e => setForm({ ...form, paciente_nome: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Select onValueChange={v => { const pr = professionals.find(x => x.id === v); if (pr) setForm({ ...form, profissional_nome: pr.full_name }); }}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.paciente_telefone} onChange={e => setForm({ ...form, paciente_telefone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={form.paciente_email} onChange={e => setForm({ ...form, paciente_email: e.target.value })} />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Itens do Orçamento</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1"><Plus className="h-3 w-3" />Item</Button>
                </div>
                {form.items.map((item: OrcamentoItem, idx: number) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px_120px_40px] gap-2 items-end">
                    <div>
                      {idx === 0 && <Label className="text-xs">Descrição</Label>}
                      <Input placeholder="Procedimento / Serviço" value={item.descricao} onChange={e => handleItemChange(idx, 'descricao', e.target.value)} />
                    </div>
                    <div>
                      {idx === 0 && <Label className="text-xs">Qtd</Label>}
                      <Input type="number" min={1} value={item.quantidade} onChange={e => handleItemChange(idx, 'quantidade', Number(e.target.value))} />
                    </div>
                    <div>
                      {idx === 0 && <Label className="text-xs">Valor Unit.</Label>}
                      <Input type="number" min={0} step={0.01} value={item.valor_unitario} onChange={e => handleItemChange(idx, 'valor_unitario', Number(e.target.value))} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleRemoveItem(idx)} disabled={form.items.length <= 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="text-right text-sm font-medium text-muted-foreground">
                  Subtotal: {formatCurrency(calcSubtotal(form.items))}
                </div>
              </div>

              {/* Payment & discount */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Desconto (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={form.desconto} onChange={e => setForm({ ...form, desconto: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Forma Pagamento</Label>
                  <Select value={form.forma_pagamento} onValueChange={v => setForm({ ...form, forma_pagamento: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(pm => <SelectItem key={pm.id} value={pm.nome}>{pm.nome}</SelectItem>)}
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Parcelas</Label>
                  <Input type="number" min={1} max={24} value={form.parcelas} onChange={e => setForm({ ...form, parcelas: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Validade</Label>
                  <Input type="date" value={form.validade} onChange={e => setForm({ ...form, validade: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} placeholder="Condições, notas adicionais..." />
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-lg font-bold text-foreground">
                  Total: {formatCurrency(calcSubtotal(form.items) - (form.desconto || 0))}
                </div>
                <Button onClick={handleSave}>Criar Orçamento</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
              <div><div className="text-2xl font-bold">{totals.total}</div><div className="text-xs text-muted-foreground">Total</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
              <div><div className="text-2xl font-bold">{totals.aprovados}</div><div className="text-xs text-muted-foreground">Aprovados</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-600" /></div>
              <div><div className="text-2xl font-bold">{totals.pendentes}</div><div className="text-xs text-muted-foreground">Pendentes</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><DollarSign className="h-5 w-5 text-blue-600" /></div>
              <div><div className="text-xl font-bold">{formatCurrency(totals.valorAprovado)}</div><div className="text-xs text-muted-foreground">Valor Aprovado</div></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por paciente ou número..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="recusado">Recusado</SelectItem>
            <SelectItem value="expirado">Expirado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(orc => {
              const sc = statusConfig[orc.status];
              const Icon = sc?.icon;
              return (
                <TableRow key={orc.id}>
                  <TableCell className="font-mono text-xs">{orc.numero}</TableCell>
                  <TableCell className="font-medium">{orc.paciente_nome}</TableCell>
                  <TableCell className="text-muted-foreground">{orc.profissional_nome || '—'}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(orc.total)}</TableCell>
                  <TableCell>
                    <Badge variant={sc?.variant || 'secondary'} className="gap-1">
                      {Icon && <Icon className="h-3 w-3" />}{sc?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(orc.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(orc); setViewOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(orc)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(orc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum orçamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Orçamento {selected.numero}</span>
                  <Badge variant={statusConfig[selected.status]?.variant || 'secondary'}>
                    {statusConfig[selected.status]?.label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Paciente:</span> <span className="font-medium">{selected.paciente_nome}</span></div>
                  <div><span className="text-muted-foreground">Profissional:</span> <span className="font-medium">{selected.profissional_nome || '—'}</span></div>
                  <div><span className="text-muted-foreground">Telefone:</span> {selected.paciente_telefone || '—'}</div>
                  <div><span className="text-muted-foreground">Email:</span> {selected.paciente_email || '—'}</div>
                  {selected.validade && <div><span className="text-muted-foreground">Validade:</span> {new Date(selected.validade).toLocaleDateString('pt-BR')}</div>}
                  {selected.forma_pagamento && <div><span className="text-muted-foreground">Pagamento:</span> {selected.forma_pagamento} ({selected.parcelas}x)</div>}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell className="text-center">{item.quantidade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.quantidade * item.valor_unitario)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="space-y-1 text-sm text-right">
                  <div>Subtotal: {formatCurrency(selected.subtotal)}</div>
                  {selected.desconto > 0 && <div className="text-destructive">Desconto: -{formatCurrency(selected.desconto)}</div>}
                  <div className="text-lg font-bold text-foreground">Total: {formatCurrency(selected.total)}</div>
                </div>

                {selected.observacoes && (
                  <div className="text-sm"><span className="text-muted-foreground">Observações:</span> {selected.observacoes}</div>
                )}

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.status === 'rascunho' && (
                    <Button size="sm" onClick={() => { handleStatusChange(selected.id, 'enviado'); setSelected({ ...selected, status: 'enviado' }); }} className="gap-1">
                      <Send className="h-3.5 w-3.5" />Marcar como Enviado
                    </Button>
                  )}
                  {(selected.status === 'enviado' || selected.status === 'rascunho') && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { handleStatusChange(selected.id, 'aprovado'); setSelected({ ...selected, status: 'aprovado' }); }} className="gap-1 text-green-600 border-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { handleStatusChange(selected.id, 'recusado'); setSelected({ ...selected, status: 'recusado' }); }} className="gap-1 text-destructive border-destructive">
                        <XCircle className="h-3.5 w-3.5" />Recusar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orcamentos;
