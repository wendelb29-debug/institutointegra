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
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['financial_transactions']['Row'];

const Financeiro = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ type: 'entrada', is_paid: false });
  const { toast } = useToast();

  const fetch_ = async () => {
    const { data } = await supabase.from('financial_transactions').select('*').order('created_at', { ascending: false });
    setTransactions(data || []);
  };

  useEffect(() => { fetch_(); }, []);

  const totalIn = transactions.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = transactions.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0);
  const overdue = transactions.filter(t => !t.is_paid && t.due_date && new Date(t.due_date) < new Date()).length;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Financeiro</h1>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className="text-xl font-semibold text-primary tabular-nums">R$ {totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><p className="text-xl font-semibold text-destructive tabular-nums">R$ {totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atrasos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><p className="text-xl font-semibold tabular-nums">{overdue}</p></CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.description}</TableCell>
                <TableCell><Badge variant="outline" className={t.type === 'entrada' ? 'text-primary' : 'text-destructive'}>{t.type === 'entrada' ? 'Entrada' : 'Saída'}</Badge></TableCell>
                <TableCell className="tabular-nums">R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>{t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : '—'}</TableCell>
                <TableCell><Badge variant="outline" className={t.is_paid ? 'text-primary' : 'text-destructive'}>{t.is_paid ? 'Pago' : 'Pendente'}</Badge></TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma transação registrada.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Financeiro;
