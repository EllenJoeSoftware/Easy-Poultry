import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, TrendingUp, Package, Zap, DollarSign, Egg, AlertTriangle, Bird,
  Plus, Eye, MessageCircle, ShoppingBag, ExternalLink, Edit3, CheckCircle2,
  Star, Settings, ShieldCheck, ArrowRight,
} from 'lucide-react';
import moment from 'moment';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import StatCard from '@/components/shell/StatCard';
import EmptyState from '@/components/shell/EmptyState';
import { ListingSkeleton } from '@/components/shell/SkeletonCard';
import { LogoMark } from '@/components/icons/EasyPoultryLogo';
import { createPageUrl } from '../utils';

const businessNameOf = (s) =>
  s?.business_name || s?.farm_name || s?.shop_name || s?.display_name || 'Your farm';

export default function FarmDashboard() {
  const [user, setUser] = useState(null);
  const [markSoldDialog, setMarkSoldDialog] = useState(null);
  const [soldQuantity, setSoldQuantity] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me()
      .then(setUser)
      .catch(() => api.auth.redirectToLogin(window.location.href));
  }, []);

  // ---- Branding (same as the public shop) -----------------------------
  const { data: sellerProfile } = useQuery({
    queryKey: ['my-seller-profile', user?.email],
    queryFn: async () => {
      const profiles = await api.entities.SellerProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  // ---- Marketplace listings (the same as Dashboard 'My Listings') ----
  const { data: myListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['farm-my-listings', user?.email],
    queryFn: () => api.entities.Listing.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  // ---- Inquiries received --------------------------------------------
  const { data: receivedInquiries = [] } = useQuery({
    queryKey: ['farm-inquiries-received', user?.email],
    queryFn: () => api.entities.Inquiry.filter({ seller_id: user.email }),
    enabled: !!user?.email,
  });

  // ---- Farm operational data -----------------------------------------
  const { data: batches = [] } = useQuery({
    queryKey: ['farm-batches', user?.email],
    queryFn: () => api.entities.PoultryBatch.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['farm-alerts', user?.email],
    queryFn: () => api.entities.FarmAlert.filter({ created_by: user.email, is_resolved: false }),
    enabled: !!user?.email,
  });

  const { data: feedTypes = [] } = useQuery({
    queryKey: ['feed-types', user?.email],
    queryFn: () => api.entities.FeedType.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: eggProduction = [] } = useQuery({
    queryKey: ['egg-production-recent', user?.email],
    queryFn: async () => {
      const last7Days = moment().subtract(7, 'days').format('YYYY-MM-DD');
      const all = await api.entities.EggProduction.filter({ created_by: user.email }, '-production_date');
      return all.filter(e => e.production_date >= last7Days);
    },
    enabled: !!user?.email,
  });

  // ---- Mark-as-sold mutation -----------------------------------------
  const markAsSoldMutation = useMutation({
    mutationFn: ({ id, quantity, listing }) => {
      const newStock = listing.stock_quantity - quantity;
      const newSold = (listing.sold_quantity || 0) + quantity;
      const newStatus = newStock === 0 ? 'sold' : 'active';
      return api.entities.Listing.update(id, {
        stock_quantity: newStock,
        sold_quantity: newSold,
        status: newStatus,
        sold_date: newStatus === 'sold' ? new Date().toISOString() : listing.sold_date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['farm-my-listings']);
      toast.success('Sale recorded');
      setMarkSoldDialog(null);
      setSoldQuantity('');
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <LogoMark className="w-12 h-12" />
          <Loader2 className="w-5 h-5 animate-spin text-moss-600" />
        </div>
      </div>
    );
  }

  // ---- Derived stats -------------------------------------------------
  const businessName = businessNameOf({ ...sellerProfile, ...user });
  const isSeller = user.user_type === 'seller' || user.user_type === 'both';

  const activeListings = myListings.filter(l => l.status === 'active');
  const soldListings = myListings.filter(l => l.status === 'sold');
  const totalViews = myListings.reduce((sum, l) => sum + (l.view_count || 0), 0);
  const totalInquiries = receivedInquiries.length;
  const totalRevenue = soldListings.reduce(
    (sum, l) => sum + (l.price || 0) * (l.sold_quantity || l.stock_quantity || 0), 0
  );

  const activeBatches = batches.filter(b => b.status === 'active');
  const totalBirds = activeBatches.reduce((sum, b) => sum + (b.current_quantity || 0), 0);
  const layerBatches = activeBatches.filter(b => b.bird_type === 'layers');
  const totalEggsWeek = eggProduction.reduce((sum, e) => sum + (e.eggs_collected || 0), 0);

  const farmRevenue = batches.reduce((sum, b) => sum + (b.total_revenue || 0), 0);
  const farmCosts = batches.reduce(
    (sum, b) => sum + (b.total_feed_cost || 0) + (b.total_vaccine_cost || 0) + (b.total_other_costs || 0), 0
  );
  const farmProfit = farmRevenue - farmCosts;

  const lowStockFeeds = feedTypes.filter(f => f.current_stock_kg <= f.low_stock_alert_kg);
  const urgentAlerts = alerts.filter(a => a.priority === 'urgent' || a.priority === 'high');

  const shopUrl = sellerProfile?.subdomain
    ? createPageUrl('SellerShop') + `?shop=${sellerProfile.subdomain}`
    : null;

  const quickActions = [
    { label: 'Batches',       path: 'BatchManagement',       icon: Bird,       tint: 'bg-moss-50',        text: 'text-moss-700',       border: 'border-moss-100' },
    { label: 'Incubation',    path: 'IncubationManagement',  icon: Egg,        tint: 'bg-yolk-50',        text: 'text-yolk-600',       border: 'border-yolk-100' },
    { label: 'Feed',          path: 'FeedManagement',        icon: Package,    tint: 'bg-cream-deep',     text: 'text-ink-soft',       border: 'border-yolk-100' },
    { label: 'Vaccinations',  path: 'VaccinationManagement', icon: Zap,        tint: 'bg-terracotta-50',  text: 'text-terracotta-600', border: 'border-terracotta-100' },
    { label: 'Financials',    path: 'FarmFinancials',        icon: DollarSign, tint: 'bg-moss-50',        text: 'text-moss-700',       border: 'border-moss-100' },
  ];

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* ============ HERO — same banner + name as the public shop ============ */}
      <section className="relative overflow-hidden">
        <div className="h-44 sm:h-52 lg:h-60 bg-moss-gradient relative overflow-hidden">
          <div className="absolute inset-0 grain pointer-events-none opacity-50" />
          {sellerProfile?.cover_image_url && (
            <img
              src={sellerProfile.cover_image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-end pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <Badge className="bg-cream/95 text-moss-700 border-0 backdrop-blur-sm gap-1 mb-2">
                <Bird className="w-3 h-3" />
                Farm dashboard
              </Badge>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pt-8 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
          >
            <div className="flex-1 min-w-0">
              <p className="eyebrow mb-2">Welcome back</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-none">
                  {businessName}
                </h1>
                {sellerProfile?.seller_verified && (
                  <Badge className="bg-moss-50 text-moss-700 hover:bg-moss-50 gap-1 border border-moss-100">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-ink/65">
                Manage your shop, listings, batches and finances — all in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {shopUrl && (
                <Link to={shopUrl}>
                  <Button variant="outline" className="rounded-full border-border bg-white gap-1.5 h-10">
                    <ExternalLink className="w-4 h-4" />
                    View public shop
                  </Button>
                </Link>
              )}
              <Link to={createPageUrl('CreateListing')}>
                <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5 h-10">
                  <Plus className="w-4 h-4" />
                  New listing
                </Button>
              </Link>
              <Link to={createPageUrl('ProfileSettings')}>
                <Button variant="outline" className="rounded-full border-border bg-white h-10 px-3" title="Shop settings">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ BODY ============ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Urgent farm alerts */}
        {urgentAlerts.length > 0 && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-terracotta-50 border border-terracotta-100">
            <AlertTriangle className="w-5 h-5 text-terracotta-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink">Urgent attention needed ({urgentAlerts.length})</p>
              <ul className="mt-1 text-sm text-ink/70 space-y-0.5">
                {urgentAlerts.slice(0, 3).map(a => (
                  <li key={a.id}>• {a.message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ---------- Combined Sales + Farm stats ---------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard icon={Package}       label="Active listings" value={activeListings.length}                                                     tint="moss" />
          <StatCard icon={Eye}           label="Total views"     value={totalViews.toLocaleString()}                                                tint="sage" />
          <StatCard icon={MessageCircle} label="Inquiries"       value={totalInquiries}                                                            tint="terracotta" />
          <StatCard icon={ShoppingBag}   label="Sales revenue"   value={`R${totalRevenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`}   tint="yolk" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Bird}        label="Total birds"     value={totalBirds.toLocaleString()}                                                  tint="moss"
            deltaLabel={`${activeBatches.length} active ${activeBatches.length === 1 ? 'batch' : 'batches'}`} />
          <StatCard icon={Egg}         label="Eggs (7 days)"   value={totalEggsWeek.toLocaleString()}                                               tint="yolk"
            deltaLabel={`${layerBatches.length} layer ${layerBatches.length === 1 ? 'batch' : 'batches'}`} />
          <StatCard icon={DollarSign}  label="Farm profit"     value={`R${farmProfit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`}        tint={farmProfit >= 0 ? 'moss' : 'terracotta'}
            deltaLabel={`Costs R${farmCosts.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`} />
          <StatCard icon={Package}     label="Feed types"      value={feedTypes.length}                                                             tint="sage"
            deltaLabel={lowStockFeeds.length > 0 ? `${lowStockFeeds.length} low stock` : 'All stocked'} />
        </div>

        {/* ---------- Quick actions ---------- */}
        <div className="mb-12">
          <p className="eyebrow mb-3">Manage</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickActions.map((a) => (
              <Link key={a.path} to={createPageUrl(a.path)} className="group">
                <div className={`card-premium p-5 ${a.tint} ${a.border} hover:-translate-y-1 transition-transform`}>
                  <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 ${a.text}`}>
                    <a.icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <p className="font-display text-base text-ink">{a.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ---------- Tabs: Listings + Batches ---------- */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
            <TabsTrigger value="listings" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream data-[state=active]:shadow-soft">
              My listings ({activeListings.length})
            </TabsTrigger>
            <TabsTrigger value="batches" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">
              Active batches ({activeBatches.length})
            </TabsTrigger>
            <TabsTrigger value="layers" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">
              Layer performance
            </TabsTrigger>
          </TabsList>

          {/* ===== LISTINGS TAB ===== */}
          <TabsContent value="listings">
            {listingsLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => <ListingSkeleton key={i} />)}
              </div>
            ) : activeListings.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No active listings yet"
                subtitle="Your shop won't show up in the marketplace until you publish your first listing. It only takes a few minutes."
                action={
                  <Link to={createPageUrl('CreateListing')}>
                    <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5">
                      <Plus className="w-4 h-4" />
                      Create your first listing
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {activeListings.map((listing) => (
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    onMarkSold={() => {
                      setMarkSoldDialog(listing);
                      setSoldQuantity(String(listing.stock_quantity));
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== BATCHES TAB ===== */}
          <TabsContent value="batches">
            {activeBatches.length === 0 ? (
              <EmptyState
                icon={Bird}
                title="No active batches"
                subtitle="Create a batch to track birds, feed, vaccinations, and finances over time."
                action={
                  <Link to={createPageUrl('BatchManagement')}>
                    <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5">
                      <Plus className="w-4 h-4" />
                      Create first batch
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeBatches.map((batch) => (
                  <Link
                    key={batch.id}
                    to={createPageUrl('BatchDetail') + `?id=${batch.id}`}
                    className="card-premium p-5 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <h4 className="font-display text-lg text-ink truncate group-hover:text-moss-700 transition-colors">
                          {batch.batch_name}
                        </h4>
                        <Badge variant="outline" className="mt-1 capitalize border-border text-ink/60 font-normal">
                          {batch.bird_type}
                        </Badge>
                      </div>
                      <Bird className="w-5 h-5 text-moss-600 flex-shrink-0" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border text-center">
                      <div>
                        <p className="font-display text-lg font-bold text-ink">{batch.current_quantity || 0}</p>
                        <p className="text-[10px] uppercase tracking-wider text-ink/50">Birds</p>
                      </div>
                      <div className="border-x border-border">
                        <p className="font-display text-lg font-bold text-ink">{batch.age_in_weeks || 0}w</p>
                        <p className="text-[10px] uppercase tracking-wider text-ink/50">Age</p>
                      </div>
                      <div>
                        <p className="font-display text-base font-bold text-ink truncate">{batch.breed || '—'}</p>
                        <p className="text-[10px] uppercase tracking-wider text-ink/50">Breed</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== LAYERS TAB ===== */}
          <TabsContent value="layers">
            {layerBatches.length === 0 ? (
              <EmptyState
                icon={Egg}
                title="No layer batches"
                subtitle="Layer batches let you track daily egg production and conversion rate. Add a layer batch to see performance here."
                action={
                  <Link to={createPageUrl('BatchManagement')}>
                    <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5">
                      <Plus className="w-4 h-4" />
                      Add layer batch
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="card-premium p-7">
                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <p className="eyebrow">Total layers</p>
                    <p className="font-display text-3xl font-bold text-ink mt-1">
                      {layerBatches.reduce((sum, b) => sum + (b.current_quantity || 0), 0)}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow">Eggs this week</p>
                    <p className="font-display text-3xl font-bold text-yolk-600 mt-1">{totalEggsWeek}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Avg production rate</p>
                    <p className="font-display text-3xl font-bold text-moss-700 mt-1">
                      {eggProduction.length > 0
                        ? (eggProduction.reduce((sum, e) => sum + (e.production_rate || 0), 0) / eggProduction.length).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ============ MARK-AS-SOLD DIALOG ============ */}
      {markSoldDialog && (
        <Dialog open={!!markSoldDialog} onOpenChange={() => setMarkSoldDialog(null)}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Record sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-cream">
                <img
                  src={markSoldDialog.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=120'}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{markSoldDialog.title}</p>
                  <p className="text-xs text-ink/60">
                    Available: {markSoldDialog.stock_quantity}
                    {markSoldDialog.sold_quantity > 0 && ` · Sold: ${markSoldDialog.sold_quantity}`}
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="sold_quantity">Quantity sold</Label>
                <Input
                  id="sold_quantity"
                  type="number"
                  min="1"
                  max={markSoldDialog.stock_quantity}
                  value={soldQuantity}
                  onChange={(e) => setSoldQuantity(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="p-3 rounded-xl bg-moss-50 border border-moss-100">
                <p className="text-sm font-medium text-moss-700">
                  Sale value: R{(markSoldDialog.price * (parseInt(soldQuantity) || 0)).toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const qty = parseInt(soldQuantity);
                    if (!qty || qty <= 0 || qty > markSoldDialog.stock_quantity) {
                      toast.error('Enter a valid quantity');
                      return;
                    }
                    markAsSoldMutation.mutate({ id: markSoldDialog.id, quantity: qty, listing: markSoldDialog });
                  }}
                  disabled={markAsSoldMutation.isPending}
                  className="btn-cta flex-1 py-2.5"
                >
                  {markAsSoldMutation.isPending ? 'Recording…' : 'Confirm sale'}
                </Button>
                <Button onClick={() => setMarkSoldDialog(null)} variant="outline" className="rounded-full">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ====================================================================== */
/*  ListingRow — compact row with quick actions                           */
/* ====================================================================== */
function ListingRow({ listing, onMarkSold }) {
  return (
    <div className="card-premium p-4 sm:p-5 flex flex-col sm:flex-row gap-4 group">
      <Link
        to={createPageUrl('ProductDetail') + `?id=${listing.id}`}
        className="flex-shrink-0"
      >
        <img
          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200'}
          alt={listing.title}
          className="w-full sm:w-28 h-28 rounded-xl object-cover bg-cream-deep"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`}>
              <h3 className="font-display text-lg text-ink truncate group-hover:text-moss-700 transition-colors">
                {listing.title}
              </h3>
            </Link>
            {listing.breed && <p className="text-sm text-ink/60">{listing.breed}</p>}
          </div>
          {listing.featured && (
            <Badge className="bg-yolk-300 text-ink hover:bg-yolk-300 border-0 gap-1 flex-shrink-0">
              <Star className="w-3 h-3 fill-ink" />
              Featured
            </Badge>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-x-5 gap-y-1 text-sm text-ink/65">
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-ink/40" />
            {listing.view_count || 0} views
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5 text-ink/40" />
            {listing.inquiry_count || 0} inquiries
          </span>
          <span className="inline-flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-ink/40" />
            {listing.stock_quantity} in stock
          </span>
          <span className="font-display font-bold text-ink">R{listing.price?.toLocaleString('en-ZA') || 0}</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`}>
            <button className="btn-ghost px-3 py-1.5 text-xs border border-border">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View
            </button>
          </Link>
          <Link to={createPageUrl('EditListing') + `?id=${listing.id}`}>
            <button className="btn-ghost px-3 py-1.5 text-xs border border-border">
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </button>
          </Link>
          <button
            onClick={onMarkSold}
            className="btn-ghost px-3 py-1.5 text-xs border border-border text-moss-700 hover:bg-moss-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Mark sold
          </button>
        </div>
      </div>
    </div>
  );
}
