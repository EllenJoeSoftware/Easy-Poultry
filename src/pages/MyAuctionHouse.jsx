import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Plus, Calendar, Package, Eye, Loader2, Clock, CheckCircle2, Gavel, AlertTriangle, CreditCard, MapPin, Settings, ArrowRight, TrendingUp } from 'lucide-react';
import moment from 'moment';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton } from '@/components/shell/SkeletonCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '../utils';

const HOUSE_STATUS_CHIP = {
  pending_payment: 'bg-yolk-50 text-yolk-700 border-yolk-200',
  awaiting_verification: 'bg-yolk-50 text-yolk-700 border-yolk-200',
  active: 'bg-fresh-50 text-moss-700 border-fresh-200',
  suspended: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100',
  expired: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100'
};

const TAB_TRIGGER = 'rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream';

export default function MyAuctionHouse() {
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

  const { data: myHouse, isLoading } = useQuery({
    queryKey: ['my-auction-house', user?.email],
    queryFn: async () => {
      const houses = await api.entities.AuctionHouse.filter({ created_by: user?.email });
      return houses[0];
    },
    enabled: !!user
  });

  const { data: events = [] } = useQuery({
    queryKey: ['my-auction-events', myHouse?.id],
    queryFn: () => api.entities.AuctionEvent.filter({ auction_house_id: myHouse?.id }, '-created_date'),
    enabled: !!myHouse?.id
  });

  const { data: items = [] } = useQuery({
    queryKey: ['my-auction-items', myHouse?.id],
    queryFn: () => api.entities.AuctionItem.filter({ auction_house_id: myHouse?.id }),
    enabled: !!myHouse?.id
  });

  const { data: tier } = useQuery({
    queryKey: ['my-auction-house-tier', myHouse?.tier_id],
    queryFn: async () => {
      if (!myHouse?.tier_id) return null;
      const tiers = await api.entities.AuctionHouseTier.filter({ id: myHouse.tier_id });
      return tiers[0];
    },
    enabled: !!myHouse?.tier_id
  });

  // Check subscription status
  const isExpired = myHouse?.subscription_end && moment().isAfter(myHouse.subscription_end);
  const daysUntilExpiry = myHouse?.subscription_end ? moment(myHouse.subscription_end).diff(moment(), 'days') : null;
  const needsRenewal = daysUntilExpiry !== null && daysUntilExpiry <= 5;

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  if (isLoading) {
    return (
      <PageShell variant="compact" eyebrow="Auction house" title="My auction house" breadcrumb={[{ label: 'Live auctions', href: createPageUrl('Auctions') }, { label: 'My auction house' }]}>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">{[...Array(5)].map((_, i) => <StatSkeleton key={i} />)}</div>
        <div className="card-premium h-40 animate-pulse" />
      </PageShell>
    );
  }

  if (!myHouse) {
    return (
      <PageShell variant="compact" eyebrow="Auction house" title="My auction house"
        subtitle="Host live auction events with multiple lots under your own brand."
        breadcrumb={[{ label: 'Live auctions', href: createPageUrl('Auctions') }, { label: 'My auction house' }]}>
        <EmptyState icon={Building2} title="No auction house yet"
          subtitle="Create your auction house to start hosting auction events and selling your poultry to verified bidders."
          action={<Link to={createPageUrl('CreateAuctionHouse')}><Button className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Create auction house</Button></Link>} />
      </PageShell>
    );
  }

  const liveEvents = events.filter(e => e.status === 'live');
  const scheduledEvents = events.filter(e => e.status === 'scheduled');
  const endedEvents = events.filter(e => e.status === 'ended');

  const maxLiveAuctions = tier?.max_live_auctions || 1;
  const canCreateAuction = liveEvents.length < maxLiveAuctions && !isExpired;
  const totalSales = items.filter(i => i.status === 'sold').reduce((sum, i) => sum + (i.final_price || 0), 0);
  const renewUrl = createPageUrl('AuctionHousePayment') + `?houseId=${myHouse.id}&tierId=${myHouse.tier_id}&renewal=true`;
  const houseChip = HOUSE_STATUS_CHIP[myHouse.status] || HOUSE_STATUS_CHIP.pending_payment;

  const renderEvents = (list, EmptyIcon, title, subtitle, withCta = false) => (
    list.length === 0 ? (
      <EmptyState icon={EmptyIcon} title={title} subtitle={subtitle}
        action={withCta && canCreateAuction && <Link to={createPageUrl('CreateAuctionEvent') + `?houseId=${myHouse.id}`}><Button className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> New auction</Button></Link>} />
    ) : (
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-4">
        {list.map((event) => <EventCard key={event.id} event={event} items={items.filter(i => i.auction_event_id === event.id)} />)}
      </motion.div>
    )
  );

  return (
    <PageShell
      variant="compact"
      eyebrow="Auction house"
      title={myHouse.name}
      subtitle={<span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-medium capitalize ${houseChip}`}>{myHouse.status.replace(/_/g, ' ')}</span>
        {myHouse.city && <span className="inline-flex items-center gap-1 text-ink/55 text-sm"><MapPin className="w-4 h-4" />{myHouse.city}, {myHouse.province}</span>}
        {tier?.name && <span className="chip chip-yolk">{tier.name} plan</span>}
      </span>}
      breadcrumb={[{ label: 'Live auctions', href: createPageUrl('Auctions') }, { label: 'My auction house' }]}
      action={myHouse.status === 'active' && !isExpired && (
        canCreateAuction ? (
          <Link to={createPageUrl('CreateAuctionEvent') + `?houseId=${myHouse.id}`}>
            <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> New auction</Button>
          </Link>
        ) : (
          <Button disabled className="rounded-full bg-cream-deep text-ink/55 px-5 py-2.5 text-sm">Max {maxLiveAuctions} live auction{maxLiveAuctions > 1 ? 's' : ''} reached</Button>
        )
      )}
    >
      {/* Brand strip */}
      <div className="card-premium overflow-hidden mb-6">
        <div className="h-24 sm:h-32 bg-moss-gradient relative overflow-hidden">
          {myHouse.cover_image_url ? <img src={myHouse.cover_image_url} alt="" className="w-full h-full object-cover" /> : <div className="absolute inset-0 grain opacity-50" />}
        </div>
        <div className="px-5 pb-5 -mt-8 flex items-end gap-4">
          {myHouse.logo_url
            ? <img src={myHouse.logo_url} alt={myHouse.name} className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-sm bg-white" />
            : <div className="w-16 h-16 rounded-2xl bg-moss-50 border-4 border-white shadow-sm flex items-center justify-center text-moss-700"><Building2 className="w-7 h-7" /></div>}
          <div className="flex-1 min-w-0 pb-1">
            {myHouse.description ? <p className="text-sm text-ink/65 line-clamp-2">{myHouse.description}</p> : <p className="text-sm text-ink/45">Add a description to tell bidders about your house.</p>}
          </div>
        </div>
      </div>

      {/* Status alerts */}
      <div className="space-y-3 mb-8">
        {myHouse.status !== 'active' && (
          <Alert tone="yolk" icon={Clock}
            text={
              myHouse.status === 'pending_payment' ? 'Complete payment to activate your auction house.'
              : myHouse.status === 'awaiting_verification' ? 'Your payment is being verified (24-48 hours).'
              : myHouse.status === 'expired' ? 'Your subscription has expired.' : null
            }
            action={(myHouse.status === 'pending_payment' || myHouse.status === 'expired') && (
              <Link to={renewUrl}><Button size="sm" className="btn-cta h-8 px-4 text-xs">{myHouse.status === 'expired' ? 'Renew subscription' : 'Complete payment'}</Button></Link>
            )} />
        )}
        {isExpired && myHouse.status === 'active' && (
          <Alert tone="terracotta" icon={AlertTriangle} text="Your subscription has expired. Renew to continue hosting auctions."
            action={<Link to={renewUrl}><Button size="sm" className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white h-8 px-4 text-xs">Renew now</Button></Link>} />
        )}
        {needsRenewal && !isExpired && myHouse.status === 'active' && (
          <Alert tone="yolk" icon={CreditCard}
            text={`Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} (${moment(myHouse.subscription_end).format('D MMM YYYY')}).`}
            action={<Link to={renewUrl}><Button size="sm" className="btn-cta h-8 px-4 text-xs">Renew subscription</Button></Link>} />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Calendar} label="Total auctions" value={events.length} tint="moss" />
        <StatCard icon={Gavel} label="Live auctions" value={`${liveEvents.length} / ${maxLiveAuctions}`} tint="terracotta" />
        <StatCard icon={Package} label="Total lots" value={items.length} tint="sage" />
        <StatCard icon={TrendingUp} label="Total sales" value={`R${totalSales.toLocaleString()}`} tint="moss" />
        <StatCard icon={CreditCard} label="Plan" value={tier?.name || 'Basic'} tint="yolk"
          deltaLabel={myHouse.subscription_end ? `Expires ${moment(myHouse.subscription_end).format('D MMM')}` : 'Current plan'} />
      </div>

      {(myHouse.status === 'active' || isExpired) && (
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
            <TabsTrigger value="live" className={TAB_TRIGGER}>Live ({liveEvents.length})</TabsTrigger>
            <TabsTrigger value="scheduled" className={TAB_TRIGGER}>Scheduled ({scheduledEvents.length})</TabsTrigger>
            <TabsTrigger value="ended" className={TAB_TRIGGER}>Ended ({endedEvents.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="live">{renderEvents(liveEvents, Gavel, 'No live auctions', 'Create an auction event and add lots to start selling.', true)}</TabsContent>
          <TabsContent value="scheduled">{renderEvents(scheduledEvents, Calendar, 'No scheduled auctions', 'Scheduled events will go live automatically at their start time.')}</TabsContent>
          <TabsContent value="ended">{renderEvents(endedEvents, CheckCircle2, 'No ended auctions', 'Past events and their results will appear here.')}</TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}

function Alert({ tone, icon: Icon, text, action }) {
  const tones = {
    yolk: 'bg-yolk-50 border-yolk-200 text-yolk-700',
    terracotta: 'bg-terracotta-50 border-terracotta-100 text-terracotta-700'
  };
  if (!text) return null;
  return (
    <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${tones[tone]}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{text}</p>
      {action}
    </div>
  );
}

function EventCard({ event, items }) {
  const chip = event.status === 'live'
    ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-terracotta-500 text-white text-[11px] font-semibold uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live</span>
    : event.status === 'scheduled' ? <span className="chip chip-yolk">Scheduled</span>
    : event.status === 'ended' ? <span className="chip bg-ink/70 text-cream border-0">Ended</span>
    : <span className="chip capitalize">{event.status}</span>;
  const totalBids = items.reduce((s, i) => s + (i.bid_count || 0), 0);

  return (
    <motion.article variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card-premium p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        <div className="w-full sm:w-40 h-36 sm:h-28 rounded-xl overflow-hidden bg-moss-gradient relative flex-shrink-0">
          {event.cover_image_url ? <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" /> : <div className="absolute inset-0 grain opacity-50 flex items-center justify-center"><Gavel className="w-8 h-8 text-cream/30" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg text-ink line-clamp-1">{event.title}</h3>
              <p className="text-xs text-ink/55 mt-0.5 inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{moment(event.start_time).format('D MMM, HH:mm')} – {moment(event.end_time).format('D MMM, HH:mm')}</p>
            </div>
            {chip}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-ink/55">
            <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5" />{items.length} lots</span>
            <span className="inline-flex items-center gap-1"><Gavel className="w-3.5 h-3.5" />{totalBids} bids</span>
            <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{event.view_count || 0} views</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to={createPageUrl('ManageAuctionEvent') + `?eventId=${event.id}`}>
              <Button size="sm" className="btn-cta h-8 px-4 text-xs gap-1.5"><Settings className="w-3.5 h-3.5" /> Manage lots</Button>
            </Link>
            <Link to={createPageUrl('AuctionEventDetail') + `?id=${event.id}`}>
              <Button size="sm" variant="outline" className="rounded-full h-8 px-4 text-xs gap-1.5">View public page <ArrowRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
