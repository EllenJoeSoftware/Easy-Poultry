import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Gavel, AlertCircle, Loader2, History, Eye, Trophy, ShieldCheck, Radio, Calendar, FileText, HeartPulse } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { LineSkeleton } from '@/components/shell/SkeletonCard';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '../utils';
import ImageCarousel from '../components/marketplace/ImageCarousel';

const POULTRY_LABELS = {
  chickens: 'Chickens', ducks: 'Ducks', geese: 'Geese', turkeys: 'Turkeys',
  quail: 'Quail', guinea_fowl: 'Guinea Fowl', peafowl: 'Peafowl', pigeons: 'Pigeons', other: 'Other'
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

function CountdownBlocks({ target, onEnd }) {
  const cd = useCountdown(target);
  const urgent = cd.diff > 0 && cd.diff < 300000;
  const pad = (n) => String(n).padStart(2, '0');
  useEffect(() => { if (cd.done) onEnd?.(); }, [cd.done, onEnd]);
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

export default function AuctionDetail() {
  const [user, setUser] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const auctionId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction', auctionId],
    queryFn: async () => {
      const auctions = await api.entities.Auction.filter({ id: auctionId });
      if (auctions.length > 0) {
        await api.entities.Auction.update(auctionId, {
          view_count: (auctions[0].view_count || 0) + 1
        });
        return auctions[0];
      }
      return null;
    },
    enabled: !!auctionId,
    refetchInterval: 5000
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['auction-bids', auctionId],
    queryFn: () => api.entities.AuctionBid.filter({ auction_id: auctionId }, '-created_date'),
    enabled: !!auctionId,
    refetchInterval: 5000
  });

  const { data: registration } = useQuery({
    queryKey: ['auction-registration', auctionId, user?.email],
    queryFn: async () => {
      const regs = await api.entities.AuctionRegistration.filter({
        auction_id: auctionId,
        bidder_email: user?.email
      });
      return regs[0];
    },
    enabled: !!auctionId && !!user
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      await api.entities.AuctionRegistration.create({
        auction_id: auctionId,
        bidder_email: user.email,
        bidder_name: user.full_name,
        status: 'registered'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-registration']);
      toast.success('Registered for auction!');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const placeBidMutation = useMutation({
    mutationFn: async (amount) => {
      // Create bid
      await api.entities.AuctionBid.create({
        auction_id: auctionId,
        bidder_email: user.email,
        bidder_name: user.full_name,
        amount
      });

      // Update auction
      const updateData = {
        current_bid: amount,
        current_bidder: user.email,
        current_bidder_name: user.full_name,
        bid_count: (auction.bid_count || 0) + 1,
        reserve_met: auction.reserve_price ? amount >= auction.reserve_price : true
      };

      // Auto-extend if within last 5 minutes
      if (auction.auto_extend) {
        const timeLeft = moment(auction.end_time).diff(moment());
        if (timeLeft < 300000 && timeLeft > 0) {
          updateData.end_time = moment(auction.end_time).add(auction.auto_extend_minutes || 2, 'minutes').toISOString();
          toast.info(`Auction extended by ${auction.auto_extend_minutes || 2} minutes!`);
        }
      }

      await api.entities.Auction.update(auctionId, updateData);

      // Notify previous bidder
      if (auction.current_bidder && auction.current_bidder !== user.email) {
        await api.entities.Notification.create({
          user_email: auction.current_bidder,
          type: 'system',
          title: 'Outbid!',
          message: `You've been outbid on "${auction.title}". New bid: R${amount}`,
          link: createPageUrl('AuctionDetail') + `?id=${auctionId}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction']);
      queryClient.invalidateQueries(['auction-bids']);
      toast.success('Bid placed successfully!');
      setBidAmount('');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    const minBid = (auction.current_bid || auction.starting_bid) + (auction.min_increment || 10);

    if (amount < minBid) {
      toast.error(`Minimum bid is R${minBid}`);
      return;
    }

    placeBidMutation.mutate(amount);
  };

  if (isLoading) {
    return (
      <PageShell eyebrow="Live auctions" title="Loading auction…" breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Live auctions', href: createPageUrl('Auctions') }, { label: 'Auction' }]}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium aspect-[4/3] animate-pulse" />
            <div className="card-premium p-6"><LineSkeleton rows={5} /></div>
          </div>
          <div className="card-premium p-6 h-fit"><LineSkeleton rows={6} /></div>
        </div>
      </PageShell>
    );
  }

  if (!auction) {
    return (
      <PageShell eyebrow="Live auctions" title="Auction not found" breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Live auctions', href: createPageUrl('Auctions') }, { label: 'Auction' }]}>
        <EmptyState icon={Gavel} title="This auction does not exist" subtitle="It may have been removed or the link is incorrect."
          action={<Link to={createPageUrl('Auctions')}><Button className="btn-cta px-5 py-2.5 text-sm">Browse auctions</Button></Link>} />
      </PageShell>
    );
  }

  const currentBid = auction.current_bid || auction.starting_bid;
  const minNextBid = currentBid + (auction.min_increment || 10);
  const hasStarted = moment().isAfter(auction.start_time);
  const hasEnded = moment().isAfter(auction.end_time);
  const isLive = hasStarted && !hasEnded;
  const isOwner = user?.email === auction.created_by;
  const canBid = user && !isOwner && hasStarted && !hasEnded && registration?.status !== 'disqualified';

  const statusChip = isLive ? <LiveBadge />
    : hasEnded ? <span className="chip bg-ink/70 text-cream border-0">Ended</span>
    : <span className="chip chip-yolk">Upcoming</span>;

  return (
    <PageShell
      eyebrow={<span className="inline-flex items-center gap-2">Live auctions {statusChip}</span>}
      title={auction.title}
      subtitle={<>
        {auction.breed && <span className="text-ink/80">{auction.breed} · </span>}
        {POULTRY_LABELS[auction.poultry_type] || auction.poultry_type}
        {(auction.city || auction.province) && <span className="inline-flex items-center gap-1 ml-2 text-ink/55"><MapPin className="w-4 h-4" />{auction.city}, {auction.province}</span>}
      </>}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Live auctions', href: createPageUrl('Auctions') }, { label: auction.title }]}
      action={isOwner && (
        <Link to={createPageUrl('MyAuctions')}>
          <Button className="btn-ghost border border-border bg-white px-5 py-2.5 text-sm gap-1.5"><Gavel className="w-4 h-4" /> Manage in My auctions</Button>
        </Link>
      )}
    >
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left — gallery + details + history */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium overflow-hidden relative">
            <ImageCarousel images={auction.images} />
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              {statusChip}
              {auction.reserve_met && <span className="chip bg-fresh-50 text-moss-700 border-fresh-200 gap-1"><ShieldCheck className="w-3 h-3" /> Reserve met</span>}
            </div>
          </motion.div>

          {/* Quick facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Users, label: 'Quantity', value: auction.quantity || '—' },
              { icon: Clock, label: 'Age', value: auction.age || '—' },
              { icon: Gavel, label: 'Bids', value: auction.bid_count || 0 },
              { icon: Eye, label: 'Views', value: auction.view_count || 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="card-premium p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-moss-50 border border-moss-100 flex items-center justify-center text-moss-700 flex-shrink-0"><Icon className="w-4 h-4" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold">{label}</p>
                  <p className="font-display font-bold text-ink truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description sections */}
          <div className="card-premium divide-y divide-border">
            {auction.description && (
              <section className="p-6">
                <h3 className="eyebrow mb-3 inline-flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Description</h3>
                <p className="text-ink/75 leading-relaxed whitespace-pre-line">{auction.description}</p>
              </section>
            )}
            {auction.health_details && (
              <section className="p-6">
                <h3 className="eyebrow mb-3 inline-flex items-center gap-2"><HeartPulse className="w-3.5 h-3.5" /> Health information</h3>
                <p className="text-ink/75 leading-relaxed">{auction.health_details}</p>
              </section>
            )}
            <section className="p-6">
              <h3 className="eyebrow mb-3 inline-flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Schedule</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-cream p-3"><p className="text-xs text-ink/50">Starts</p><p className="font-medium text-ink">{moment(auction.start_time).format('ddd D MMM YYYY, HH:mm')}</p></div>
                <div className="rounded-xl bg-cream p-3"><p className="text-xs text-ink/50">Ends</p><p className="font-medium text-ink">{moment(auction.end_time).format('ddd D MMM YYYY, HH:mm')}</p></div>
              </div>
            </section>
            {auction.terms_conditions && (
              <section className="p-6">
                <h3 className="eyebrow mb-3">Terms & conditions</h3>
                <p className="text-ink/65 text-sm leading-relaxed whitespace-pre-line">{auction.terms_conditions}</p>
              </section>
            )}
          </div>

          {/* Bid history timeline */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl text-ink inline-flex items-center gap-2"><History className="w-5 h-5 text-ink/50" /> Bid history</h3>
              <span className="chip">{bids.length} bid{bids.length === 1 ? '' : 's'}</span>
            </div>
            {bids.length === 0 ? (
              <EmptyState variant="plain" icon={Gavel} title="No bids yet" subtitle="Be the first to place a bid on this lot." className="!py-8" />
            ) : (
              <motion.ol initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                className="relative pl-6 max-h-96 overflow-y-auto">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                {bids.map((bid, index) => (
                  <motion.li key={bid.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="relative pb-5 last:pb-0">
                    <span className={`absolute -left-6 top-1.5 w-[19px] h-[19px] rounded-full border-2 border-white flex items-center justify-center ${index === 0 ? 'bg-terracotta-500' : 'bg-cream-deep'}`}>
                      {index === 0 && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </span>
                    <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${index === 0 ? 'bg-terracotta-50 border border-terracotta-100' : 'bg-cream'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-sm font-semibold text-moss-700 flex-shrink-0">
                          {bid.bidder_name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{bid.bidder_name || 'Anonymous'}</p>
                          <p className="text-xs text-ink/50">{moment(bid.created_date).format('D MMM, HH:mm')} · {moment(bid.created_date).fromNow()}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-display font-bold tabular-nums ${index === 0 ? 'text-terracotta-600 text-lg' : 'text-ink/75'}`}>R{bid.amount.toLocaleString()}</p>
                        {index === 0 && <span className="text-[10px] uppercase tracking-wider font-semibold text-terracotta-600">Highest</span>}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ol>
            )}
          </div>
        </div>

        {/* Right — sticky bid rail */}
        <aside className="lg:sticky lg:top-24">
          <div className="card-premium overflow-hidden">
            <div className="bg-moss-gradient text-cream p-5 relative overflow-hidden">
              <div className="absolute inset-0 grain opacity-50" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider opacity-80">{auction.bid_count > 0 ? 'Current bid' : 'Starting bid'}</p>
                  <p className="font-display text-4xl font-bold tabular-nums mt-1">R{currentBid.toLocaleString()}</p>
                </div>
                {isLive && <Radio className="w-6 h-6 text-terracotta-300 animate-pulse" />}
              </div>
              <p className="relative text-xs opacity-80 mt-2">{auction.bid_count || 0} bids · {auction.view_count || 0} views{auction.current_bidder_name ? ` · Leading: ${auction.current_bidder_name}` : ''}</p>
            </div>

            <div className="p-5 space-y-5">
              {hasEnded ? (
                <div className="text-center py-2">
                  <div className="w-14 h-14 rounded-2xl bg-cream-deep flex items-center justify-center mx-auto mb-3"><Trophy className="w-7 h-7 text-ink/40" /></div>
                  <h3 className="font-display text-xl text-ink mb-1">Auction ended</h3>
                  {auction.winner_name ? (
                    <div className="bg-fresh-50 border border-fresh-200 rounded-xl p-4 mt-4 text-left">
                      <p className="text-xs uppercase tracking-wider text-ink/50 font-semibold">Winner</p>
                      <p className="font-medium text-ink mt-0.5">{auction.winner_name}</p>
                      <p className="font-display text-2xl font-bold text-moss-700 mt-2">R{auction.final_price?.toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-ink/55">No bids were received.</p>
                  )}
                </div>
              ) : !hasStarted ? (
                <div className="text-center py-2">
                  <div className="w-14 h-14 rounded-2xl bg-yolk-50 border border-yolk-100 flex items-center justify-center mx-auto mb-3"><Clock className="w-7 h-7 text-yolk-600" /></div>
                  <h3 className="font-display text-xl text-ink mb-1">Starts soon</h3>
                  <p className="text-sm text-ink/65">{moment(auction.start_time).format('ddd D MMM YYYY, HH:mm')}</p>
                  <div className="mt-4"><p className="eyebrow mb-2 text-left">Starts in</p><CountdownBlocks target={auction.start_time} onEnd={() => queryClient.invalidateQueries(['auction'])} /></div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="eyebrow mb-2">Time remaining</p>
                    <CountdownBlocks target={auction.end_time} onEnd={() => queryClient.invalidateQueries(['auction'])} />
                  </div>

                  {!user ? (
                    <Button onClick={() => api.auth.redirectToLogin(window.location.href)} className="w-full btn-cta py-3">Sign in to bid</Button>
                  ) : isOwner ? (
                    <div className="bg-moss-50 border border-moss-100 rounded-xl p-4 text-center text-sm text-moss-800">This is your auction.</div>
                  ) : !registration ? (
                    <Button onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending} className="w-full btn-cta py-3 gap-2">
                      {registerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Register to bid
                    </Button>
                  ) : registration.status === 'disqualified' ? (
                    <div className="bg-terracotta-50 border border-terracotta-100 rounded-xl p-4 text-center">
                      <AlertCircle className="w-6 h-6 text-terracotta-500 mx-auto mb-2" />
                      <p className="text-sm text-terracotta-700">You have been disqualified from this auction.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-ink/60 mb-1.5 block">Your bid <span className="text-ink/40">(min R{minNextBid.toLocaleString()})</span></label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/50">R</span>
                            <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder={`${minNextBid}`} min={minNextBid}
                              className="w-full bg-cream border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-moss-300" />
                          </div>
                          <Button onClick={handlePlaceBid} disabled={!canBid || !bidAmount || placeBidMutation.isPending}
                            className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white px-6 gap-1.5">
                            {placeBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gavel className="w-4 h-4" /> Bid</>}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[minNextBid, minNextBid + 50, minNextBid + 100].map((amount) => (
                          <button key={amount} type="button" onClick={() => setBidAmount(amount.toString())}
                            className="px-3 py-2 rounded-full border border-border bg-white text-sm font-medium text-ink/70 hover:bg-moss-50 hover:text-moss-700 hover:border-moss-200 transition-colors tabular-nums">
                            R{amount.toLocaleString()}
                          </button>
                        ))}
                      </div>
                      {auction.auto_extend && (
                        <p className="text-xs text-ink/50 text-center inline-flex items-center justify-center gap-1 w-full">
                          <AlertCircle className="w-3 h-3" /> Auto-extends {auction.auto_extend_minutes || 2} min on last-minute bids
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {auction.reserve_price && !hasEnded && (
            <p className="mt-3 text-xs text-ink/50 text-center">
              {auction.reserve_met ? 'Reserve price has been met.' : 'A reserve price applies to this lot.'}
            </p>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
