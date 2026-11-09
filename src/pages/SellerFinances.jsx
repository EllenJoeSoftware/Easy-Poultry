import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Package, Eye, Loader2, Star, ArrowUpRight, ArrowDownRight, Receipt, ArrowRight, Megaphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import moment from 'moment';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton } from '@/components/shell/SkeletonCard';
import { createPageUrl } from '../utils';

const C = { moss: '#174D35', leaf: '#287A4C', fresh: '#83AA62', yolk: '#E5A23C', terracotta: '#C8673D' };
const PALETTE = [C.moss, C.leaf, C.fresh, C.yolk, C.terracotta];
const R = (n) => `R${Math.round(n || 0).toLocaleString()}`;
const R2 = (n) => `R${Number(n || 0).toFixed(2)}`;
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=100';

const PAYMENT_CHIP = {
  verified: 'bg-fresh-50 text-moss-700 border-fresh-200',
  pending:  'bg-yolk-50 text-yolk-600 border-yolk-200',
  rejected: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200',
};

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink text-cream px-3 py-2 text-xs shadow-lift">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p, i) => <p key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />{p.name}: <span className="font-semibold">{R(p.value)}</span></p>)}
    </div>
  );
};

// Revenue earned on a listing: batch pricing is spread across the full original stock.
const listingRevenue = (l) => {
  const soldQty = l.sold_quantity || 0;
  const pricePerItem = l.price_type === 'batch' ? l.price / Math.max(1, (l.stock_quantity + soldQty)) : l.price;
  return pricePerItem * soldQty;
};

