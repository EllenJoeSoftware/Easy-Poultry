import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, Plus, Search, Building2, Clock, Calendar, Package, Radio, ArrowRight, X, MapPin } from 'lucide-react';
import moment from 'moment';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createPageUrl } from '../utils';

export default function Auctions() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('ending_soon');

  useEffect(() => { api.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: auctionHouses = [] } = useQuery({
    queryKey: ['auction-houses'],
    queryFn: () => api.entities.AuctionHouse.filter({ status: 'active' }),
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['auction-events', sort],
    queryFn: async () => {
      const [live, scheduled] = await Promise.all([
        api.entities.AuctionEvent.filter({ status: 'live' }),
        api.entities.AuctionEvent.filter({ status: 'scheduled' }),
      ]);
      const results = [...live, ...scheduled];
      if (sort === 'ending_soon') results.sort((a, b) => new Date(a.end_time) - new Date(b.end_time));
      else results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      return results;
    },
  });

  const { data: myHouse } = useQuery({
    queryKey: ['my-auction-house', user?.email],
    queryFn: async () => (await api.entities.AuctionHouse.filter({ created_by: user?.email }))[0],
    enabled: !!user,
  });

  const filtered = events.filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()));
  const liveCount = events.filter(e => isLiveEvent(e)).length;

  const houseCta = !user ? null
    : myHouse?.status === 'active'
      ? { to: 'MyAuctionHouse', icon: Building2, label: 'My auction house' }
      : myHouse
        ? { to: 'MyAuctionHouse', icon: Clock, label: 'Pending verification' }
        : { to: 'CreateAuctionHouse', icon: Plus, label: 'Create auction house' };

  return (
    <PageShell
      eyebrow="Live auctions"
      title={<>Bid on <span className="italic text-moss-700">premium</span> poultry.</>}
      subtitle={liveCount > 0
        ? <><span className="inline-flex items-center gap-1.5 text-terracotta-600 font-medium"><Radio className="w-4 h-4 animate-pulse" />{liveCount} live now</span> — bid in real time from verified auction houses across South Africa.</>
        : 'Verified auction houses run live events every Tuesday from 19:00 SAST. Browse upcoming lots and set reminders.'}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Live auctions' }]}
      action={houseCta && (
        <Link to={createPageUrl(houseCta.to)}>
          <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5"><houseCta.icon className="w-4 h-4" />{houseCta.label}</Button>
        </Link>
      )}
    >
      {/* Search + sort panel */}
      <div className="card-premium p-2 -mt-6 lg:-mt-10 mb-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-stretch gap-2 p-1.5">
          <div className="relative flex-1 flex items-center md:border-r md:border-border md:pr-3 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 pointer-events-none group-focus-within:text-moss-700" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search auctions, lots, auction houses…"
              className="w-full bg-transparent pl-11 pr-10 py-3 text-base placeholder:text-ink/40 focus:outline-none" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 w-7 h-7 rounded-full hover:bg-cream-deep flex items-center justify-center"><X className="w-3.5 h-3.5 text-ink/50" /></button>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-ink/70 hover:bg-moss-50 hover:text-moss-700">
                <Clock className="w-4 h-4" />{sort === 'ending_soon' ? 'Ending soon' : 'Newest'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onSelect={() => setSort('ending_soon')}>Ending soon</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort('newest')}>Newest</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="auctions" className="space-y-6">
        <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
          <TabsTrigger value="auctions" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Live & upcoming ({filtered.length})</TabsTrigger>
          <TabsTrigger value="houses" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Auction houses ({auctionHouses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="auctions">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(6)].map((_, i) => <div key={i} className="card-premium aspect-[4/3] animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Gavel} title={search ? `No auctions match "${search}"` : 'No live or upcoming auctions'}
              subtitle="New events are posted weekly. Check back soon or follow an auction house to get notified." />
          ) : (
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(e => <AuctionEventCard key={e.id} event={e} houses={auctionHouses} />)}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="houses">
          {auctionHouses.length === 0 ? (
            <EmptyState icon={Building2} title="No auction houses yet" subtitle="Verified auction houses will appear here once approved." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {auctionHouses.map(h => (
                <article key={h.id} className="card-premium overflow-hidden">
                  <div className="aspect-[3/1] bg-moss-gradient relative overflow-hidden">
                    {h.cover_image_url ? <img src={h.cover_image_url} alt="" className="w-full h-full object-cover" /> : <div className="absolute inset-0 grain opacity-50" />}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      {h.logo_url
                        ? <img src={h.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-border" />
                        : <div className="w-11 h-11 rounded-xl bg-moss-50 border border-moss-100 flex items-center justify-center text-moss-700"><Building2 className="w-5 h-5" /></div>}
                      <div className="min-w-0">
                        <h3 className="font-display text-lg text-ink truncate">{h.name}</h3>
                        {h.city && <p className="text-xs text-ink/55 inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{h.city}, {h.province}</p>}
                      </div>
                    </div>
                    {h.description && <p className="text-sm text-ink/65 line-clamp-2">{h.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function isLiveEvent(e) {
  const started = moment().isAfter(e.start_time);
  const ended = moment().isAfter(e.end_time);
  return e.status === 'live' || (started && !ended && e.status !== 'ended');
}

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(target) - now);
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
  return { d, h, m, s, done: diff === 0 };
}

function AuctionEventCard({ event, houses }) {
  const house = houses.find(h => h.id === event.auction_house_id);
  const started = moment().isAfter(event.start_time);
  const ended = moment().isAfter(event.end_time);
  const live = isLiveEvent(event);
  const cd = useCountdown(started ? event.end_time : event.start_time);
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <motion.article variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="group card-premium overflow-hidden relative flex flex-col">
      <Link to={createPageUrl('AuctionEventDetail') + `?id=${event.id}`} className="absolute inset-0 z-10" aria-label={event.title} />
      <div className="aspect-video bg-moss-gradient relative overflow-hidden">
        {event.cover_image_url
          ? <img src={event.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="absolute inset-0 grain opacity-50 flex items-center justify-center"><Gavel className="w-12 h-12 text-cream/30" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 z-20">
          {live ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-terracotta-500 text-white text-[11px] font-semibold uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
          ) : ended ? (
            <span className="chip bg-ink/70 text-cream border-0">Ended</span>
          ) : (
            <span className="chip chip-yolk">Upcoming</span>
          )}
        </div>
        {!ended && (
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-cream">
            <span className="text-[11px] uppercase tracking-wider opacity-80">{started ? 'Ends in' : 'Starts in'}</span>
            <span className="font-display font-bold text-lg tabular-nums">
              {cd.d > 0 && `${cd.d}d `}{pad(cd.h)}:{pad(cd.m)}:{pad(cd.s)}
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-display text-lg text-ink leading-snug line-clamp-2 group-hover:text-moss-700 transition-colors">{event.title}</h3>
        {house && <p className="text-xs text-ink/55 mt-1 inline-flex items-center gap-1"><Building2 className="w-3 h-3" />{house.name}</p>}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-ink/55">
          <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{moment(started ? event.end_time : event.start_time).format('ddd D MMM, HH:mm')}</span>
          <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5" />{event.total_items || 0} lots</span>
        </div>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-moss-700">
          {live ? 'Join auction' : 'View lots'} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.article>
  );
}
