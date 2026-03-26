import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Pencil, Users, DollarSign, AlertCircle, CheckCircle, Calculator,
  Send, TrendingUp, TrendingDown, Percent, MessageCircle, Eye,
  ArrowUpRight, ArrowDownRight, BarChart3, Clock, XCircle
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Socios = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [openPartner, setOpenPartner] = useState(false);
  const [openCost, setOpenCost] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ status: 'ativo' });
  const [costForm, setCostForm] = useState<any>({});
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [partnerDetail, setPartnerDetail] = useState<any>(null);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    const [pRes, iRes, cRes] = await Promise.all([
      supabase.from('partners').select('*').order('name'),
      supabase.from('partner_invoices').select('*, partners(name, email, phone)').order('created_at', { ascending: false }),
      supabase.from('partner_costs').select('*').order('created_at', { ascending: false }),
    ]);
    setPartners(pRes.data || []);
    setInvoices(iRes.data || []);
    setCosts(cRes.data || []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('socios-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_invoices' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_costs' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // Computed stats
  const activePartners = partners.filter(p => p.status === 'ativo');
  const now = new Date();
  const currentMonthRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthInvoices = invoices.filter(i => i.reference_month === currentMonthRef);
  const totalRevenue = currentMonthInvoices.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.amount), 0);
  const totalPending = currentMonthInvoices.filter(i => i.status === 'pendente').reduce((s, i) => s + Number(i.amount), 0);
  const totalCollectedAll = invoices.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.amount), 0);
  const totalPendingAll = invoices.filter(i => i.status === 'pendente').reduce((s, i) => s + Number(i.amount), 0);

  const currentMonthCost = costs.find(c => c.reference_month === currentMonthRef);
  const totalCostMonth = currentMonthCost ? Number(currentMonthCost.total_value) : 0;
  const avgPerPartner = activePartners.length > 0 && totalCostMonth > 0
    ? totalCostMonth / activePartners.length : 0;

  const overdueInvoices = invoices.filter(i => i.status === 'pendente' && new Date(i.due_date) < now);
  const inadimplenciaRate = currentMonthInvoices.length > 0
    ? Math.round((currentMonthInvoices.filter(i => i.status === 'pendente' && new Date(i.due_date) < now).length / currentMonthInvoices.length) * 100)
    : 0;

  // Save partner
  const handleSavePartner = async () => {
    if (!form.name || !form.email || !form.phone || !form.cpf) {
      toast({ title: 'Preencha todos os campos', description: 'Nome, e-mail, telefone e CPF são obrigatórios.', variant: 'destructive' });
      return;
    }
    const payload = {
      name: form.name, email: form.email, phone: form.phone, cpf: form.cpf,
      share_percentage: form.share_percentage, status: form.status,
    };
    const { error } = editing
      ? await supabase.from('partners').update(payload as any).eq('id', editing.id)
      : await supabase.from('partners').insert(payload as any);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'Sócio atualizado!' : 'Sócio adicionado!' });
    setOpenPartner(false); setEditing(null); setForm({ status: 'ativo' }); fetchAll();
  };

  // Launch monthly cost
  const handleLaunchCost = async () => {
    if (!costForm.total_value || !costForm.reference_month) return;
    setLaunching(true);
    try {
      const active = partners.filter(p => p.status === 'ativo');
      if (active.length === 0) {
        toast({ title: 'Erro', description: 'Nenhum sócio ativo para ratear.', variant: 'destructive' });
        return;
      }
      const totalValue = Number(costForm.total_value);
      const valuePerPartner = Math.round((totalValue / active.length) * 100) / 100;

      const { data: costData, error: costError } = await supabase.from('partner_costs').insert({
        total_value: totalValue,
        reference_month: costForm.reference_month,
        description: costForm.description || null,
        num_partners: active.length,
        value_per_partner: valuePerPartner,
      } as any).select().single();

      if (costError) {
        toast({ title: 'Erro', description: costError.message.includes('unique') || costError.message.includes('duplicate') ? 'Já existe lançamento para este mês.' : costError.message, variant: 'destructive' });
        return;
      }

      const dueDate = costForm.due_date || `${year}-${month}-05`;

      const invoiceInserts = active.map(p => ({
        partner_id: p.id, cost_id: costData.id, amount: valuePerPartner,
        reference_month: costForm.reference_month, due_date: dueDate,
        status: 'pendente', payment_link: `https://paypal.me/integracoworking/${valuePerPartner}`,
      }));

      const { error: invError } = await supabase.from('partner_invoices').insert(invoiceInserts as any);
      if (invError) { toast({ title: 'Erro', description: invError.message, variant: 'destructive' }); return; }

      toast({
        title: '✅ Rateio gerado com sucesso!',
        description: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ÷ ${active.length} = R$ ${valuePerPartner.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/sócio`,
      });
      setOpenCost(false); setCostForm({}); fetchAll();
    } finally { setLaunching(false); }
  };

  const markAsPaid = async (invoiceId: string) => {
    await supabase.from('partner_invoices').update({ status: 'pago', paid_at: new Date().toISOString() } as any).eq('id', invoiceId);
    toast({ title: 'Pagamento confirmado!' }); fetchAll();
  };

  const sendWhatsAppCharge = (inv: any) => {
    const phone = (inv.partners?.phone || '').replace(/\D/g, '');
    if (!phone) { toast({ title: 'Sem telefone', variant: 'destructive' }); return; }
    const msg = `Olá ${inv.partners?.name}! 💰\n\nSua cobrança de *R$ ${Number(inv.amount).toFixed(2)}* referente a *${formatMonth(inv.reference_month)}* está ${inv.status === 'pendente' ? 'pendente' : 'paga'}.\n\n📅 Vencimento: ${new Date(inv.due_date).toLocaleDateString('pt-BR')}\n🔗 Link: ${inv.payment_link || ''}\n\nInstituto Integra`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getMonthOptions = () => {
    const options = [];
    for (let i = -2; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  };

  const filteredInvoices = useMemo(() => {
    if (selectedMonth === 'all') return invoices;
    return invoices.filter(i => i.reference_month === selectedMonth);
  }, [invoices, selectedMonth]);

  const formatMonth = (ref: string) => {
    const [y, m] = ref.split('-');
    const d = new Date(Number(y), Number(m) - 1);
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const getInvoiceStatusInfo = (inv: any) => {
    if (inv.status === 'pago') return { color: 'bg-emerald-500/15 text-emerald-700 border-emerald-300', label: '✅ Pago', daysInfo: '' };
    const dueDate = new Date(inv.due_date);
    const diff = differenceInDays(dueDate, now);
    if (diff < 0) return { color: 'bg-red-500/15 text-red-700 border-red-300', label: `🔴 Atrasado`, daysInfo: `${Math.abs(diff)} dia(s) em atraso` };
    if (diff <= 3) return { color: 'bg-amber-500/15 text-amber-700 border-amber-300', label: '🟡 Próximo', daysInfo: `Vence em ${diff} dia(s)` };
    return { color: 'bg-amber-500/10 text-amber-600 border-amber-200', label: '⏳ Pendente', daysInfo: `Vence em ${diff} dia(s)` };
  };

  // Partner detail data
  const partnerInvoices = partnerDetail ? invoices.filter(i => i.partner_id === partnerDetail.id) : [];
  const partnerPaid = partnerInvoices.filter(i => i.status === 'pago');
  const partnerPending = partnerInvoices.filter(i => i.status === 'pendente');
  const partnerTotalPaid = partnerPaid.reduce((s, i) => s + Number(i.amount), 0);
  const partnerTotalPending = partnerPending.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-display text-foreground">Sócios & Rateio</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Painel financeiro inteligente</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={openCost} onOpenChange={setOpenCost}>
            <DialogTrigger asChild>
              <Button className="gap-1.5">
                <Calculator className="h-4 w-4" /> Lançar Custo Mensal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Lançar Custo Mensal</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Valor Total (R$)</Label><Input type="number" placeholder="3500.00" value={costForm.total_value || ''} onChange={e => setCostForm({ ...costForm, total_value: e.target.value })} /></div>
                <div>
                  <Label>Mês de Referência</Label>
                  <Select value={costForm.reference_month || ''} onValueChange={v => setCostForm({ ...costForm, reference_month: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o mês" /></SelectTrigger>
                    <SelectContent>{getMonthOptions().map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Descrição (opcional)</Label><Input placeholder="Aluguel + manutenção" value={costForm.description || ''} onChange={e => setCostForm({ ...costForm, description: e.target.value })} /></div>
                {costForm.total_value && activePartners.length > 0 && (
                  <div className="rounded-lg bg-muted/50 border p-4 space-y-2">
                    <p className="text-sm font-medium">Prévia do rateio:</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Total</span><p className="font-semibold tabular-nums">R$ {Number(costForm.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                      <div><span className="text-muted-foreground">Sócios ativos</span><p className="font-semibold">{activePartners.length}</p></div>
                      <div><span className="text-muted-foreground">Valor/sócio</span><p className="font-semibold tabular-nums text-primary">R$ {(Number(costForm.total_value) / activePartners.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                    </div>
                  </div>
                )}
                <Button onClick={handleLaunchCost} className="w-full" disabled={launching || !costForm.total_value || !costForm.reference_month}>
                  {launching ? 'Gerando rateio...' : 'Gerar Rateio e Cobranças'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openPartner} onOpenChange={setOpenPartner}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => { setEditing(null); setForm({ status: 'ativo' }); }} className="gap-1.5">
                <Plus className="h-4 w-4" /> Novo Sócio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar Sócio' : 'Novo Sócio'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome completo</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>E-mail</Label><Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Telefone</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>CPF</Label><Input value={form.cpf || ''} onChange={e => setForm({ ...form, cpf: e.target.value })} /></div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status || 'ativo'} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSavePartner} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards - 5 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tabular-nums truncate">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-muted-foreground">Receita do mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tabular-nums truncate">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-muted-foreground">Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <Percent className="h-4 w-4 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tabular-nums">{inadimplenciaRate}%</p>
                <p className="text-[10px] text-muted-foreground">Inadimplência</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <TrendingDown className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tabular-nums truncate">R$ {totalCostMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-muted-foreground">Custo do mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tabular-nums truncate">R$ {avgPerPartner.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-muted-foreground">Média/sócio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue alert */}
      {overdueInvoices.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">{overdueInvoices.length} cobrança(s) em atraso</p>
              <p className="text-xs text-red-600/80">Total: R$ {overdueInvoices.reduce((s, i) => s + Number(i.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto text-xs border-red-200 text-red-700 hover:bg-red-100" onClick={() => setSelectedMonth('all')}>
              Ver todas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Cobranças</TabsTrigger>
          <TabsTrigger value="partners" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Sócios</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Histórico</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-3">
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground">Mês:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[220px] h-9"><SelectValue placeholder="Todos os meses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {[...new Set(invoices.map(i => i.reference_month))].sort().reverse().map(m => (
                  <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sócio</TableHead>
                  <TableHead>Mês</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv: any) => {
                  const statusInfo = getInvoiceStatusInfo(inv);
                  return (
                    <TableRow key={inv.id} className={inv.status === 'pendente' && new Date(inv.due_date) < now ? 'bg-red-50/30 dark:bg-red-950/10' : ''}>
                      <TableCell className="font-medium">{inv.partners?.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatMonth(inv.reference_month)}</TableCell>
                      <TableCell className="tabular-nums font-medium">R$ {Number(inv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm">{new Date(inv.due_date).toLocaleDateString('pt-BR')}</span>
                          {statusInfo.daysInfo && <p className="text-[10px] text-muted-foreground">{statusInfo.daysInfo}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.status === 'pendente' && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-emerald-700" onClick={() => markAsPaid(inv.id)}>
                              <CheckCircle className="h-3 w-3" /> Pagar
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-emerald-700" onClick={() => sendWhatsAppCharge(inv)}>
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          {inv.payment_link && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                              navigator.clipboard.writeText(inv.payment_link);
                              toast({ title: 'Link copiado!' });
                            }}>
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma cobrança encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {partners.map(p => {
              const pInvoices = invoices.filter(i => i.partner_id === p.id);
              const paid = pInvoices.filter(i => i.status === 'pago').length;
              const pending = pInvoices.filter(i => i.status === 'pendente').length;
              const overdue = pInvoices.filter(i => i.status === 'pendente' && new Date(i.due_date) < now).length;
              const totalPaidAmount = pInvoices.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.amount), 0);

              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPartnerDetail(p)}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{p.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">{p.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={`text-[10px] ${p.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}`}>
                        {p.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditing(p); setForm(p); setOpenPartner(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex gap-3 text-xs">
                      {paid > 0 && <span className="text-emerald-600">✅ {paid} pago(s)</span>}
                      {pending > 0 && <span className="text-amber-600">⏳ {pending} pendente(s)</span>}
                      {overdue > 0 && <span className="text-red-600">🔴 {overdue} atrasado(s)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total pago: <span className="font-semibold text-foreground tabular-nums">R$ {totalPaidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {partners.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum sócio cadastrado.</div>}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Custo Total</TableHead>
                  <TableHead>Sócios</TableHead>
                  <TableHead>Valor/Sócio</TableHead>
                  <TableHead>Arrecadado</TableHead>
                  <TableHead>Pendente</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((c: any) => {
                  const monthInvs = invoices.filter(i => i.reference_month === c.reference_month);
                  const collected = monthInvs.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.amount), 0);
                  const pendingAmt = monthInvs.filter(i => i.status === 'pendente').reduce((s, i) => s + Number(i.amount), 0);

                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{formatMonth(c.reference_month)}</TableCell>
                      <TableCell className="tabular-nums">R$ {Number(c.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{c.num_partners}</TableCell>
                      <TableCell className="tabular-nums text-primary font-medium">R$ {Number(c.value_per_partner).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="tabular-nums text-emerald-600">R$ {collected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="tabular-nums text-red-600">R$ {pendingAmt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{c.description || '—'}</TableCell>
                    </TableRow>
                  );
                })}
                {costs.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum rateio lançado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Partner Detail Dialog */}
      <Dialog open={!!partnerDetail} onOpenChange={() => setPartnerDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{partnerDetail?.name?.charAt(0)}</span>
              </div>
              {partnerDetail?.name}
            </DialogTitle>
          </DialogHeader>
          {partnerDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span><p className="font-medium">{partnerDetail.email}</p></div>
                <div><span className="text-muted-foreground">Telefone:</span><p className="font-medium">{partnerDetail.phone}</p></div>
                <div><span className="text-muted-foreground">CPF:</span><p className="font-medium">{partnerDetail.cpf}</p></div>
                <div><span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className={partnerDetail.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}>{partnerDetail.status}</Badge>
                </div>
              </div>

              {/* Financial summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
                  <p className="text-lg font-bold tabular-nums text-emerald-700">R$ {partnerTotalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-emerald-600">Total pago</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
                  <p className="text-lg font-bold tabular-nums text-amber-700">R$ {partnerTotalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-amber-600">Pendente</p>
                </div>
                <div className="rounded-lg bg-primary/5 p-3 text-center">
                  <p className="text-lg font-bold tabular-nums text-primary">{partnerInvoices.length}</p>
                  <p className="text-[10px] text-muted-foreground">Total cobranças</p>
                </div>
              </div>

              {/* Payment history */}
              <div>
                <p className="text-sm font-semibold mb-2">Histórico de pagamentos</p>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1.5">
                    {partnerInvoices.map(inv => {
                      const si = getInvoiceStatusInfo(inv);
                      return (
                        <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg border text-xs">
                          <div>
                            <span className="font-medium">{formatMonth(inv.reference_month)}</span>
                            <span className="text-muted-foreground ml-2">R$ {Number(inv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] ${si.color}`}>{si.label}</Badge>
                            {inv.status === 'pendente' && (
                              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => markAsPaid(inv.id)}>
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {partnerInvoices.length === 0 && <p className="text-center py-4 text-muted-foreground text-xs">Nenhuma cobrança.</p>}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Socios;
