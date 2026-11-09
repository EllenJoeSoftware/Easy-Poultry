import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Star, Calendar, Users, Award, Medal, ArrowRight } from 'lucide-react';
import moment from 'moment';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { createPageUrl } from '../utils';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400';
const score = (w) => Number(w.final_score || 0);

export default function WinnersHallOfFame() {
  const [season, setSeason] = useState('all');

  const { data: winners = [], isLoading } = useQuery({
    queryKey: ['competition-winners'],
    queryFn: () => api.entities.CompetitionWinner.list('-created_date')
  });

  const seasons = useMemo(() => [...new Set(winners.map(w => moment(w.created_date).format('YYYY')))].sort((a, b) => b.localeCompare(a)), [winners]);
  const filtered = useMemo(() => season === 'all' ? winners : winners.filter(w => moment(w.created_date).format('YYYY') === season), [winners, season]);
  const ranked = useMemo(() => [...filtered].sort((a, b) => score(b) - score(a)), [filtered]);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const totalVotes = filtered.reduce((s, w) => s + (w.vote_count || 0), 0);
  const breeders = new Set(filtered.map(w => w.owner_email || w.owner_name)).size;

  return (
    <PageShell
      eyebrow="Hall of Fame"
      title={<>Every <span className="italic text-moss-700">champion</span>, every season.</>}
      subtitle={`${winners.length} winning ${winners.length === 1 ? 'bird' : 'birds'} · ${breeders} ${breeders === 1 ? 'breeder' : 'breeders'} · ${totalVotes.toLocaleString()} community votes. The best birds across South Africa, as judged by you.`}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Competitions', href: createPageUrl('Competitions') }, { label: 'Hall of Fame' }]}
      action={
        <Link to={createPageUrl('Competitions')} className="btn-ghost px-5 py-2.5 text-sm gap-1.5 border border-border bg-white">
          <Trophy className="w-4 h-4 text-yolk-500" /> Open competitions
        </Link>
      }
    >
      {/* Season filter */}
      {seasons.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none mb-8 bg-white border border-border rounded-full p-1 w-fit max-w-full">
          {['all', ...seasons].map(s => {
            const on = season === s;
            return (
              <button key={s} onClick={() => setSeason(s)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${on ? 'bg-moss-600 text-cream' : 'text-ink/65 hover:bg-moss-50 hover:text-moss-700'}`}>
                {s === 'all' ? 'All seasons' : `Season ${s}`}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">{[...Array(3)].map((_, i) => <div key={i} className="card-premium h-80 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Trophy} title="No winners yet" subtitle={season === 'all' ? 'Winners will be displayed here after competitions end.' : `No competitions were decided in ${season}.`}
          action={<Link to={createPageUrl('Competitions')} className="btn-cta px-5 py-2.5 text-sm gap-1.5">Browse competitions <ArrowRight className="w-4 h-4" /></Link>} />
      ) : (
        <>
          {/* Podium */}
          <section className="mb-12">
            <p className="eyebrow mb-2">Top of the roost</p>
            <h2 className="font-display text-2xl text-ink mb-6">{season === 'all' ? 'All-time podium' : `${season} podium`}</h2>
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:items-end">
              {[podium[1], podium[0], podium[2]].map((w, i) => w && <PodiumCard key={w.id} winner={w} place={[2, 1, 3][i]} />)}
            </motion.div>
          </section>

          {/* Grid of remaining winners */}
          {rest.length > 0 && (
            <section>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="eyebrow mb-2">Champions</p>
                  <h2 className="font-display text-2xl text-ink">All winners</h2>
                </div>
                <span className="text-sm text-ink/55">{rest.length} more</span>
              </div>
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((w, i) => <WinnerCard key={w.id} winner={w} rank={i + 4} />)}
              </motion.div>
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}

function PodiumCard({ winner, place }) {
  const style = {
    1: { ring: 'ring-2 ring-yolk-400', badge: 'bg-yolk-500 text-white', label: 'Champion', height: 'sm:-mt-6', aspect: 'aspect-[4/5]' },
    2: { ring: '', badge: 'bg-ink/70 text-cream', label: 'Runner-up', height: '', aspect: 'aspect-square' },
    3: { ring: '', badge: 'bg-terracotta-500 text-white', label: 'Third place', height: '', aspect: 'aspect-square' },
  }[place];

  return (
    <motion.article variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
      className={`group card-premium overflow-hidden relative flex flex-col ${style.ring} ${style.height} ${place === 1 ? 'sm:order-none' : ''}`}>
      <div className={`${style.aspect} relative overflow-hidden bg-cream-deep`}>
        <img src={winner.image_url || FALLBACK_IMG} alt={winner.chicken_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`w-10 h-10 rounded-full ${style.badge} font-display font-bold text-lg flex items-center justify-center shadow-lift`}>{place}</span>
          <span className="chip bg-white/95 text-ink border-0">{place === 1 ? <Trophy className="w-3 h-3 text-yolk-500" /> : <Medal className="w-3 h-3" />}{style.label}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-cream">
          <p className="text-[11px] uppercase tracking-wider text-yolk-300 font-semibold truncate">{winner.competition_name}</p>
          <h3 className={`font-display font-bold leading-tight ${place === 1 ? 'text-2xl' : 'text-xl'}`}>{winner.chicken_name}</h3>
          <p className="text-sm text-cream/80">by {winner.owner_name}</p>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-cream p-3">
          <p className="text-[11px] uppercase tracking-wider text-ink/50">Final score</p>
          <p className="font-display font-bold text-xl text-moss-700 inline-flex items-center gap-1"><Star className="w-4 h-4 text-yolk-500 fill-yolk-500" />{winner.final_score?.toFixed(1) || '0.0'}</p>
        </div>
        <div className="rounded-xl bg-cream p-3">
          <p className="text-[11px] uppercase tracking-wider text-ink/50">Votes</p>
          <p className="font-display font-bold text-xl text-ink">{winner.vote_count || 0}</p>
        </div>
        <p className="col-span-2 text-xs text-ink/50 inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Won {moment(winner.created_date).format('D MMMM YYYY')}</p>
      </div>
    </motion.article>
  );
}

function WinnerCard({ winner, rank }) {
  return (
    <motion.article variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="group card-premium overflow-hidden flex flex-col">
      <div className="aspect-[16/10] relative overflow-hidden bg-cream-deep">
        <img src={winner.image_url || FALLBACK_IMG} alt={winner.chicken_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/95 text-ink font-display font-bold text-sm flex items-center justify-center shadow-soft">{rank}</span>
        <span className="absolute top-3 right-3 chip chip-yolk"><Award className="w-3 h-3" />Winner</span>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-[11px] uppercase tracking-wider text-moss-700 font-semibold truncate">{winner.competition_name}</p>
        <h3 className="font-display text-lg text-ink leading-snug mt-1">{winner.chicken_name}</h3>
        <p className="text-sm text-ink/60 mt-0.5 inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{winner.owner_name}</p>
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-ink"><Star className="w-4 h-4 text-yolk-500 fill-yolk-500" />{winner.final_score?.toFixed(1) || '0.0'} <span className="text-ink/50 font-normal">· {winner.vote_count || 0} votes</span></span>
          <span className="text-xs text-ink/50">{moment(winner.created_date).format('MMM YYYY')}</span>
        </div>
      </div>
    </motion.article>
  );
}
