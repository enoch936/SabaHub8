"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listContracts } from "@/lib/api";

export default function ContractsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["contracts"], queryFn: listContracts });

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
        <img src="/images/backgrounds/aurora-blur.svg" alt="Aurora" className="h-full w-full object-cover opacity-80" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <img src="/images/backgrounds/geo-light-grid.svg" alt="Grid" className="h-full w-full object-cover opacity-55" />
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="text-center text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Contracts</p>
          <h1 className="mt-2 text-3xl font-bold">Agreements</h1>
          <p className="mt-2 text-sm text-cyan-100/80">View and manage your contracts.</p>
        </header>

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/85 p-6 shadow-[0_22px_70px_rgba(8,47,73,0.35)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500" aria-hidden />
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sky-300/30 blur-3xl" aria-hidden />
          <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-300/30 blur-3xl" aria-hidden />

          {isLoading && <p className="text-slate-700">Loading...</p>}
          {error && <p className="text-rose-600">Failed to load.</p>}
          <ul className="space-y-3">
            {data?.map((c) => (
              <li key={c.id} className="rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{c.id}</p>
                    <p className="text-sm text-slate-600">Status: {c.status}</p>
                  </div>
                  <Link href={`/dashboard/contracts/${c.id}`} className="text-sky-700 hover:text-sky-800 font-semibold">Open</Link>
                </div>
              </li>
            ))}
            {(!data || data.length === 0) && <p className="text-slate-600">No contracts yet.</p>}
          </ul>
        </div>
      </div>
    </main>
  );
}
