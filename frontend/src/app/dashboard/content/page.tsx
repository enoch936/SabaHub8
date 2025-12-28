"use client";

import { useQuery } from "@tanstack/react-query";
import { listContent } from "@/lib/api";
import { useState } from "react";

export default function ContentPage() {
  const [type, setType] = useState("FAQ");
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["content", type], queryFn: () => listContent(type) });

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content</h1>
          <p className="text-slate-600">Public content listing</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded border p-2" value={type} onChange={(e) => setType(e.target.value)}>
            <option>FAQ</option>
            <option>PAGE</option>
            <option>BLOG</option>
            <option>CATEGORY</option>
            <option>ANNOUNCEMENT</option>
          </select>
          <button onClick={() => refetch()} className="rounded border px-3 py-2">Refresh</button>
        </div>
      </header>

      {isLoading && <p>Loading...</p>}
      {error && <p className="text-rose-600">Failed to load content</p>}

      <ul className="space-y-3">
        {data?.map((c) => (
          <li key={c.id} className="rounded border p-4">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm text-slate-600">{c.type} — {c.status}</p>
            <div className="prose mt-2 whitespace-pre-wrap text-slate-800">{c.body}</div>
          </li>
        ))}
        {(!data || data.length === 0) && <p className="text-slate-600">No content</p>}
      </ul>
    </main>
  );
}
