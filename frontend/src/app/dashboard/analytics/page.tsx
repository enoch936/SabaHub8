"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listJobs, listContracts, listDisputes, listContent } from "@/lib/api";
import { bootstrapSession, useSession } from "@/lib/session";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();
  const role = useSession((s) => s.role);

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) router.replace("/login");
  }, [router]);

  const jobs = useQuery({ queryKey: ["analytics", "jobs"], queryFn: listJobs });
  const contracts = useQuery({ queryKey: ["analytics", "contracts"], queryFn: listContracts });
  const disputes = useQuery({ queryKey: ["analytics", "disputes"], queryFn: listDisputes });
  const contentFaq = useQuery({ queryKey: ["analytics", "content", "FAQ"], queryFn: () => listContent("FAQ") });

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
        <img src="/images/backgrounds/aurora-blur.svg" alt="Aurora" className="h-full w-full object-cover opacity-80" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <img src="/images/backgrounds/geo-light-grid.svg" alt="Grid" className="h-full w-full object-cover opacity-55" />
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Analytics</p>
            <h1 className="text-3xl font-bold">Metrics</h1>
            <p className="text-sm text-cyan-100/80">Real-time platform statistics.</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Jobs" value={jobs.data?.length ?? 0} loading={jobs.isLoading} />
          <StatCard label="Contracts" value={contracts.data?.length ?? 0} loading={contracts.isLoading} />
          <StatCard label="Disputes" value={disputes.data?.length ?? 0} loading={disputes.isLoading} />
          <StatCard label="FAQs" value={contentFaq.data?.length ?? 0} loading={contentFaq.isLoading} />
        </section>

        <section className="rounded-3xl border border-white/15 bg-white/85 p-6 shadow-[0_22px_70px_rgba(8,47,73,0.35)] backdrop-blur">
          <h2 className="mb-2 font-semibold text-slate-900">Details</h2>
          <ul className="list-inside list-disc text-sm text-slate-700">
            <li>Jobs: {jobs.data?.length ?? 0}</li>
            <li>Contracts: {contracts.data?.length ?? 0}</li>
            <li>Disputes: {disputes.data?.length ?? 0}</li>
            <li>FAQs: {contentFaq.data?.length ?? 0}</li>
          </ul>
          {role === "ADMIN" ? (
            <p className="mt-2 text-xs text-slate-600">Admin can extend this with revenue and audit logs once backend endpoints are exposed.</p>
          ) : (
            <p className="mt-2 text-xs text-slate-600">Metrics shown are limited for non-admin roles.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number; loading?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/25 bg-white/85 p-4 backdrop-blur">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold">{loading ? "…" : value}</p>
      <p className="text-xs text-slate-500">Beta data</p>
    </div>
  );
}
