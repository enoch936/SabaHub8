"use client";

import { create } from 'zustand';
import { toast } from 'sonner';
import type { Review } from './types';
import { createWorkspaceReview, listWorkspaceReviews, type WorkspaceReview } from './api';


export function computeAggregateRating(reviews: Review[], targetId?: string): number {
  const filtered = targetId ? reviews.filter((r) => r.targetId === targetId) : reviews;
  if (!filtered.length) return 0;
  const sum = filtered.reduce((acc, r) => acc + r.rating, 0);
  // Round to 1 decimal place; result is always in [1, 5] for non-empty input
  return Math.round((sum / filtered.length) * 10) / 10;
}

function normalizeReview(review: WorkspaceReview): Review {
  return {
    ...review,
    isVerified: Boolean(review.isVerified ?? review.verified),
    tags: Array.isArray(review.tags) ? review.tags : [],
  };
}

interface ReviewStore {
  reviews: Review[];
  isLoading: boolean;
  aggregateRating: number;
  fetchReviews: (targetId?: string) => Promise<void>;
  submitReview: (review: {
    contractId: string;
    targetId: string;
    rating: number;
    comment: string;
    tags?: string[];
    reviewerId?: string;
    reviewerName?: string;
    reviewerAvatar?: string;
    isVerified?: boolean;
  }) => Promise<boolean>;
  computeAggregate: (targetId?: string) => number;
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  isLoading: false,
  aggregateRating: 0,

  fetchReviews: async (targetId?: string) => {
    set({ isLoading: true });
    try {
      const data = await listWorkspaceReviews();
      const normalized = data.map(normalizeReview);
      const reviews = targetId ? normalized.filter((review) => review.targetId === targetId) : normalized;
      set({ reviews, aggregateRating: computeAggregateRating(reviews), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      const message = error instanceof Error ? error.message : 'Failed to load reviews.';
      toast.error(message);
    }
  },

  submitReview: async (reviewData) => {
    // Validate rating is between 1 and 5 inclusive (Req 13.2)
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      toast.error('Rating must be between 1 and 5.');
      return false;
    }

    set({ isLoading: true });
    try {
      const created = await createWorkspaceReview({
        contractId: reviewData.contractId,
        targetId: reviewData.targetId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        tags: reviewData.tags,
      });
      const newReview = normalizeReview(created);
      set((state) => {
        const reviews = [newReview, ...state.reviews];
        return { reviews, aggregateRating: computeAggregateRating(reviews), isLoading: false };
      });
      toast.success('Review submitted successfully!');
      return true;
    } catch (error) {
      set({ isLoading: false });
      const message = error instanceof Error ? error.message : 'Failed to submit review. Please try again.';
      toast.error(message);
      return false;
    }
  },

  computeAggregate: (targetId?: string) => computeAggregateRating(get().reviews, targetId),
}));
