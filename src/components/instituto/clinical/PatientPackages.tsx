import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, CheckCircle } from 'lucide-react';

export function PatientPackages({ patientId }: { patientId: string }) {
  const [packages, setPackages] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', total_sessions: 10, price: 0 });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetch_ = async () => {
    const { data } = await supabase.from('patient_packages').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    setPackages(data || []);
  };
  useEffect(() => { fetch_(); }, [patientId]);

  const handleSave = async () => {
    if (!form.name || !user) return;
    const { error } = await supabase.from('patient_packages').insert({
      patient_id: patientId, psychologist_id: user.id,
      name: form.name, total_sessions: form.total_sessions, price: form.price,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Pacote criado!' });
    setOpen(false); setForm({ name: '', total_sessions: 10, price: 0 }); fetch_();
  };

  const useSession = async (pkg: any) => {
    if (pkg.used_sessions >= pkg.total_sessions) {
      toast({ title: 'Pacote esgotado', description: 'Todas as sessões foram utilizadas.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('patient_packages').update({ used_sessions: pkg.used_sessions + 1 }).eq('id', pkg.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Sessão registrada!' }); fetch_();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Planos e Pacotes</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Novo Pacote</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Pacote de Sessões</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome do Pacote</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pacote 10 sessões" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Total de Sessões</Label><Input type="number" value={form.total_sessions} onChange={e => setForm({ ...form, total_sessions: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
              </div>
              <Button onClick={handleSave} className="w-full" disabled={!form.name}>Criar Pacote</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {packages.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Nenhum pacote cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {packages.map(pkg => {
              const pct = pkg.total_sessions > 0 ? (pkg.used_sessions / pkg.total_sessions) * 100 : 0;
              const remaining = pkg.total_sessions - pkg.used_sessions;
              return (
                <div key={pkg.id} className="border border-border/60 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{pkg.name}</span>
                    </div>
                    <Badge variant={pkg.is_active ? 'default' : 'secondary'}>{pkg.is_active ? 'Ativo' : 'Encerrado'}</Badge>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pkg.used_sessions}/{pkg.total_sessions} sessões utilizadas</span>
                    <span>{remaining} restantes</span>
                  </div>
                  {pkg.price > 0 && <div className="text-xs text-muted-foreground">Valor: R$ {Number(pkg.price).toFixed(2)}</div>}
                  {pkg.is_active && remaining > 0 && (
                    <Button size="sm" variant="outline" className="gap-1 w-full" onClick={() => useSession(pkg)}>
                      <CheckCircle className="h-3.5 w-3.5" />Registrar Sessão
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
