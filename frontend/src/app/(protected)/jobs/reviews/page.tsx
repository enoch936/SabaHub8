"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Plus, Star } from 'lucide-react';
import { useReviewStore } from '@/lib/reviewStore';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { AnimatedStarRating } from '@/components/reviews/AnimatedStarRating';
import { SentimentBadge } from '@/components/reviews/SentimentBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { SentimentLabel } from '@/lib/types';

export default function ReviewsPage() {
  const { reviews, isLoading, aggregateRating, fetchReviews, submitReview } = useReviewStore();
  const [showModal, setShowModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newContractId, setNewContractId] = useState('');
  const [newTargetId, setNewTargetId] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentLabel | 'ALL'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const filtered = reviews.filter((review) => {
    if (sentimentFilter !== 'ALL' && review.sentiment !== sentimentFilter) return false;
    if (ratingFilter !== null && review.rating !== ratingFilter) return false;
    return true;
  });

  const ratingDist = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => {
        const count = reviews.filter((review) => review.rating === rating).length;
        return {
          rating,
          count,
          pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0,
        };
      }),
    [reviews],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      await submitReview({
        contractId: newContractId.trim() || 'N/A',
        reviewerId: 'self',
        reviewerName: 'You',
        targetId: newTargetId.trim() || 'N/A',
        rating: newRating,
        comment: newComment,
        isVerified: true,
        tags: [],
      });
      setShowModal(false);
      setNewComment('');
      setNewRating(5);
      setNewContractId('');
      setNewTargetId('');
    },
    [submitReview, newRating, newComment, newContractId, newTargetId],
  );

  return (
    <div className="sheet-shell min-h-screen">
      <div className="sheet-container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Reviews and Ratings</h1>
            <p className="text-muted-foreground text-sm">{reviews.length} reviews</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm"
          >
            <Plus className="w-4 h-4" />
            Write Review
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-4">
            <div className="sheet-panel p-6 text-center">
              <p className="text-5xl font-bold mb-1">{aggregateRating.toFixed(1)}</p>
              <AnimatedStarRating rating={Math.round(aggregateRating)} size="lg" />
              <p className="text-sm text-muted-foreground mt-2">{reviews.length} reviews</p>
            </div>

            <div className="sheet-panel p-5">
              <h3 className="font-semibold mb-3">Rating Distribution</h3>
              <div className="space-y-2">
                {ratingDist.map(({ rating, count, pct }) => (
                  <button
                    key={rating}
                    onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                    className={`w-full flex items-center gap-2 text-sm rounded-lg p-1 border ${
                      ratingFilter === rating ? 'bg-[var(--accent)] border-[var(--border)]' : 'border-transparent'
                    }`}
                  >
                    <span className="w-4 text-right">{rating}</span>
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-[var(--accent)] rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-muted-foreground w-6 text-right">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="sheet-panel p-5">
              <h3 className="font-semibold mb-3">Filter by Sentiment</h3>
              <div className="space-y-2">
                {(['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'] as const).map((sentiment) => (
                  <button
                    key={sentiment}
                    onClick={() => setSentimentFilter(sentiment)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${
                      sentimentFilter === sentiment
                        ? 'bg-[var(--accent)] text-foreground border-[var(--border)]'
                        : 'border-transparent'
                    }`}
                  >
                    {sentiment === 'ALL' ? 'All Reviews' : <SentimentBadge sentiment={sentiment} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? <LoadingSkeleton rows={5} /> : filtered.map((review) => <ReviewCard key={review.id} review={review} />)}
            {!isLoading && filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No reviews match your filters</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45">
          <div className="sheet-panel w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="font-semibold">Write a Review</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg">
                x
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <AnimatedStarRating rating={newRating} size="lg" interactive onChange={setNewRating} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contract ID</label>
                <input
                  value={newContractId}
                  onChange={(event) => setNewContractId(event.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target User ID</label>
                <input
                  value={newTargetId}
                  onChange={(event) => setNewTargetId(event.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Comment *</label>
                <textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-[var(--border)] text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm">
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
