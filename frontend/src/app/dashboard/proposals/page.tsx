"use client";

import { useQuery } from "@tanstack/react-query";
import { listEmployerJobs, listJobProposals, acceptProposal } from "@/lib/api";
import Image from "next/image";
import { Badge, Button } from "@/components/ui";

export default function ProposalsPage() {
  const jobsQuery = useQuery({ queryKey: ["my-jobs"], queryFn: listEmployerJobs });

  return (
    <main className="relative mx-auto max-w-5xl p-6 pb-12 space-y-6">
      <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/images/backgrounds/geo-light-grid.svg')" }} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_45%),radial-gradient(circle_at_78%_8%,rgba(167,139,250,0.2),transparent_40%),radial-gradient(circle_at_45%_85%,rgba(16,185,129,0.16),transparent_35%)]" />

      <div className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner">
              <Image src="/images/badges/info.png" alt="info badge" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Proposals (Employer)</h1>
              <p className="text-slate-600">Review and manage incoming proposals from freelancers.</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-50/80 text-emerald-700">Live System</Badge>
        </div>
      </div>

      {jobsQuery.isLoading && <p className="text-slate-700">Loading...</p>}
      {jobsQuery.error && <p className="text-rose-600">Failed to load jobs</p>}
      {jobsQuery.data?.map((job) => (
        <JobProposals key={job.id} jobId={job.id} title={job.title} />
      ))}
      {(!jobsQuery.data || jobsQuery.data.length === 0) && <p className="text-slate-600">No active jobs. Post your first job to receive proposals.</p>}
    </main>
  );
}

function JobProposals({ jobId, title }: { jobId: string; title: string }) {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["proposals", jobId], queryFn: () => listJobProposals(jobId) });

  async function accept(id: string) {
    await acceptProposal(id);
    await refetch();
  }

  return (
    <section className="rounded-2xl border border-white/20 bg-white/85 p-5 shadow-xl shadow-sky-500/10 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">Real-time proposal tracking with instant notifications.</p>
        </div>
        <Badge variant="outline" className="bg-sky-50/80 text-sky-700">Active</Badge>
      </div>
      {isLoading && <p className="text-slate-700">Loading...</p>}
      {error && <p className="text-rose-600">Failed to load proposals</p>}
      <ul className="space-y-3">
        {data?.map((p) => (
          <li key={p.id} className="rounded-xl border border-white/30 bg-white/75 p-3 shadow-inner">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-medium text-slate-900">Bid {p.bidAmount} — {p.timelineDays} days</p>
                <p className="text-sm text-slate-600">{p.coverLetter}</p>
              </div>
              <Button onClick={() => accept(p.id)} size="sm" variant="secondary">Accept</Button>
            </div>
          </li>
        ))}
        {(!data || data.length === 0) && <p className="text-slate-600">No proposals for this job.</p>}
      </ul>
    </section>
  );
}
