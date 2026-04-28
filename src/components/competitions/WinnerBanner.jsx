import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import moment from 'moment';
import confetti from 'canvas-confetti';

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
    <div className="relative bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <Card className="overflow-hidden border-0 shadow-2xl bg-white animate-in zoom-in duration-700">
          <div className="md:flex">
            <div className="md:w-1/2 relative">
              <div className="absolute top-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg animate-bounce">
                <Trophy className="w-5 h-5 fill-white" />
                COMPETITION WINNER 🎉
              </div>
              <img
                src={winner.image_url || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600'}
                alt={winner.chicken_name}
                className="w-full h-full object-cover min-h-[300px]"
              />
            </div>
            <div className="md:w-1/2 p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">
                  {winner.competition_name}
                </span>
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                {winner.chicken_name}
              </h2>
              
              <p className="text-xl text-gray-600 mb-6">
                by {winner.owner_name}
              </p>

              <div className="flex items-center gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Final Score</p>
                  <p className="text-3xl font-bold text-[#7A9D7A]">
                    {winner.final_score?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Votes</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {winner.vote_count || 0}
                  </p>
                </div>
              </div>

              <Link to={createPageUrl('WinnersHallOfFame')}>
                <Button className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] hover:from-[#6A8D6A] hover:to-[#5A7D5A] text-white">
                  View All Winners
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
  }

  // Show active competition banner
  return (
    <div className="bg-gradient-to-r from-[#7A9D7A] via-[#6A8D6A] to-[#5A7D5A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Card className="overflow-hidden border-0 shadow-2xl bg-white">
          <div className="md:flex">
            <div className="md:w-1/2 relative">
              <div className="absolute top-4 left-4 bg-[#7A9D7A] text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                <Trophy className="w-5 h-5 fill-white" />
                ACTIVE COMPETITION
              </div>
              <img
                src={competition.banner_image_url}
                alt={competition.name}
                className="w-full h-full object-cover min-h-[300px]"
              />
            </div>
            <div className="md:w-1/2 p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-6 h-6 text-[#7A9D7A] fill-[#7A9D7A]" />
                <span className="text-sm font-semibold text-[#7A9D7A] uppercase tracking-wide">
                  COMPETE NOW
                </span>
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                {competition.name}
              </h2>
              
              <p className="text-xl text-gray-600 mb-6">
                {competition.description}
              </p>

              <div className="flex items-center gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Current Entries</p>
                  <p className="text-3xl font-bold text-[#7A9D7A]">
                    {competition.total_entries || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ends</p>
                  <p className="text-lg font-bold text-gray-900">
                    {moment(competition.end_date).format('MMM D, YYYY')}
                  </p>
                </div>
              </div>

              <Link to={createPageUrl('CompetitionDetail') + `?id=${competition.id}`}>
                <Button className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] hover:from-[#6A8D6A] hover:to-[#5A7D5A] text-white">
                  Enter Competition
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}