export default function SellerFinances() {
  const [user, setUser] = useState(null);
  const [txFilter, setTxFilter] = useState('all');

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

  const { data: myListings = [], isLoading: ll } = useQuery({
    queryKey: ['my-listings-finance'],
    queryFn: () => api.entities.Listing.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const { data: myPayments = [], isLoading: lp } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => api.entities.FeaturePayment.filter({ seller_id: user?.email }, '-created_date'),
    enabled: !!user
  });
  const isLoading = ll || lp;

  const soldListings = useMemo(() => myListings.filter(l => (l.sold_quantity || 0) > 0), [myListings]);
  const totalRevenue = useMemo(() => myListings.reduce((sum, l) => sum + listingRevenue(l), 0), [myListings]);
  const totalViews = myListings.reduce((sum, l) => sum + (l.view_count || 0), 0);
  const totalSpent = myPayments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount_paid, 0);
  const itemsSold = soldListings.reduce((s, l) => s + (l.sold_quantity || 0), 0);

  // Earnings over the last 6 months (by sold_date) vs promotion spend (by payment created_date)
  const monthly = useMemo(() => {
    const months = [...Array(6)].map((_, i) => moment().subtract(5 - i, 'months').startOf('month'));
    return months.map(m => {
      const key = m.format('YYYY-MM');
      const Earnings = soldListings.filter(l => l.sold_date && moment(l.sold_date).format('YYYY-MM') === key).reduce((s, l) => s + listingRevenue(l), 0);
      const Spend = myPayments.filter(p => p.status === 'verified' && moment(p.created_date).format('YYYY-MM') === key).reduce((s, p) => s + (p.amount_paid || 0), 0);
      return { month: m.format('MMM'), Earnings, Spend };
    });
  }, [soldListings, myPayments]);
  const hasMonthly = monthly.some(m => m.Earnings || m.Spend);

  // Earnings by category
  const byCategory = useMemo(() => {
    const map = soldListings.reduce((acc, l) => {
      const k = (l.category || 'other').replace(/_/g, ' ');
      acc[k] = (acc[k] || 0) + listingRevenue(l);
      return acc;
    }, {});
    return Object.entries(map).map(([name, value], i) => ({ name, value, fill: PALETTE[i % PALETTE.length] })).sort((a, b) => b.value - a.value);
  }, [soldListings]);

  // Unified transaction feed
  const transactions = useMemo(() => {
    const sales = soldListings.map(l => ({ id: `s-${l.id}`, kind: 'sale', date: l.sold_date || l.updated_date || l.created_date, amount: listingRevenue(l), listing: l }));
    const payments = myPayments.map(p => ({ id: `p-${p.id}`, kind: 'payment', date: p.created_date, amount: p.amount_paid, payment: p }));
    return [...sales, ...payments].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [soldListings, myPayments]);
  const visibleTx = transactions.filter(t => txFilter === 'all' || t.kind === txFilter);

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  return (
    <PageShell
      variant="compact"
      eyebrow="Sell"
      title="Sales & finances"
      subtitle="What you've earned on the marketplace, where it came from, and what you've spent promoting listings."
      breadcrumb={[{ label: 'Dashboard', href: createPageUrl('Dashboard') }, { label: 'Finances' }]}
      action={<Link to={createPageUrl('MyListings')} className="btn-ghost px-5 py-2.5 text-sm gap-1.5 border border-border bg-white"><Package className="w-4 h-4" /> My listings</Link>}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard icon={Wallet} label="Sales revenue" value={R2(totalRevenue)} deltaLabel={`${soldListings.length} ${soldListings.length === 1 ? 'listing' : 'listings'} sold`} tint="moss" />
            <StatCard icon={Package} label="Items sold" value={itemsSold.toLocaleString()} deltaLabel="units across all listings" tint="sage" />
            <StatCard icon={Eye} label="Total views" value={totalViews.toLocaleString()} deltaLabel={`${myListings.length} listings`} tint="yolk" />
            <StatCard icon={TrendingUp} label="Promotion spend" value={R2(totalSpent)} deltaLabel={`${myPayments.filter(p => p.status === 'verified').length} verified payments`} tint="terracotta" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Earnings over time */}
        <section className="card-premium p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div><p className="eyebrow mb-1">Last 6 months</p><h3 className="font-display text-xl text-ink">Earnings over time</h3></div>
            <div className="flex items-center gap-3 text-xs text-ink/60">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.moss }} />Earnings</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.terracotta }} />Promo spend</span>
            </div>
          </div>
          {hasMonthly ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gEarn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.moss} stopOpacity={0.35} /><stop offset="100%" stopColor={C.moss} stopOpacity={0} /></linearGradient>
                    <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.terracotta} stopOpacity={0.3} /><stop offset="100%" stopColor={C.terracotta} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7EBE1" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7A70' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7A70' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip content={<TooltipBox />} cursor={{ stroke: '#E7EBE1' }} />
                  <Area type="monotone" dataKey="Earnings" stroke={C.moss} strokeWidth={2.5} fill="url(#gEarn)" />
                  <Area type="monotone" dataKey="Spend" name="Promo spend" stroke={C.terracotta} strokeWidth={2.5} fill="url(#gSpend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 rounded-xl bg-cream border border-dashed border-border flex flex-col items-center justify-center text-center p-6">
              <Receipt className="w-8 h-8 text-moss-600 mb-3" strokeWidth={1.5} />
              <p className="font-medium text-ink">No dated sales yet</p>
              <p className="text-sm text-ink/55 mt-1 max-w-xs">Mark listings as sold and your monthly earnings trend will fill in here.</p>
            </div>
          )}
        </section>

        {/* By category */}
        <section className="card-premium p-6">
          <p className="eyebrow mb-1">Where it comes from</p>
          <h3 className="font-display text-xl text-ink mb-4">Earnings by category</h3>
          {byCategory.length ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                    {byCategory.map((s, i) => <Cell key={i} fill={s.fill} />)}
                  </Pie>
                  <Tooltip content={<TooltipBox />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-44 rounded-xl bg-cream flex items-center justify-center text-sm text-ink/50">No sales recorded</div>}
          <ul className="mt-2 space-y-2 text-sm">
            {byCategory.slice(0, 5).map(s => (
              <li key={s.name} className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-ink/70 capitalize"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.fill }} />{s.name}</span><span className="font-semibold text-ink tabular-nums">{R(s.value)}</span></li>
            ))}
            {byCategory.length > 0 && <li className="flex items-center justify-between pt-2 border-t border-border"><span className="font-semibold text-ink">Total</span><span className="font-display font-bold text-ink tabular-nums">{R(totalRevenue)}</span></li>}
          </ul>
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Top sellers bar */}
        <section className="card-premium p-6">
          <p className="eyebrow mb-1">Best performers</p>
          <h3 className="font-display text-xl text-ink mb-4">Top listings by revenue</h3>
          {soldListings.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...soldListings].sort((a, b) => listingRevenue(b) - listingRevenue(a)).slice(0, 5).map(l => ({ name: l.title, Revenue: listingRevenue(l) }))} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7EBE1" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7A70' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: '#6B7A70' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v} />
                  <Tooltip content={<TooltipBox />} cursor={{ fill: '#F4F6F1' }} />
                  <Bar dataKey="Revenue" fill={C.leaf} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-56 rounded-xl bg-cream flex items-center justify-center text-sm text-ink/50">No sales yet</div>}
        </section>

        {/* Transactions */}
        <section className="card-premium overflow-hidden lg:col-span-2">
          <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><p className="eyebrow mb-1">Activity</p><h3 className="font-display text-xl text-ink">Transactions</h3></div>
            <div className="inline-flex bg-cream border border-border rounded-full p-1">
              {[{ v: 'all', l: 'All' }, { v: 'sale', l: 'Sales' }, { v: 'payment', l: 'Promotions' }].map(t => (
                <button key={t.v} onClick={() => setTxFilter(t.v)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${txFilter === t.v ? 'bg-moss-600 text-cream' : 'text-ink/60 hover:text-moss-700'}`}>{t.l}</button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="divide-y divide-border">{[...Array(4)].map((_, i) => <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse"><div className="w-11 h-11 rounded-xl bg-cream-deep" /><div className="flex-1 space-y-2"><div className="h-4 bg-cream-deep rounded w-1/3" /><div className="h-3 bg-cream-deep rounded w-1/5" /></div></div>)}</div>
          ) : visibleTx.length === 0 ? (
            <div className="px-6 pb-6"><EmptyState variant="plain" icon={Receipt} title={txFilter === 'payment' ? 'No promotion payments yet' : txFilter === 'sale' ? 'No sales yet' : 'No transactions yet'} subtitle="Sales you mark as sold and featured-listing payments will appear here." className="!py-8" /></div>
          ) : (
            <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="divide-y divide-border max-h-[32rem] overflow-y-auto">
              {visibleTx.map(t => t.kind === 'sale' ? <SaleRow key={t.id} t={t} /> : <PaymentRow key={t.id} t={t} />)}
            </motion.ul>
          )}
          <div className="px-6 py-3 bg-cream border-t border-border text-xs text-ink/50 flex items-center justify-between">
            <span>{visibleTx.length} {visibleTx.length === 1 ? 'transaction' : 'transactions'}</span>
            <Link to={createPageUrl('MyListings')} className="inline-flex items-center gap-1 text-moss-700 link-underline">Manage listings <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function SaleRow({ t }) {
  const l = t.listing;
  const totalStock = l.stock_quantity + (l.sold_quantity || 0);
  return (
    <motion.li variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="flex items-center gap-4 px-6 py-4 hover:bg-cream/70 transition-colors">
      <div className="w-11 h-11 rounded-xl overflow-hidden bg-cream-deep border border-border flex-shrink-0">
        <img src={l.images?.[0] || FALLBACK_IMG} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <Link to={createPageUrl('ProductDetail') + `?id=${l.id}`} className="font-medium text-ink hover:text-moss-700 line-clamp-1">{l.title}</Link>
        <p className="text-xs text-ink/55 mt-0.5">
          <span className="chip bg-fresh-50 text-moss-700 border-fresh-200 !py-0 !px-2 text-[10px] mr-1.5">Sale</span>
          {l.sold_date ? moment(l.sold_date).format('D MMM YYYY') : 'Recent'} · Sold {l.sold_quantity} / {totalStock} items
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-display font-bold text-moss-700 tabular-nums inline-flex items-center gap-1"><ArrowUpRight className="w-4 h-4" />{R2(t.amount)}</p>
        {l.featured && <p className="text-[10px] text-yolk-600 inline-flex items-center gap-0.5 justify-end"><Star className="w-3 h-3 fill-current" />Featured</p>}
      </div>
    </motion.li>
  );
}

function PaymentRow({ t }) {
  const p = t.payment;
  const chip = PAYMENT_CHIP[p.status] || 'bg-cream-deep text-ink/60 border-border';
  return (
    <motion.li variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="flex items-center gap-4 px-6 py-4 hover:bg-cream/70 transition-colors">
      <div className="w-11 h-11 rounded-xl bg-yolk-50 text-yolk-600 border border-yolk-100 flex-shrink-0 flex items-center justify-center"><Megaphone className="w-5 h-5" /></div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink">Featured listing · {p.duration_days} days</p>
        <p className="text-xs text-ink/55 mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex capitalize px-2 py-0 rounded-full border text-[10px] font-medium ${chip}`}>{p.status}</span>
          {moment(p.created_date).format('D MMM YYYY')}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-display font-bold text-terracotta-600 tabular-nums inline-flex items-center gap-1"><ArrowDownRight className="w-4 h-4" />R{p.amount_paid}</p>
      </div>
    </motion.li>
  );
}
