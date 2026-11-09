import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, Plus, Clock, CheckCircle2, XCircle, Eye, Users, Loader2, Trophy, CreditCard, Layers, TrendingUp, MoreHorizontal, Package } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton } from '@/components/shell/SkeletonCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createPageUrl } from '../utils';
import ChatButton from '../components/chat/ChatButton';

const STATUS_CHIP = {
  draft: 'bg-cream-deep text-ink/60 border-border',
  pending_payment: 'bg-yolk-50 text-yolk-700 border-yolk-200',
  awaiting_verification: 'bg-yolk-50 text-yolk-700 border-yolk-200',
  active: 'bg-fresh-50 text-moss-700 border-fresh-200',
  ended: 'bg-ink/70 text-cream border-0',
  cancelled: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100',
  rejected: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100'
};
const STATUS_LABEL = {
  draft: 'Draft',
  pending_payment: 'Pending payment',
  awaiting_verification: 'Awaiting verification',
  active: 'Active',
  ended: 'Ended',
  cancelled: 'Cancelled',
  rejected: 'Rejected'
};

const TAB_TRIGGER = 'rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream';

export default function MyAuctions() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
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

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['my-auctions', user?.email],
    queryFn: () => api.entities.Auction.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['my-auction-registrations', user?.email],
    queryFn: () => api.entities.AuctionRegistration.filter({ auction_id: auctions.map(a => a.id) }),
    enabled: auctions.length > 0
  });

  const cancelAuctionMutation = useMutation({
    mutationFn: (auctionId) => api.entities.Auction.update(auctionId, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-auctions']);
      toast.success('Auction cancelled');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const markCollectedMutation = useMutation({
    mutationFn: (auctionId) => api.entities.Auction.update(auctionId, {
      item_collected: true,
      collection_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-auctions']);
      toast.success('Marked as collected');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const activeAuctions = auctions.filter(a => a.status === 'active');
  const pendingAuctions = auctions.filter(a => ['draft', 'pending_payment', 'awaiting_verification'].includes(a.status));
  const endedAuctions = auctions.filter(a => ['ended', 'cancelled', 'rejected'].includes(a.status));

  const totalBids = auctions.reduce((s, a) => s + (a.bid_count || 0), 0);
  const totalViews = auctions.reduce((s, a) => s + (a.view_count || 0), 0);
  const totalSales = auctions.filter(a => a.status === 'ended' && a.final_price).reduce((s, a) => s + (a.final_price || 0), 0);

  const renderList = (list, emptyIcon, emptyTitle, emptySubtitle, showActions = true, withCta = false) => {
    if (isLoading) {
      return (
        <div className="space-y-4">{[...Array(3)].map((_, i) => (
          <div key={i} className="card-premium p-5 flex gap-5 animate-pulse"><div className="w-28 h-28 rounded-xl bg-cream-deep flex-shrink-0" /><div className="flex-1 space-y-3"><div className="h-5 bg-cream-deep rounded w-1/3" /><div className="h-3 bg-cream-deep rounded w-1/5" /><div className="h-3 bg-cream-deep rounded w-2/5" /></div></div>
        ))}</div>
      );
    }
    if (list.length === 0) {
      return (
        <EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptySubtitle}
          action={withCta && <Link to={createPageUrl('CreateAuction')}><Button className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Create auction</Button></Link>} />
      );
    }
    return (
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-4">
        {list.map((auction) => (
          <AuctionRow key={auction.id} auction={auction} registrations={registrations} showActions={showActions}
            onCancel={() => cancelAuctionMutation.mutate(auction.id)} cancelling={cancelAuctionMutation.isPending}
            onCollected={() => markCollectedMutation.mutate(auction.id)} collecting={markCollectedMutation.isPending} />
        ))}
      </motion.div>
    );
  };

  return (
    <PageShell
      variant="compact"
      eyebrow="Sell"
      title="My auctions"
      subtitle="Track bids, complete payments and hand over to winners — all your standalone auctions in one place."
      breadcrumb={[{ label: 'Live auctions', href: createPageUrl('Auctions') }, { label: 'My auctions' }]}
      action={
        <Link to={createPageUrl('CreateAuction')}>
          <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Create auction</Button>
        </Link>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard icon={Layers} label="Active auctions" value={activeAuctions.length} tint="moss" />
            <StatCard icon={Gavel} label="Total bids" value={totalBids.toLocaleString()} tint="yolk" />
            <StatCard icon={Eye} label="Total views" value={totalViews.toLocaleString()} tint="sage" />
            <StatCard icon={TrendingUp} label="Sales" value={`R${totalSales.toLocaleString()}`} tint="terracotta" />
          </>
        )}
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
          <TabsTrigger value="active" className={TAB_TRIGGER}>Active ({activeAuctions.length})</TabsTrigger>
          <TabsTrigger value="pending" className={TAB_TRIGGER}>Pending ({pendingAuctions.length})</TabsTrigger>
          <TabsTrigger value="ended" className={TAB_TRIGGER}>Ended ({endedAuctions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {renderList(activeAuctions, Gavel, 'No active auctions', 'Create your first auction to start receiving bids.', true, true)}
        </TabsContent>
        <TabsContent value="pending">
          {renderList(pendingAuctions, Clock, 'No pending auctions', 'Drafts and auctions awaiting payment or verification will appear here.')}
        </TabsContent>
        <TabsContent value="ended">
          {renderList(endedAuctions, CheckCircle2, 'No ended auctions', 'Completed, cancelled and rejected auctions will be listed here.', false)}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function AuctionRow({ auction, registrations, showActions, onCancel, cancelling, onCollected, collecting }) {
  const auctionRegs = registrations.filter(r => r.auction_id === auction.id);
  const hasEnded = moment().isAfter(auction.end_time);
  const chip = STATUS_CHIP[auction.status] || STATUS_CHIP.draft;
  const img = auction.images?.[0];
  const canCancel = ['draft', 'pending_payment'].includes(auction.status);

  return (
    <motion.article variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card-premium p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        <div className="w-full sm:w-28 h-40 sm:h-28 rounded-xl overflow-hidden bg-cream-deep border border-border flex-shrink-0 flex items-center justify-center text-moss-600">
          {img ? <img src={img} alt={auction.title} className="w-full h-full object-cover" /> : <Package className="w-8 h-8" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={createPageUrl('AuctionDetail') + `?id=${auction.id}`} className="font-display text-lg text-ink hover:text-moss-700 line-clamp-1">{auction.title}</Link>
              {auction.breed && <p className="text-sm text-ink/55">{auction.breed}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-medium ${chip}`}>{STATUS_LABEL[auction.status] || auction.status}</span>
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="More actions"><MoreHorizontal className="w-4 h-4" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl w-52">
                    <DropdownMenuItem asChild><Link to={createPageUrl('AuctionDetail') + `?id=${auction.id}`} className="gap-2"><Eye className="w-4 h-4" /> View auction</Link></DropdownMenuItem>
                    {auction.status === 'pending_payment' && (
                      <DropdownMenuItem asChild><Link to={createPageUrl('AuctionPayment') + `?auctionId=${auction.id}`} className="gap-2"><CreditCard className="w-4 h-4 text-yolk-600" /> Complete payment</Link></DropdownMenuItem>
                    )}
                    {canCancel && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={onCancel} disabled={cancelling} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><XCircle className="w-4 h-4" /> Cancel auction</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-ink/55">
            <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{auction.view_count || 0} views</span>
            <span className="inline-flex items-center gap-1"><Gavel className="w-3.5 h-3.5" />{auction.bid_count || 0} bids</span>
            {auctionRegs.length > 0 && <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{auctionRegs.length} registered</span>}
            <span className="font-display font-bold text-sm text-terracotta-600 tabular-nums">R{(auction.current_bid || auction.starting_bid).toLocaleString()}</span>
            {auction.status === 'active' && !hasEnded && (
              <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Ends {moment(auction.end_time).format('D MMM, HH:mm')} ({moment(auction.end_time).fromNow()})</span>
            )}
          </div>

          {auction.status === 'ended' && auction.winner_email && (
            <div className="bg-fresh-50 border border-fresh-200 rounded-xl p-3 mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-fresh-200 flex items-center justify-center text-moss-700"><Trophy className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-ink/55">Winner <span className="font-medium text-ink">{auction.winner_name}</span></p>
                  <p className="text-sm">Final price <span className="font-display font-bold text-moss-700">R{auction.final_price?.toLocaleString()}</span></p>
                </div>
              </div>
              {auction.item_collected ? (
                <span className="chip bg-fresh-50 text-moss-700 border-fresh-200 gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Collected</span>
              ) : (
                <div className="flex items-center gap-2">
                  <ChatButton sellerEmail={auction.winner_email} variant="outline" className="text-sm h-8 rounded-full" />
                  <Button size="sm" onClick={onCollected} disabled={collecting} className="btn-cta h-8 px-3 text-xs gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Mark collected</Button>
                </div>
              )}
            </div>
          )}

          {showActions && (auction.status === 'pending_payment' || canCancel) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {auction.status === 'pending_payment' && (
                <Link to={createPageUrl('AuctionPayment') + `?auctionId=${auction.id}`}>
                  <Button size="sm" className="btn-cta h-8 px-4 text-xs gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Complete payment</Button>
                </Link>
              )}
              {canCancel && (
                <Button size="sm" variant="outline" onClick={onCancel} disabled={cancelling} className="rounded-full h-8 text-xs text-terracotta-600 hover:text-terracotta-700 gap-1"><XCircle className="w-3.5 h-3.5" /> Cancel</Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
