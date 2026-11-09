import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, ShoppingCart, TrendingDown, AlertTriangle, Loader2, Wheat, Truck, Phone, Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import moment from 'moment';

const listVariants = { show: { transition: { staggerChildren: 0.05 } } };
const rowVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
const tabCls = 'rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream';
const birdTypeChip = { layers: 'chip-yolk', broilers: 'chip-accent', both: '' };

export default function FeedManagement() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [showFeedTypeForm, setShowFeedTypeForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [feedTypeFormData, setFeedTypeFormData] = useState({
    name: '',
    category: 'starter',
    bird_type: 'broilers',
    protein_percentage: '',
    current_stock_kg: 0,
    low_stock_alert_kg: 100,
    cost_per_kg: '',
    description: ''
  });
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [purchaseFormData, setPurchaseFormData] = useState({
    feed_type_id: '',
    supplier_id: '',
    quantity_kg: '',
    cost_per_kg: '',
    purchase_date: moment().format('YYYY-MM-DD'),
    invoice_number: '',
    notes: ''
  });
  const [usageFormData, setUsageFormData] = useState({
    batch_id: '',
    feed_type_id: '',
    quantity_kg: '',
    usage_date: moment().format('YYYY-MM-DD'),
    notes: ''
  });

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

  const { data: feedTypes = [] } = useQuery({
    queryKey: ['feed-types'],
    queryFn: () => api.entities.FeedType.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.entities.FeedSupplier.filter({ created_by: user?.email }),
    enabled: !!user
  });

  // Create default feed types if none exist
  useEffect(() => {
    const createDefaults = async () => {
      if (user && feedTypes.length === 0) {
        const defaults = [
          { name: 'Broiler Starter', category: 'starter', bird_type: 'broilers', protein_percentage: 23, current_stock_kg: 0, low_stock_alert_kg: 100, cost_per_kg: 8.5, description: 'High protein starter feed for broilers (0-2 weeks)' },
          { name: 'Broiler Grower', category: 'grower', bird_type: 'broilers', protein_percentage: 20, current_stock_kg: 0, low_stock_alert_kg: 100, cost_per_kg: 7.5, description: 'Grower feed for broilers (3-4 weeks)' },
          { name: 'Broiler Finisher', category: 'finisher', bird_type: 'broilers', protein_percentage: 18, current_stock_kg: 0, low_stock_alert_kg: 100, cost_per_kg: 7, description: 'Finisher feed for broilers (5+ weeks)' },
          { name: 'Layer Starter', category: 'starter', bird_type: 'layers', protein_percentage: 20, current_stock_kg: 0, low_stock_alert_kg: 100, cost_per_kg: 8, description: 'Starter feed for layer chicks (0-6 weeks)' },
          { name: 'Layer Grower', category: 'grower', bird_type: 'layers', protein_percentage: 16, current_stock_kg: 0, low_stock_alert_kg: 100, cost_per_kg: 7, description: 'Grower feed for layers (7-18 weeks)' },
          { name: 'Layer Mash', category: 'layer_mash', bird_type: 'layers', protein_percentage: 17, current_stock_kg: 0, low_stock_alert_kg: 150, cost_per_kg: 7.5, description: 'Production feed for laying hens' }
        ];
        
        for (const feed of defaults) {
          await api.entities.FeedType.create(feed);
        }
        queryClient.invalidateQueries(['feed-types']);
      }
    };
    createDefaults();
  }, [user, feedTypes.length]);

  const { data: batches = [] } = useQuery({
    queryKey: ['batches-feed'],
    queryFn: () => api.entities.PoultryBatch.filter({ created_by: user?.email, status: 'active' }),
    enabled: !!user
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['feed-purchases'],
    queryFn: () => api.entities.FeedPurchase.filter({ created_by: user?.email }, '-purchase_date', 20),
    enabled: !!user
  });

  const recordPurchaseMutation = useMutation({
    mutationFn: async (data) => {
      const feed = feedTypes.find(f => f.id === data.feed_type_id);
      const supplier = suppliers.find(s => s.id === data.supplier_id);
      const quantity = parseFloat(data.quantity_kg);
      const costPerKg = parseFloat(data.cost_per_kg);
      
      await api.entities.FeedPurchase.create({
        ...data,
        feed_name: feed.name,
        supplier_name: supplier.name,
        quantity_kg: quantity,
        cost_per_kg: costPerKg,
        total_cost: quantity * costPerKg
      });

      // Update feed stock
      await api.entities.FeedType.update(data.feed_type_id, {
        current_stock_kg: (feed.current_stock_kg || 0) + quantity
      });
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed-purchases']);
      queryClient.invalidateQueries(['feed-types']);
      toast.success('Purchase recorded');
      resetPurchaseForm();
    }
  });

  const createFeedTypeMutation = useMutation({
    mutationFn: (data) => api.entities.FeedType.create(data),
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed-types']);
      toast.success('Feed type added');
      resetFeedTypeForm();
    }
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data) => api.entities.FeedSupplier.create(data),
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success('Supplier added');
      resetSupplierForm();
    }
  });

  const recordUsageMutation = useMutation({
    mutationFn: async (data) => {
      const feed = feedTypes.find(f => f.id === data.feed_type_id);
      const batch = batches.find(b => b.id === data.batch_id);
      const quantity = parseFloat(data.quantity_kg);
      const cost = quantity * (feed.cost_per_kg || 0);

      await api.entities.FeedUsage.create({
        ...data,
        feed_name: feed.name,
        batch_name: batch.batch_name,
        quantity_kg: quantity,
        cost: cost,
        birds_count: batch.current_quantity
      });

      // Update feed stock
      await api.entities.FeedType.update(data.feed_type_id, {
        current_stock_kg: Math.max(0, (feed.current_stock_kg || 0) - quantity)
      });

      // Update batch feed cost
      await api.entities.PoultryBatch.update(data.batch_id, {
        total_feed_cost: (batch.total_feed_cost || 0) + cost
      });
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed-types']);
      queryClient.invalidateQueries(['batches-feed']);
      toast.success('Feed usage recorded');
      resetUsageForm();
    }
  });

  const resetPurchaseForm = () => {
    setPurchaseFormData({
      feed_type_id: '',
      supplier_id: '',
      quantity_kg: '',
      cost_per_kg: '',
      purchase_date: moment().format('YYYY-MM-DD'),
      invoice_number: '',
      notes: ''
    });
    setShowPurchaseForm(false);
  };

  const resetUsageForm = () => {
    setUsageFormData({
      batch_id: '',
      feed_type_id: '',
      quantity_kg: '',
      usage_date: moment().format('YYYY-MM-DD'),
      notes: ''
    });
    setShowUsageForm(false);
  };

  const resetFeedTypeForm = () => {
    setFeedTypeFormData({
      name: '',
      category: 'starter',
      bird_type: 'broilers',
      protein_percentage: '',
      current_stock_kg: 0,
      low_stock_alert_kg: 100,
      cost_per_kg: '',
      description: ''
    });
    setShowFeedTypeForm(false);
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setShowSupplierForm(false);
  };

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const lowStockFeeds = feedTypes.filter(f => f.current_stock_kg <= f.low_stock_alert_kg);
  const totalStockKg = feedTypes.reduce((s, f) => s + (f.current_stock_kg || 0), 0);
  const stockValue = feedTypes.reduce((s, f) => s + (f.current_stock_kg || 0) * (f.cost_per_kg || 0), 0);
  const purchaseSpend = purchases.reduce((s, p) => s + (p.total_cost || 0), 0);

  return (
    <PageShell
      variant="compact"
      eyebrow="Farm"
      title="Feed"
      subtitle="Track feed stock, purchases, suppliers and daily usage across your batches."
      breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Feed' }]}
      action={(
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowFeedTypeForm(true)} className="btn-ghost border border-border bg-white px-4 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Feed type</Button>
          <Button onClick={() => setShowSupplierForm(true)} className="btn-ghost border border-border bg-white px-4 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Supplier</Button>
          <Button onClick={() => setShowUsageForm(true)} className="btn-ghost border border-border bg-white px-4 py-2.5 text-sm gap-1.5"><TrendingDown className="w-4 h-4" /> Record usage</Button>
          <Button onClick={() => setShowPurchaseForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><ShoppingCart className="w-4 h-4" /> Record purchase</Button>
        </div>
      )}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Feed types" value={feedTypes.length} deltaLabel={`${lowStockFeeds.length} low on stock`} tint={lowStockFeeds.length ? 'yolk' : 'moss'} />
        <StatCard icon={Wheat} label="Stock on hand" value={`${totalStockKg.toLocaleString()} kg`} deltaLabel={`≈ R${Math.round(stockValue).toLocaleString()} value`} tint="moss" />
        <StatCard icon={ShoppingCart} label="Recent purchases" value={purchases.length} deltaLabel={`R${Math.round(purchaseSpend).toLocaleString()} spent`} tint="sage" />
        <StatCard icon={Truck} label="Suppliers" value={suppliers.length} tint="terracotta" />
      </div>

      {lowStockFeeds.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-amber-gradient text-ink p-5 mb-8 border border-yolk-200">
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/70 border border-yolk-200 flex items-center justify-center text-yolk-700 flex-shrink-0"><AlertTriangle className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <p className="eyebrow text-yolk-700 mb-1">Low stock</p>
              <p className="font-display text-lg text-ink leading-snug">{lowStockFeeds.length} feed {lowStockFeeds.length === 1 ? 'type is' : 'types are'} at or below the alert level</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {lowStockFeeds.map(feed => (
                  <span key={feed.id} className="chip bg-white/80 text-ink border-yolk-200">{feed.name} · {feed.current_stock_kg}kg</span>
                ))}
              </div>
            </div>
            <Button onClick={() => setShowPurchaseForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5 flex-shrink-0"><ShoppingCart className="w-4 h-4" /> Restock</Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
          <TabsTrigger value="inventory" className={tabCls}>Inventory ({feedTypes.length})</TabsTrigger>
          <TabsTrigger value="suppliers" className={tabCls}>Suppliers ({suppliers.length})</TabsTrigger>
          <TabsTrigger value="purchases" className={tabCls}>Purchases ({purchases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          {feedTypes.length === 0 ? (
            <EmptyState icon={Package} title="Setting up default feed types" subtitle="We are creating starter, grower, finisher and layer feeds for you. This only takes a moment." />
          ) : (
            <motion.div initial="hidden" animate="show" variants={listVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {feedTypes.map(feed => {
                const isLow = feed.current_stock_kg <= feed.low_stock_alert_kg;
                const target = Math.max(feed.low_stock_alert_kg * 3, 1);
                const pct = Math.min(100, Math.round(((feed.current_stock_kg || 0) / target) * 100));
                return (
                  <motion.article key={feed.id} variants={rowVariants} className={`card-premium p-5 flex flex-col ${isLow ? 'border-yolk-200' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-lg text-ink leading-snug truncate">{feed.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="chip capitalize">{(feed.category || '').replace(/_/g, ' ')}</span>
                          <span className={`chip capitalize ${birdTypeChip[feed.bird_type] || ''}`}>{feed.bird_type}</span>
                          {isLow && <span className="chip bg-yolk-50 text-yolk-700 border-yolk-200 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low</span>}
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLow ? 'bg-yolk-50 text-yolk-600' : 'bg-moss-50 text-moss-700'}`}><Package className="w-5 h-5" strokeWidth={1.75} /></div>
                    </div>
                    {feed.description && <p className="text-xs text-ink/55 mt-2 line-clamp-2">{feed.description}</p>}

                    <div className="mt-4">
                      <div className="flex justify-between items-end mb-1">
                        <span className="stat-num font-display font-bold text-2xl text-ink leading-none">{feed.current_stock_kg}<span className="text-sm text-ink/50 font-normal ml-1">kg</span></span>
                        <span className="text-[11px] text-ink/55">alert at {feed.low_stock_alert_kg}kg</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-cream-deep overflow-hidden"><div className={`h-full rounded-full ${isLow ? 'bg-yolk-500' : 'bg-fresh-500'}`} style={{ width: `${pct}%` }} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="rounded-xl bg-cream p-2.5 text-center"><p className="font-display font-bold text-sm text-ink leading-none">R{feed.cost_per_kg || 0}</p><p className="text-[10px] uppercase tracking-wider text-ink/50 mt-1">per kg</p></div>
                      <div className="rounded-xl bg-cream p-2.5 text-center"><p className="font-display font-bold text-sm text-ink leading-none">{feed.protein_percentage ? `${feed.protein_percentage}%` : '—'}</p><p className="text-[10px] uppercase tracking-wider text-ink/50 mt-1">protein</p></div>
                    </div>

                    <div className="mt-auto pt-4 flex gap-2">
                      <button onClick={() => { setUsageFormData({ ...usageFormData, feed_type_id: feed.id }); setShowUsageForm(true); }} className="btn-ghost flex-1 justify-center border border-border bg-white py-2 text-sm gap-1.5"><TrendingDown className="w-4 h-4" /> Use</button>
                      <button onClick={() => { setPurchaseFormData({ ...purchaseFormData, feed_type_id: feed.id, cost_per_kg: feed.cost_per_kg ?? '' }); setShowPurchaseForm(true); }} className="btn-cta flex-1 justify-center py-2 text-sm gap-1.5"><ShoppingCart className="w-4 h-4" /> Buy</button>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="suppliers">
          {suppliers.length === 0 ? (
            <EmptyState icon={Truck} title="No suppliers yet" subtitle="Add the mills and agents you buy from so purchases can be tracked by supplier." action={<Button onClick={() => setShowSupplierForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Add supplier</Button>} />
          ) : (
            <motion.div initial="hidden" animate="show" variants={listVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {suppliers.map(supplier => (
                <motion.article key={supplier.id} variants={rowVariants} className="card-premium p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg text-ink leading-snug truncate">{supplier.name}</h3>
                      {supplier.contact_person && <p className="text-xs text-ink/55 mt-0.5">{supplier.contact_person}</p>}
                    </div>
                    <span className={`chip ${supplier.is_active === false ? 'bg-cream-deep text-ink/60 border-border' : 'bg-fresh-50 text-moss-700 border-fresh-200'}`}>{supplier.is_active === false ? 'Inactive' : 'Active'}</span>
                  </div>
                  <ul className="space-y-1.5 text-sm text-ink/70">
                    {supplier.phone && <li className="inline-flex items-center gap-2 w-full"><Phone className="w-3.5 h-3.5 text-ink/40" />{supplier.phone}</li>}
                    {supplier.email && <li className="inline-flex items-center gap-2 w-full truncate"><Mail className="w-3.5 h-3.5 text-ink/40" />{supplier.email}</li>}
                    {supplier.address && <li className="inline-flex items-start gap-2 w-full"><MapPin className="w-3.5 h-3.5 text-ink/40 mt-0.5" />{supplier.address}</li>}
                    {!supplier.phone && !supplier.email && !supplier.address && <li className="text-ink/45">No contact details</li>}
                  </ul>
                  {supplier.notes && <p className="text-xs text-ink/55 italic mt-3 pt-3 border-t border-border">{supplier.notes}</p>}
                </motion.article>
              ))}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="purchases">
          {purchases.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No purchases recorded" subtitle="Each purchase you log adds to stock and your batch feed costs." action={<Button onClick={() => setShowPurchaseForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><ShoppingCart className="w-4 h-4" /> Record purchase</Button>} />
          ) : (
            <section className="card-premium overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2.5 bg-cream text-[11px] uppercase tracking-wider text-ink/50 font-semibold">
                <span className="col-span-4">Feed</span><span className="col-span-3">Supplier</span><span className="col-span-2">Date</span><span className="col-span-1 text-right">Qty</span><span className="col-span-2 text-right">Total</span>
              </div>
              <motion.ul initial="hidden" animate="show" variants={listVariants} className="divide-y divide-border">
                {purchases.map(purchase => (
                  <motion.li key={purchase.id} variants={rowVariants} className="px-6 py-3 grid grid-cols-2 md:grid-cols-12 gap-1 md:gap-3 md:items-center hover:bg-cream/70">
                    <div className="col-span-2 md:col-span-4 min-w-0">
                      <p className="font-medium text-ink truncate">{purchase.feed_name}</p>
                      <p className="md:hidden text-xs text-ink/55">{purchase.supplier_name} · {moment(purchase.purchase_date).format('D MMM YYYY')}</p>
                      {purchase.invoice_number && <p className="text-xs text-ink/45">Inv {purchase.invoice_number}</p>}
                    </div>
                    <p className="hidden md:block md:col-span-3 text-sm text-ink/70 truncate">{purchase.supplier_name}</p>
                    <p className="hidden md:block md:col-span-2 text-sm text-ink/60">{moment(purchase.purchase_date).format('D MMM YYYY')}</p>
                    <p className="md:col-span-1 text-sm text-ink/70 md:text-right">{purchase.quantity_kg}kg <span className="md:hidden text-ink/45">@ R{purchase.cost_per_kg}/kg</span></p>
                    <p className="md:col-span-2 text-right font-semibold text-ink tabular-nums">R{Math.round(purchase.total_cost || 0).toLocaleString()}</p>
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showPurchaseForm} onOpenChange={(open) => !open && resetPurchaseForm()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Record feed purchase</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); recordPurchaseMutation.mutate(purchaseFormData); }} className="space-y-4">
            <div>
              <Label>Feed Type *</Label>
              <Select value={purchaseFormData.feed_type_id} onValueChange={(value) => setPurchaseFormData({ ...purchaseFormData, feed_type_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feed" />
                </SelectTrigger>
                <SelectContent>
                  {feedTypes.map(feed => (
                    <SelectItem key={feed.id} value={feed.id}>{feed.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Supplier *</Label>
              <Select value={purchaseFormData.supplier_id} onValueChange={(value) => setPurchaseFormData({ ...purchaseFormData, supplier_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {suppliers.length === 0 && <p className="text-xs text-ink/55 mt-1">No suppliers yet — <button type="button" onClick={() => { resetPurchaseForm(); setShowSupplierForm(true); }} className="text-moss-700 underline">add one first</button>.</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchaseFormData.quantity_kg}
                  onChange={(e) => setPurchaseFormData({ ...purchaseFormData, quantity_kg: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Cost per kg *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchaseFormData.cost_per_kg}
                  onChange={(e) => setPurchaseFormData({ ...purchaseFormData, cost_per_kg: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={purchaseFormData.purchase_date}
                onChange={(e) => setPurchaseFormData({ ...purchaseFormData, purchase_date: e.target.value })}
              />
            </div>

            {purchaseFormData.quantity_kg && purchaseFormData.cost_per_kg && (
              <div className="rounded-xl bg-cream p-3 flex items-center justify-between text-sm"><span className="text-ink/60">Total</span><span className="font-display font-bold text-ink">R{(parseFloat(purchaseFormData.quantity_kg) * parseFloat(purchaseFormData.cost_per_kg)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={resetPurchaseForm}>Cancel</Button>
              <Button type="submit" disabled={recordPurchaseMutation.isPending} className="btn-cta px-5">Record purchase</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showUsageForm} onOpenChange={(open) => !open && resetUsageForm()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Record feed usage</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); recordUsageMutation.mutate(usageFormData); }} className="space-y-4">
            <div>
              <Label>Batch *</Label>
              <Select value={usageFormData.batch_id} onValueChange={(value) => setUsageFormData({ ...usageFormData, batch_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>{batch.batch_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Feed Type *</Label>
              <Select value={usageFormData.feed_type_id} onValueChange={(value) => setUsageFormData({ ...usageFormData, feed_type_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feed" />
                </SelectTrigger>
                <SelectContent>
                  {feedTypes.map(feed => (
                    <SelectItem key={feed.id} value={feed.id}>{feed.name} ({feed.current_stock_kg}kg)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantity (kg) *</Label>
              <Input
                type="number"
                step="0.01"
                value={usageFormData.quantity_kg}
                onChange={(e) => setUsageFormData({ ...usageFormData, quantity_kg: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={resetUsageForm}>Cancel</Button>
              <Button type="submit" disabled={recordUsageMutation.isPending} className="btn-cta px-5">Record usage</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showFeedTypeForm} onOpenChange={(open) => !open && resetFeedTypeForm()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Add feed type</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createFeedTypeMutation.mutate(feedTypeFormData); }} className="space-y-4">
            <div>
              <Label>Feed Name *</Label>
              <Input
                value={feedTypeFormData.name}
                onChange={(e) => setFeedTypeFormData({ ...feedTypeFormData, name: e.target.value })}
                placeholder="e.g., Premium Broiler Starter"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={feedTypeFormData.category} onValueChange={(value) => setFeedTypeFormData({ ...feedTypeFormData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="grower">Grower</SelectItem>
                    <SelectItem value="finisher">Finisher</SelectItem>
                    <SelectItem value="layer_mash">Layer Mash</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bird Type *</Label>
                <Select value={feedTypeFormData.bird_type} onValueChange={(value) => setFeedTypeFormData({ ...feedTypeFormData, bird_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="layers">Layers</SelectItem>
                    <SelectItem value="broilers">Broilers</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Protein %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={feedTypeFormData.protein_percentage}
                  onChange={(e) => setFeedTypeFormData({ ...feedTypeFormData, protein_percentage: e.target.value })}
                  placeholder="e.g., 20"
                />
              </div>

              <div>
                <Label>Cost per kg *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={feedTypeFormData.cost_per_kg}
                  onChange={(e) => setFeedTypeFormData({ ...feedTypeFormData, cost_per_kg: e.target.value })}
                  placeholder="e.g., 7.50"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Low Stock Alert (kg)</Label>
              <Input
                type="number"
                value={feedTypeFormData.low_stock_alert_kg}
                onChange={(e) => setFeedTypeFormData({ ...feedTypeFormData, low_stock_alert_kg: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={feedTypeFormData.description}
                onChange={(e) => setFeedTypeFormData({ ...feedTypeFormData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={resetFeedTypeForm}>Cancel</Button>
              <Button type="submit" disabled={createFeedTypeMutation.isPending} className="btn-cta px-5">Add feed type</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSupplierForm} onOpenChange={(open) => !open && resetSupplierForm()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Add supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createSupplierMutation.mutate(supplierFormData); }} className="space-y-4">
            <div>
              <Label>Supplier Name *</Label>
              <Input
                value={supplierFormData.name}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                placeholder="e.g., ABC Feed Co."
                required
              />
            </div>

            <div>
              <Label>Contact Person</Label>
              <Input
                value={supplierFormData.contact_person}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_person: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={supplierFormData.phone}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                  placeholder="+27 123 456 789"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={supplierFormData.email}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                  placeholder="supplier@example.com"
                />
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={supplierFormData.address}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                placeholder="123 Main Street, City"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={supplierFormData.notes}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={resetSupplierForm}>Cancel</Button>
              <Button type="submit" disabled={createSupplierMutation.isPending} className="btn-cta px-5">Add supplier</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
