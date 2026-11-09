import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bird, ArrowLeft, Calendar, Egg, Syringe, Wheat, Loader2, Tag, HeartCrack, Wallet, Receipt, Home, Hash, TrendingDown, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { createPageUrl } from '../utils';
import moment from 'moment';

const C = { moss: '#174D35', leaf: '#287A4C', fresh: '#83AA62', yolk: '#E5A23C', terracotta: '#C8673D' };
const R = (n) => `R${Math.round(n || 0).toLocaleString()}`;
const listVariants = { show: { transition: { staggerChildren: 0.05 } } };
const rowVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const EggTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink text-cream px-3 py-2 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.name}: <span className="font-semibold">{p.name === 'Revenue' ? R(p.value) : p.value}</span></p>
      ))}
    </div>
  );
};

export default function BatchDetail() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const batchId = urlParams.get('id');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {
        api.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: batch, isLoading } = useQuery({
    queryKey: ['batch-detail', batchId],
    queryFn: async () => {
      const batches = await api.entities.PoultryBatch.filter({ id: batchId });
      return batches[0] || null;
    },
    enabled: !!user && !!batchId
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['batch-vaccinations', batchId],
    queryFn: () => api.entities.VaccinationEvent.filter({ batch_id: batchId }, '-vaccination_date'),
    enabled: !!batchId
  });

  const { data: feedUsage = [] } = useQuery({
    queryKey: ['batch-feed', batchId],
    queryFn: () => api.entities.FeedUsage.filter({ batch_id: batchId }, '-usage_date', 20),
    enabled: !!batchId
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['batch-expenses', batchId],
    queryFn: () => api.entities.BatchExpense.filter({ batch_id: batchId }, '-expense_date', 20),
    enabled: !!batchId
  });

  const { data: eggProduction = [] } = useQuery({
    queryKey: ['batch-eggs', batchId],
    queryFn: () => api.entities.EggProduction.filter({ batch_id: batchId }, '-production_date', 20),
    enabled: !!batchId && batch?.bird_type === 'layers'
  });

  const eggSeries = useMemo(() => (
    [...eggProduction]
      .sort((a, b) => moment(a.production_date).valueOf() - moment(b.production_date).valueOf())
      .map(p => ({ date: moment(p.production_date).format('D MMM'), Eggs: p.eggs_collected || 0, Revenue: p.revenue || 0 }))
  ), [eggProduction]);

  if (!user || isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  if (!batch) {
    return (
      <PageShell variant="compact" eyebrow="Farm" title="Batch not found" breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Batches', href: createPageUrl('BatchManagement') }, { label: 'Detail' }]}>
        <EmptyState icon={Bird} title="We couldn't find that batch" subtitle="It may have been deleted, or the link is incomplete." action={<Link to={createPageUrl('BatchManagement')} className="btn-cta px-5 py-2.5 text-sm gap-1.5 inline-flex items-center"><ArrowLeft className="w-4 h-4" /> Back to batches</Link>} />
      </PageShell>
    );
  }

  const totalRevenue = (batch.total_revenue || 0);
  const totalCosts = (batch.total_feed_cost || 0) + (batch.total_vaccine_cost || 0) + (batch.total_other_costs || 0);
  const netProfit = totalRevenue - totalCosts;
  const age = batch.age_in_weeks ?? moment().diff(moment(batch.date_acquired), 'weeks');
  const survival = batch.initial_quantity ? Math.round(((batch.current_quantity || 0) / batch.initial_quantity) * 100) : 0;
  const maturity = batch.expected_maturity_weeks ? Math.min(100, Math.round((age / batch.expected_maturity_weeks) * 100)) : null;
  const birdTypeChip = { layers: 'chip-yolk', broilers: 'chip-accent', mixed: '' };
  const statusChip = batch.status === 'active' ? 'bg-fresh-50 text-moss-700 border-fresh-200' : 'bg-ink/70 text-cream border-0';
  const totalEggs = eggProduction.reduce((s, p) => s + (p.eggs_collected || 0), 0);
  const expenseTint = { mortality_loss: 'text-terracotta-600', feed: 'text-moss-700', vaccine: 'text-yolk-600' };

  const tabCls = 'rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream';

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0">
      <span className="inline-flex items-center gap-2 text-sm text-ink/60"><Icon className="w-4 h-4 text-ink/40" />{label}</span>
      <span className="text-sm font-semibold text-ink text-right">{value}</span>
    </div>
  );

  return (
    <PageShell
      variant="compact"
      eyebrow="Farm · Batch"
      title={batch.batch_name}
      subtitle={(
        <span className="flex flex-wrap items-center gap-2">
          <span className={`chip ${birdTypeChip[batch.bird_type] || ''} capitalize`}>{batch.bird_type}</span>
          <span className={`chip capitalize ${statusChip}`}>{batch.status}</span>
          {batch.breed && <span className="chip">{batch.breed}</span>}
          <span className="chip bg-cream-deep text-ink/60 border-border">{age} wk old</span>
          {batch.housing_location && <span className="chip bg-cream-deep text-ink/60 border-border inline-flex items-center gap-1"><Home className="w-3 h-3" />{batch.housing_location}</span>}
        </span>
      )}
      breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Batches', href: createPageUrl('BatchManagement') }, { label: batch.batch_name }]}
      action={<Link to={createPageUrl('BatchManagement')} className="btn-ghost border border-border bg-white px-4 py-2.5 text-sm gap-1.5 inline-flex items-center"><ArrowLeft className="w-4 h-4" /> All batches</Link>}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Bird} label="Birds on hand" value={(batch.current_quantity ?? 0).toLocaleString()} deltaLabel={`Started with ${batch.initial_quantity ?? 0}`} tint="moss" />
        <StatCard icon={Tag} label="Available to sell" value={(batch.available_quantity ?? 0).toLocaleString()} deltaLabel={`${batch.sold_count || 0} sold so far`} tint="sage" />
        <StatCard icon={HeartCrack} label="Mortality" value={(batch.mortality_count || 0).toLocaleString()} deltaLabel={`${survival}% survival`} tint="terracotta" />
        <StatCard icon={Wallet} label="Revenue" value={R(totalRevenue)} deltaLabel={`${netProfit < 0 ? '−' : ''}${R(Math.abs(netProfit))} net`} tint={netProfit >= 0 ? 'yolk' : 'terracotta'} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
          <TabsTrigger value="overview" className={tabCls}>Overview</TabsTrigger>
          <TabsTrigger value="expenses" className={tabCls}>Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="production" className={tabCls}>Production{batch.bird_type === 'layers' ? ` (${eggProduction.length})` : ''}</TabsTrigger>
        </TabsList>

        {/* ---------------- Overview ---------------- */}
        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-5">
            <section className="card-premium p-6 lg:col-span-1">
              <p className="eyebrow mb-1">Batch</p>
              <h3 className="font-display text-xl text-ink mb-3">Information</h3>
              <InfoRow icon={Hash} label="Batch number" value={batch.batch_number} />
              <InfoRow icon={Bird} label="Breed" value={batch.breed || 'Not set'} />
              <InfoRow icon={Home} label="Housing" value={batch.housing_location || 'Not set'} />
              <InfoRow icon={Calendar} label="Acquired" value={moment(batch.date_acquired).format('D MMM YYYY')} />
              {batch.expected_harvest_date && <InfoRow icon={Calendar} label="Expected harvest" value={moment(batch.expected_harvest_date).format('D MMM YYYY')} />}
              <InfoRow icon={Wheat} label="Feed / bird / day" value={`${batch.daily_feed_per_bird_kg || 0.12} kg`} />

              <div className="mt-5 space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] text-ink/55 mb-1"><span>Survival</span><span>{survival}%</span></div>
                  <div className="h-1.5 rounded-full bg-cream-deep overflow-hidden"><div className={`h-full rounded-full ${survival >= 90 ? 'bg-fresh-500' : survival >= 75 ? 'bg-yolk-500' : 'bg-terracotta-500'}`} style={{ width: `${survival}%` }} /></div>
                </div>
                {maturity !== null && (
                  <div>
                    <div className="flex justify-between text-[11px] text-ink/55 mb-1"><span>Maturity</span><span>{maturity}% · {batch.expected_maturity_weeks} wk target</span></div>
                    <div className="h-1.5 rounded-full bg-cream-deep overflow-hidden"><div className="h-full rounded-full bg-moss-600" style={{ width: `${maturity}%` }} /></div>
                  </div>
                )}
              </div>

              {batch.notes && (
                <div className="mt-5 pt-4 border-t border-border">
                  <p className="eyebrow mb-1">Notes</p>
                  <p className="text-sm text-ink/75 leading-relaxed">{batch.notes}</p>
                </div>
              )}
            </section>

            <div className="lg:col-span-2 space-y-5">
              {/* Money summary */}
              <section className="card-premium p-6">
                <p className="eyebrow mb-1">Finance</p>
                <h3 className="font-display text-xl text-ink mb-4">Revenue vs costs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-cream p-4"><p className="text-[11px] uppercase tracking-wider text-ink/50 inline-flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Revenue</p><p className="stat-num font-display font-bold text-xl text-moss-700 mt-1">{R(totalRevenue)}</p></div>
                  <div className="rounded-xl bg-cream p-4"><p className="text-[11px] uppercase tracking-wider text-ink/50 inline-flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Costs</p><p className="stat-num font-display font-bold text-xl text-terracotta-600 mt-1">{R(totalCosts)}</p></div>
                  <div className="rounded-xl bg-cream p-4"><p className="text-[11px] uppercase tracking-wider text-ink/50 inline-flex items-center gap-1"><Wallet className="w-3 h-3" /> Net</p><p className={`stat-num font-display font-bold text-xl mt-1 ${netProfit >= 0 ? 'text-moss-700' : 'text-terracotta-600'}`}>{netProfit < 0 ? '−' : ''}{R(Math.abs(netProfit))}</p></div>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {[{ l: 'Feed', v: batch.total_feed_cost, I: Wheat }, { l: 'Vaccines', v: batch.total_vaccine_cost, I: Syringe }, { l: 'Other', v: batch.total_other_costs, I: Receipt }].map(({ l, v, I }) => (
                    <li key={l} className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-ink/70"><I className="w-3.5 h-3.5 text-ink/40" />{l}</span><span className="font-semibold text-ink tabular-nums">{R(v)}</span></li>
                  ))}
                </ul>
              </section>

              {/* Vaccinations */}
              <section className="card-premium overflow-hidden">
                <div className="p-6 pb-3 flex items-start justify-between gap-3">
                  <div><p className="eyebrow mb-1">Health</p><h3 className="font-display text-xl text-ink">Vaccinations ({vaccinations.length})</h3></div>
                  <Link to={createPageUrl('VaccinationManagement')} className="text-sm text-moss-700 link-underline">Record</Link>
                </div>
                {vaccinations.length === 0 ? (
                  <div className="px-6 pb-6"><EmptyState variant="plain" icon={Syringe} title="No vaccinations yet" subtitle="Vaccinations logged against this batch appear here." /></div>
                ) : (
                  <motion.ul initial="hidden" animate="show" variants={listVariants} className="divide-y divide-border">
                    {vaccinations.map(vac => (
                      <motion.li key={vac.id} variants={rowVariants} className="px-6 py-3 flex items-center justify-between gap-3 hover:bg-cream/70">
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{vac.vaccine_name}</p>
                          <p className="text-xs text-ink/55">{moment(vac.vaccination_date).format('D MMM YYYY')} · {vac.birds_vaccinated} birds · day {vac.batch_age_days}</p>
                        </div>
                        {vac.cost > 0 && <span className="text-sm font-semibold text-ink tabular-nums">{R(vac.cost)}</span>}
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </section>

              {/* Feed usage */}
              <section className="card-premium overflow-hidden">
                <div className="p-6 pb-3 flex items-start justify-between gap-3">
                  <div><p className="eyebrow mb-1">Feed</p><h3 className="font-display text-xl text-ink">Recent usage ({feedUsage.length})</h3></div>
                  <Link to={createPageUrl('FeedManagement')} className="text-sm text-moss-700 link-underline">Record</Link>
                </div>
                {feedUsage.length === 0 ? (
                  <div className="px-6 pb-6"><EmptyState variant="plain" icon={Wheat} title="No feed usage yet" subtitle="Feed consumed by this batch will be listed here." /></div>
                ) : (
                  <motion.ul initial="hidden" animate="show" variants={listVariants} className="divide-y divide-border">
                    {feedUsage.map(usage => (
                      <motion.li key={usage.id} variants={rowVariants} className="px-6 py-3 flex items-center justify-between gap-3 hover:bg-cream/70">
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{usage.feed_name}</p>
                          <p className="text-xs text-ink/55">{moment(usage.usage_date).format('D MMM YYYY')} · {usage.quantity_kg} kg</p>
                        </div>
                        <span className="text-sm font-semibold text-ink tabular-nums">{R(usage.cost)}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </section>
            </div>
          </div>
        </TabsContent>

        {/* ---------------- Expenses ---------------- */}
        <TabsContent value="expenses">
          <section className="card-premium overflow-hidden">
            <div className="p-6 pb-3 flex items-start justify-between gap-3">
              <div><p className="eyebrow mb-1">Ledger</p><h3 className="font-display text-xl text-ink">Expenses</h3></div>
              <span className="text-sm text-ink/55">Latest 20</span>
            </div>
            {expenses.length === 0 ? (
              <div className="px-6 pb-6"><EmptyState variant="plain" icon={Receipt} title="No expenses recorded" subtitle="Mortality losses and other costs logged against this batch show up here." /></div>
            ) : (
              <>
                <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2.5 bg-cream text-[11px] uppercase tracking-wider text-ink/50 font-semibold">
                  <span className="col-span-3">Type</span><span className="col-span-5">Description</span><span className="col-span-2">Date</span><span className="col-span-2 text-right">Amount</span>
                </div>
                <motion.ul initial="hidden" animate="show" variants={listVariants} className="divide-y divide-border">
                  {expenses.map(expense => (
                    <motion.li key={expense.id} variants={rowVariants} className="px-6 py-3 grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-3 md:items-center hover:bg-cream/70">
                      <p className={`md:col-span-3 font-medium capitalize ${expenseTint[expense.expense_type] || 'text-ink'}`}>{(expense.expense_type || '').replace(/_/g, ' ')}</p>
                      <p className="md:col-span-5 text-sm text-ink/70 truncate">{expense.description || '—'}</p>
                      <p className="md:col-span-2 text-xs md:text-sm text-ink/55">{moment(expense.expense_date).format('D MMM YYYY')}</p>
                      <p className="md:col-span-2 md:text-right font-semibold text-ink tabular-nums">{R(expense.amount)}</p>
                    </motion.li>
                  ))}
                </motion.ul>
              </>
            )}
          </section>
        </TabsContent>

        {/* ---------------- Production ---------------- */}
        <TabsContent value="production">
          {batch.bird_type !== 'layers' ? (
            <EmptyState icon={Egg} title="Egg production is for layer batches" subtitle={`This is a ${batch.bird_type} batch, so there is no egg production to track here.`} />
          ) : (
            <div className="space-y-5">
              <section className="card-premium p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div><p className="eyebrow mb-1">Eggs</p><h3 className="font-display text-xl text-ink">Production over time</h3></div>
                  <div className="text-right"><p className="stat-num font-display font-bold text-2xl text-ink leading-none">{totalEggs.toLocaleString()}</p><p className="text-[11px] uppercase tracking-wider text-ink/50 mt-1">eggs (last 20 logs)</p></div>
                </div>
                {eggSeries.length > 1 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={eggSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gEggs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.yolk} stopOpacity={0.4} /><stop offset="100%" stopColor={C.yolk} stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E7EBE1" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7A70' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#6B7A70' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<EggTooltip />} cursor={{ stroke: '#E7EBE1' }} />
                        <Area type="monotone" dataKey="Eggs" stroke={C.yolk} strokeWidth={2.5} fill="url(#gEggs)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-40 rounded-xl bg-cream border border-dashed border-border flex flex-col items-center justify-center text-center p-6">
                    <Egg className="w-8 h-8 text-yolk-600 mb-3" strokeWidth={1.5} />
                    <p className="font-medium text-ink">Not enough data to chart yet</p>
                    <p className="text-sm text-ink/55 mt-1 max-w-xs">Record at least two collections and the trend will appear here.</p>
                  </div>
                )}
              </section>

              <section className="card-premium overflow-hidden">
                <div className="p-6 pb-3"><p className="eyebrow mb-1">Log</p><h3 className="font-display text-xl text-ink">Collections</h3></div>
                {eggProduction.length === 0 ? (
                  <div className="px-6 pb-6"><EmptyState variant="plain" icon={Egg} title="No collections yet" subtitle="Use Record eggs on the batch card to log a collection." /></div>
                ) : (
                  <>
                    <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2.5 bg-cream text-[11px] uppercase tracking-wider text-ink/50 font-semibold">
                      <span className="col-span-3">Date</span><span className="col-span-3">Collected</span><span className="col-span-3">Rate</span><span className="col-span-3 text-right">Revenue</span>
                    </div>
                    <motion.ul initial="hidden" animate="show" variants={listVariants} className="divide-y divide-border">
                      {eggProduction.map(prod => (
                        <motion.li key={prod.id} variants={rowVariants} className="px-6 py-3 grid grid-cols-2 md:grid-cols-12 gap-1 md:gap-3 md:items-center hover:bg-cream/70">
                          <p className="md:col-span-3 text-sm text-ink/70">{moment(prod.production_date).format('D MMM YYYY')}</p>
                          <p className="md:col-span-3 font-medium text-ink text-right md:text-left">{prod.eggs_collected} eggs</p>
                          <p className="md:col-span-3 text-xs md:text-sm text-ink/55">Rate {Number(prod.production_rate || 0).toFixed(0)}%{prod.eggs_sold ? ` · ${prod.eggs_sold} sold` : ''}{prod.eggs_damaged ? ` · ${prod.eggs_damaged} damaged` : ''}</p>
                          <p className="md:col-span-3 text-right font-semibold text-moss-700 tabular-nums">{prod.revenue > 0 ? R(prod.revenue) : '—'}</p>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </>
                )}
              </section>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
