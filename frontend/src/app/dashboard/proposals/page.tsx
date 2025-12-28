"use client";

import { useQuery } from "@tanstack/react-query";
import { listEmployerJobs, listJobProposals, acceptProposal } from "@/lib/api";

export default function ProposalsPage() {
  const jobsQuery = useQuery({ queryKey: ["my-jobs"], queryFn: listEmployerJobs });

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Proposals (Employer)</h1>
      {jobsQuery.isLoading && <p>Loading...</p>}
      {jobsQuery.error && <p className="text-rose-600">Failed to load jobs</p>}
      {jobsQuery.data?.map((job) => (
        <JobProposals key={job.id} jobId={job.id} title={job.title} />
      ))}
      {(!jobsQuery.data || jobsQuery.data.length === 0) && <p className="text-slate-600">No jobs yet.</p>}
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
    <section className="rounded-xl border p-4">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-rose-600">Failed to load proposals</p>}
      <ul className="space-y-2">
        {data?.map((p) => (
          <li key={p.id} className="rounded border p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Bid: {p.bidAmount} — {p.timelineDays} days</p>
                <p className="text-slate-600 text-sm">{p.coverLetter}</p>
              </div>
              <button onClick={() => accept(p.id)} className="rounded bg-emerald-600 px-3 py-1.5 text-white">Accept</button>
            </div>
          </li>
        ))}
        {(!data || data.length === 0) && <p className="text-slate-600">No proposals for this job.</p>}
      </ul>
    </section>
  );
}
