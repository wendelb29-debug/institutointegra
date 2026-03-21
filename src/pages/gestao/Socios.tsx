import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Users, DollarSign, AlertCircle, CheckCircle, Calculator, Send } from 'lucide-react';

const Socios = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [openPartner, setOpenPartner] = useState(false);
  const [openCost, setOpenCost] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ status: 'ativo' });
  const [costForm, setCostForm] = useState<any>({});
  const [selectedMonth, setSelectedMonth] = useState('');
  const [launching, setLaunching] = useState(false);
  const { toast } = useToast();

  const fetchAll = async () => {
    const [pRes, iRes, cRes] = await Promise.all([
      supabase.from('partners').select('*').order('name'),
      supabase.from('partner_invoices').select('*, partners(name, email)').order('created_at', { ascending: false }),
      supabase.from('partner_costs').select('*').order('created_at', { ascending: false }),
    ]);
    setPartners(pRes.data || []);
    setInvoices(iRes.data || []);
    setCosts(cRes.data || []);
  };

  useEffect(() => { fetchAll(); }, []);

  // Stats
  const activePartners = partners.filter(p => p.status === 'ativo');
  const totalCollected = invoices.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.amount), 0);
  const totalPending = invoices.filter(i => i.status === 'pendente').reduce((s, i) => s + Number(i.amount), 0);

  // Save partner
  const handleSavePartner = async () => {
    if (!form.name || !form.email || !form.phone || !form.cpf) {
      toast({ title: 'Preencha todos os campos', description: 'Nome, e-mail, telefone e CPF são obrigatórios.', variant: 'destructive' });
      return;
    }
    if (editing) {
      const { error } = await supabase.from('partners').update({
        name: form.name, email: form.email, phone: form.phone, cpf: form.cpf,
        share_percentage: form.share_percentage, status: form.status,
      } as any).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('partners').insert({
        name: form.name, email: form.email, phone: form.phone, cpf: form.cpf,
        share_percentage: form.share_percentage, status: form.status,
      } as any);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: editing ? 'Sócio atualizado!' : 'Sócio adicionado!' });
    setOpenPartner(false); setEditing(null); setForm({ status: 'ativo' }); fetchAll();
  };

  // Launch monthly cost + auto-split
  const handleLaunchCost = async () => {
    if (!costForm.total_value || !costForm.reference_month) return;
    setLaunching(true);

    try {
      const active = partners.filter(p => p.status === 'ativo');
      if (active.length === 0) {
        toast({ title: 'Erro', description: 'Nenhum sócio ativo para ratear.', variant: 'destructive' });
        setLaunching(false);
        return;
      }

      const totalValue = Number(costForm.total_value);
      const valuePerPartner = Math.round((totalValue / active.length) * 100) / 100;

      // Create cost entry
      const { data: costData, error: costError } = await supabase.from('partner_costs').insert({
        total_value: totalValue,
        reference_month: costForm.reference_month,
        description: costForm.description || null,
        num_partners: active.length,
        value_per_partner: valuePerPartner,
      } as any).select().single();

      if (costError) {
        if (costError.message.includes('unique') || costError.message.includes('duplicate')) {
          toast({ title: 'Erro', description: 'Já existe um lançamento para este mês.', variant: 'destructive' });
        } else {
          toast({ title: 'Erro', description: costError.message, variant: 'destructive' });
        }
        setLaunching(false);
        return;
      }

      // Parse reference_month to get due date (day 05)
      const [year, month] = costForm.reference_month.split('-');
      const dueDate = `${year}-${month}-05`;

      // Create invoices for each active partner
      const invoiceInserts = active.map(p => ({
        partner_id: p.id,
        cost_id: costData.id,
        amount: valuePerPartner,
        reference_month: costForm.reference_month,
        due_date: dueDate,
        status: 'pendente',
        payment_link: `https://paypal.me/integracoworking/${valuePerPartner}`,
      }));

      const { error: invError } = await supabase.from('partner_invoices').insert(invoiceInserts as any);
      if (invError) {
        toast({ title: 'Erro ao gerar faturas', description: invError.message, variant: 'destructive' });
        setLaunching(false);
        return;
      }

      toast({
        title: '✅ Rateio gerado com sucesso!',
        description: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} dividido entre ${active.length} sócios = R$ ${valuePerPartner.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cada`,
      });

      setOpenCost(false);
      setCostForm({});
      fetchAll();
    } finally {
      setLaunching(false);
    }
  };

  // Mark as paid
  const markAsPaid = async (invoiceId: string) => {
    const { error } = await supabase.from('partner_invoices')
      .update({ status: 'pago', paid_at: new Date().toISOString() } as any)
      .eq('id', invoiceId);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Pagamento confirmado!' });
    fetchAll();
  };

  // Get current month reference options
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  };

  // Filter invoices by month
  const filteredInvoices = selectedMonth
    ? invoices.filter(i => i.reference_month === selectedMonth)
    : invoices;

  const formatMonth = (ref: string) => {
    const [y, m] = ref.split('-');
    const d = new Date(Number(y), Number(m) - 1);
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Sócios & Rateio</h1>
        <div className="flex gap-2">
          <Dialog open={openCost} onOpenChange={setOpenCost}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Calculator className="h-4 w-4" /> Lançar Custo Mensal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Lançar Custo Mensal</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Valor Total (R$)</Label>
                  <Input
                    type="number"
                    placeholder="3500.00"
                    value={costForm.total_value || ''}
                    onChange={e => setCostForm({ ...costForm, total_value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mês de Referência</Label>
                  <Select value={costForm.reference_month || ''} onValueChange={v => setCostForm({ ...costForm, reference_month: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o mês" /></SelectTrigger>
                    <SelectContent>
                      {getMonthOptions().map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    placeholder="Aluguel + manutenção"
                    value={costForm.description || ''}
                    onChange={e => setCostForm({ ...costForm, description: e.target.value })}
                  />
                </div>

                {/* Preview */}
                {costForm.total_value && activePartners.length > 0 && (
                  <div className="rounded-lg bg-muted/50 border border-border/40 p-4 space-y-2">
                    <p className="text-sm font-medium">Prévia do rateio:</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total</span>
                        <p className="font-semibold tabular-nums">R$ {Number(costForm.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sócios ativos</span>
                        <p className="font-semibold">{activePartners.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor/sócio</span>
                        <p className="font-semibold tabular-nums text-primary">
                          R$ {(Number(costForm.total_value) / activePartners.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
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
              <Button variant="outline" onClick={() => { setEditing(null); setForm({ status: 'ativo' }); }} className="gap-2">
                <Plus className="h-4 w-4" /> Novo Sócio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar Sócio' : 'Novo Sócio'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nome completo</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>E-mail</Label><Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>CPF</Label><Input value={form.cpf || ''} onChange={e => setForm({ ...form, cpf: e.target.value })} /></div>
                  <div className="space-y-2">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{activePartners.length}</p>
                <p className="text-xs text-muted-foreground">Sócios ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">R$ {totalCollected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">Total arrecadado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-destructive/8 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">Total pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/8 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{costs.length}</p>
                <p className="text-xs text-muted-foreground">Rateios lançados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Cobranças</TabsTrigger>
          <TabsTrigger value="partners">Sócios</TabsTrigger>
          <TabsTrigger value="history">Histórico de Rateios</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Month filter */}
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground">Filtrar por mês:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todos os meses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {[...new Set(invoices.map(i => i.reference_month))].map(m => (
                  <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border/60 overflow-hidden">
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
                {(selectedMonth === 'all' ? invoices : filteredInvoices).map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.partners?.name}</TableCell>
                    <TableCell>{formatMonth(inv.reference_month)}</TableCell>
                    <TableCell className="tabular-nums">R$ {Number(inv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{new Date(inv.due_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={inv.status === 'pago' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}>
                        {inv.status === 'pago' ? '✅ Pago' : '❌ Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {inv.status === 'pendente' && (
                          <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => markAsPaid(inv.id)}>
                            <CheckCircle className="h-3.5 w-3.5" /> Confirmar
                          </Button>
                        )}
                        {inv.payment_link && (
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => {
                            navigator.clipboard.writeText(inv.payment_link);
                            toast({ title: 'Link copiado!' });
                          }}>
                            <Send className="h-3.5 w-3.5" /> Link
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredInvoices.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma cobrança gerada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map(p => (
              <Card key={p.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">{p.name}</CardTitle>
                    <Badge variant="outline" className={p.status === 'ativo' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}>
                      {p.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(p); setForm(p); setOpenPartner(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  {p.email && <p>{p.email}</p>}
                  {p.phone && <p>{p.phone}</p>}
                  {/* Show invoice status for this partner */}
                  {(() => {
                    const partnerInvoices = invoices.filter(i => i.partner_id === p.id);
                    const paid = partnerInvoices.filter(i => i.status === 'pago').length;
                    const pending = partnerInvoices.filter(i => i.status === 'pendente').length;
                    return (
                      <div className="flex gap-3 pt-1 text-xs">
                        {paid > 0 && <span className="text-primary">✅ {paid} pago(s)</span>}
                        {pending > 0 && <span className="text-destructive">❌ {pending} pendente(s)</span>}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
            {partners.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum sócio cadastrado.</div>}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Sócios</TableHead>
                  <TableHead>Valor/Sócio</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{formatMonth(c.reference_month)}</TableCell>
                    <TableCell className="tabular-nums">R$ {Number(c.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{c.num_partners}</TableCell>
                    <TableCell className="tabular-nums text-primary font-medium">R$ {Number(c.value_per_partner).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-muted-foreground">{c.description || '—'}</TableCell>
                  </TableRow>
                ))}
                {costs.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum rateio lançado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Socios;
