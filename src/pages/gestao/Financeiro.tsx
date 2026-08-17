import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['financial_transactions']['Row'];

const Financeiro = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ type: 'entrada', is_paid: false });
  const [periodFilter, setPeriodFilter] = useState('month');
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('financial_transactions').select('*').order('created_at', { ascending: false });
      setTransactions(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch_(); }, []);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let start: Date;
    switch (periodFilter) {
      case 'month': start = startOfMonth(now); break;
      case '3months': start = subMonths(now, 3); break;
      case '6months': start = subMonths(now, 6); break;
      case 'year': start = subMonths(now, 12); break;
      default: return transactions;
    }
    return transactions.filter(t => new Date(t.created_at) >= start);
  }, [transactions, periodFilter]);

  const totalIn = filteredTransactions.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = filteredTransactions.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0);
  const profit = totalIn - totalOut;
  const overdue = filteredTransactions.filter(t => !t.is_paid && t.due_date && new Date(t.due_date) < new Date()).length;

  // Chart data: monthly revenue vs costs (last 6 months)
  const chartData = useMemo(() => {
    const months: { label: string; entradas: number; saidas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const label = format(d, 'MMM', { locale: ptBR });
      const monthTxns = transactions.filter(t => {
        const cd = new Date(t.created_at);
        return cd >= mStart && cd <= mEnd;
      });
      months.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        entradas: monthTxns.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0),
        saidas: monthTxns.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0),
      });
    }
    return months;
  }, [transactions]);

  const handleSave = async () => {
    if (!form.amount || !form.description) return;
    const { error } = await supabase.from('financial_transactions').insert({
      type: form.type, amount: form.amount, description: form.description,
      category: form.category, due_date: form.due_date || null, is_paid: form.is_paid,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Transação registrada!' });
    setOpen(false); setForm({ type: 'entrada', is_paid: false }); fetch_();
  };

  const markPaid = async (id: string) => {
    await supabase.from('financial_transactions').update({ is_paid: true, paid_at: new Date().toISOString() }).eq('id', id);
    toast({ title: 'Marcado como pago!' });
    fetch_();
  };

  const fmtCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const SummaryCard = ({ label, value, icon: Icon, color, isCount }: { label: string; value: number; icon: any; color: string; isCount?: boolean }) => (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <p className={`text-xl font-semibold tabular-nums ${color}`}>
          {isCount ? value : fmtCurrency(value)}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display text-foreground">Financeiro</h1>
        <div className="flex items-center gap-3">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="3months">3 meses</SelectItem>
              <SelectItem value="6months">6 meses</SelectItem>
              <SelectItem value="year">12 meses</SelectItem>
              <SelectItem value="all">Tudo</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Transação</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Descrição</Label><Input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Valor</Label><Input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>Categoria</Label><Input value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Pago?</Label>
                    <Select value={form.is_paid ? 'sim' : 'nao'} onValueChange={v => setForm({ ...form, is_paid: v === 'sim' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="premium-card p-5 h-[100px] flex flex-col justify-between">
              <Skeleton className="h-3 w-20 bg-gold/10" />
              <Skeleton className="h-6 w-32 bg-gold/10" />
            </Card>
          ))
        ) : (
          <>
            <SummaryCard label="Entradas" value={totalIn} icon={TrendingUp} color="text-primary" />
            <SummaryCard label="Saídas" value={totalOut} icon={TrendingDown} color="text-destructive" />
            <SummaryCard label="Lucro Líquido" value={profit} icon={DollarSign} color={profit >= 0 ? 'text-primary' : 'text-destructive'} />
            <SummaryCard label="Atrasos" value={overdue} isCount icon={AlertTriangle} color="text-accent" />
          </>
        )}
      </div>

      {/* Revenue vs Costs Chart */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader><CardTitle className="text-base">Receita vs Custos (últimos 6 meses)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead>
              <TableHead>Categoria</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><Skeleton className="h-6 w-full bg-gold/5" /></TableCell>
                </TableRow>
              ))
            ) : filteredTransactions.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma transação no período.</TableCell></TableRow>
            ) : (
              filteredTransactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.description}</TableCell>
                  <TableCell><Badge variant="outline" className={t.type === 'entrada' ? 'text-primary' : 'text-destructive'}>{t.type === 'entrada' ? 'Entrada' : 'Saída'}</Badge></TableCell>
                  <TableCell className="tabular-nums">{fmtCurrency(Number(t.amount))}</TableCell>
                  <TableCell className="text-muted-foreground">{t.category || '—'}</TableCell>
                  <TableCell>{t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={t.is_paid ? 'text-primary' : (!t.is_paid && t.due_date && new Date(t.due_date) < new Date()) ? 'text-destructive' : 'text-accent'}>
                      {t.is_paid ? 'Pago' : (!t.is_paid && t.due_date && new Date(t.due_date) < new Date()) ? 'Atrasado' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!t.is_paid && (
                      <Button variant="ghost" size="sm" onClick={() => markPaid(t.id)} className="text-xs">
                        Marcar Pago
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Financeiro;
