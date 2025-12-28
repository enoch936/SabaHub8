"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJob, listJobProposals, submitProposal } from "@/lib/api";
import { useState } from "react";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const qc = useQueryClient();
  const { data: job, isLoading } = useQuery({ queryKey: ["job", id], queryFn: () => getJob(id), enabled: !!id });
  const { data: proposals } = useQuery({ queryKey: ["proposals", id], queryFn: () => listJobProposals(id), enabled: !!id });

  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [timelineDays, setTimelineDays] = useState<number>(7);

  const mutation = useMutation({
    mutationFn: () => submitProposal(id, { coverLetter, bidAmount, timelineDays }),
    onSuccess: () => {
      setCoverLetter("");
      setBidAmount(0);
      setTimelineDays(7);
      qc.invalidateQueries({ queryKey: ["proposals", id] });
    },
  });

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (!job) return <p className="p-6">Not found</p>;

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="text-slate-700 whitespace-pre-wrap">{job.description}</p>
      </header>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Submit Proposal (Freelancer)</h2>
        <div className="space-y-3">
          <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className="w-full rounded border p-2" rows={4} placeholder="Cover letter" />
          <div className="flex gap-3">
            <input type="number" value={bidAmount} onChange={(e) => setBidAmount(Number(e.target.value))} className="w-40 rounded border p-2" placeholder="Bid amount" />
            <input type="number" value={timelineDays} onChange={(e) => setTimelineDays(Number(e.target.value))} className="w-40 rounded border p-2" placeholder="Days" />
            <button onClick={() => mutation.mutate()} className="rounded bg-sky-600 px-4 py-2 text-white">Submit</button>
          </div>
          {mutation.isError && <p className="text-rose-600">Failed</p>}
          {mutation.isSuccess && <p className="text-emerald-600">Submitted</p>}
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Proposals (Employer)</h2>
        <ul className="space-y-2">
          {proposals?.map((p) => (
            <li key={p.id} className="rounded border p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Bid: {p.bidAmount} — {p.timelineDays} days</p>
                  <p className="text-slate-600 text-sm">{p.coverLetter}</p>
                </div>
              </div>
            </li>
          ))}
          {(!proposals || proposals.length === 0) && <p className="text-slate-600">No proposals yet.</p>}
        </ul>
      </section>
    </main>
  );
}
