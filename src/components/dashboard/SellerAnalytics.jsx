import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Eye, MessageCircle, Star, TrendingUp, Wallet, BarChart3, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '@/api/client';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton } from '@/components/shell/SkeletonCard';

const C = { moss: '#174D35', leaf: '#287A4C', fresh: '#83AA62', yolk: '#E5A23C', terracotta: '#C8673D' };
const COLORS = [C.moss, C.leaf, C.fresh, C.yolk, C.terracotta];

const TooltipBox = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink text-cream px-3 py-2 text-xs shadow-lift">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          {p.name}: <span className="font-semibold">{formatter ? formatter(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

const ChartEmpty = ({ h = 'h-[250px]', text = 'No data yet' }) => (
  <div className={`${h} rounded-xl bg-cream border border-dashed border-border flex items-center justify-center text-sm text-ink/50`}>{text}</div>
);

export default function SellerAnalytics({ userEmail }) {
  const { data: listings = [], isLoading: ll } = useQuery({
    queryKey: ['seller-listings-analytics', userEmail],
    queryFn: () => api.entities.Listing.filter({ created_by: userEmail }),
    enabled: !!userEmail
  });

  const { data: reviews = [], isLoading: lr } = useQuery({
    queryKey: ['seller-reviews-analytics', userEmail],
    queryFn: () => api.entities.SellerReview.filter({ seller_email: userEmail }),
    enabled: !!userEmail
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ['seller-inquiries-analytics', userEmail],
    queryFn: () => api.entities.Inquiry.filter({ seller_id: userEmail }),
    enabled: !!userEmail
  });
  const isLoading = ll || lr;

  // Calculate metrics
  const activeListings = listings.filter(l => l.status === 'active');
  const soldListings = listings.filter(l => l.status === 'sold');
  const totalViews = listings.reduce((sum, l) => sum + (l.view_count || 0), 0);
  const totalInquiries = listings.reduce((sum, l) => sum + (l.inquiry_count || 0), 0);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  const totalSales = soldListings.reduce((sum, l) => sum + (l.price || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : 0;

  // Prepare chart data
  const categoryData = Object.entries(
    listings.reduce((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const viewsData = listings
    .filter(l => l.view_count > 0)
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5)
    .map(l => ({ name: l.title.slice(0, 15) + '...', views: l.view_count, inquiries: l.inquiry_count || 0 }));

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating: `${rating} Star`,
    count: reviews.filter(r => r.rating === rating).length
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard icon={Package} label="Active listings" value={activeListings.length} deltaLabel={`${soldListings.length} sold`} tint="moss" />
            <StatCard icon={Eye} label="Total views" value={totalViews.toLocaleString()} deltaLabel={`${conversionRate}% enquiry rate`} tint="sage" />
            <StatCard icon={MessageCircle} label="Inquiries" value={totalInquiries.toLocaleString()} deltaLabel={`${inquiries.length} conversations`} tint="yolk" />
            <StatCard icon={Wallet} label="Total sales" value={`R${totalSales.toLocaleString()}`} deltaLabel={reviews.length ? `${avgRating} avg rating · ${reviews.length} reviews` : 'No reviews yet'} tint="terracotta" />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top Listings by Views */}
        <section className="card-premium p-6">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div><p className="eyebrow mb-1">Top 5</p><h3 className="font-display text-xl text-ink">Listing performance</h3></div>
            <div className="flex items-center gap-3 text-xs text-ink/60">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.moss }} />Views</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.yolk }} />Inquiries</span>
            </div>
          </div>
          {viewsData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7EBE1" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7A70' }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7A70' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<TooltipBox />} cursor={{ fill: '#F4F6F1' }} />
                  <Bar dataKey="views" fill={C.moss} name="Views" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="inquiries" fill={C.yolk} name="Inquiries" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <ChartEmpty text="Views will show here once buyers start browsing your listings" />}
        </section>

        {/* Category Distribution */}
        <section className="card-premium p-6">
          <p className="eyebrow mb-1">Mix</p>
          <h3 className="font-display text-xl text-ink mb-4">Listings by category</h3>
          {categoryData.length > 0 ? (
            <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                      {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<TooltipBox />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm min-w-[10rem]">
                {categoryData.map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 text-ink/70 capitalize"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{c.name}</span>
                    <span className="font-semibold text-ink tabular-nums">{c.value} <span className="text-ink/45 font-normal">· {listings.length ? Math.round((c.value / listings.length) * 100) : 0}%</span></span>
                  </li>
                ))}
              </ul>
            </div>
          ) : <ChartEmpty h="h-[200px]" text="Create a listing to see your category mix" />}
        </section>
      </div>

      {/* Rating Distribution */}
      {reviews.length > 0 && (
        <section className="card-premium p-6">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div><p className="eyebrow mb-1">Reputation</p><h3 className="font-display text-xl text-ink">Rating distribution</h3></div>
            <div className="text-right">
              <p className="font-display font-bold text-2xl text-ink inline-flex items-center gap-1"><Star className="w-5 h-5 text-yolk-500 fill-yolk-500" />{avgRating}</p>
              <p className="text-xs text-ink/50">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7EBE1" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7A70' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="rating" type="category" width={60} tick={{ fontSize: 12, fill: '#6B7A70' }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} cursor={{ fill: '#F4F6F1' }} />
                <Bar dataKey="count" name="Reviews" fill={C.yolk} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Quick read */}
      {!isLoading && listings.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { I: TrendingUp, l: 'Enquiry rate', v: `${conversionRate}%`, d: 'inquiries per 100 views' },
            { I: CheckCircle, l: 'Sell-through', v: `${listings.length ? Math.round((soldListings.length / listings.length) * 100) : 0}%`, d: `${soldListings.length} of ${listings.length} listings sold` },
            { I: BarChart3, l: 'Avg views / listing', v: listings.length ? Math.round(totalViews / listings.length).toLocaleString() : 0, d: 'across all listings' },
          ].map(({ I, l, v, d }) => (
            <div key={l} className="card-premium p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-moss-50 text-moss-700 flex items-center justify-center flex-shrink-0"><I className="w-5 h-5" /></div>
              <div><p className="text-xs text-ink/55">{l}</p><p className="font-display font-bold text-lg text-ink leading-tight">{v}</p><p className="text-[11px] text-ink/45">{d}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
