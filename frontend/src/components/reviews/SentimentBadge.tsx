import type { SentimentLabel } from '@/lib/types'; const CONFIG = { POSITIVE: { label: 'Positive', className: 'bg-green-100 text-green-700', emoji: '😊' }, NEUTRAL: { label: 'Neutral', className: 'bg-gray-100 text-gray-600', emoji: '😐' }, NEGATIVE: { label: 'Negative', className: 'bg-red-100 text-red-700', emoji: '😞' },
}; export function SentimentBadge({ sentiment }: { sentiment: SentimentLabel }) { const cfg = CONFIG[sentiment]; return ( <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.className}`}> {cfg.emoji} {cfg.label} </span> );
}
