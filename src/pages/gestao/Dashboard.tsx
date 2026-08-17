import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign, TrendingDown, AlertTriangle, CalendarDays,
  TrendingUp, Percent, ArrowUpRight, Plus,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GOLD = '#C9A96E';
const BLUE = '#4F7EFF';
const RED  = '#E05252';
const GOLD_SCALE = ['#C9A96E', '#B8945A', '#A37F47', '#8E6A36', '#785627', '#62421A'];

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

// --- Premium tooltip ---
const PremiumTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-primary/30 bg-[#1C1C2E] px-3 py-2 shadow-2xl backdrop-blur">
      {label && <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-mono text-foreground ml-auto pl-3">{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// --- Section divider ---
const Divider = () => <div className="gestao-divider" />;

// --- Metric card ---
type MetricProps = {
  label: string;
  value: string;
  icon: any;
  color?: string;
  accent?: 'gold' | 'blue' | 'red';
  hint?: React.ReactNode;
  delay?: number;
};
const MetricCard = ({ label, value, icon: Icon, color = GOLD, hint, delay = 0 }: MetricProps) => (
  <div
    className="premium-card rounded-xl p-5 reveal"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground" style={{ letterSpacing: '0.12em' }}>
          {label}
        </p>
        <p
          className="font-mono mt-3 text-foreground truncate"
          style={{ fontSize: '28px', lineHeight: 1.1, color }}
        >
          {value}
        </p>
        {hint && <div className="mt-3">{hint}</div>}
      </div>
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ml-3"
        style={{ background: `${color}14`, border: `1px solid ${color}26` }}
      >
        <Icon strokeWidth={1.5} className="h-4 w-4" style={{ color }} />
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="premium-card rounded-xl p-5 h-[120px] shimmer" />
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    monthRevenue: 0, monthCosts: 0, roomsOccupied: 0, roomsTotal: 0,
    overdueCount: 0, overdueValue: 0, upcomingReservations: 0,
  });
  const [revenueByRoom, setRevenueByRoom] = useState<any[]>([]);
  const [revenueByPartner, setRevenueByPartner] = useState<any[]>([]);
  const [revenueByType, setRevenueByType] = useState<any[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [roomsRes, transRes, reservRes, partnersRes, contractsRes] = await Promise.all([
          supabase.from('rooms').select('id, name, status'),
          supabase.from('financial_transactions').select('amount, type, is_paid, due_date, room_id, partner_id, created_at'),
          supabase.from('reservations').select('id, date, status').gte('date', new Date().toISOString().split('T')[0]),
          supabase.from('partners').select('id, name'),
          supabase.from('contracts').select('id, monthly_value, contract_type, status').eq('status', 'ativo'),
        ]);

        const rooms = roomsRes.data || [];
        const trans = transRes.data || [];
        const reserv = reservRes.data || [];
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
        const overdue = trans.filter(t => !t.is_paid && t.due_date && new Date(t.due_date) < now);

        setStats({
          monthRevenue, monthCosts,
          roomsOccupied: rooms.filter(r => r.status === 'ocupada').length,
          roomsTotal: rooms.length,
          overdueCount: overdue.length,
          overdueValue: overdue.reduce((s, t) => s + Number(t.amount), 0),
          upcomingReservations: reserv.filter(r => r.status !== 'cancelada').length,
        });

        const roomMap: Record<string, number> = {};
        trans.filter(t => t.type === 'entrada' && t.room_id).forEach(t => {
          roomMap[t.room_id!] = (roomMap[t.room_id!] || 0) + Number(t.amount);
        });
        const nameMap = Object.fromEntries(rooms.map(r => [r.id, r.name]));
        setRevenueByRoom(
          Object.entries(roomMap).map(([id, val]) => ({ name: nameMap[id] || 'Sala', receita: val }))
            .sort((a, b) => b.receita - a.receita).slice(0, 6)
        );

        const partnerMap: Record<string, number> = {};
        trans.filter(t => t.type === 'entrada' && t.partner_id).forEach(t => {
          partnerMap[t.partner_id!] = (partnerMap[t.partner_id!] || 0) + Number(t.amount);
        });
        const partnerNameMap = Object.fromEntries(partners.map(p => [p.id, p.name]));
        setRevenueByPartner(
          Object.entries(partnerMap).map(([id, val]) => ({ name: partnerNameMap[id] || 'Sócio', value: val }))
            .sort((a, b) => b.value - a.value)
        );

        const typeMap: Record<string, number> = { mensalista: 0, diarista: 0, hora: 0 };
        contracts.forEach(c => {
          const type = c.contract_type || 'mensalista';
          typeMap[type] = (typeMap[type] || 0) + Number(c.monthly_value || 0);
        });
        const typeLabels: Record<string, string> = { mensalista: 'Mensalista', diarista: 'Diária', hora: 'Por Hora' };
        setRevenueByType(
          Object.entries(typeMap).filter(([, v]) => v > 0).map(([k, v]) => ({ name: typeLabels[k] || k, value: v }))
        );

        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = subMonths(now, i);
          const ms = startOfMonth(d), me = endOfMonth(d);
          const label = format(d, 'MMM', { locale: ptBR });
          const mt = trans.filter(t => { const cd = new Date(t.created_at); return cd >= ms && cd <= me; });
          months.push({
            label: label.charAt(0).toUpperCase() + label.slice(1),
            entradas: mt.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0),
            saidas: mt.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0),
          });
        }
        setMonthlyChart(months);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const profit = stats.monthRevenue - stats.monthCosts;
  const occupancy = stats.roomsTotal > 0 ? Math.round((stats.roomsOccupied / stats.roomsTotal) * 100) : 0;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 reveal">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pulse-dot" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live · {format(new Date(), "d 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <h1 className="font-display text-foreground" style={{ fontSize: '28px', lineHeight: 1.1 }}>
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Visão executiva do Integra Coworking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden md:inline-flex items-center gap-2 text-xs font-medium text-foreground/80 hover:text-primary transition-colors px-3 py-2 rounded-lg border border-border/60 hover:border-primary/40">
            Este mês
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Top metrics */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <MetricCard
                label="Receita do Mês"
                value={fmtCurrency(stats.monthRevenue)}
                icon={DollarSign}
                color={GOLD}
                delay={0}
              />
              <MetricCard
                label="Custos do Mês"
                value={fmtCurrency(stats.monthCosts)}
                icon={TrendingDown}
                color={RED}
                delay={80}
              />
              <MetricCard
                label="Lucro Líquido"
                value={fmtCurrency(profit)}
                icon={TrendingUp}
                color={profit >= 0 ? BLUE : RED}
                delay={160}
              />
              <MetricCard
                label="Ocupação"
                value={`${occupancy}%`}
                icon={Percent}
                color={GOLD}
                delay={240}
                hint={
                  <div>
                    <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{ width: `${occupancy}%`, background: GOLD }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
                      {stats.roomsOccupied}/{stats.roomsTotal} salas
                    </p>
                  </div>
                }
              />
              <MetricCard
                label="Inadimplência"
                value={stats.overdueCount > 0 ? fmtCurrency(stats.overdueValue) : 'R$ 0,00'}
                icon={AlertTriangle}
                color={stats.overdueCount > 0 ? RED : GOLD}
                delay={320}
                hint={
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {stats.overdueCount} {stats.overdueCount === 1 ? 'cobrança' : 'cobranças'}
                  </span>
                }
              />
              <MetricCard
                label="Próximas Reservas"
                value={String(stats.upcomingReservations).padStart(2, '0')}
                icon={CalendarDays}
                color={BLUE}
                delay={400}
              />
            </>
          )}
        </div>
      </div>

      <Divider />

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="premium-card rounded-xl p-6 lg:col-span-2 reveal">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg text-foreground">Receita vs Custos</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} /> Entradas
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ background: RED }} /> Saídas
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChart} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gSai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6E6E8A', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6E6E8A', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<PremiumTooltip />} cursor={{ stroke: GOLD, strokeOpacity: 0.2 }} />
                <Area type="monotone" dataKey="entradas" name="Entradas" stroke={GOLD} strokeWidth={2} fill="url(#gEnt)" />
                <Area type="monotone" dataKey="saidas" name="Saídas" stroke={RED} strokeWidth={2} fill="url(#gSai)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card rounded-xl p-6 reveal" style={{ animationDelay: '100ms' }}>
          <div className="mb-6">
            <h3 className="font-display text-lg text-foreground">Receita por Sala</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top 6</p>
          </div>
          <div className="h-72">
            {revenueByRoom.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByRoom} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#F0EDE8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(201,169,110,0.05)' }} />
                  <Bar dataKey="receita" name="Receita" radius={[0, 4, 4, 0]} barSize={14}>
                    {revenueByRoom.map((_, i) => <Cell key={i} fill={GOLD_SCALE[i % GOLD_SCALE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            )}
          </div>
        </div>
      </div>

      <Divider />

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="premium-card rounded-xl p-6 reveal">
          <div className="mb-6">
            <h3 className="font-display text-lg text-foreground">Receita por Sócio</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribuição</p>
          </div>
          <div className="h-72">
            {revenueByPartner.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueByPartner} cx="50%" cy="50%" innerRadius={64} outerRadius={96} paddingAngle={3} dataKey="value" stroke="none">
                    {revenueByPartner.map((_, idx) => <Cell key={idx} fill={GOLD_SCALE[idx % GOLD_SCALE.length]} />)}
                  </Pie>
                  <Tooltip content={<PremiumTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={7}
                    formatter={(v: string) => <span className="text-xs text-muted-foreground">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            )}
          </div>
        </div>

        <div className="premium-card rounded-xl p-6 reveal" style={{ animationDelay: '100ms' }}>
          <div className="mb-6">
            <h3 className="font-display text-lg text-foreground">Receita por Tipo de Locação</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Contratos ativos</p>
          </div>
          <div className="space-y-5 mt-4">
            {revenueByType.length > 0 ? (
              (() => {
                const total = revenueByType.reduce((s, x) => s + x.value, 0);
                return revenueByType.map((row, i) => {
                  const pct = total > 0 ? (row.value / total) * 100 : 0;
                  return (
                    <div key={row.name}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-foreground/90">{row.name}</span>
                        <span className="font-mono text-muted-foreground">
                          {fmtCurrency(row.value)} <span className="text-foreground/60 ml-1">· {pct.toFixed(0)}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className="h-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: GOLD_SCALE[i % GOLD_SCALE.length] }}
                        />
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        aria-label="Nova ação"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-20"
        style={{
          background: 'linear-gradient(135deg, #D9B97E 0%, #B8945A 100%)',
          boxShadow: '0 8px 32px rgba(201,169,110,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <Plus strokeWidth={2} className="h-5 w-5" style={{ color: '#0A0A0F' }} />
      </button>
    </div>
  );
};

export default Dashboard;
