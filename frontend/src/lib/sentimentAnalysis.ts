import type { SentimentLabel } from './types';

const POSITIVE_KEYWORDS = [
  'great', 'excellent', 'amazing', 'good', 'wonderful', 'fantastic',
  'helpful', 'professional', 'recommend', 'outstanding', 'brilliant',
  'exceptional', 'superb', 'perfect', 'awesome', 'impressive', 'pleased',
  'satisfied', 'happy', 'love', 'best', 'top', 'quality', 'efficient',
  'reliable', 'responsive', 'thorough', 'skilled', 'talented', 'creative',
  'innovative', 'dedicated', 'punctual', 'accurate', 'exceeded',
];

const NEGATIVE_KEYWORDS = [
  'bad', 'terrible', 'awful', 'poor', 'horrible', 'disappointing',
  'unprofessional', 'waste', 'never', 'worst', 'failed', 'failure',
  'useless', 'incompetent', 'slow', 'late', 'rude', 'dishonest',
  'unreliable', 'unresponsive', 'mediocre', 'subpar', 'inadequate',
  'frustrating', 'regret', 'avoid', 'scam', 'overpriced', 'incomplete',
];

/**
 * Analyzes comment text and returns a SentimentLabel.
 * Uses keyword matching — case-insensitive.
 */
export function analyzeSentiment(text: string): SentimentLabel {
  const lower = text.toLowerCase();

  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of POSITIVE_KEYWORDS) {
    if (lower.includes(word)) positiveScore++;
  }
  for (const word of NEGATIVE_KEYWORDS) {
    if (lower.includes(word)) negativeScore++;
  }

  if (positiveScore > negativeScore) return 'POSITIVE';
  if (negativeScore > positiveScore) return 'NEGATIVE';
  return 'NEUTRAL';
}
