import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Upload, X, Loader2, Package, Gavel, Play, Trash2, Edit, Trophy, MessageCircle, Phone, Calendar, Eye, Layers, TrendingUp, ExternalLink } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton, ListingSkeleton } from '@/components/shell/SkeletonCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';

const EVENT_CHIP = {
  draft: 'bg-cream-deep text-ink/60 border-border',
  scheduled: 'bg-yolk-50 text-yolk-700 border-yolk-200',
  live: 'bg-terracotta-500 text-white border-0',
  ended: 'bg-ink/70 text-cream border-0'
};

export default function ManageAuctionEvent() {
  const [user, setUser] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [itemForm, setItemForm] = useState({
    title: '', description: '', poultry_type: 'chickens', breed: '', age: '',
    quantity: 1, gender: 'n/a', health_details: '', video_url: '',
    starting_bid: '', reserve_price: '', min_increment: 10
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId');

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

  const { data: event } = useQuery({
    queryKey: ['auction-event', eventId],
    queryFn: async () => {
      const events = await api.entities.AuctionEvent.filter({ id: eventId });
      return events[0];
    },
    enabled: !!eventId
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['auction-items', eventId],
    queryFn: () => api.entities.AuctionItem.filter({ auction_event_id: eventId }, 'lot_number'),
    enabled: !!eventId
  });

  const { data: winners = [] } = useQuery({
    queryKey: ['auction-winners', eventId],
    queryFn: async () => {
      const soldItems = items.filter(i => i.winner_email || i.current_bidder);
      const winnerEmails = [...new Set(soldItems.map(i => i.winner_email || i.current_bidder).filter(Boolean))];
      if (winnerEmails.length === 0) return [];
      const users = await api.entities.User.list();
      return users.filter(u => winnerEmails.includes(u.email));
    },
    enabled: items.length > 0
  });

  const getWinnerInfo = (email) => winners.find(w => w.email === email);
  const onError = (e) => toast.error(e?.message || 'Something went wrong');

  const addItemMutation = useMutation({
    mutationFn: async (data) => {
      await api.entities.AuctionItem.create({
        ...data,
        auction_event_id: eventId,
        auction_house_id: event.auction_house_id,
        lot_number: items.length + 1,
        images,
        status: 'pending'
      });
      await api.entities.AuctionEvent.update(eventId, { total_items: items.length + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-items']);
      toast.success('Item added');
      resetForm();
    },
    onError
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await api.entities.AuctionItem.update(id, { ...data, images });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-items']);
      toast.success('Item updated');
      resetForm();
    },
    onError
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => api.entities.AuctionItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-items']);
      toast.success('Item deleted');
    },
    onError
  });

  const startAuctionMutation = useMutation({
    mutationFn: async () => {
      await api.entities.AuctionEvent.update(eventId, { status: 'scheduled' });
      for (const item of items) {
        await api.entities.AuctionItem.update(item.id, { status: 'active' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-event']);
      toast.success('Auction scheduled!');
    },
    onError
  });

  const resetForm = () => {
    setShowAddItem(false);
    setEditingItem(null);
    setImages([]);
    setItemForm({
      title: '', description: '', poultry_type: 'chickens', breed: '', age: '',
      quantity: 1, gender: 'n/a', health_details: '', video_url: '',
      starting_bid: '', reserve_price: '', min_increment: 10
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      toast.error('Max 10 images');
      return;
    }
    setUploading(true);
    for (const file of files) {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setImages(prev => [...prev, file_url]);
    }
    setUploading(false);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      title: item.title, description: item.description || '', poultry_type: item.poultry_type || 'chickens',
      breed: item.breed || '', age: item.age || '', quantity: item.quantity || 1,
      gender: item.gender || 'n/a', health_details: item.health_details || '', video_url: item.video_url || '',
      starting_bid: item.starting_bid, reserve_price: item.reserve_price || '', min_increment: item.min_increment || 10
    });
    setImages(item.images || []);
    setShowAddItem(true);
  };

  const handleSubmitItem = () => {
    if (!itemForm.title || !itemForm.starting_bid) {
      toast.error('Title and starting bid required');
      return;
    }
    const data = {
      ...itemForm,
      starting_bid: parseFloat(itemForm.starting_bid),
      reserve_price: itemForm.reserve_price ? parseFloat(itemForm.reserve_price) : null,
      min_increment: parseFloat(itemForm.min_increment),
      quantity: parseInt(itemForm.quantity)
    };
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      addItemMutation.mutate(data);
    }
  };

  const poultryTypes = [
    { value: 'chickens', label: 'Chickens' }, { value: 'ducks', label: 'Ducks' },
    { value: 'geese', label: 'Geese' }, { value: 'turkeys', label: 'Turkeys' },
    { value: 'quail', label: 'Quail' }, { value: 'guinea_fowl', label: 'Guinea Fowl' },
    { value: 'peafowl', label: 'Peafowl' }, { value: 'pigeons', label: 'Pigeons' },
    { value: 'eggs', label: 'Eggs' }, { value: 'other', label: 'Other' }
  ];

  if (!user || !event) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const totalBids = items.reduce((s, i) => s + (i.bid_count || 0), 0);
  const totalValue = items.reduce((s, i) => s + (i.current_bid || i.starting_bid || 0), 0);
  const eventChip = EVENT_CHIP[event.status] || EVENT_CHIP.draft;
  const saving = addItemMutation.isPending || updateItemMutation.isPending;
  const inputCls = 'mt-1.5 rounded-xl';

  return (
    <PageShell
      variant="compact"
      eyebrow="Auction house"
      title={event.title}
      subtitle={<span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium capitalize ${eventChip}`}>
          {event.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}{event.status}
        </span>
        <span className="inline-flex items-center gap-1 text-ink/55 text-sm"><Calendar className="w-4 h-4" />{moment(event.start_time).format('D MMM, HH:mm')} – {moment(event.end_time).format('D MMM, HH:mm')}</span>
      </span>}
      breadcrumb={[{ label: 'My auction house', href: createPageUrl('MyAuctionHouse') }, { label: 'Manage auction' }]}
      action={
        <div className="flex flex-wrap gap-2">
          <Link to={createPageUrl('AuctionEventDetail') + `?id=${event.id}`}>
            <Button className="btn-ghost border border-border bg-white px-4 py-2.5 text-sm gap-1.5"><ExternalLink className="w-4 h-4" /> Public page</Button>
          </Link>
          {event.status === 'draft' && items.length > 0 && (
            <Button onClick={() => startAuctionMutation.mutate()} disabled={startAuctionMutation.isPending} className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white px-5 py-2.5 text-sm gap-1.5">
              {startAuctionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Schedule auction
            </Button>
          )}
          <Button onClick={() => { resetForm(); setShowAddItem(true); }} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Add lot</Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard icon={Layers} label="Lots" value={items.length} tint="moss" />
            <StatCard icon={Gavel} label="Total bids" value={totalBids.toLocaleString()} tint="yolk" />
            <StatCard icon={TrendingUp} label="Current value" value={`R${totalValue.toLocaleString()}`} tint="terracotta" />
            <StatCard icon={Eye} label="Views" value={(event.view_count || 0).toLocaleString()} tint="sage" />
          </>
        )}
      </div>

      {event.status === 'draft' && (
        <div className="rounded-2xl border border-yolk-200 bg-yolk-50 text-yolk-700 p-4 mb-6 text-sm font-medium flex flex-col sm:flex-row sm:items-center gap-3">
          <Play className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">This event is a draft. Add your lots, then schedule it so it goes live at {moment(event.start_time).format('D MMM, HH:mm')}.</span>
        </div>
      )}

      {/* Lots */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(3)].map((_, i) => <ListingSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Package} title="No lots yet" subtitle="Add the birds, eggs or equipment you want to auction. Each lot gets its own bidding."
          action={<Button onClick={() => setShowAddItem(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Add first lot</Button>} />
      ) : (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const winnerEmail = item.winner_email || item.current_bidder;
            const winner = getWinnerInfo(winnerEmail);
            const showWinner = winnerEmail && (event.status === 'ended' || item.status === 'sold');
            return (
              <motion.article key={item.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card-premium overflow-hidden flex flex-col">
                <div className="aspect-[4/3] bg-cream-deep relative overflow-hidden">
                  {item.images?.[0]
                    ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    : <div className="absolute inset-0 flex items-center justify-center text-moss-600/40"><Package className="w-12 h-12" /></div>}
                  <span className="absolute top-3 left-3 chip bg-ink/70 text-cream border-0 font-semibold">Lot {item.lot_number}</span>
                  {item.status === 'sold' && <span className="absolute top-3 right-3 chip bg-ink/70 text-cream border-0 uppercase tracking-wider">Sold</span>}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-display text-lg text-ink leading-snug line-clamp-1">{item.title}</h3>
                  {item.breed && <p className="text-xs text-ink/55 mt-0.5">{item.breed}</p>}
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold">{item.bid_count > 0 ? 'Current bid' : 'Starting bid'}</p>
                      <p className="font-display text-xl font-bold text-terracotta-600 tabular-nums">R{(item.current_bid || item.starting_bid).toLocaleString()}</p>
                    </div>
                    <span className="text-xs text-ink/55 inline-flex items-center gap-1"><Gavel className="w-3.5 h-3.5" />{item.bid_count || 0} bid{item.bid_count === 1 ? '' : 's'}</span>
                  </div>

                  {showWinner && (
                    <div className="bg-fresh-50 border border-fresh-200 rounded-xl p-3 mt-3">
                      <div className="flex items-center gap-2 text-moss-700 text-xs font-semibold uppercase tracking-wider mb-1.5"><Trophy className="w-3.5 h-3.5" /> Winner</div>
                      <p className="text-sm font-medium text-ink">{item.winner_name || item.current_bidder_name || 'Unknown'}</p>
                      <p className="text-xs text-ink/55 truncate">{winnerEmail}</p>
                      {winner?.phone && (
                        <a href={`tel:${winner.phone}`} className="inline-flex items-center gap-1 text-xs text-moss-700 mt-1"><Phone className="w-3 h-3" />{winner.phone}</a>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1"
                          onClick={() => { window.location.href = createPageUrl('Messages') + `?startChat=${winnerEmail}&listingTitle=${encodeURIComponent(item.title)}`; }}>
                          <MessageCircle className="w-3 h-3" /> Message
                        </Button>
                        {winner?.whatsapp && (
                          <a href={`https://wa.me/${winner.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! Regarding your winning bid on "${item.title}" (Lot ${item.lot_number}) for R${item.current_bid || item.final_price}`)}`}
                            target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="rounded-full h-7 text-xs text-moss-700">WhatsApp</Button>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditItem(item)} className="rounded-full h-8 flex-1 gap-1.5 text-xs"><Edit className="w-3.5 h-3.5" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => deleteItemMutation.mutate(item.id)} disabled={deleteItemMutation.isPending}
                      className="rounded-full h-8 w-8 p-0 text-terracotta-600 hover:text-terracotta-700 hover:bg-terracotta-50" aria-label="Delete lot"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      {/* Add / edit lot */}
      <Dialog open={showAddItem} onOpenChange={() => resetForm()}>
        <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingItem ? `Edit lot ${editingItem.lot_number}` : 'Add lot'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>Images</Label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} aria-label="Remove image"
                      className="absolute top-1 right-1 w-5 h-5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {images.length < 10 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-border bg-cream flex items-center justify-center cursor-pointer hover:border-moss-400 hover:bg-moss-50/40 transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin text-moss-600" /> : <Upload className="w-4 h-4 text-ink/40" />}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="eyebrow mb-3">Lot details</p>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input className={inputCls} value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={itemForm.poultry_type} onValueChange={(v) => setItemForm({ ...itemForm, poultry_type: v })}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {poultryTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Breed</Label>
                    <Input className={inputCls} value={itemForm.breed} onChange={(e) => setItemForm({ ...itemForm, breed: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Age</Label>
                    <Input className={inputCls} value={itemForm.age} onChange={(e) => setItemForm({ ...itemForm, age: e.target.value })} />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input className={inputCls} type="number" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} min="1" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={itemForm.gender} onValueChange={(v) => setItemForm({ ...itemForm, gender: v })}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                        <SelectItem value="n/a">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea className={inputCls} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} rows={2} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="eyebrow mb-3">Pricing</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Starting bid (R) *</Label>
                  <Input className={inputCls} type="number" value={itemForm.starting_bid} onChange={(e) => setItemForm({ ...itemForm, starting_bid: e.target.value })} />
                </div>
                <div>
                  <Label>Reserve (R)</Label>
                  <Input className={inputCls} type="number" value={itemForm.reserve_price} onChange={(e) => setItemForm({ ...itemForm, reserve_price: e.target.value })} />
                </div>
                <div>
                  <Label>Min increment</Label>
                  <Input className={inputCls} type="number" value={itemForm.min_increment} onChange={(e) => setItemForm({ ...itemForm, min_increment: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="rounded-full" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmitItem} disabled={saving} className="btn-cta px-5 gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingItem ? 'Save changes' : 'Add lot'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
