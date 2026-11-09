import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bird, Plus, Edit, Trash2, TrendingUp, Loader2, Archive, ArchiveRestore, Egg, HeartCrack, Home, Tag, Wallet, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton } from '@/components/shell/SkeletonCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { fetchForUserAndFarms, farmStamp } from '@/lib/farm';
import moment from 'moment';

export default function BatchManagement() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [showEggForm, setShowEggForm] = useState(false);
  const [showMortalityForm, setShowMortalityForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [eggFormData, setEggFormData] = useState({
    eggs_collected: '',
    production_date: moment().format('YYYY-MM-DD'),
    eggs_sold: 0,
    eggs_damaged: 0,
    revenue: 0,
    notes: ''
  });
  const [mortalityFormData, setMortalityFormData] = useState({
    count: '',
    date: moment().format('YYYY-MM-DD'),
    cause: '',
    notes: ''
  });
  const [formData, setFormData] = useState({
    batch_name: '',
    bird_type: 'broilers',
    breed: '',
    initial_quantity: '',
    current_quantity: '',
    available_quantity: '',
    date_acquired: moment().format('YYYY-MM-DD'),
    expected_maturity_weeks: '',
    daily_feed_per_bird_kg: '0.12',
    housing_location: '',
    notes: '',
    images: []
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingFormData, setListingFormData] = useState({
    quantity: '',
    price: '',
    price_type: 'per_item'
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

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => fetchForUserAndFarms(api.entities.PoultryBatch, user, 'created_date'),
    enabled: !!user
  });

  const { data: sellerTiers = [] } = useQuery({
    queryKey: ['seller-tiers-batches'],
    queryFn: () => api.entities.SellerTier.list(),
    enabled: !!user
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data) => {
      const batchNumber = `B${Date.now()}`;
      const currentQuantity = parseInt(data.current_quantity || data.initial_quantity);
      const ageInWeeks = moment().diff(moment(data.date_acquired), 'weeks');
      const expectedHarvestDate = data.expected_maturity_weeks 
        ? moment(data.date_acquired).add(parseInt(data.expected_maturity_weeks), 'weeks').format('YYYY-MM-DD')
        : null;

      await api.entities.PoultryBatch.create({
        ...(await farmStamp(user)),
        batch_number: batchNumber,
        batch_name: data.batch_name,
        bird_type: data.bird_type,
        breed: data.breed,
        initial_quantity: parseInt(data.initial_quantity),
        current_quantity: currentQuantity,
        available_quantity: currentQuantity,
        date_acquired: data.date_acquired,
        age_in_weeks: ageInWeeks,
        expected_maturity_weeks: data.expected_maturity_weeks ? parseInt(data.expected_maturity_weeks) : undefined,
        expected_harvest_date: expectedHarvestDate,
        daily_feed_per_bird_kg: parseFloat(data.daily_feed_per_bird_kg || 0.12),
        housing_location: data.housing_location,
        notes: data.notes,
        images: data.images || [],
        status: 'active'
      });
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Batch created successfully');
      resetForm();
    }
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.PoultryBatch.update(id, {
      batch_name: data.batch_name,
      bird_type: data.bird_type,
      breed: data.breed,
      initial_quantity: parseInt(data.initial_quantity),
      current_quantity: parseInt(data.current_quantity),
      available_quantity: parseInt(data.available_quantity),
      date_acquired: data.date_acquired,
      expected_maturity_weeks: data.expected_maturity_weeks ? parseInt(data.expected_maturity_weeks) : undefined,
      daily_feed_per_bird_kg: parseFloat(data.daily_feed_per_bird_kg || 0.12),
      housing_location: data.housing_location,
      notes: data.notes,
      images: data.images || []
    }),
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Batch updated');
      resetForm();
    }
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (id) => api.entities.PoultryBatch.delete(id),
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Batch deleted');
    }
  });

  const archiveBatchMutation = useMutation({
    mutationFn: (id) => api.entities.PoultryBatch.update(id, { status: 'archived' }),
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Batch archived');
    }
  });

  const unarchiveBatchMutation = useMutation({
    mutationFn: (id) => api.entities.PoultryBatch.update(id, { status: 'active' }),
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Batch unarchived');
    }
  });

  const recordEggsMutation = useMutation({
    mutationFn: async (data) => {
      const batch = batches.find(b => b.id === selectedBatch.id);
      const eggsCollected = parseInt(data.eggs_collected);
      const productionRate = (eggsCollected / batch.current_quantity) * 100;

      await api.entities.EggProduction.create({
        ...(await farmStamp(user)),
        batch_id: batch.id,
        batch_name: batch.batch_name,
        production_date: data.production_date,
        eggs_collected: eggsCollected,
        birds_count: batch.current_quantity,
        production_rate: productionRate,
        eggs_sold: parseInt(data.eggs_sold) || 0,
        eggs_damaged: parseInt(data.eggs_damaged) || 0,
        revenue: parseFloat(data.revenue) || 0,
        notes: data.notes
      });

      await api.entities.PoultryBatch.update(batch.id, {
        total_eggs_produced: (batch.total_eggs_produced || 0) + eggsCollected,
        total_revenue: (batch.total_revenue || 0) + (parseFloat(data.revenue) || 0)
      });
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Egg production recorded');
      setShowEggForm(false);
      setSelectedBatch(null);
      setEggFormData({
        eggs_collected: '',
        production_date: moment().format('YYYY-MM-DD'),
        eggs_sold: 0,
        eggs_damaged: 0,
        revenue: 0,
        notes: ''
      });
    }
  });

  const recordMortalityMutation = useMutation({
    mutationFn: async (data) => {
      const batch = batches.find(b => b.id === selectedBatch.id);
      const count = parseInt(data.count);

      await api.entities.BatchExpense.create({
        ...(await farmStamp(user)),
        batch_id: batch.id,
        batch_name: batch.batch_name,
        expense_type: 'mortality_loss',
        amount: 0,
        expense_date: data.date,
        description: `Mortality: ${count} birds. ${data.cause ? 'Cause: ' + data.cause : ''} ${data.notes || ''}`
      });

      await api.entities.PoultryBatch.update(batch.id, {
        mortality_count: (batch.mortality_count || 0) + count,
        current_quantity: Math.max(0, batch.current_quantity - count),
        available_quantity: Math.max(0, (batch.available_quantity || batch.current_quantity) - count)
      });
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Mortality recorded');
      setShowMortalityForm(false);
      setSelectedBatch(null);
      setMortalityFormData({
        count: '',
        date: moment().format('YYYY-MM-DD'),
        cause: '',
        notes: ''
      });
    }
  });

  const resetForm = () => {
    setFormData({
      batch_name: '',
      bird_type: 'broilers',
      breed: '',
      initial_quantity: '',
      current_quantity: '',
      available_quantity: '',
      date_acquired: moment().format('YYYY-MM-DD'),
      expected_maturity_weeks: '',
      daily_feed_per_bird_kg: '0.12',
      housing_location: '',
      notes: '',
      images: []
    });
    setEditingBatch(null);
    setShowForm(false);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingImages(true);
    const uploadedUrls = [];
    
    for (const file of files) {
      try {
        const { file_url } = await api.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      } catch (error) {
        toast.error('Failed to upload image');
      }
    }
    
    setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...uploadedUrls] }));
    setUploadingImages(false);
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      batch_name: batch.batch_name,
      bird_type: batch.bird_type,
      breed: batch.breed || '',
      initial_quantity: batch.initial_quantity,
      current_quantity: batch.current_quantity,
      available_quantity: batch.available_quantity,
      date_acquired: batch.date_acquired,
      expected_maturity_weeks: batch.expected_maturity_weeks || '',
      daily_feed_per_bird_kg: batch.daily_feed_per_bird_kg || '0.12',
      housing_location: batch.housing_location || '',
      notes: batch.notes || '',
      images: batch.images || []
    });
    setShowForm(true);
  };

  const createListingFromBatch = async (batch) => {
    setSelectedBatch(batch);
    setListingFormData({
      quantity: batch.available_quantity.toString(),
      price: '',
      price_type: 'per_item'
    });
    setShowListingForm(true);
  };

  const createListingMutation = useMutation({
    mutationFn: async (data) => {
      const batch = selectedBatch;
      const quantity = parseInt(data.quantity);

      await api.entities.Listing.create({
        title: `${batch.breed || batch.bird_type} - ${batch.batch_name}`,
        breed: batch.breed || '',
        category: batch.bird_type === 'layers' ? 'layers' : batch.bird_type === 'broilers' ? 'broilers' : 'chickens',
        age: `${batch.age_in_weeks} weeks`,
        gender: 'mixed',
        stock_quantity: quantity,
        price: parseFloat(data.price),
        price_type: data.price_type,
        description: `${batch.bird_type} from ${batch.batch_name}. ${batch.notes || ''}`,
        images: batch.images || [],
        province: user.province || '',
        city: user.city || '',
        status: 'active'
      });

      await api.entities.PoultryBatch.update(batch.id, {
        available_quantity: batch.available_quantity - quantity
      });
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Listing created successfully');
      setShowListingForm(false);
      setSelectedBatch(null);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.batch_name || !formData.initial_quantity) {
      toast.error('Please fill required fields');
      return;
    }

    // Check tier limits when creating new batch
    if (!editingBatch) {
      const userTier = sellerTiers.find(t => t.name === (user?.seller_tier || 'basic'));
      const maxBatches = userTier?.max_batches || 10;
      const activeBatchesCount = batches.filter(b => b.status === 'active').length;
      
      if (activeBatchesCount >= maxBatches) {
        toast.error(`You've reached your batch limit (${maxBatches}). Upgrade your tier for more.`);
        return;
      }
    }

    if (editingBatch) {
      updateBatchMutation.mutate({ id: editingBatch.id, data: formData });
    } else {
      createBatchMutation.mutate(formData);
    }
  };

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const activeBatches = batches.filter(b => b.status === 'active');
  const archivedBatches = batches.filter(b => b.status === 'archived');
  const userTier = sellerTiers.find(t => t.name === (user?.seller_tier || 'basic'));
  const maxBatches = userTier?.max_batches || 10;
  const totalBirds = activeBatches.reduce((s, b) => s + (b.current_quantity || 0), 0);
  const totalAvailable = activeBatches.reduce((s, b) => s + (b.available_quantity || 0), 0);
  const totalMortality = activeBatches.reduce((s, b) => s + (b.mortality_count || 0), 0);
  const totalRevenue = batches.reduce((s, b) => s + (b.total_revenue || 0), 0);
  const birdTypeChip = { layers: 'chip-yolk', broilers: 'chip-accent', mixed: '' };

  const BatchCard = ({ batch, archived }) => {
    const pct = batch.initial_quantity ? Math.round(((batch.current_quantity || 0) / batch.initial_quantity) * 100) : 0;
    const maturity = batch.expected_maturity_weeks ? Math.min(100, Math.round(((batch.age_in_weeks || moment().diff(moment(batch.date_acquired), 'weeks')) / batch.expected_maturity_weeks) * 100)) : null;
    const age = moment().diff(moment(batch.date_acquired), 'weeks');
    return (
      <motion.article variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className={`card-premium overflow-hidden flex flex-col ${archived ? 'opacity-80' : ''}`}>
        <div className="aspect-[16/7] bg-moss-gradient relative overflow-hidden">
          {batch.images?.[0]
            ? <img src={batch.images[0]} alt="" className="w-full h-full object-cover" />
            : <div className="absolute inset-0 grain opacity-50 flex items-center justify-center"><Bird className="w-10 h-10 text-cream/30" /></div>}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className={`chip ${birdTypeChip[batch.bird_type] || ''} capitalize`}>{batch.bird_type}</span>
            {archived && <span className="chip bg-ink/70 text-cream border-0">Archived</span>}
          </div>
          {batch.housing_location && <span className="absolute bottom-3 left-3 text-[11px] text-cream/85 inline-flex items-center gap-1"><Home className="w-3 h-3" />{batch.housing_location}</span>}
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg text-ink leading-snug truncate">{batch.batch_name}</h3>
              <p className="text-xs text-ink/55 mt-0.5">{batch.breed || 'Breed not set'} · {age} wk old</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700 flex-shrink-0" aria-label="Batch actions"><MoreHorizontal className="w-4 h-4" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl w-52">
                <DropdownMenuItem asChild><Link to={createPageUrl('BatchDetail') + `?id=${batch.id}`} className="gap-2"><TrendingUp className="w-4 h-4" /> View details</Link></DropdownMenuItem>
                {!archived && <DropdownMenuItem onSelect={() => handleEdit(batch)} className="gap-2"><Edit className="w-4 h-4" /> Edit batch</DropdownMenuItem>}
                {!archived && batch.bird_type === 'layers' && <DropdownMenuItem onSelect={() => { setSelectedBatch(batch); setShowEggForm(true); }} className="gap-2"><Egg className="w-4 h-4 text-yolk-500" /> Record eggs</DropdownMenuItem>}
                {!archived && <DropdownMenuItem onSelect={() => { setSelectedBatch(batch); setShowMortalityForm(true); }} className="gap-2"><HeartCrack className="w-4 h-4 text-terracotta-500" /> Record mortality</DropdownMenuItem>}
                <DropdownMenuSeparator />
                {archived
                  ? <DropdownMenuItem onSelect={() => unarchiveBatchMutation.mutate(batch.id)} className="gap-2"><ArchiveRestore className="w-4 h-4" /> Unarchive</DropdownMenuItem>
                  : <DropdownMenuItem onSelect={() => archiveBatchMutation.mutate(batch.id)} className="gap-2"><Archive className="w-4 h-4" /> Archive</DropdownMenuItem>}
                <DropdownMenuItem onSelect={() => setDeleteTarget(batch)} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-xl bg-cream p-2.5 text-center"><p className="stat-num font-display font-bold text-lg text-ink leading-none">{batch.current_quantity ?? 0}</p><p className="text-[10px] uppercase tracking-wider text-ink/50 mt-1">Birds</p></div>
            <div className="rounded-xl bg-cream p-2.5 text-center"><p className="stat-num font-display font-bold text-lg text-moss-700 leading-none">{batch.available_quantity ?? 0}</p><p className="text-[10px] uppercase tracking-wider text-ink/50 mt-1">For sale</p></div>
            <div className="rounded-xl bg-cream p-2.5 text-center"><p className={`stat-num font-display font-bold text-lg leading-none ${batch.mortality_count > 0 ? 'text-terracotta-600' : 'text-ink'}`}>{batch.mortality_count || 0}</p><p className="text-[10px] uppercase tracking-wider text-ink/50 mt-1">Lost</p></div>
          </div>

          <div className="mt-4 space-y-2">
            <div>
              <div className="flex justify-between text-[11px] text-ink/55 mb-1"><span>Survival</span><span>{pct}%</span></div>
              <div className="h-1.5 rounded-full bg-cream-deep overflow-hidden"><div className={`h-full rounded-full ${pct >= 90 ? 'bg-fresh-500' : pct >= 75 ? 'bg-yolk-500' : 'bg-terracotta-500'}`} style={{ width: `${pct}%` }} /></div>
            </div>
            {maturity !== null && (
              <div>
                <div className="flex justify-between text-[11px] text-ink/55 mb-1"><span>Maturity</span><span>{maturity}% · {batch.expected_maturity_weeks} wk target</span></div>
                <div className="h-1.5 rounded-full bg-cream-deep overflow-hidden"><div className="h-full rounded-full bg-moss-600" style={{ width: `${maturity}%` }} /></div>
              </div>
            )}
          </div>

          {archived ? (
            <div className="mt-4 pt-4 border-t border-border text-xs text-ink/60 flex justify-between">
              <span>Started {batch.initial_quantity} · sold {batch.sold_count || 0}</span>
              <span className="font-semibold text-ink">R{(batch.total_revenue || 0).toLocaleString()}</span>
            </div>
          ) : (
            <div className="mt-auto pt-4 border-t border-border flex gap-2">
              <Link to={createPageUrl('BatchDetail') + `?id=${batch.id}`} className="btn-ghost flex-1 justify-center border border-border bg-white py-2 text-sm">Details</Link>
              {batch.available_quantity > 0 && (
                <button onClick={() => createListingFromBatch(batch)} className="btn-cta flex-1 justify-center py-2 text-sm gap-1.5"><Tag className="w-4 h-4" /> Sell</button>
              )}
            </div>
          )}
        </div>
      </motion.article>
    );
  };

  const Grid = ({ items, archived, empty }) => isLoading ? (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(3)].map((_, i) => <div key={i} className="card-premium h-80 animate-pulse" />)}</div>
  ) : items.length === 0 ? empty : (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(b => <BatchCard key={b.id} batch={b} archived={archived} />)}
    </motion.div>
  );

  return (
    <PageShell
      variant="compact"
      eyebrow="Farm"
      title="Batches"
      subtitle={`${activeBatches.length} of ${maxBatches} active batches on your ${user?.seller_tier || 'basic'} plan. Track flock size, losses, maturity and move birds to the marketplace.`}
      breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Batches' }]}
      action={<Button onClick={() => setShowForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> New batch</Button>}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard icon={Bird} label="Birds on farm" value={totalBirds.toLocaleString()} tint="moss" />
            <StatCard icon={Tag} label="Available to sell" value={totalAvailable.toLocaleString()} tint="sage" />
            <StatCard icon={HeartCrack} label="Mortality (active)" value={totalMortality.toLocaleString()} tint="terracotta" />
            <StatCard icon={Wallet} label="Batch revenue" value={`R${totalRevenue.toLocaleString()}`} tint="yolk" />
          </>
        )}
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
          <TabsTrigger value="active" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Active ({activeBatches.length})</TabsTrigger>
          <TabsTrigger value="archived" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Archived ({archivedBatches.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <Grid items={activeBatches} empty={<EmptyState icon={Bird} title="No active batches" subtitle="Create your first poultry batch to start tracking birds, feed, losses and sales." action={<Button onClick={() => setShowForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Create batch</Button>} />} />
        </TabsContent>
        <TabsContent value="archived">
          <Grid items={archivedBatches} archived empty={<EmptyState icon={Archive} title="No archived batches" subtitle="Finished batches you archive will be kept here with their history." />} />
        </TabsContent>
      </Tabs>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Delete batch?</DialogTitle></DialogHeader>
          <p className="text-ink/70"><strong>{deleteTarget?.batch_name}</strong> and its summary will be removed. Expense and production records are kept.</p>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" className="rounded-full" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={() => { deleteBatchMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingBatch ? 'Edit Batch' : 'Create New Batch'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Batch Name *</Label>
                <Input
                  value={formData.batch_name}
                  onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  placeholder="e.g., Batch A - Layers 2024"
                  required
                />
              </div>
              <div>
                <Label>Bird Type *</Label>
                <Select value={formData.bird_type} onValueChange={(value) => setFormData({ ...formData, bird_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="layers">Layers</SelectItem>
                    <SelectItem value="broilers">Broilers</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Breed</Label>
                <Input
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="e.g., Rhode Island Red"
                />
              </div>
              <div>
                <Label>Initial Quantity *</Label>
                <Input
                  type="number"
                  value={formData.initial_quantity}
                  onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
                  placeholder="100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date Acquired *</Label>
                <Input
                  type="date"
                  value={formData.date_acquired}
                  onChange={(e) => setFormData({ ...formData, date_acquired: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Expected Maturity (weeks)</Label>
                <Input
                  type="number"
                  value={formData.expected_maturity_weeks}
                  onChange={(e) => setFormData({ ...formData, expected_maturity_weeks: e.target.value })}
                  placeholder="20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Daily Feed per Bird (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.daily_feed_per_bird_kg}
                  onChange={(e) => setFormData({ ...formData, daily_feed_per_bird_kg: e.target.value })}
                  placeholder="0.12"
                />
              </div>
              <div>
                <Label>Housing Location</Label>
                <Input
                  value={formData.housing_location}
                  onChange={(e) => setFormData({ ...formData, housing_location: e.target.value })}
                  placeholder="e.g., Coop A"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information..."
                rows={3}
              />
            </div>

            <div>
              <Label>Batch Images (up to 10)</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImages || (formData.images?.length >= 10)}
              />
              {uploadingImages && <p className="text-sm text-ink/55 mt-1">Uploading...</p>}
              {formData.images?.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt={`Batch ${index + 1}`} className="w-full h-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-terracotta-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="rounded-full" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="btn-cta px-5">
                {editingBatch ? 'Update Batch' : 'Create Batch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Egg Collection Dialog */}
      <Dialog open={showEggForm} onOpenChange={(open) => { if (!open) { setShowEggForm(false); setSelectedBatch(null); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Collect Eggs - {selectedBatch?.batch_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); recordEggsMutation.mutate(eggFormData); }} className="space-y-4">
            <div>
              <Label>Eggs Collected *</Label>
              <Input
                type="number"
                value={eggFormData.eggs_collected}
                onChange={(e) => setEggFormData({ ...eggFormData, eggs_collected: e.target.value })}
                placeholder="Number of eggs"
                required
              />
            </div>

            <div>
              <Label>Collection Date</Label>
              <Input
                type="date"
                value={eggFormData.production_date}
                onChange={(e) => setEggFormData({ ...eggFormData, production_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Eggs Sold</Label>
                <Input
                  type="number"
                  value={eggFormData.eggs_sold}
                  onChange={(e) => setEggFormData({ ...eggFormData, eggs_sold: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Eggs Damaged</Label>
                <Input
                  type="number"
                  value={eggFormData.eggs_damaged}
                  onChange={(e) => setEggFormData({ ...eggFormData, eggs_damaged: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Revenue (R)</Label>
              <Input
                type="number"
                step="0.01"
                value={eggFormData.revenue}
                onChange={(e) => setEggFormData({ ...eggFormData, revenue: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={eggFormData.notes}
                onChange={(e) => setEggFormData({ ...eggFormData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => { setShowEggForm(false); setSelectedBatch(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="btn-cta px-5">Record Collection</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mortality Dialog */}
      <Dialog open={showMortalityForm} onOpenChange={(open) => { if (!open) { setShowMortalityForm(false); setSelectedBatch(null); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Record Mortality - {selectedBatch?.batch_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); recordMortalityMutation.mutate(mortalityFormData); }} className="space-y-4">
            <div>
              <Label>Number of Birds *</Label>
              <Input
                type="number"
                value={mortalityFormData.count}
                onChange={(e) => setMortalityFormData({ ...mortalityFormData, count: e.target.value })}
                placeholder="Number of birds lost"
                required
              />
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={mortalityFormData.date}
                onChange={(e) => setMortalityFormData({ ...mortalityFormData, date: e.target.value })}
              />
            </div>

            <div>
              <Label>Cause (Optional)</Label>
              <Input
                value={mortalityFormData.cause}
                onChange={(e) => setMortalityFormData({ ...mortalityFormData, cause: e.target.value })}
                placeholder="e.g., Disease, predator, etc."
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={mortalityFormData.notes}
                onChange={(e) => setMortalityFormData({ ...mortalityFormData, notes: e.target.value })}
                placeholder="Additional details"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => { setShowMortalityForm(false); setSelectedBatch(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white">Record Mortality</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Listing Dialog */}
      <Dialog open={showListingForm} onOpenChange={(open) => { if (!open) { setShowListingForm(false); setSelectedBatch(null); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create Listing from {selectedBatch?.batch_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createListingMutation.mutate(listingFormData); }} className="space-y-4">
            <div>
              <Label>Quantity to Sell *</Label>
              <Input
                type="number"
                value={listingFormData.quantity}
                onChange={(e) => setListingFormData({ ...listingFormData, quantity: e.target.value })}
                max={selectedBatch?.available_quantity}
                placeholder={`Max: ${selectedBatch?.available_quantity}`}
                required
              />
              <p className="text-xs text-ink/55 mt-1">Available: {selectedBatch?.available_quantity} birds</p>
            </div>

            <div>
              <Label>Price Type *</Label>
              <Select value={listingFormData.price_type} onValueChange={(value) => setListingFormData({ ...listingFormData, price_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_item">Per Bird</SelectItem>
                  <SelectItem value="batch">Entire Batch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Price (R) *</Label>
              <Input
                type="number"
                step="0.01"
                value={listingFormData.price}
                onChange={(e) => setListingFormData({ ...listingFormData, price: e.target.value })}
                placeholder={listingFormData.price_type === 'per_item' ? 'Price per bird' : 'Total price'}
                required
              />
            </div>

            {selectedBatch?.images?.length > 0 && (
              <div>
                <Label>Images ({selectedBatch.images.length})</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {selectedBatch.images.slice(0, 4).map((url, index) => (
                    <img key={index} src={url} alt={`Preview ${index + 1}`} className="w-full h-16 object-cover rounded" />
                  ))}
                </div>
                <p className="text-xs text-ink/55 mt-1">These images will be used in the listing</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => { setShowListingForm(false); setSelectedBatch(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="btn-cta px-5">Create Listing</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
