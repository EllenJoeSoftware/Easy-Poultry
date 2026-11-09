import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Star, ArrowRight, Users, Calendar } from 'lucide-react';
import moment from 'moment';
import confetti from 'canvas-confetti';
import { api } from '@/api/client';
import { createPageUrl } from '../../utils';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600';

export default function WinnerBanner() {
  const { data: activeWinners = [] } = useQuery({
    queryKey: ['active-competition-winners'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const all = await api.entities.CompetitionWinner.list('-created_date');
      return all.filter(w => w.display_until && new Date(w.display_until) > new Date());
    }
  });

  const { data: activeCompetitions = [] } = useQuery({
    queryKey: ['active-competitions-banner'],
    queryFn: async () => {
      const now = new Date();
      const all = await api.entities.Competition.list('-created_date');
      return all.filter(c => {
        const start = new Date(c.start_date);
        const end = new Date(c.end_date);
        return now >= start && now <= end && c.banner_image_url;
      });
    }
  });

  const winner = activeWinners[0];
  const competition = activeCompetitions[0];

  // Trigger fireworks effect for winner
  useEffect(() => {
    if (!winner) return;

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, [winner?.id]);

  // Show winner if available, otherwise show active competition banner
  if (activeWinners.length === 0 && activeCompetitions.length === 0) return null;

  // Winner takes priority
  if (winner) {
    return (
      <section className="relative bg-amber-gradient py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 grain opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.3, 1] }}
            className="card-premium overflow-hidden grid md:grid-cols-2">
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[320px] bg-cream-deep">
              <img src={winner.image_url || FALLBACK_IMG} alt={winner.chicken_name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yolk-500 text-white text-xs font-semibold uppercase tracking-wider shadow-lift">
                <Trophy className="w-4 h-4" /> Competition winner
              </div>
            </div>
            <div className="p-7 lg:p-10 flex flex-col justify-center">
              <p className="eyebrow text-yolk-600 mb-3 inline-flex items-center gap-2"><Star className="w-4 h-4 fill-yolk-500 text-yolk-500" />{winner.competition_name}</p>
              <h2 className="font-display text-3xl lg:text-4xl text-ink leading-tight">{winner.chicken_name}</h2>
              <p className="text-lg text-ink/65 mt-1">by {winner.owner_name}</p>

              <div className="grid grid-cols-2 gap-3 mt-6 max-w-sm">
                <div className="rounded-xl bg-cream p-4">
                  <p className="text-[11px] uppercase tracking-wider text-ink/50">Final score</p>
                  <p className="font-display font-bold text-3xl text-moss-700">{winner.final_score?.toFixed(1) || '0.0'}</p>
                </div>
                <div className="rounded-xl bg-cream p-4">
                  <p className="text-[11px] uppercase tracking-wider text-ink/50">Total votes</p>
                  <p className="font-display font-bold text-3xl text-ink">{winner.vote_count || 0}</p>
                </div>
              </div>

              <div className="mt-7">
                <Link to={createPageUrl('WinnersHallOfFame')} className="btn-cta px-6 py-3 text-sm gap-2 inline-flex">
                  View all winners <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // Show active competition banner
  return (
    <section className="relative bg-moss-gradient py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 grain opacity-50 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <div className="card-premium overflow-hidden grid md:grid-cols-2">
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[320px] bg-cream-deep">
            <img src={competition.banner_image_url} alt={competition.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fresh-500 text-white text-xs font-semibold uppercase tracking-wider shadow-lift">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Open competition
            </div>
          </div>
          <div className="p-7 lg:p-10 flex flex-col justify-center">
            <p className="eyebrow mb-3 inline-flex items-center gap-2"><Trophy className="w-4 h-4 text-moss-600" />Compete now</p>
            <h2 className="font-display text-3xl lg:text-4xl text-ink leading-tight">{competition.name}</h2>
            {competition.description && <p className="text-lg text-ink/65 mt-2 line-clamp-3">{competition.description}</p>}

            <div className="grid grid-cols-2 gap-3 mt-6 max-w-sm">
              <div className="rounded-xl bg-cream p-4">
                <p className="text-[11px] uppercase tracking-wider text-ink/50 inline-flex items-center gap-1"><Users className="w-3 h-3" />Entries</p>
                <p className="font-display font-bold text-3xl text-moss-700">{competition.total_entries || 0}</p>
              </div>
              <div className="rounded-xl bg-cream p-4">
                <p className="text-[11px] uppercase tracking-wider text-ink/50 inline-flex items-center gap-1"><Calendar className="w-3 h-3" />Ends</p>
                <p className="font-display font-bold text-lg text-ink leading-tight mt-1">{moment(competition.end_date).format('D MMM YYYY')}</p>
              </div>
            </div>

            <div className="mt-7">
              <Link to={createPageUrl('CompetitionDetail') + `?id=${competition.id}`} className="btn-cta px-6 py-3 text-sm gap-2 inline-flex">
                Enter competition <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
