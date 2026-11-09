import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, Gavel, Loader2, Building2, Trophy, User, MapPin, Eye, Package, Radio, Calendar, Layers } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { LineSkeleton, ListingSkeleton } from '@/components/shell/SkeletonCard';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '../utils';

const POULTRY_LABELS = {
  chickens: 'Chickens', ducks: 'Ducks', geese: 'Geese', turkeys: 'Turkeys',
  quail: 'Quail', guinea_fowl: 'Guinea Fowl', peafowl: 'Peafowl', pigeons: 'Pigeons', eggs: 'Eggs', other: 'Other'
};

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(target) - now);
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
  return { d, h, m, s, done: diff === 0, diff };
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-terracotta-500 text-white text-[11px] font-semibold uppercase tracking-wider shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
    </span>
  );
}

function CountdownBlocks({ target }) {
  const cd = useCountdown(target);
  const urgent = cd.diff > 0 && cd.diff < 300000;
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className={`grid grid-cols-4 gap-2 ${urgent ? 'animate-pulse' : ''}`}>
      {[['Days', cd.d], ['Hours', pad(cd.h)], ['Min', pad(cd.m)], ['Sec', pad(cd.s)]].map(([label, value]) => (
        <div key={label} className={`text-center py-3 rounded-xl border ${urgent ? 'bg-terracotta-50 border-terracotta-100' : 'bg-cream border-border'}`}>
          <p className={`font-display text-2xl font-bold tabular-nums ${urgent ? 'text-terracotta-600' : 'text-ink'}`}>{value}</p>
          <p className="text-[10px] uppercase tracking-wider text-ink/50 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

function HeroCountdown({ target, label }) {
  const cd = useCountdown(target);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-3 text-cream">
      <span className="text-[11px] uppercase tracking-wider opacity-80">{label}</span>
      <span className="font-display font-bold text-2xl tabular-nums">{cd.d > 0 && `${cd.d}d `}{pad(cd.h)}:{pad(cd.m)}:{pad(cd.s)}</span>
    </div>
  );
}

export default function AuctionEventDetail() {
  const [user, setUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {}
    };
    loadUser();
  }, []);

  // Auto-update auction status based on time
  const checkAndUpdateStatus = async (eventData) => {
    if (!eventData) return eventData;
    const now = moment();
    const hasStarted = now.isAfter(eventData.start_time);
    const hasEnded = now.isAfter(eventData.end_time);

    let newStatus = eventData.status;
    if (hasEnded && eventData.status !== 'ended') {
      newStatus = 'ended';
    } else if (hasStarted && !hasEnded && eventData.status === 'scheduled') {
      newStatus = 'live';
    }

    if (newStatus !== eventData.status) {
      await api.entities.AuctionEvent.update(eventData.id, { status: newStatus });
      return { ...eventData, status: newStatus };
    }
    return eventData;
  };

  const { data: event, isLoading } = useQuery({
    queryKey: ['auction-event', eventId],
    queryFn: async () => {
      const events = await api.entities.AuctionEvent.filter({ id: eventId });
      if (events.length > 0) {
        await api.entities.AuctionEvent.update(eventId, { view_count: (events[0].view_count || 0) + 1 });
        return await checkAndUpdateStatus(events[0]);
      }
      return null;
    },
    enabled: !!eventId,
    refetchInterval: 2000  // Faster refresh for real-time updates
  });

  const { data: house } = useQuery({
    queryKey: ['auction-house', event?.auction_house_id],
    queryFn: async () => {
      const houses = await api.entities.AuctionHouse.filter({ id: event.auction_house_id });
      return houses[0];
    },
    enabled: !!event?.auction_house_id
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['auction-event-items', eventId],
    queryFn: () => api.entities.AuctionItem.filter({ auction_event_id: eventId }, 'lot_number'),
    enabled: !!eventId,
    refetchInterval: 2000  // Faster refresh
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['item-bids', selectedItem?.id],
    queryFn: () => api.entities.AuctionBid.filter({ auction_id: selectedItem?.id }, '-created_date'),
    enabled: !!selectedItem?.id,
    refetchInterval: 2000  // Faster refresh
  });

  // Get all bids for all items to show bidder activity
  const { data: allBids = [] } = useQuery({
    queryKey: ['all-event-bids', eventId],
    queryFn: async () => {
      const itemIds = items.map(i => i.id);
      let allB = [];
      for (const itemId of itemIds) {
        const itemBids = await api.entities.AuctionBid.filter({ auction_id: itemId }, '-created_date');
        allB = [...allB, ...itemBids];
      }
      return allB;
    },
    enabled: items.length > 0,
    refetchInterval: 2000
  });

  // Get unique bidders
  const uniqueBidders = [...new Map(allBids.map(b => [b.bidder_email, { email: b.bidder_email, name: b.bidder_name }])).values()];

  const placeBidMutation = useMutation({
    mutationFn: async ({ item, amount }) => {
      await api.entities.AuctionBid.create({
        auction_id: item.id,
        bidder_email: user.email,
        bidder_name: user.full_name,
        amount
      });

      const updateData = {
        current_bid: amount,
        current_bidder: user.email,
        current_bidder_name: user.full_name,
        bid_count: (item.bid_count || 0) + 1,
        reserve_met: item.reserve_price ? amount >= item.reserve_price : true
      };

      await api.entities.AuctionItem.update(item.id, updateData);
      await api.entities.AuctionEvent.update(eventId, { total_bids: (event.total_bids || 0) + 1 });

      if (item.current_bidder && item.current_bidder !== user.email) {
        await api.entities.Notification.create({
          user_email: item.current_bidder,
          type: 'system',
          title: 'Outbid!',
          message: `You've been outbid on Lot ${item.lot_number}: ${item.title}`,
          link: createPageUrl('AuctionEventDetail') + `?id=${eventId}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-event-items']);
      queryClient.invalidateQueries(['item-bids']);
      toast.success('Bid placed!');
      setBidAmount('');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    const currentBid = selectedItem.current_bid || 0;
    const startingBid = selectedItem.starting_bid;
    const minIncrement = selectedItem.min_increment || 10;

    // Must be at least starting bid if no bids yet
    const minBid = currentBid > 0 ? currentBid + minIncrement : startingBid;

    if (amount <= currentBid && currentBid > 0) {
      toast.error(`Your bid must be higher than the current bid of R${currentBid}`);
      return;
    }

    if (amount < minBid) {
      toast.error(`Minimum bid is R${minBid}`);
      return;
    }
    placeBidMutation.mutate({ item: selectedItem, amount });
  };

  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Live auctions', href: createPageUrl('Auctions') }, { label: event?.title || 'Auction' }];

  if (isLoading) {
    return (
      <PageShell eyebrow="Live auctions" title="Loading auction…" breadcrumb={crumbs}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">{[...Array(4)].map((_, i) => <ListingSkeleton key={i} />)}</div>
          <div className="card-premium p-6 h-fit"><LineSkeleton rows={6} /></div>
        </div>
      </PageShell>
    );
  }

  if (!event) {
    return (
      <PageShell eyebrow="Live auctions" title="Auction not found" breadcrumb={crumbs}>
        <EmptyState icon={Gavel} title="This auction does not exist" subtitle="It may have been removed or the link is incorrect."
          action={<Link to={createPageUrl('Auctions')}><Button className="btn-cta px-5 py-2.5 text-sm">Browse auctions</Button></Link>} />
      </PageShell>
    );
  }

  const hasStarted = moment().isAfter(event.start_time);
  const hasEnded = moment().isAfter(event.end_time) || event.status === 'ended';
  const isLive = event.status === 'live' || (hasStarted && !hasEnded && event.status !== 'ended');

  const soldItems = items.filter(i => i.current_bid > 0);
  const unsoldCount = items.filter(i => !i.current_bid || i.current_bid === 0).length;
  const totalSales = items.reduce((sum, i) => sum + (i.current_bid || 0), 0);

  const statusChip = isLive ? <LiveBadge />
    : hasEnded ? <span className="chip bg-ink/70 text-cream border-0">Ended</span>
    : <span className="chip chip-yolk">Upcoming</span>;

  const selectedMin = selectedItem
    ? (selectedItem.current_bid > 0 ? (selectedItem.current_bid + (selectedItem.min_increment || 10)) : selectedItem.starting_bid)
    : 0;

  return (
    <PageShell
      eyebrow={<span className="inline-flex items-center gap-2">Live auctions {statusChip}</span>}
      title={event.title}
      subtitle={house ? (
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4 text-moss-700" />{house.name}</span>
          {house.city && <span className="inline-flex items-center gap-1 text-ink/55"><MapPin className="w-4 h-4" />{house.city}, {house.province}</span>}
        </span>
      ) : event.description}
      breadcrumb={crumbs}
    >
      {/* Cover band */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card-premium overflow-hidden -mt-6 lg:-mt-10 mb-8 relative aspect-[3/1] sm:aspect-[4/1] bg-moss-gradient">
        {event.cover_image_url
          ? <img src={event.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 grain opacity-50" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-cream/90 text-sm">
            <span className="inline-flex items-center gap-1.5"><Package className="w-4 h-4" />{items.length} lots</span>
            <span className="inline-flex items-center gap-1.5"><Eye className="w-4 h-4" />{event.view_count || 0} views</span>
            <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" />{uniqueBidders.length} bidders</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" />{moment(event.start_time).format('ddd D MMM, HH:mm')} – {moment(event.end_time).format('HH:mm')}</span>
          </div>
          {!hasEnded && <HeroCountdown target={hasStarted ? event.end_time : event.start_time} label={hasStarted ? 'Ends in' : 'Starts in'} />}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left — lots */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active bidders */}
          {uniqueBidders.length > 0 && (
            <div className="card-premium p-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink mr-2"><Users className="w-4 h-4 text-moss-700" /> {uniqueBidders.length} active bidder{uniqueBidders.length === 1 ? '' : 's'}</span>
              {uniqueBidders.map((bidder, i) => (
                <span key={i} className="chip gap-1"><User className="w-3 h-3" />{bidder.name || bidder.email.split('@')[0]}</span>
              ))}
            </div>
          )}

          {/* Results — when ended */}
          {hasEnded && (
            <div className="rounded-2xl bg-moss-gradient text-cream p-6 relative overflow-hidden">
              <div className="absolute inset-0 grain opacity-50" />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display text-2xl inline-flex items-center gap-2"><Trophy className="w-6 h-6 text-yolk-300" /> Auction results</h3>
                  <span className="text-sm opacity-80">{soldItems.length} of {items.length} lots sold</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {soldItems.map(item => (
                    <div key={item.id} className="bg-white/10 border border-white/15 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-wider opacity-70">Lot {item.lot_number}</p>
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="font-display text-2xl font-bold tabular-nums mt-1">R{(item.current_bid || 0).toLocaleString()}</p>
                      <p className="text-xs opacity-80 mt-1">Winner: {item.current_bidder_name || item.current_bidder?.split('@')[0] || 'No bids'}</p>
                    </div>
                  ))}
                  {unsoldCount > 0 && (
                    <div className="bg-white/5 border border-dashed border-white/20 rounded-xl p-4 flex items-center justify-center text-sm opacity-80">
                      {unsoldCount} lot{unsoldCount === 1 ? '' : 's'} received no bids
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lot grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-ink inline-flex items-center gap-2"><Layers className="w-5 h-5 text-ink/50" /> Auction lots</h2>
              <span className="chip">{items.length}</span>
            </div>
            {itemsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{[...Array(4)].map((_, i) => <ListingSkeleton key={i} />)}</div>
            ) : items.length === 0 ? (
              <EmptyState icon={Package} title="No lots listed yet" subtitle="The auction house has not added lots to this event." />
            ) : (
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {items.map((item) => {
                  const selected = selectedItem?.id === item.id;
                  return (
                    <motion.article key={item.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                      onClick={() => setSelectedItem(item)}
                      className={`group card-premium overflow-hidden cursor-pointer transition-all ${selected ? 'ring-2 ring-moss-600 ring-offset-2 ring-offset-cream' : 'hover:shadow-lift'}`}>
                      <div className="aspect-[4/3] bg-cream-deep relative overflow-hidden">
                        {item.images?.[0]
                          ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          : <div className="absolute inset-0 flex items-center justify-center text-moss-600/40"><Package className="w-12 h-12" /></div>}
                        <div className="absolute top-3 left-3 chip bg-ink/70 text-cream border-0 font-semibold">Lot {item.lot_number}</div>
                        {item.status === 'sold' && (
                          <div className="absolute inset-0 bg-ink/50 flex items-center justify-center">
                            <span className="chip bg-ink/70 text-cream border-0 text-sm px-4 py-1.5 uppercase tracking-wider">Sold</span>
                          </div>
                        )}
                        {item.reserve_met && item.status !== 'sold' && <span className="absolute top-3 right-3 chip bg-fresh-50 text-moss-700 border-fresh-200">Reserve met</span>}
                      </div>
                      <div className="p-4">
                        <h3 className="font-display text-lg text-ink leading-snug line-clamp-1 group-hover:text-moss-700 transition-colors">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-ink/55">
                          <span className="chip !py-0 !px-2 text-[10px]">{POULTRY_LABELS[item.poultry_type] || item.poultry_type}</span>
                          {item.breed && <span>{item.breed}</span>}
                          {item.quantity > 1 && <span>· Qty {item.quantity}</span>}
                        </div>
                        <div className="mt-3 pt-3 border-t border-border flex items-end justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold">{item.bid_count > 0 ? 'Current bid' : 'Starting bid'}</p>
                            <p className="font-display text-xl font-bold text-terracotta-600 tabular-nums">R{(item.current_bid || item.starting_bid).toLocaleString()}</p>
                          </div>
                          <span className="text-xs text-ink/55 inline-flex items-center gap-1"><Gavel className="w-3.5 h-3.5" />{item.bid_count || 0} bid{item.bid_count === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right — sticky bid rail */}
        <aside className="lg:sticky lg:top-24">
          <div className="card-premium overflow-hidden">
            {!hasStarted ? (
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-yolk-50 border border-yolk-100 flex items-center justify-center mx-auto mb-3"><Clock className="w-7 h-7 text-yolk-600" /></div>
                <h3 className="font-display text-xl text-ink mb-1">Starts soon</h3>
                <p className="text-sm text-ink/65 mb-5">{moment(event.start_time).format('ddd D MMM YYYY, HH:mm')}</p>
                <p className="eyebrow mb-2 text-left">Starts in</p>
                <CountdownBlocks target={event.start_time} />
              </div>
            ) : hasEnded ? (
              <>
                <div className="bg-moss-gradient text-cream p-5 relative overflow-hidden">
                  <div className="absolute inset-0 grain opacity-50" />
                  <div className="relative">
                    <p className="text-[11px] uppercase tracking-wider opacity-80">Total sales</p>
                    <p className="font-display text-4xl font-bold tabular-nums mt-1">R{totalSales.toLocaleString()}</p>
                    <p className="text-xs opacity-80 mt-2">{soldItems.length} of {items.length} lots sold</p>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <Trophy className="w-10 h-10 text-moss-600 mx-auto mb-3" />
                  <h3 className="font-display text-xl text-ink mb-1">Auction ended</h3>
                  <p className="text-sm text-ink/65">Final results are shown in the panel on the left.</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-moss-gradient text-cream p-5 relative overflow-hidden">
                  <div className="absolute inset-0 grain opacity-50" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-wider opacity-80">{selectedItem ? `Lot ${selectedItem.lot_number}` : 'Select a lot'}</p>
                      <Radio className="w-5 h-5 text-terracotta-300 animate-pulse" />
                    </div>
                    {selectedItem ? (
                      <>
                        <p className="font-medium truncate mt-1">{selectedItem.title}</p>
                        <p className="font-display text-4xl font-bold tabular-nums mt-2">R{(selectedItem.current_bid || selectedItem.starting_bid).toLocaleString()}</p>
                        <p className="text-xs opacity-80 mt-1">{selectedItem.bid_count > 0 ? 'Current bid' : 'Starting bid'} · {selectedItem.bid_count || 0} bids</p>
                      </>
                    ) : (
                      <p className="font-display text-2xl mt-1">Live bidding open</p>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <div>
                    <p className="eyebrow mb-2">Time remaining</p>
                    <CountdownBlocks target={event.end_time} />
                  </div>

                  {selectedItem ? (
                    !user ? (
                      <Button onClick={() => api.auth.redirectToLogin(window.location.href)} className="w-full btn-cta py-3">Sign in to bid</Button>
                    ) : selectedItem.status === 'sold' ? (
                      <div className="bg-fresh-50 border border-fresh-200 rounded-xl p-4 text-center text-sm font-medium text-moss-700">This lot has been sold.</div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-ink/60 mb-1.5 block">Your bid <span className="text-ink/40">(min R{selectedMin.toLocaleString()})</span></label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/50">R</span>
                              <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder={`${selectedMin}`}
                                className="w-full bg-cream border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-moss-300" />
                            </div>
                            <Button onClick={handlePlaceBid} disabled={!bidAmount || placeBidMutation.isPending}
                              className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white px-6 gap-1.5">
                              {placeBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gavel className="w-4 h-4" /> Bid</>}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[selectedMin, selectedMin + 50, selectedMin + 100].map((amount) => (
                            <button key={amount} type="button" onClick={() => setBidAmount(amount.toString())}
                              className="px-3 py-2 rounded-full border border-border bg-white text-sm font-medium text-ink/70 hover:bg-moss-50 hover:text-moss-700 hover:border-moss-200 transition-colors tabular-nums">
                              R{amount.toLocaleString()}
                            </button>
                          ))}
                        </div>

                        {/* Recent bids for this item */}
                        {bids.length > 0 && (
                          <div className="pt-3 border-t border-border">
                            <p className="eyebrow mb-3">Recent bids</p>
                            <ol className="relative pl-5 space-y-2.5 max-h-40 overflow-y-auto">
                              <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-border" />
                              {bids.slice(0, 5).map((bid, i) => (
                                <li key={bid.id} className="relative text-sm flex items-center justify-between gap-2">
                                  <span className={`absolute -left-5 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-white ${i === 0 ? 'bg-terracotta-500' : 'bg-cream-deep'}`} />
                                  <span className={`truncate ${i === 0 ? 'text-ink font-medium' : 'text-ink/65'}`}>{bid.bidder_name || bid.bidder_email.split('@')[0]}</span>
                                  <span className={`tabular-nums font-display font-bold ${i === 0 ? 'text-terracotta-600' : 'text-ink/60'}`}>R{bid.amount.toLocaleString()}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-6 text-ink/55">
                      <Gavel className="w-8 h-8 mx-auto mb-2 text-ink/25" />
                      <p className="text-sm">Select a lot on the left to place a bid.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
