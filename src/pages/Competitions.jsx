import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import moment from 'moment';

export default function Competitions() {
  const [user, setUser] = useState(null);

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

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => api.entities.Competition.list('-created_date')
  });

  const activeCompetitions = competitions.filter(c => {
    const now = new Date();
    const start = new Date(c.start_date);
    const end = new Date(c.end_date);
    return now >= start && now <= end;
  });

  const upcomingCompetitions = competitions.filter(c => {
    const now = new Date();
    const start = new Date(c.start_date);
    return now < start;
  });

  const pastCompetitions = competitions.filter(c => {
    const now = new Date();
    const end = new Date(c.end_date);
    return now > end;
  });

  const CompetitionCard = ({ competition }) => {
    const now = new Date();
    const start = new Date(competition.start_date);
    const end = new Date(competition.end_date);
    const isActive = now >= start && now <= end;
    const isUpcoming = now < start;
    const isPast = now > end;

    return (
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
        <div className={`p-6 ${isActive ? 'bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A]' : isPast ? 'bg-gray-100' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white`}>
          <div className="flex items-start justify-between mb-2">
            <Trophy className="w-8 h-8" />
            <Badge className={`${isActive ? 'bg-yellow-500' : isPast ? 'bg-gray-500' : 'bg-blue-500'} text-white`}>
              {isActive ? 'Active' : isPast ? 'Ended' : 'Upcoming'}
            </Badge>
          </div>
          <h3 className="text-xl font-bold mb-2">{competition.name}</h3>
          <p className="text-white/90 text-sm">{competition.description}</p>
        </div>
        <div className="p-6 bg-white">
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{moment(competition.start_date).format('MMM D, YYYY')} - {moment(competition.end_date).format('MMM D, YYYY')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{competition.total_entries || 0} entries</span>
            </div>
          </div>
          <Link to={createPageUrl('CompetitionDetail') + `?id=${competition.id}`}>
            <Button className="w-full bg-[#7A9D7A] hover:bg-[#6A8D6A]">
              View Competition
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Poultry Competitions</h1>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            Showcase your best chickens, compete with fellow breeders, and win recognition in our community competitions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="active">Active ({activeCompetitions.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingCompetitions.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastCompetitions.length})</TabsTrigger>
            <TabsTrigger value="winners">
              <Trophy className="w-4 h-4 mr-2" />
              Hall of Fame
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeCompetitions.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Competitions</h3>
                <p className="text-gray-600">Check back soon for new competitions!</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCompetitions.map(comp => <CompetitionCard key={comp.id} competition={comp} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingCompetitions.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Competitions</h3>
                <p className="text-gray-600">New competitions will be announced soon!</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingCompetitions.map(comp => <CompetitionCard key={comp.id} competition={comp} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastCompetitions.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Past Competitions</h3>
                <p className="text-gray-600">Past competition results will appear here</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastCompetitions.map(comp => <CompetitionCard key={comp.id} competition={comp} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="winners">
            <Link to={createPageUrl('WinnersHallOfFame')}>
              <Card className="p-12 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <Trophy className="w-16 h-16 text-[#7A9D7A] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">View Winners Hall of Fame</h3>
                <p className="text-gray-600">See all past competition winners</p>
                <Button className="mt-4 bg-[#7A9D7A] hover:bg-[#6A8D6A]">
                  View Winners
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            </Link>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}