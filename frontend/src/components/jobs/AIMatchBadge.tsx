"use client"; import { Sparkles } from 'lucide-react'; interface AIMatchBadgeProps { score: number;
} export function AIMatchBadge({ score }: AIMatchBadgeProps) { const color = score >= 80 ? 'bg-slate-100 text-slate-700 border-slate-200' : score >= 60 ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'; return ( <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}> <Sparkles className="w-3 h-3" /> {score}% match </span> );
}
