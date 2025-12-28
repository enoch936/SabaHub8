"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listContracts } from "@/lib/api";

export default function ContractsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["contracts"], queryFn: listContracts });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Contracts</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-rose-600">Failed to load.</p>}
      <ul className="space-y-3">
        {data?.map((c) => (
          <li key={c.id} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.id}</p>
                <p className="text-sm text-slate-600">Status: {c.status}</p>
              </div>
              <Link href={`/dashboard/contracts/${c.id}`} className="text-sky-700">Open</Link>
            </div>
          </li>
        ))}
        {(!data || data.length === 0) && <p className="text-slate-600">No contracts yet.</p>}
      </ul>
    </main>
  );
}
