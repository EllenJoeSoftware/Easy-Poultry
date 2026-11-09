import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Users, Star, ArrowLeft, Plus, Loader2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import moment from 'moment';
import { toast } from 'sonner';

export default function CompetitionDetail() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const competitionId = urlParams.get('id');
  const queryClient = useQueryClient();

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

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: async () => {
      const comps = await api.entities.Competition.filter({ id: competitionId });
      return comps[0] || null;
    },
    enabled: !!competitionId
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['competition-entries', competitionId],
    queryFn: () => api.entities.CompetitionEntry.filter({ competition_id: competitionId }, '-average_rating'),
    enabled: !!competitionId
  });

  const { data: myRatings = [] } = useQuery({
    queryKey: ['my-ratings', competitionId, user?.email],
    queryFn: () => api.entities.CompetitionRating.filter({ competition_id: competitionId, voter_email: user.email }),
    enabled: !!competitionId && !!user
  });

  const rateEntryMutation = useMutation({
    mutationFn: async ({ entryId, rating }) => {
      await api.entities.CompetitionRating.create({
        competition_id: competitionId,
        entry_id: entryId,
        rating: rating,
        voter_email: user.email
      });

      const entry = entries.find(e => e.id === entryId);
      const newTotal = (entry.total_score || 0) + rating;
      const newCount = (entry.vote_count || 0) + 1;
      const newAverage = newTotal / newCount;

      await api.entities.CompetitionEntry.update(entryId, {
        total_score: newTotal,
        vote_count: newCount,
        average_rating: newAverage
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['competition-entries']);
      queryClient.invalidateQueries(['my-ratings']);
      toast.success('Rating submitted!');
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId) => {
      await api.entities.CompetitionEntry.delete(entryId);
      await api.entities.Competition.update(competitionId, {
        total_entries: Math.max(0, (competition.total_entries || 0) - 1)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['competition-entries']);
      queryClient.invalidateQueries(['competition']);
      toast.success('Entry deleted');
    }
  });

  if (isLoading || !competition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-moss-600" />
      </div>
    );
  }

  const now = new Date();
  const start = new Date(competition.start_date);
  const end = new Date(competition.end_date);
  const isActive = now >= start && now <= end;
  const isUpcoming = now < start;
  const isPast = now > end;
  const canEnter = isActive && user;
  const hasEntered = entries.some(e => e.created_by === user?.email);

  const EntryCard = ({ entry }) => {
    const userRating = myRatings.find(r => r.entry_id === entry.id);
    const [selectedRating, setSelectedRating] = useState(userRating?.rating || 0);

    if (entry.disqualified) {
      return (
        <Card className="overflow-hidden card-premium relative">
          <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-4 text-center max-w-xs">
              <Badge variant="destructive" className="mb-2">Disqualified</Badge>
              <p className="text-sm text-ink/65">{entry.disqualification_reason || 'This entry has been disqualified'}</p>
            </div>
          </div>
          <div className="aspect-square overflow-hidden bg-cream-deep opacity-50">
            <img
              src={entry.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'}
              alt={entry.chicken_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 opacity-50">
            <h3 className="font-bold text-lg text-ink mb-1">{entry.chicken_name}</h3>
            <p className="text-sm text-ink/65">{entry.breed}</p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="overflow-hidden card-premium">
        <div className="aspect-square overflow-hidden bg-cream-deep">
          <img
            src={entry.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'}
            alt={entry.chicken_name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg text-ink mb-1">{entry.chicken_name}</h3>
          <p className="text-sm text-ink/65 mb-2">{entry.breed}</p>
          <p className="text-sm text-ink/65 mb-3 line-clamp-2">{entry.description}</p>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yolk-500 fill-yolk-500" />
              <span className="font-bold text-ink">{entry.average_rating?.toFixed(1) || '0.0'}</span>
            </div>
            <span className="text-sm text-ink/65">({entry.vote_count || 0} votes)</span>
          </div>

          <p className="text-xs text-ink/55 mb-3">
            by <Link to={createPageUrl('SellerListings') + `?email=${entry.owner_email}`} className="text-moss-600 hover:underline font-medium">{entry.owner_name}</Link>
          </p>

          {isActive && user && !userRating && entry.created_by !== user.email && entry.owner_email !== user.email && !entry.disqualified && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {Array.from({ length: competition.max_rating }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedRating(i + 1)}
                    className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${
                      selectedRating >= i + 1
                        ? 'bg-moss-600 text-white'
                        : 'bg-cream-deep text-ink/65 hover:bg-cream-deep'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => rateEntryMutation.mutate({ entryId: entry.id, rating: selectedRating })}
                disabled={selectedRating === 0 || rateEntryMutation.isPending}
                className="w-full btn-cta"
                size="sm"
              >
                Submit Rating
              </Button>
            </div>
          )}

          {userRating && (
            <Badge className="bg-fresh-500 w-full justify-center">
              You rated: {userRating.rating}/{competition.max_rating}
            </Badge>
          )}

          {user && (entry.created_by === user.email || entry.owner_email === user.email) && (
            <div className="flex gap-2 mt-2">
              <Link to={createPageUrl('SubmitEntry') + `?competition=${competitionId}&edit=${entry.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  {(entry.vote_count || 0) > 0 ? 'Add Photos' : 'Edit'}
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this entry?')) {
                    deleteEntryMutation.mutate(entry.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-[80vh] bg-cream">
      <div className="bg-moss-gradient text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('Competitions')} className="inline-flex items-center text-white/90 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Competitions
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-10 h-10" />
                <h1 className="text-3xl font-bold">{competition.name}</h1>
              </div>
              <p className="text-white/90 mb-4">{competition.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{moment(competition.start_date).format('MMM D')} - {moment(competition.end_date).format('MMM D, YYYY')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{entries.length} entries</span>
                </div>
              </div>
            </div>
            <Badge className={`${isActive ? 'bg-yolk-500' : isPast ? 'bg-cream0' : 'bg-moss-500'} text-white text-lg px-4 py-2`}>
              {isActive ? 'Active' : isPast ? 'Ended' : 'Upcoming'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isActive && user && !hasEntered && (
          <Card className="p-6 mb-8 border border-moss-200 bg-moss-50/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink mb-2">Enter This Competition!</h3>
                <p className="text-ink/65">Showcase your best chicken and compete for the top spot.</p>
              </div>
              <Link to={createPageUrl('SubmitEntry') + `?competition=${competitionId}`}>
                <Button className="btn-cta">
                  <Plus className="w-5 h-5 mr-2" />
                  Submit Entry
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {hasEntered && isActive && (
          <Card className="p-6 mb-8 bg-fresh-50 border-fresh-200">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-moss-700" />
              <div>
                <h3 className="font-bold text-green-900">You've entered this competition!</h3>
                <p className="text-sm text-moss-700">Good luck! Voting is now open.</p>
              </div>
            </div>
          </Card>
        )}

        {isUpcoming && (
          <Card className="p-6 mb-8 bg-moss-50 border-moss-200">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-moss-700" />
              <div>
                <h3 className="font-bold text-blue-900">This competition hasn't started yet</h3>
                <p className="text-sm text-moss-700">Come back on {moment(competition.start_date).format('MMMM D, YYYY')} to participate!</p>
              </div>
            </div>
          </Card>
        )}

        {entries.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="w-16 h-16 text-ink/25 mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-ink mb-2">No Entries Yet</h3>
            <p className="text-ink/65">Be the first to enter this competition!</p>
          </Card>
        ) : (
          <div>
            <h2 className="font-display text-2xl font-bold text-ink mb-6">Entries ({entries.length})</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {entries.map(entry => <EntryCard key={entry.id} entry={entry} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}