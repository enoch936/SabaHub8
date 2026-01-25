"use client";

import { useQuery } from "@tanstack/react-query";
import { listContent } from "@/lib/api";
import { useState } from "react";
import Image from "next/image";
import { Badge, Button, Input, Select } from "@/components/ui";

export default function ContentPage() {
  const [type, setType] = useState("FAQ");
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["content", type], queryFn: () => listContent(type) });

  return (
    <main className="relative mx-auto max-w-5xl p-6 pb-12 space-y-6">
      <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/images/backgrounds/geo-light-grid.svg')" }} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_45%),radial-gradient(circle_at_75%_10%,rgba(99,102,241,0.2),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(110,231,183,0.18),transparent_35%)]" />

      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner">
            <Image src="/images/badges/info.png" alt="info" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Content</h1>
            <p className="text-slate-600">Public content management system.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option>FAQ</option>
            <option>PAGE</option>
            <option>BLOG</option>
            <option>CATEGORY</option>
            <option>ANNOUNCEMENT</option>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
        </div>
      </header>

      {isLoading && <p className="text-slate-700">Loading...</p>}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          Failed to load content — prototype endpoint only.
        </div>
      )}

      <ul className="space-y-4">
        {data?.map((c) => (
          <li key={c.id} className="rounded-2xl border border-white/20 bg-white/85 p-5 shadow-lg shadow-sky-500/10 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900">{c.title}</h3>
                <p className="text-sm text-slate-600">{c.type} — {c.status}</p>
              </div>
              <Badge variant="outline" className="bg-emerald-50/80 text-emerald-700">Published</Badge>
            </div>
            <div className="prose prose-slate mt-3 whitespace-pre-wrap text-slate-800">{c.body}</div>
          </li>
        ))}
        {(!data || data.length === 0) && <p className="text-slate-600">No content available. Create your first content item.</p>}
      </ul>
    </main>
  );
}
