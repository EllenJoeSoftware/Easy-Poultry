import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, ArrowRight, Award, Clock, Star } from 'lucide-react';
import moment from 'moment';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '../utils';

const statusOf = (c) => {
  const now = Date.now(), s = new Date(c.start_date).getTime(), e = new Date(c.end_date).getTime();
  if (now < s) return 'upcoming';
  if (now > e) return 'ended';
  return 'active';
};

export default function Competitions() {
  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => api.entities.Competition.list('-created_date'),
  });

  const active = competitions.filter(c => statusOf(c) === 'active');
  const upcoming = competitions.filter(c => statusOf(c) === 'upcoming').sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  const past = competitions.filter(c => statusOf(c) === 'ended');
  const totalEntries = competitions.reduce((s, c) => s + (c.total_entries || 0), 0);

  const Grid = ({ items, empty }) => isLoading ? (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(3)].map((_, i) => <div key={i} className="card-premium h-72 animate-pulse" />)}</div>
  ) : items.length === 0 ? empty : (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(c => <CompetitionCard key={c.id} c={c} />)}
    </motion.div>
  );

  return (
    <PageShell
      eyebrow="Competitions"
      title={<>Show your <span className="italic text-moss-700">best birds</span>.</>}
      subtitle={`${active.length} open now · ${upcoming.length} upcoming · ${totalEntries.toLocaleString()} entries to date. Compete with breeders across South Africa and earn a place in the Hall of Fame.`}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Competitions' }]}
      action={
        <Link to={createPageUrl('WinnersHallOfFame')} className="btn-ghost px-5 py-2.5 text-sm gap-1.5 border border-border bg-white">
          <Trophy className="w-4 h-4 text-yolk-500" /> Hall of Fame
        </Link>
      }
    >
      <Tabs defaultValue={active.length ? 'active' : upcoming.length ? 'upcoming' : 'past'} className="space-y-6">
        <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex flex-wrap">
          <TabsTrigger value="active"   className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Open ({active.length})</TabsTrigger>
          <TabsTrigger value="upcoming" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past"     className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Grid items={active} empty={<EmptyState icon={Trophy} title="No competitions open right now" subtitle="New shows are announced regularly. Check the Upcoming tab or follow us for announcements." />} />
        </TabsContent>
        <TabsContent value="upcoming">
          <Grid items={upcoming} empty={<EmptyState icon={Calendar} title="Nothing scheduled yet" subtitle="Upcoming competitions will be listed here with their entry dates." />} />
        </TabsContent>
        <TabsContent value="past">
          <Grid items={past} empty={<EmptyState icon={Award} title="No past competitions" subtitle="Results and rankings will appear here after each event closes." />} />
        </TabsContent>
      </Tabs>

      {/* Hall of fame promo */}
      <section className="mt-14 card-premium p-8 lg:p-10 bg-moss-gradient text-cream relative overflow-hidden">
        <div className="absolute inset-0 grain opacity-50 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-yolk-300 mb-2">Winners Hall of Fame</p>
            <h2 className="font-display text-3xl font-bold leading-tight">Every champion bird, every season.</h2>
            <p className="text-cream/75 mt-2 max-w-xl">Browse past winners, scores and the breeders behind them.</p>
          </div>
          <Link to={createPageUrl('WinnersHallOfFame')} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cream text-moss-800 font-medium hover:bg-yolk-100 transition-colors flex-shrink-0">
            <Trophy className="w-4 h-4" /> View winners <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function CompetitionCard({ c }) {
  const status = statusOf(c);
  const daysLeft = Math.max(0, moment(status === 'upcoming' ? c.start_date : c.end_date).diff(moment(), 'days'));
  const badge = {
    active:   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fresh-500 text-white text-[11px] font-semibold uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />Open</span>,
    upcoming: <span className="chip chip-yolk"><Clock className="w-3 h-3" />Upcoming</span>,
    ended:    <span className="chip bg-ink/70 text-cream border-0">Ended</span>,
  }[status];

  return (
    <motion.article variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="group card-premium overflow-hidden relative flex flex-col">
      <Link to={createPageUrl('CompetitionDetail') + `?id=${c.id}`} className="absolute inset-0 z-10" aria-label={c.name} />
      <div className="aspect-[16/9] relative overflow-hidden bg-moss-gradient">
        {c.banner_image_url
          ? <img src={c.banner_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="absolute inset-0 grain opacity-50 flex items-center justify-center"><Trophy className="w-12 h-12 text-cream/30" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 z-20">{badge}</div>
        {status !== 'ended' && (
          <div className="absolute bottom-3 left-3 z-20 text-cream">
            <span className="text-[11px] uppercase tracking-wider opacity-80">{status === 'upcoming' ? 'Entries open in' : 'Closes in'}</span>
            <p className="font-display font-bold text-xl leading-none">{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</p>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-display text-lg text-ink leading-snug line-clamp-2 group-hover:text-moss-700 transition-colors">{c.name}</h3>
        {c.description && <p className="text-sm text-ink/60 mt-1.5 line-clamp-2">{c.description}</p>}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-ink/55">
          <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{moment(c.start_date).format('D MMM')} – {moment(c.end_date).format('D MMM YYYY')}</span>
          <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.total_entries || 0}</span>
        </div>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-moss-700">
          {status === 'active' ? 'Enter now' : status === 'upcoming' ? 'View details' : 'See results'} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.article>
  );
}
