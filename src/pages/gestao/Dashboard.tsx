import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, DoorOpen, AlertTriangle, CalendarDays, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  monthRevenue: number;
  roomsOccupied: number;
  roomsTotal: number;
  overdueCount: number;
  upcomingReservations: number;
  maintenancePending: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    monthRevenue: 0, roomsOccupied: 0, roomsTotal: 0,
    overdueCount: 0, upcomingReservations: 0, maintenancePending: 0,
  });
  const [revenueByRoom, setRevenueByRoom] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [roomsRes, transRes, reservRes, maintRes] = await Promise.all([
        supabase.from('rooms').select('id, status'),
        supabase.from('financial_transactions').select('amount, type, is_paid, due_date, room_id'),
        supabase.from('reservations').select('id, date, status').gte('date', new Date().toISOString().split('T')[0]),
        supabase.from('maintenance_requests').select('id, status').eq('status', 'pendente'),
      ]);

      const rooms = roomsRes.data || [];
      const trans = transRes.data || [];
      const reserv = reservRes.data || [];
      const maint = maintRes.data || [];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthRevenue = trans
        .filter(t => t.type === 'entrada' && t.is_paid)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const overdueCount = trans.filter(t => !t.is_paid && t.due_date && new Date(t.due_date) < now).length;

      setStats({
        monthRevenue: monthRevenue,
        roomsOccupied: rooms.filter(r => r.status === 'ocupada').length,
        roomsTotal: rooms.length,
        overdueCount,
        upcomingReservations: reserv.filter(r => r.status !== 'cancelada').length,
        maintenancePending: maint.length,
      });

      // Revenue by room (top 6)
      const roomMap: Record<string, number> = {};
      trans.filter(t => t.type === 'entrada' && t.room_id).forEach(t => {
        roomMap[t.room_id!] = (roomMap[t.room_id!] || 0) + Number(t.amount);
      });
      const roomNames = await supabase.from('rooms').select('id, name');
      const nameMap = Object.fromEntries((roomNames.data || []).map(r => [r.id, r.name]));
      const chartData = Object.entries(roomMap)
        .map(([id, val]) => ({ name: nameMap[id] || 'Sala', receita: val }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 6);
      setRevenueByRoom(chartData);
    };

    fetchStats();
  }, []);

  const cards = [
    { title: 'Receita do Mês', value: `R$ ${stats.monthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-primary' },
    { title: 'Salas Ocupadas', value: `${stats.roomsOccupied} / ${stats.roomsTotal}`, icon: DoorOpen, color: 'text-primary' },
    { title: 'Inadimplência', value: `${stats.overdueCount} pendente${stats.overdueCount !== 1 ? 's' : ''}`, icon: AlertTriangle, color: 'text-destructive' },
    { title: 'Próximas Reservas', value: stats.upcomingReservations.toString(), icon: CalendarDays, color: 'text-accent' },
    { title: 'Manutenção', value: `${stats.maintenancePending} aberto${stats.maintenancePending !== 1 ? 's' : ''}`, icon: Wrench, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(card => (
          <Card key={card.title} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {revenueByRoom.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Receita por Sala</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByRoom}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`} />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
