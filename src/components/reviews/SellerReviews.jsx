import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, MessageCircle, CornerDownRight, Loader2 } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import EmptyState from '@/components/shell/EmptyState';
import { createPageUrl } from '../../utils';

const onError = (e) => toast.error(e?.message || 'Something went wrong');

export function StarRating({ rating, size = 'sm', interactive = false, onRate }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star className={`${sizes[size]} ${star <= rating ? 'text-yolk-500 fill-yolk-500' : 'text-ink/20'}`} />
        </button>
      ))}
    </div>
  );
}

/** Compact inline summary — used on seller profiles / cards. */
export function ReviewSummary({ sellerEmail }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ['seller-reviews', sellerEmail],
    queryFn: () => api.entities.SellerReview.filter({ seller_email: sellerEmail }),
    enabled: !!sellerEmail
  });

  if (reviews.length === 0) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(avgRating)} size="sm" />
      <span className="text-sm font-semibold text-ink">{avgRating.toFixed(1)}</span>
      <span className="text-sm text-ink/55">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
    </div>
  );
}

export function ReviewForm({ sellerEmail, listingId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async (data) => {
      const user = await api.auth.me();
      await api.entities.SellerReview.create({
        ...data,
        buyer_name: user.full_name
      });
      // Create notification for seller
      await api.entities.Notification.create({
        user_email: sellerEmail,
        type: 'review',
        title: 'New Review',
        message: `${user.full_name} left a ${data.rating}-star review`,
        link: createPageUrl('SellerReviews')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-reviews']);
      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      onSuccess?.();
    },
    onError,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    createReviewMutation.mutate({
      seller_email: sellerEmail,
      listing_id: listingId,
      rating,
      comment
    });
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="eyebrow mb-2">Your rating</p>
        <div className="flex items-center gap-3">
          <StarRating rating={rating} size="lg" interactive onRate={setRating} />
          <span className="text-sm text-ink/60 min-w-[5rem]">{labels[rating]}</span>
        </div>
      </div>
      <div>
        <p className="eyebrow mb-2">Your review <span className="normal-case tracking-normal font-normal text-ink/45">(optional)</span></p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this seller…"
          rows={4}
          className="bg-cream border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300"
        />
      </div>
      <Button type="submit" disabled={rating === 0 || createReviewMutation.isPending} className="btn-cta px-6 py-2.5">
        {createReviewMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : 'Submit review'}
      </Button>
    </form>
  );
}

/** Rating summary: big average + distribution bars. */
export function RatingBreakdown({ reviews }) {
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const responded = reviews.filter(r => r.seller_response).length;

  return (
    <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
      <div className="text-center sm:pr-6 sm:border-r border-border">
        <p className="stat-num font-display text-5xl text-ink leading-none">{avgRating.toFixed(1)}</p>
        <div className="flex justify-center mt-2"><StarRating rating={Math.round(avgRating)} size="md" /></div>
        <p className="text-sm text-ink/55 mt-1.5">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
        <p className="text-xs text-ink/45 mt-0.5">{responded} answered</p>
      </div>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = reviews.filter(r => r.rating === stars).length;
          const percent = (count / reviews.length) * 100;
          return (
            <div key={stars} className="flex items-center gap-2.5 text-sm">
              <span className="w-3 text-ink/70 tabular-nums">{stars}</span>
              <Star className="w-3.5 h-3.5 text-yolk-500 fill-yolk-500" />
              <div className="flex-1 h-2.5 bg-cream-deep rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.3, 1] }} className="h-full rounded-full bg-yolk-500" />
              </div>
              <span className="w-10 text-right text-ink/55 tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewList({ sellerEmail, isOwner = false }) {
  const [respondingTo, setRespondingTo] = useState(null);
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['seller-reviews', sellerEmail],
    queryFn: () => api.entities.SellerReview.filter({ seller_email: sellerEmail }, '-created_date'),
    enabled: !!sellerEmail
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, response }) => api.entities.SellerReview.update(id, {
      seller_response: response,
      seller_response_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-reviews']);
      toast.success('Response saved');
      setRespondingTo(null);
      setResponse('');
    },
    onError,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="card-premium p-6 h-40 animate-pulse" />
        {[...Array(3)].map((_, i) => <div key={i} className="card-premium p-5 animate-pulse space-y-3"><div className="h-4 bg-cream-deep rounded w-1/4" /><div className="h-3 bg-cream-deep rounded w-3/4" /><div className="h-3 bg-cream-deep rounded w-1/2" /></div>)}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState icon={Star} title="No reviews yet" subtitle={isOwner ? 'When buyers rate their experience with you, their reviews will appear here.' : 'This seller has not been reviewed yet.'} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <RatingBreakdown reviews={reviews} />
      </div>

      <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-4">
        {reviews.map((review) => {
          const initial = (review.buyer_name || 'A').trim().charAt(0).toUpperCase();
          return (
            <motion.li key={review.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card-premium p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-moss-50 text-moss-700 font-display font-bold flex items-center justify-center flex-shrink-0">{initial}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-ink">{review.buyer_name || 'Anonymous'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-ink/50">{moment(review.created_date).fromNow()}</span>
                      </div>
                    </div>
                    {review.seller_response
                      ? <span className="chip bg-fresh-50 text-moss-700 border-fresh-200">Answered</span>
                      : isOwner && <span className="chip bg-yolk-50 text-yolk-600 border-yolk-200">Awaiting reply</span>}
                  </div>

                  {review.comment && <p className="text-ink/75 mt-3 leading-relaxed">{review.comment}</p>}

                  {review.seller_response && (
                    <div className="mt-4 flex gap-3 rounded-xl bg-cream p-4">
                      <CornerDownRight className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-moss-700">Seller response</p>
                        <p className="text-sm text-ink/75 mt-1">{review.seller_response}</p>
                        <p className="text-xs text-ink/40 mt-1.5">{moment(review.seller_response_date).fromNow()}</p>
                      </div>
                    </div>
                  )}

                  {isOwner && !review.seller_response && (
                    respondingTo === review.id ? (
                      <div className="mt-4 space-y-3">
                        <Textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Thank the buyer or address their feedback…"
                          rows={3}
                          autoFocus
                          className="bg-cream border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => respondMutation.mutate({ id: review.id, response })}
                            disabled={!response.trim() || respondMutation.isPending} className="btn-cta px-4">
                            {respondMutation.isPending ? 'Saving…' : 'Post response'}
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => { setRespondingTo(null); setResponse(''); }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setRespondingTo(review.id)}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-moss-700 hover:text-moss-800 link-underline">
                        <MessageCircle className="w-4 h-4" /> Respond
                      </button>
                    )
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
