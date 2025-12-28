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
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-slate-600">High-level overview</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jobs" value={jobs.data?.length ?? 0} loading={jobs.isLoading} />
        <StatCard label="Contracts" value={contracts.data?.length ?? 0} loading={contracts.isLoading} />
        <StatCard label="Disputes" value={disputes.data?.length ?? 0} loading={disputes.isLoading} />
        <StatCard label="FAQs" value={contentFaq.data?.length ?? 0} loading={contentFaq.isLoading} />
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Details</h2>
        <ul className="list-inside list-disc text-sm text-slate-700">
          <li>Jobs: {jobs.data?.length ?? 0}</li>
          <li>Contracts: {contracts.data?.length ?? 0}</li>
          <li>Disputes: {disputes.data?.length ?? 0}</li>
          <li>FAQs: {contentFaq.data?.length ?? 0}</li>
        </ul>
        {role === "ADMIN" ? (
          <p className="mt-2 text-xs text-slate-500">Admin can extend this with revenue and audit logs once backend endpoints are exposed.</p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Metrics shown are limited for non-admin roles.</p>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number; loading?: boolean }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold">{loading ? "…" : value}</p>
    </div>
  );
}
