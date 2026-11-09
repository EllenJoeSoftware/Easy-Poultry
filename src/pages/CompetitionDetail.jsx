import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, Star, Plus, Loader2, Trash2, Clock, Edit, ShieldAlert, Gavel, Gift, ScrollText, Camera, ArrowRight, CheckCircle } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createPageUrl } from '../utils';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400';

export default function CompetitionDetail() {
  const [user, setUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const onError = (e) => toast.error(e?.message || 'Something went wrong');

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
    },
    onError,
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
      setDeleteTarget(null);
      toast.success('Entry deleted');
    },
    onError,
  });

  if (isLoading || !competition) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
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
  const status = isActive ? 'active' : isUpcoming ? 'upcoming' : 'ended';
  const daysLeft = Math.max(0, moment(isUpcoming ? competition.start_date : competition.end_date).diff(moment(), 'days'));
  const liveEntries = entries.filter(e => !e.disqualified);
  const totalVotes = entries.reduce((s, e) => s + (e.vote_count || 0), 0);
  const leader = liveEntries[0];

  const statusChip = {
    active:   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fresh-500 text-white text-[11px] font-semibold uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />Open for entries</span>,
    upcoming: <span className="chip chip-yolk"><Clock className="w-3 h-3" />Upcoming</span>,
    ended:    <span className="chip bg-ink/70 text-cream border-0">Ended</span>,
  }[status];

  return (
    <PageShell
      eyebrow="Competitions"
      title={competition.name}
      subtitle={competition.description}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Competitions', href: createPageUrl('Competitions') }, { label: competition.name }]}
      action={
        <div className="flex flex-col items-start md:items-end gap-2">
          {statusChip}
          {!isPast && (
            <p className="text-sm text-ink/60">
              {isUpcoming ? 'Entries open in' : 'Closes in'} <span className="font-display font-bold text-ink text-lg">{daysLeft}</span> {daysLeft === 1 ? 'day' : 'days'}
            </p>
          )}
        </div>
      }
    >
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-moss-gradient text-cream mb-8 aspect-[21/9] sm:aspect-[3/1]">
        {competition.banner_image_url
          ? <img src={competition.banner_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 grain opacity-50 flex items-center justify-center"><Trophy className="w-16 h-16 text-cream/30" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4 text-yolk-300" />{moment(competition.start_date).format('D MMM')} – {moment(competition.end_date).format('D MMM YYYY')}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4 text-yolk-300" />{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
            <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 text-yolk-300" />{totalVotes} votes cast</span>
          </div>
          {leader && (isPast || totalVotes > 0) && (
            <div className="hidden sm:block text-right">
              <p className="text-[11px] uppercase tracking-wider text-cream/70">{isPast ? 'Winner' : 'Current leader'}</p>
              <p className="font-display font-bold text-lg leading-tight">{leader.chicken_name}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Main column */}
        <div className="min-w-0 space-y-8">
          {/* Info sections */}
          <div className="grid sm:grid-cols-2 gap-5">
            <section className="card-premium p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-moss-50 text-moss-700 flex items-center justify-center"><ScrollText className="w-4 h-4" /></div>
                <h3 className="font-display text-lg text-ink">Rules</h3>
              </div>
              {competition.rules ? (
                <p className="text-sm text-ink/70 whitespace-pre-line leading-relaxed">{competition.rules}</p>
              ) : (
                <ul className="text-sm text-ink/70 space-y-2">
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />One entry per breeder, up to 5 photos of your bird.</li>
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />Community voting runs from {moment(competition.start_date).format('D MMM')} to {moment(competition.end_date).format('D MMM YYYY')}.</li>
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />Each voter scores an entry once, from {competition.min_rating || 1} to {competition.max_rating}. You cannot vote on your own bird.</li>
                  <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />Ranked by {competition.scoring_method === 'total' ? 'total score' : 'average rating'}. Entries that break the rules are disqualified.</li>
                </ul>
              )}
            </section>
            <section className="card-premium p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-yolk-50 text-yolk-600 flex items-center justify-center"><Gift className="w-4 h-4" /></div>
                <h3 className="font-display text-lg text-ink">Prizes</h3>
              </div>
              {competition.prizes ? (
                <p className="text-sm text-ink/70 whitespace-pre-line leading-relaxed">{competition.prizes}</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-cream p-3">
                    <Trophy className="w-6 h-6 text-yolk-500" />
                    <div><p className="font-medium text-ink text-sm">Hall of Fame placement</p><p className="text-xs text-ink/55">The winning bird is featured on the homepage and in the Hall of Fame.</p></div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-cream p-3">
                    <Gavel className="w-6 h-6 text-moss-600" />
                    <div><p className="font-medium text-ink text-sm">Breeder recognition</p><p className="text-xs text-ink/55">Your profile and listings are linked from the winner spotlight.</p></div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Status banners */}
          {hasEntered && isActive && (
            <div className="rounded-2xl bg-fresh-50 border border-fresh-200 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-moss-700 flex items-center justify-center flex-shrink-0"><Trophy className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-moss-800">You've entered this competition!</h3>
                <p className="text-sm text-moss-700">Good luck! Voting is now open.</p>
              </div>
            </div>
          )}
          {isUpcoming && (
            <div className="rounded-2xl bg-yolk-50 border border-yolk-200 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-yolk-600 flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-ink">This competition hasn't started yet</h3>
                <p className="text-sm text-ink/65">Come back on {moment(competition.start_date).format('MMMM D, YYYY')} to participate!</p>
              </div>
            </div>
          )}

          {/* Entries */}
          <section>
            <div className="flex items-end justify-between mb-5 gap-4">
              <div>
                <p className="eyebrow mb-1">{isPast ? 'Final standings' : 'Entries'}</p>
                <h2 className="font-display text-2xl text-ink">{entries.length} {entries.length === 1 ? 'bird' : 'birds'} entered</h2>
              </div>
              {isPast && <Link to={createPageUrl('WinnersHallOfFame')} className="text-sm text-moss-700 inline-flex items-center gap-1 link-underline">Hall of Fame <ArrowRight className="w-4 h-4" /></Link>}
            </div>
            {entries.length === 0 ? (
              <EmptyState icon={Trophy} title="No entries yet" subtitle={isActive ? 'Be the first to enter this competition!' : isUpcoming ? 'Entries will appear here once the competition opens.' : 'This competition closed without any entries.'}
                action={canEnter && !hasEntered && <Link to={createPageUrl('SubmitEntry') + `?competition=${competitionId}`}><Button className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Submit entry</Button></Link>} />
            ) : (
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {entries.map((entry, i) => (
                  <EntryCard key={entry.id} entry={entry} rank={i} competition={competition} competitionId={competitionId} user={user} isActive={isActive} isPast={isPast}
                    userRating={myRatings.find(r => r.entry_id === entry.id)}
                    onRate={(rating) => rateEntryMutation.mutate({ entryId: entry.id, rating })}
                    rating={rateEntryMutation.isPending}
                    onDelete={() => setDeleteTarget(entry)} />
                ))}
              </motion.div>
            )}
          </section>
        </div>

        {/* Sticky rail */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="card-premium p-6">
            <p className="eyebrow mb-2">{isActive ? 'Entries close' : isUpcoming ? 'Entries open' : 'Closed on'}</p>
            <p className="font-display text-2xl text-ink leading-tight">{moment(isUpcoming ? competition.start_date : competition.end_date).format('D MMMM YYYY')}</p>
            {!isPast && <p className="text-sm text-ink/55 mt-1">{daysLeft} {daysLeft === 1 ? 'day' : 'days'} to go</p>}

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl bg-cream p-3"><p className="text-[11px] uppercase tracking-wider text-ink/50">Entries</p><p className="font-display font-bold text-xl text-ink">{entries.length}</p></div>
              <div className="rounded-xl bg-cream p-3"><p className="text-[11px] uppercase tracking-wider text-ink/50">Votes</p><p className="font-display font-bold text-xl text-ink">{totalVotes}</p></div>
            </div>

            <div className="mt-5">
              {canEnter && !hasEntered ? (
                <Link to={createPageUrl('SubmitEntry') + `?competition=${competitionId}`} className="block">
                  <Button className="btn-cta w-full py-3 gap-1.5"><Plus className="w-4 h-4" /> Enter this competition</Button>
                </Link>
              ) : hasEntered && isActive ? (
                <div className="rounded-xl bg-fresh-50 border border-fresh-200 px-4 py-3 text-sm text-moss-800 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-moss-600" /> You're in. Good luck!</div>
              ) : isActive && !user ? (
                <Button onClick={() => api.auth.redirectToLogin(window.location.href)} className="btn-cta w-full py-3">Sign in to enter</Button>
              ) : isUpcoming ? (
                <div className="rounded-xl bg-yolk-50 border border-yolk-200 px-4 py-3 text-sm text-ink/70 flex items-center gap-2"><Clock className="w-4 h-4 text-yolk-600" /> Opens {moment(competition.start_date).fromNow()}</div>
              ) : (
                <Link to={createPageUrl('WinnersHallOfFame')} className="block">
                  <Button className="btn-ghost w-full py-3 border border-border bg-white gap-1.5"><Trophy className="w-4 h-4 text-yolk-500" /> See the Hall of Fame</Button>
                </Link>
              )}
            </div>
            <p className="text-xs text-ink/50 mt-3 text-center">Scored by {competition.scoring_method === 'total' ? 'total points' : 'average rating'} · 1–{competition.max_rating} scale</p>
          </div>

          <div className="card-premium p-5 bg-moss-gradient text-cream relative overflow-hidden">
            <div className="absolute inset-0 grain opacity-50 pointer-events-none" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-yolk-300 mb-1">Tip</p>
              <p className="text-sm text-cream/85">Clear, well-lit photos from the side and front score best. Show off plumage, posture and comb.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-display">Delete entry?</DialogTitle></DialogHeader>
          <p className="text-ink/70"><strong>{deleteTarget?.chicken_name}</strong> will be removed from this competition permanently.</p>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" className="rounded-full" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={() => deleteEntryMutation.mutate(deleteTarget.id)} disabled={deleteEntryMutation.isPending}
              className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white">{deleteEntryMutation.isPending ? 'Deleting…' : 'Delete'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function EntryCard({ entry, rank, competition, competitionId, user, isActive, isPast, userRating, onRate, rating, onDelete }) {
  const [selectedRating, setSelectedRating] = useState(userRating?.rating || 0);
  const isOwner = user && (entry.created_by === user.email || entry.owner_email === user.email);
  const canVote = isActive && user && !userRating && entry.created_by !== user.email && entry.owner_email !== user.email && !entry.disqualified;
  const img = entry.images?.[0] || FALLBACK_IMG;
  const medal = !entry.disqualified && isPast && rank < 3 ? ['bg-yolk-500 text-white', 'bg-ink/60 text-cream', 'bg-terracotta-500 text-white'][rank] : null;

  if (entry.disqualified) {
    return (
      <motion.article variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card-premium overflow-hidden relative">
        <div className="absolute inset-0 bg-ink/60 z-10 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 text-center max-w-xs">
            <span className="chip bg-terracotta-500 text-white border-0 mb-2"><ShieldAlert className="w-3 h-3" />Disqualified</span>
            <p className="text-sm text-ink/65">{entry.disqualification_reason || 'This entry has been disqualified'}</p>
          </div>
        </div>
        <div className="aspect-square overflow-hidden bg-cream-deep opacity-50">
          <img src={img} alt={entry.chicken_name} className="w-full h-full object-cover" />
        </div>
        <div className="p-4 opacity-50">
          <h3 className="font-display text-lg text-ink mb-1">{entry.chicken_name}</h3>
          <p className="text-sm text-ink/65">{entry.breed}</p>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="group card-premium overflow-hidden flex flex-col">
      <div className="aspect-square overflow-hidden bg-cream-deep relative">
        <img src={img} alt={entry.chicken_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {medal && <span className={`absolute top-3 left-3 w-9 h-9 rounded-full ${medal} font-display font-bold flex items-center justify-center shadow-lift`}>{rank + 1}</span>}
        {entry.images?.length > 1 && <span className="absolute bottom-3 right-3 chip bg-ink/70 text-cream border-0 !py-0.5 gap-1"><Camera className="w-3 h-3" />{entry.images.length}</span>}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-sm shadow-soft">
          <Star className="w-4 h-4 text-yolk-500 fill-yolk-500" />
          <span className="font-display font-bold text-ink">{entry.average_rating?.toFixed(1) || '0.0'}</span>
          <span className="text-xs text-ink/55">({entry.vote_count || 0})</span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display text-lg text-ink leading-snug">{entry.chicken_name}</h3>
        <p className="text-xs text-ink/55 mt-0.5">
          {entry.breed}{entry.breed && entry.age ? ' · ' : ''}{entry.age}
        </p>
        {entry.description && <p className="text-sm text-ink/65 mt-2 line-clamp-2">{entry.description}</p>}
        <p className="text-xs text-ink/55 mt-3">
          by <Link to={createPageUrl('SellerListings') + `?email=${entry.owner_email}`} className="text-moss-700 hover:underline font-medium">{entry.owner_name}</Link>
        </p>

        {canVote && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-ink/50">Your score</p>
            <div className="flex gap-1">
              {Array.from({ length: competition.max_rating }).map((_, i) => (
                <button key={i} type="button" onClick={() => setSelectedRating(i + 1)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedRating >= i + 1 ? 'bg-moss-600 text-cream' : 'bg-cream text-ink/60 hover:bg-moss-50 hover:text-moss-700'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <Button onClick={() => onRate(selectedRating)} disabled={selectedRating === 0 || rating} className="w-full btn-cta py-2.5 text-sm" size="sm">
              Submit rating
            </Button>
          </div>
        )}

        {userRating && (
          <div className="mt-4 rounded-xl bg-fresh-50 border border-fresh-200 px-3 py-2 text-sm text-moss-800 text-center inline-flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-moss-600" /> You rated {userRating.rating}/{competition.max_rating}
          </div>
        )}

        {isOwner && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Link to={createPageUrl('SubmitEntry') + `?competition=${competitionId}&edit=${entry.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full rounded-full gap-1.5">
                {(entry.vote_count || 0) > 0 ? <><Camera className="w-4 h-4" /> Add photos</> : <><Edit className="w-4 h-4" /> Edit</>}
              </Button>
            </Link>
            <Button size="sm" className="flex-1 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white gap-1.5" onClick={onDelete}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
