"use client";

import { useEffect, useState } from "react";
import { adminAnalyticsSummary, adminAnalyticsDaily } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<{ users: number; jobs: number; revenue: number; disputesOpen: number } | null>(null);
  const [daily, setDaily] = useState<{ dates: string[]; users: number[]; jobs: number[]; revenue: number[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, day] = await Promise.all([adminAnalyticsSummary(), adminAnalyticsDaily()]);
      setData(sum);
      setDaily(day);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <button onClick={load} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700">Reload</button>
      </div>

      {error && <div className="rounded-lg border border-rose-700 bg-rose-900/20 p-3 text-rose-200 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Users" value={loading ? "…" : data?.users ?? 0} />
        <KpiCard title="Jobs" value={loading ? "…" : data?.jobs ?? 0} />
        <KpiCard title="Revenue" value={loading ? "…" : `${(data?.revenue ?? 0).toFixed(2)} ETB`} />
        <KpiCard title="Open Disputes" value={loading ? "…" : data?.disputesOpen ?? 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <MiniChart title="Users (30d)" color="rgb(34 211 238)" data={daily?.users ?? []} dates={daily?.dates ?? []} />
        <MiniChart title="Jobs (30d)" color="rgb(132 204 22)" data={daily?.jobs ?? []} dates={daily?.dates ?? []} />
        <MiniChart title="Revenue (30d)" color="rgb(250 204 21)" data={daily?.revenue ?? []} dates={daily?.dates ?? []} format={(v) => `${v.toFixed(1)}`} />
      </div>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-slate-400 text-sm">{title}</div>
      <div className="text-3xl font-bold text-slate-100">{value}</div>
    </div>
  );
}

function MiniChart({ title, data, dates, color, format }: { title: string; data: number[]; dates: string[]; color: string; format?: (v: number) => string }) {
  const max = data.length ? Math.max(...data, 1) : 1;
  const formatFn = format || ((v) => v.toString());
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
      <div className="font-semibold text-slate-200">{title}</div>
      <div className="flex items-end gap-1 h-32">
        {data.map((val, i) => {
          const pct = (val / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
              <div className="w-full rounded-t" style={{ height: `${pct}%`, backgroundColor: color, minHeight: val > 0 ? "4px" : "0" }} />
              <div className="absolute bottom-full mb-2 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                {dates[i]}: {formatFn(val)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
