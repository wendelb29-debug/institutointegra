import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, DoorOpen, AlertTriangle, CalendarDays, Wrench, TrendingUp, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CHART_COLORS = [
  'hsl(152, 32%, 36%)', 'hsl(28, 56%, 52%)', 'hsl(220, 20%, 46%)',
  'hsl(152, 24%, 55%)', 'hsl(28, 40%, 65%)', 'hsl(220, 14%, 60%)',
];

const Dashboard = () => {
  const [stats, setStats] = useState({
    monthRevenue: 0, monthCosts: 0, roomsOccupied: 0, roomsTotal: 0,
    overdueCount: 0, upcomingReservations: 0, maintenancePending: 0,
  });
  const [revenueByRoom, setRevenueByRoom] = useState<any[]>([]);
  const [revenueByPartner, setRevenueByPartner] = useState<any[]>([]);
  const [revenueByType, setRevenueByType] = useState<any[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [roomsRes, transRes, reservRes, maintRes, partnersRes, contractsRes] = await Promise.all([
        supabase.from('rooms').select('id, name, status, type'),
        supabase.from('financial_transactions').select('amount, type, is_paid, due_date, room_id, partner_id, category, created_at'),
        supabase.from('reservations').select('id, date, status, total_value').gte('date', new Date().toISOString().split('T')[0]),
        supabase.from('maintenance_requests').select('id, status').eq('status', 'pendente'),
        supabase.from('partners').select('id, name'),
        supabase.from('contracts').select('id, monthly_value, contract_type, status').eq('status', 'ativo'),
      ]);

      const rooms = roomsRes.data || [];
      const trans = transRes.data || [];
      const reserv = reservRes.data || [];
      const maint = maintRes.data || [];
      const partners = partnersRes.data || [];
      const contracts = contractsRes.data || [];
      const now = new Date();
      const mStart = startOfMonth(now);
      const mEnd = endOfMonth(now);

      const monthTrans = trans.filter(t => {
        const d = new Date(t.created_at);
        return d >= mStart && d <= mEnd;
      });

      const monthRevenue = monthTrans.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0);
      const monthCosts = monthTrans.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0);
      const overdueCount = trans.filter(t => !t.is_paid && t.due_date && new Date(t.due_date) < now).length;

      setStats({
        monthRevenue, monthCosts,
        roomsOccupied: rooms.filter(r => r.status === 'ocupada').length,
        roomsTotal: rooms.length,
        overdueCount,
        upcomingReservations: reserv.filter(r => r.status !== 'cancelada').length,
        maintenancePending: maint.length,
      });

      // Revenue by room
      const roomMap: Record<string, number> = {};
      trans.filter(t => t.type === 'entrada' && t.room_id).forEach(t => {
        roomMap[t.room_id!] = (roomMap[t.room_id!] || 0) + Number(t.amount);
      });
      const nameMap = Object.fromEntries(rooms.map(r => [r.id, r.name]));
      setRevenueByRoom(
        Object.entries(roomMap).map(([id, val]) => ({ name: nameMap[id] || 'Sala', receita: val }))
          .sort((a, b) => b.receita - a.receita).slice(0, 6)
      );

      // Revenue by partner
      const partnerMap: Record<string, number> = {};
      trans.filter(t => t.type === 'entrada' && t.partner_id).forEach(t => {
        partnerMap[t.partner_id!] = (partnerMap[t.partner_id!] || 0) + Number(t.amount);
      });
      const partnerNameMap = Object.fromEntries(partners.map(p => [p.id, p.name]));
      setRevenueByPartner(
        Object.entries(partnerMap).map(([id, val]) => ({ name: partnerNameMap[id] || 'Sócio', value: val }))
          .sort((a, b) => b.value - a.value)
      );

      // Revenue by contract type
      const typeMap: Record<string, number> = { mensalista: 0, diarista: 0, hora: 0 };
      contracts.forEach(c => {
        const type = c.contract_type || 'mensalista';
        typeMap[type] = (typeMap[type] || 0) + Number(c.monthly_value || 0);
      });
      const typeLabels: Record<string, string> = { mensalista: 'Mensalista', diarista: 'Diária', hora: 'Por Hora' };
      setRevenueByType(
        Object.entries(typeMap).filter(([, v]) => v > 0).map(([k, v]) => ({ name: typeLabels[k] || k, value: v }))
      );

      // Monthly revenue chart (6 months)
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const ms = startOfMonth(d);
        const me = endOfMonth(d);
        const label = format(d, 'MMM', { locale: ptBR });
        const mt = trans.filter(t => { const cd = new Date(t.created_at); return cd >= ms && cd <= me; });
        months.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          entradas: mt.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0),
          saidas: mt.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0),
        });
      }
      setMonthlyChart(months);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const fmtCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const profit = stats.monthRevenue - stats.monthCosts;
  const occupancy = stats.roomsTotal > 0 ? Math.round((stats.roomsOccupied / stats.roomsTotal) * 100) : 0;

  const cards = [
    { title: 'Receita do Mês', value: fmtCurrency(stats.monthRevenue), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/8' },
    { title: 'Custos do Mês', value: fmtCurrency(stats.monthCosts), icon: TrendingUp, color: 'text-destructive', bg: 'bg-destructive/8' },
    { title: 'Lucro Líquido', value: fmtCurrency(profit), icon: DollarSign, color: profit >= 0 ? 'text-primary' : 'text-destructive', bg: profit >= 0 ? 'bg-primary/8' : 'bg-destructive/8' },
    { title: 'Ocupação', value: `${occupancy}% (${stats.roomsOccupied}/${stats.roomsTotal})`, icon: Percent, color: 'text-primary', bg: 'bg-primary/8' },
    { title: 'Inadimplência', value: `${stats.overdueCount}`, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/8' },
    { title: 'Próximas Reservas', value: stats.upcomingReservations.toString(), icon: CalendarDays, color: 'text-accent', bg: 'bg-accent/8' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display text-foreground">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/40 shadow-sm animate-pulse">
              <CardHeader className="pb-2"><div className="h-4 bg-muted rounded w-24" /></CardHeader>
              <CardContent><div className="h-6 bg-muted rounded w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do Integra Coworking</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <Card key={card.title} className="border-border/40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.06)] transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.title}</CardTitle>
              <div className={`h-8 w-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Receita vs Custos (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmtCurrency(v)]} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Receita por Sala</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {revenueByRoom.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByRoom} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(val: number) => [fmtCurrency(val), 'Receita']} />
                  <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Receita por Sócio</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {revenueByPartner.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueByPartner} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {revenueByPartner.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val: number) => [fmtCurrency(val), 'Receita']} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-xs text-foreground">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>}
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Receita por Tipo de Locação</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {revenueByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueByType} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {revenueByType.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val: number) => [fmtCurrency(val), 'Receita']} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-xs text-foreground">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
