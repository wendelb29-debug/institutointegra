import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, DoorOpen, AlertTriangle, CalendarDays, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardStats {
  monthRevenue: number;
  roomsOccupied: number;
  roomsTotal: number;
  overdueCount: number;
  upcomingReservations: number;
  maintenancePending: number;
}

const CHART_COLORS = [
  'hsl(152, 32%, 36%)',
  'hsl(28, 56%, 52%)',
  'hsl(220, 20%, 46%)',
  'hsl(152, 24%, 55%)',
  'hsl(28, 40%, 65%)',
  'hsl(220, 14%, 60%)',
];

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    monthRevenue: 0, roomsOccupied: 0, roomsTotal: 0,
    overdueCount: 0, upcomingReservations: 0, maintenancePending: 0,
  });
  const [revenueByRoom, setRevenueByRoom] = useState<any[]>([]);
  const [revenueByPartner, setRevenueByPartner] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [roomsRes, transRes, reservRes, maintRes, partnersRes] = await Promise.all([
        supabase.from('rooms').select('id, status'),
        supabase.from('financial_transactions').select('amount, type, is_paid, due_date, room_id, partner_id'),
        supabase.from('reservations').select('id, date, status').gte('date', new Date().toISOString().split('T')[0]),
        supabase.from('maintenance_requests').select('id, status').eq('status', 'pendente'),
        supabase.from('partners').select('id, name'),
      ]);

      const rooms = roomsRes.data || [];
      const trans = transRes.data || [];
      const reserv = reservRes.data || [];
      const maint = maintRes.data || [];
      const partners = partnersRes.data || [];

      const now = new Date();
      const monthRevenue = trans
        .filter(t => t.type === 'entrada' && t.is_paid)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const overdueCount = trans.filter(t => !t.is_paid && t.due_date && new Date(t.due_date) < now).length;

      setStats({
        monthRevenue,
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
      const roomNames = await supabase.from('rooms').select('id, name');
      const nameMap = Object.fromEntries((roomNames.data || []).map(r => [r.id, r.name]));
      const roomChartData = Object.entries(roomMap)
        .map(([id, val]) => ({ name: nameMap[id] || 'Sala', receita: val }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 6);
      setRevenueByRoom(roomChartData);

      // Revenue by partner
      const partnerMap: Record<string, number> = {};
      trans.filter(t => t.type === 'entrada' && t.partner_id).forEach(t => {
        partnerMap[t.partner_id!] = (partnerMap[t.partner_id!] || 0) + Number(t.amount);
      });
      const partnerNameMap = Object.fromEntries(partners.map(p => [p.id, p.name]));
      const partnerChartData = Object.entries(partnerMap)
        .map(([id, val]) => ({ name: partnerNameMap[id] || 'Sócio', value: val }))
        .sort((a, b) => b.value - a.value);
      setRevenueByPartner(partnerChartData);

      setLoading(false);
    };

    fetchStats();
  }, []);

  const cards = [
    { title: 'Receita do Mês', value: `R$ ${stats.monthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/8' },
    { title: 'Salas Ocupadas', value: `${stats.roomsOccupied} / ${stats.roomsTotal}`, icon: DoorOpen, color: 'text-primary', bg: 'bg-primary/8' },
    { title: 'Inadimplência', value: `${stats.overdueCount} pendente${stats.overdueCount !== 1 ? 's' : ''}`, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/8' },
    { title: 'Próximas Reservas', value: stats.upcomingReservations.toString(), icon: CalendarDays, color: 'text-accent', bg: 'bg-accent/8' },
    { title: 'Manutenção', value: `${stats.maintenancePending} aberto${stats.maintenancePending !== 1 ? 's' : ''}`, icon: Wrench, color: 'text-muted-foreground', bg: 'bg-muted' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display text-foreground">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Receita por Sala</CardTitle>
            <p className="text-xs text-muted-foreground">Distribuição de receita entre as salas</p>
          </CardHeader>
          <CardContent className="h-72">
            {revenueByRoom.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByRoom} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR')}`, 'Receita']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma receita registrada por sala
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Receita por Sócio</CardTitle>
            <p className="text-xs text-muted-foreground">Participação de cada sócio na receita</p>
          </CardHeader>
          <CardContent className="h-72">
            {revenueByPartner.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByPartner}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {revenueByPartner.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR')}`, 'Receita']} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma receita vinculada a sócios
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
