import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, Eye, Edit, Trash2, RotateCcw, CheckCircle, Loader2, Star, AlertCircle, Minus,
  Plus, Search, X, MessageSquare, TrendingUp, Layers, FileText, MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton } from '@/components/shell/SkeletonCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createPageUrl } from '../utils';
import FeatureListingModal from '../components/listings/FeatureListingModal';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
  { value: 'inactive', label: 'Inactive' },
];

const STATUS_CHIP = {
  active:   'bg-fresh-50 text-moss-700 border-fresh-200',
  sold:     'bg-moss-800 text-cream border-moss-800',
  reserved: 'bg-yolk-50 text-yolk-700 border-yolk-200',
  inactive: 'bg-cream-deep text-ink/60 border-border',
};

export default function MyListings() {
  const [user, setUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [featuringListing, setFeaturingListing] = useState(null);
  const [partialSaleDialog, setPartialSaleDialog] = useState(null);
  const [quantityToSell, setQuantityToSell] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => api.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['my-listings', user?.email],
    queryFn: () => api.entities.Listing.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['my-listings'] });
  const onError = (e) => toast.error(e?.message || 'Something went wrong');

  const updateListingMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Listing.update(id, data),
    onSuccess: () => { invalidate(); toast.success('Listing updated'); },
    onError,
  });
  const deleteListingMutation = useMutation({
    mutationFn: (id) => api.entities.Listing.delete(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); toast.success('Listing deleted'); },
    onError,
  });
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }) => { await Promise.all(ids.map(id => api.entities.Listing.update(id, data))); },
    onSuccess: () => { invalidate(); setSelectedIds([]); setShowBulkDialog(false); toast.success('Listings updated'); },
    onError,
  });
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => { await Promise.all(ids.map(id => api.entities.Listing.delete(id))); },
    onSuccess: () => { invalidate(); setSelectedIds([]); setShowBulkDialog(false); toast.success('Listings deleted'); },
    onError,
  });

  const counts = useMemo(() => listings.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {}), [listings]);
  const totals = useMemo(() => ({
    views: listings.reduce((s, l) => s + (l.view_count || 0), 0),
    inquiries: listings.reduce((s, l) => s + (l.inquiry_count || 0), 0),
    featured: listings.filter(l => l.featured).length,
  }), [listings]);

  const filteredListings = listings.filter(l =>
    (statusFilter === 'all' || l.status === statusFilter) &&
    (!search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.breed?.toLowerCase().includes(search.toLowerCase()))
  );

  const allSelected = filteredListings.length > 0 && filteredListings.every(l => selectedIds.includes(l.id));
  const handleSelectAll = (checked) => setSelectedIds(checked ? filteredListings.map(l => l.id) : []);
  const handleSelect = (id, checked) => setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter(i => i !== id));

  const openBulk = (action) => { setBulkAction(action); setShowBulkDialog(true); };
  const executeBulkAction = () => {
    if (bulkAction === 'delete') bulkDeleteMutation.mutate(selectedIds);
    else bulkUpdateMutation.mutate({ ids: selectedIds, data: { status: bulkAction } });
  };

  const handleRelist = (listing) => updateListingMutation.mutate({ id: listing.id, data: { status: 'active', sold_date: null } });
  const markSold = (listing) => updateListingMutation.mutate({ id: listing.id, data: { status: 'sold', sold_date: new Date().toISOString() } });

  const handlePartialSale = () => {
    const listing = partialSaleDialog;
    const newStock = listing.stock_quantity - quantityToSell;
    if (newStock <= 0) updateListingMutation.mutate({ id: listing.id, data: { status: 'sold', stock_quantity: 0, sold_date: new Date().toISOString() } });
    else updateListingMutation.mutate({ id: listing.id, data: { stock_quantity: newStock } });
    setPartialSaleDialog(null);
    setQuantityToSell(1);
  };
  const openPartialSaleDialog = (listing) => { setPartialSaleDialog(listing); setQuantityToSell(Math.min(1, listing.stock_quantity)); };

  const busy = bulkUpdateMutation.isPending || bulkDeleteMutation.isPending;

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  return (
    <PageShell
      variant="compact"
      eyebrow="Sell"
      title="My listings"
      subtitle="Everything you have on the marketplace — edit, feature, mark sold or relist in one place."
      action={
        <Link to={createPageUrl('CreateListing')}>
          <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> New listing</Button>
        </Link>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard icon={Layers} label="Active listings" value={counts.active || 0} tint="moss" />
            <StatCard icon={Eye} label="Total views" value={totals.views.toLocaleString()} tint="sage" />
            <StatCard icon={MessageSquare} label="Inquiries" value={totals.inquiries.toLocaleString()} tint="yolk" />
            <StatCard icon={TrendingUp} label="Sold" value={counts.sold || 0} tint="terracotta" />
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="card-premium p-3 mb-5 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {STATUS_TABS.map(t => {
            const n = t.value === 'all' ? listings.length : (counts[t.value] || 0);
            const on = statusFilter === t.value;
            return (
              <button key={t.value} onClick={() => { setStatusFilter(t.value); setSelectedIds([]); }}
                className={`whitespace-nowrap px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${on ? 'bg-moss-600 text-cream' : 'text-ink/65 hover:bg-moss-50 hover:text-moss-700'}`}>
                {t.label} <span className={`ml-1 text-xs ${on ? 'text-cream/70' : 'text-ink/40'}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 lg:max-w-sm lg:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your listings…"
            className="w-full bg-cream border border-border rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-cream-deep flex items-center justify-center"><X className="w-3.5 h-3.5 text-ink/50" /></button>}
        </div>
      </div>

      {/* Bulk bar */}
      {selectedIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-moss-800 text-cream px-4 py-2.5 shadow-lift">
          <span className="text-sm font-medium mr-2">{selectedIds.length} selected</span>
          <button onClick={() => openBulk('active')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20">Mark active</button>
          <button onClick={() => openBulk('sold')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20">Mark sold</button>
          <button onClick={() => openBulk('inactive')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20">Mark inactive</button>
          <button onClick={() => openBulk('delete')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-terracotta-500 hover:bg-terracotta-600">Delete</button>
          <button onClick={() => setSelectedIds([])} className="ml-auto text-xs text-cream/70 hover:text-cream">Clear</button>
        </motion.div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="card-premium divide-y divide-border">{[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse"><div className="w-14 h-14 rounded-xl bg-cream-deep" /><div className="flex-1 space-y-2"><div className="h-4 bg-cream-deep rounded w-1/3" /><div className="h-3 bg-cream-deep rounded w-1/5" /></div></div>
        ))}</div>
      ) : filteredListings.length === 0 ? (
        <EmptyState icon={Package}
          title={search ? `No listings match "${search}"` : statusFilter === 'all' ? 'No listings yet' : `No ${statusFilter} listings`}
          subtitle={statusFilter === 'all' && !search ? 'Create your first listing to start selling on Easy Poultry.' : 'Try a different filter or search term.'}
          action={statusFilter === 'all' && !search && <Link to={createPageUrl('CreateListing')}><Button className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Create listing</Button></Link>} />
      ) : (
        <div className="card-premium overflow-hidden">
          {/* Header row (desktop) */}
          <div className="hidden md:grid grid-cols-[auto_1fr_120px_120px_90px_90px_60px] items-center gap-4 px-5 py-3 bg-cream border-b border-border text-[11px] uppercase tracking-wider font-semibold text-ink/50">
            <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} aria-label="Select all" />
            <span>Listing</span><span>Price</span><span>Status</span><span className="text-right">Views</span><span className="text-right">Inquiries</span><span />
          </div>
          <ul className="divide-y divide-border">
            {filteredListings.map(listing => (
              <ListingRow key={listing.id} listing={listing}
                selected={selectedIds.includes(listing.id)} onSelect={(c) => handleSelect(listing.id, c)}
                onFeature={() => setFeaturingListing(listing)} onPartial={() => openPartialSaleDialog(listing)}
                onSold={() => markSold(listing)} onRelist={() => handleRelist(listing)} onDelete={() => setDeleteTarget(listing)} />
            ))}
          </ul>
          <div className="px-5 py-3 bg-cream border-t border-border text-xs text-ink/50">{filteredListings.length} of {listings.length} listings</div>
        </div>
      )}

      {/* Bulk confirm */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display"><AlertCircle className="w-5 h-5 text-yolk-500" />Confirm bulk action</DialogTitle>
          </DialogHeader>
          <p className="text-ink/70">
            {bulkAction === 'delete' ? 'Permanently delete' : `Mark as ${bulkAction}`} <strong>{selectedIds.length}</strong> listing{selectedIds.length === 1 ? '' : 's'}?
            {bulkAction === 'delete' && ' This cannot be undone.'}
          </p>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" className="rounded-full" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
            <Button onClick={executeBulkAction} disabled={busy}
              className={bulkAction === 'delete' ? 'rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white' : 'btn-cta px-5'}>
              {busy ? 'Processing…' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Single delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Delete listing?</DialogTitle></DialogHeader>
          <p className="text-ink/70"><strong>{deleteTarget?.title}</strong> will be removed permanently.</p>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" className="rounded-full" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={() => deleteListingMutation.mutate(deleteTarget.id)} disabled={deleteListingMutation.isPending}
              className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white">{deleteListingMutation.isPending ? 'Deleting…' : 'Delete'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {featuringListing && <FeatureListingModal isOpen={!!featuringListing} onClose={() => setFeaturingListing(null)} listing={featuringListing} />}

      {/* Partial sale */}
      <Dialog open={!!partialSaleDialog} onOpenChange={() => setPartialSaleDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Sell partial quantity</DialogTitle></DialogHeader>
          {partialSaleDialog && (
            <div className="space-y-4">
              <div className="rounded-xl bg-cream p-3">
                <p className="text-sm font-medium text-ink">{partialSaleDialog.title}</p>
                <p className="text-xs text-ink/55 mt-0.5">Available: {partialSaleDialog.stock_quantity} items</p>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity to sell</Label>
                <Input id="quantity" type="number" min="1" max={partialSaleDialog.stock_quantity} value={quantityToSell}
                  onChange={(e) => setQuantityToSell(parseInt(e.target.value) || 1)} className="mt-1.5 rounded-xl" />
                <p className="text-xs text-ink/50 mt-1.5">{partialSaleDialog.stock_quantity - quantityToSell <= 0 ? 'This will mark the listing as sold.' : `${partialSaleDialog.stock_quantity - quantityToSell} will remain in stock.`}</p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" className="rounded-full" onClick={() => setPartialSaleDialog(null)}>Cancel</Button>
                <Button onClick={handlePartialSale} className="btn-cta px-5"
                  disabled={updateListingMutation.isPending || quantityToSell < 1 || quantityToSell > partialSaleDialog.stock_quantity}>
                  {updateListingMutation.isPending ? 'Processing…' : 'Confirm sale'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function ListingRow({ listing, selected, onSelect, onFeature, onPartial, onSold, onRelist, onDelete }) {
  const isDigital = listing.listing_type === 'digital' || listing.is_digital;
  const chip = STATUS_CHIP[listing.status] || STATUS_CHIP.inactive;
  const img = listing.images?.[0];

  return (
    <li className={`group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_120px_120px_90px_90px_60px] items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 transition-colors ${selected ? 'bg-moss-50/60' : 'hover:bg-cream/70'}`}>
      <Checkbox checked={selected} onCheckedChange={onSelect} aria-label={`Select ${listing.title}`} />

      <div className="flex items-center gap-3 min-w-0">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-cream-deep border border-border flex-shrink-0 flex items-center justify-center text-moss-600">
          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : isDigital ? <FileText className="w-6 h-6" /> : <Package className="w-6 h-6" />}
        </div>
        <div className="min-w-0">
          <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`} className="font-medium text-ink hover:text-moss-700 line-clamp-1">{listing.title}</Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-ink/55">
            <span className="capitalize">{listing.breed || listing.category}</span>
            {isDigital && <span className="chip chip-accent !py-0 !px-2 text-[10px]">Digital</span>}
            {listing.stock_quantity > 1 && <span className="chip !py-0 !px-2 text-[10px]">Stock {listing.stock_quantity}</span>}
            {listing.featured && <span className="chip chip-yolk !py-0 !px-2 text-[10px] gap-1"><Star className="w-2.5 h-2.5 fill-current" />Featured</span>}
            {/* mobile-only meta */}
            <span className="md:hidden">· R{Number(listing.price || 0).toLocaleString()}</span>
            <span className={`md:hidden capitalize inline-flex px-2 py-0.5 rounded-full border text-[10px] font-medium ${chip}`}>{listing.status}</span>
          </div>
        </div>
      </div>

      <span className="hidden md:block font-display font-bold text-ink tabular-nums">R{Number(listing.price || 0).toLocaleString()}</span>
      <span className={`hidden md:inline-flex capitalize items-center w-fit px-2.5 py-1 rounded-full border text-[11px] font-medium ${chip}`}>{listing.status}</span>
      <span className="hidden md:block text-right text-sm text-ink/70 tabular-nums">{listing.view_count || 0}</span>
      <span className="hidden md:block text-right text-sm text-ink/70 tabular-nums">{listing.inquiry_count || 0}</span>

      <div className="flex items-center justify-end gap-1">
        <Link to={createPageUrl('EditListing') + `?id=${listing.id}`} className="hidden sm:inline-flex w-8 h-8 rounded-lg items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" title="Edit"><Edit className="w-4 h-4" /></Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="More actions"><MoreHorizontal className="w-4 h-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl w-52">
            <DropdownMenuItem asChild><Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`} className="gap-2"><Eye className="w-4 h-4" /> View listing</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to={createPageUrl('EditListing') + `?id=${listing.id}`} className="gap-2"><Edit className="w-4 h-4" /> Edit</Link></DropdownMenuItem>
            {listing.status === 'active' && !listing.featured && <DropdownMenuItem onSelect={onFeature} className="gap-2"><Star className="w-4 h-4 text-yolk-500" /> Feature listing</DropdownMenuItem>}
            {listing.status === 'active' && listing.stock_quantity > 1 && <DropdownMenuItem onSelect={onPartial} className="gap-2"><Minus className="w-4 h-4" /> Sell part of stock</DropdownMenuItem>}
            {listing.status === 'active' && <DropdownMenuItem onSelect={onSold} className="gap-2"><CheckCircle className="w-4 h-4 text-moss-600" /> Mark as sold</DropdownMenuItem>}
            {(listing.status === 'sold' || listing.status === 'inactive') && <DropdownMenuItem onSelect={onRelist} className="gap-2"><RotateCcw className="w-4 h-4 text-moss-600" /> Relist</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
