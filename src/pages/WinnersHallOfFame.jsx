import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Trophy, Star, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import moment from 'moment';

export default function WinnersHallOfFame() {
  const { data: winners = [], isLoading } = useQuery({
    queryKey: ['competition-winners'],
    queryFn: () => api.entities.CompetitionWinner.list('-created_date')
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('Competitions')} className="inline-flex items-center text-white/90 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Competitions
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <Trophy className="w-16 h-16" />
            <h1 className="text-4xl font-bold">Winners Hall of Fame</h1>
          </div>
          <p className="text-white/90 text-lg">Celebrating our competition champions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {winners.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Winners Yet</h3>
            <p className="text-gray-600">Winners will be displayed here after competitions end</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {winners.map((winner, index) => (
              <Card key={winner.id} className="overflow-hidden border-0 shadow-xl">
                <div className="md:flex">
                  <div className="md:w-1/3 bg-gray-100 relative">
                    {index === 0 && (
                      <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Star className="w-4 h-4 fill-white" />
                        Latest Winner
                      </div>
                    )}
                    <img
                      src={winner.image_url || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'}
                      alt={winner.chicken_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="md:w-2/3 p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{winner.chicken_name}</h2>
                        <p className="text-xl text-[#7A9D7A] font-semibold mb-2">{winner.competition_name}</p>
                        <p className="text-gray-600">Owned by {winner.owner_name}</p>
                      </div>
                      <Trophy className="w-12 h-12 text-yellow-500 fill-yellow-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Final Score</p>
                        <p className="text-2xl font-bold text-[#7A9D7A]">{winner.final_score?.toFixed(1) || '0.0'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Votes</p>
                        <p className="text-2xl font-bold text-gray-900">{winner.vote_count || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Won on {moment(winner.created_date).format('MMMM D, YYYY')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}