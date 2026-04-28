import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageCircle } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { createPageUrl } from '../../utils';

function StarRating({ rating, size = 'sm', interactive = false, onRate }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
        >
          <Star
            className={`${sizes[size]} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

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
      <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
      <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
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
    }
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
        <StarRating rating={rating} size="lg" interactive onRate={setRating} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Review (optional)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this seller..."
          rows={4}
        />
      </div>
      <Button
        type="submit"
        disabled={rating === 0 || createReviewMutation.isPending}
        className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
      >
        {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
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
    }
  });

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading reviews...</div>;

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No reviews yet</p>
      </div>
    );
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
          <StarRating rating={Math.round(avgRating)} size="md" />
          <p className="text-sm text-gray-500 mt-1">{reviews.length} reviews</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter(r => r.rating === stars).length;
            const percent = (count / reviews.length) * 100;
            return (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="w-3">{stars}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-8 text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-4 border-0 shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900">{review.buyer_name || 'Anonymous'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-gray-500">{moment(review.created_date).fromNow()}</span>
                </div>
              </div>
            </div>

            {review.comment && (
              <p className="text-gray-600 mt-2">{review.comment}</p>
            )}

            {review.seller_response && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-[#7A9D7A]">
                <p className="text-xs font-medium text-gray-500 mb-1">Seller Response</p>
                <p className="text-sm text-gray-700">{review.seller_response}</p>
                <p className="text-xs text-gray-400 mt-1">{moment(review.seller_response_date).fromNow()}</p>
              </div>
            )}

            {isOwner && !review.seller_response && (
              respondingTo === review.id ? (
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Write your response..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondMutation.mutate({ id: review.id, response })}
                      disabled={!response.trim() || respondMutation.isPending}
                      className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                    >
                      Submit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRespondingTo(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRespondingTo(review.id)}
                  className="mt-2 text-[#7A9D7A]"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Respond
                </Button>
              )
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}