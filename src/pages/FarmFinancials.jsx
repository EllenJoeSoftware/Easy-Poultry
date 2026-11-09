import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, Wheat, Loader2, ArrowRight, Egg, Bird, Syringe, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import moment from 'moment';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton } from '@/components/shell/SkeletonCard';
import { createPageUrl } from '../utils';

const C = { moss: '#174D35', leaf: '#287A4C', fresh: '#83AA62', yolk: '#E5A23C', terracotta: '#C8673D', ink: '#16201B' };
const R = (n) => `R${Math.round(n || 0).toLocaleString()}`;

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink text-cream px-3 py-2 text-xs shadow-lift">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p, i) => <p key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />{p.name}: <span className="font-semibold">{R(p.value)}</span></p>)}
    </div>
  );
};

export default function FarmFinancials() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => api.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: batches = [], isLoading: lb } = useQuery({
    queryKey: ['batches-finance', user?.email],
    queryFn: () => api.entities.PoultryBatch.filter({ created_by: user?.email }),
    enabled: !!user,
  });
  const { data: eggProduction = [], isLoading: le } = useQuery({
    queryKey: ['egg-production-finance', user?.email],
    queryFn: () => api.entities.EggProduction.filter({ created_by: user?.email }),
    enabled: !!user,
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ['batch-expenses-finance', user?.email],
    queryFn: () => api.entities.BatchExpense.filter({ created_by: user?.email }),
    enabled: !!user,
  });
  const isLoading = lb || le;

  const totals = useMemo(() => {
    const birdRevenue = batches.reduce((s, b) => s + (b.total_revenue || 0), 0);
    const eggRevenue = eggProduction.reduce((s, e) => s + (e.revenue || 0), 0);
    const feed = batches.reduce((s, b) => s + (b.total_feed_cost || 0), 0);
    const vaccine = batches.reduce((s, b) => s + (b.total_vaccine_cost || 0), 0);
    const other = batches.reduce((s, b) => s + (b.total_other_costs || 0), 0);
    const costs = feed + vaccine + other;
    const revenue = birdRevenue + eggRevenue;
    return { birdRevenue, eggRevenue, feed, vaccine, other, costs, revenue, net: revenue - costs, margin: revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0 };
  }, [batches, eggProduction]);

  // Monthly cash-flow (last 6 months) from egg production + expenses
  const monthly = useMemo(() => {
    const months = [...Array(6)].map((_, i) => moment().subtract(5 - i, 'months').startOf('month'));
    return months.map(m => {
      const key = m.format('YYYY-MM');
      const rev = eggProduction.filter(e => moment(e.production_date).format('YYYY-MM') === key).reduce((s, e) => s + (e.revenue || 0), 0);
      const cost = expenses.filter(e => moment(e.expense_date).format('YYYY-MM') === key).reduce((s, e) => s + (e.amount || 0), 0);
      return { month: m.format('MMM'), Revenue: rev, Costs: cost };
    });
  }, [eggProduction, expenses]);
  const hasMonthly = monthly.some(m => m.Revenue || m.Costs);

  const costSlices = [
    { name: 'Feed', value: totals.feed, fill: C.leaf },
    { name: 'Vaccines', value: totals.vaccine, fill: C.yolk },
    { name: 'Other', value: totals.other, fill: C.terracotta },
  ].filter(s => s.value > 0);

  const batchRows = useMemo(() => batches.map(b => {
    const revenue = b.total_revenue || 0;
    const costs = (b.total_feed_cost || 0) + (b.total_vaccine_cost || 0) + (b.total_other_costs || 0);
    return { ...b, revenue, costs, profit: revenue - costs };
  }).sort((a, b) => b.profit - a.profit), [batches]);

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;

  return (
    <PageShell
      variant="compact"
      eyebrow="Farm"
      title="Financials"
      subtitle="Revenue, costs and margin across every batch — updated from your feed, vaccination and egg records."
      breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Financials' }]}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard icon={Wallet} label="Total revenue" value={R(totals.revenue)} deltaLabel="Birds + eggs" tint="moss" />
            <StatCard icon={TrendingDown} label="Total costs" value={R(totals.costs)} deltaLabel="Feed, vaccines, other" tint="terracotta" />
            <StatCard icon={TrendingUp} label="Net profit" value={R(totals.net)} delta={totals.revenue > 0 ? `${totals.margin.toFixed(0)}%` : undefined} deltaLabel="margin" tint={totals.net >= 0 ? 'moss' : 'terracotta'} />
            <StatCard icon={Wheat} label="Feed share of costs" value={`${totals.costs > 0 ? ((totals.feed / totals.costs) * 100).toFixed(0) : 0}%`} deltaLabel={R(totals.feed)} tint="yolk" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Cash flow */}
        <section className="card-premium p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div><p className="eyebrow mb-1">Last 6 months</p><h3 className="font-display text-xl text-ink">Cash flow</h3></div>
            <div className="flex items-center gap-3 text-xs text-ink/60"><span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.moss }} />Revenue</span><span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.terracotta }} />Costs</span></div>
          </div>
          {hasMonthly ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.moss} stopOpacity={0.35} /><stop offset="100%" stopColor={C.moss} stopOpacity={0} /></linearGradient>
                    <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.terracotta} stopOpacity={0.3} /><stop offset="100%" stopColor={C.terracotta} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7EBE1" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7A70' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7A70' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip content={<TooltipBox />} cursor={{ stroke: '#E7EBE1' }} />
                  <Area type="monotone" dataKey="Revenue" stroke={C.moss} strokeWidth={2.5} fill="url(#gRev)" />
                  <Area type="monotone" dataKey="Costs" stroke={C.terracotta} strokeWidth={2.5} fill="url(#gCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 rounded-xl bg-cream border border-dashed border-border flex flex-col items-center justify-center text-center p-6">
              <Receipt className="w-8 h-8 text-moss-600 mb-3" strokeWidth={1.5} />
              <p className="font-medium text-ink">No dated records yet</p>
              <p className="text-sm text-ink/55 mt-1 max-w-xs">Log egg sales and expenses on your batches and the monthly trend will fill in here.</p>
            </div>
          )}
        </section>

        {/* Cost breakdown */}
        <section className="card-premium p-6">
          <p className="eyebrow mb-1">Where it goes</p>
          <h3 className="font-display text-xl text-ink mb-4">Cost breakdown</h3>
          {costSlices.length ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costSlices} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                    {costSlices.map((s, i) => <Cell key={i} fill={s.fill} />)}
                  </Pie>
                  <Tooltip content={<TooltipBox />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-44 rounded-xl bg-cream flex items-center justify-center text-sm text-ink/50">No costs recorded</div>}
          <ul className="mt-2 space-y-2 text-sm">
            {[{ l: 'Feed', v: totals.feed, c: C.leaf, I: Wheat }, { l: 'Vaccines', v: totals.vaccine, c: C.yolk, I: Syringe }, { l: 'Other', v: totals.other, c: C.terracotta, I: Receipt }].map(({ l, v, c, I }) => (
              <li key={l} className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-ink/70"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} /><I className="w-3.5 h-3.5 text-ink/40" />{l}</span><span className="font-semibold text-ink tabular-nums">{R(v)}</span></li>
            ))}
            <li className="flex items-center justify-between pt-2 border-t border-border"><span className="font-semibold text-ink">Total</span><span className="font-display font-bold text-ink tabular-nums">{R(totals.costs)}</span></li>
          </ul>
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue sources */}
        <section className="card-premium p-6">
          <p className="eyebrow mb-1">Income</p>
          <h3 className="font-display text-xl text-ink mb-4">Revenue sources</h3>
          <div className="space-y-4">
            {[{ l: 'Bird sales', v: totals.birdRevenue, I: Bird, c: 'bg-moss-600' }, { l: 'Egg sales', v: totals.eggRevenue, I: Egg, c: 'bg-yolk-500' }].map(({ l, v, I, c }) => {
              const pct = totals.revenue > 0 ? (v / totals.revenue) * 100 : 0;
              return (
                <div key={l}>
                  <div className="flex items-center justify-between text-sm mb-1.5"><span className="inline-flex items-center gap-2 text-ink/75"><I className="w-4 h-4 text-ink/45" />{l}</span><span className="font-semibold text-ink tabular-nums">{R(v)} <span className="text-ink/45 font-normal">· {pct.toFixed(0)}%</span></span></div>
                  <div className="h-2 rounded-full bg-cream-deep overflow-hidden"><div className={`h-full rounded-full ${c}`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            <div className="pt-3 border-t border-border flex items-center justify-between"><span className="font-semibold text-ink">Total revenue</span><span className="font-display font-bold text-ink tabular-nums">{R(totals.revenue)}</span></div>
          </div>
        </section>

        {/* Batch performance */}
        <section className="card-premium overflow-hidden lg:col-span-2">
          <div className="p-6 pb-3 flex items-start justify-between">
            <div><p className="eyebrow mb-1">By batch</p><h3 className="font-display text-xl text-ink">Batch performance</h3></div>
            <Link to={createPageUrl('BatchManagement')} className="text-sm text-moss-700 inline-flex items-center gap-1 link-underline">Manage batches <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {batchRows.length === 0 ? (
            <div className="px-6 pb-6"><EmptyState variant="plain" icon={Bird} title="No batches yet" subtitle="Create a batch to start tracking profit per flock." className="!py-8" /></div>
          ) : (
            <>
              {batchRows.length > 1 && (
                <div className="h-40 px-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={batchRows.slice(0, 8)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7EBE1" vertical={false} />
                      <XAxis dataKey="batch_name" tick={{ fontSize: 11, fill: '#6B7A70' }} axisLine={false} tickLine={false} interval={0} tickFormatter={(v) => v.length > 10 ? v.slice(0, 10) + '…' : v} />
                      <YAxis tick={{ fontSize: 11, fill: '#6B7A70' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                      <Tooltip content={<TooltipBox />} cursor={{ fill: '#F4F6F1' }} />
                      <Bar dataKey="revenue" name="Revenue" fill={C.moss} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="costs" name="Costs" fill={C.terracotta} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-cream text-[11px] uppercase tracking-wider text-ink/50"><tr><th className="text-left px-6 py-2.5 font-semibold">Batch</th><th className="text-right px-4 py-2.5 font-semibold">Revenue</th><th className="text-right px-4 py-2.5 font-semibold">Costs</th><th className="text-right px-6 py-2.5 font-semibold">Profit</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {batchRows.map(b => (
                      <tr key={b.id} className="hover:bg-cream/70">
                        <td className="px-6 py-3"><Link to={createPageUrl('BatchDetail') + `?id=${b.id}`} className="font-medium text-ink hover:text-moss-700">{b.batch_name}</Link><p className="text-xs text-ink/50 capitalize">{b.bird_type} · {b.status}</p></td>
                        <td className="px-4 py-3 text-right tabular-nums text-ink/80">{R(b.revenue)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-ink/80">{R(b.costs)}</td>
                        <td className={`px-6 py-3 text-right tabular-nums font-semibold ${b.profit >= 0 ? 'text-moss-700' : 'text-terracotta-600'}`}>{b.profit < 0 ? '−' : ''}{R(Math.abs(b.profit))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
