"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJob, listJobProposals, submitProposal } from "@/lib/api";
import { useState } from "react";
import Image from "next/image";
import { Badge, Button, Input, Textarea } from "@/components/ui";

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
    <main className="relative mx-auto max-w-5xl p-6 pb-12">
      <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/images/backgrounds/geo-light-grid.svg')" }} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(125,211,252,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(167,139,250,0.25),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(110,231,183,0.18),transparent_35%)]" />

      <header className="mb-6 rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner">
            <Image src="/images/badges/verified.png" alt="Beta verified badge" fill className="object-contain" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              <Badge variant="outline" className="bg-emerald-50/80 text-emerald-700">Beta workspace</Badge>
              <Badge variant="outline" className="bg-amber-50/80 text-amber-700">Prototype data only</Badge>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap">{job.description}</p>
            <p className="text-sm text-slate-500">This view shows demo-safe values until your account wiring is complete.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Submit Proposal (Freelancer)</h2>
            <Badge variant="outline" className="bg-indigo-50/80 text-indigo-700">Sends to sandbox API</Badge>
          </div>
          <div className="mt-4 space-y-4">
            <Textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className="min-h-[140px]" placeholder="Share relevant work, timeline confidence, and assumptions." />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input type="number" value={bidAmount} onChange={(e) => setBidAmount(Number(e.target.value))} placeholder="Bid amount" />
              <Input type="number" value={timelineDays} onChange={(e) => setTimelineDays(Number(e.target.value))} placeholder="Days" />
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Submit</Button>
            </div>
            {mutation.isError && <p className="text-sm text-rose-600">Failed — check connectivity.</p>}
            {mutation.isSuccess && <p className="text-sm text-emerald-600">Submitted to sandbox.</p>}
            <p className="text-xs text-slate-500">No live offers are created in this beta environment.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Proposals (Employer)</h2>
            <Badge variant="outline" className="bg-slate-100 text-slate-700">Sample only</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {proposals?.map((p) => (
              <li key={p.id} className="rounded-xl border border-white/30 bg-white/70 p-3 shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">Bid {p.bidAmount} — {p.timelineDays} days</p>
                    <p className="text-sm text-slate-600">{p.coverLetter}</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Pending</Badge>
                </div>
              </li>
            ))}
            {(!proposals || proposals.length === 0) && <p className="text-slate-600">No proposals yet in this beta view.</p>}
          </ul>
        </section>
      </div>
    </main>
  );
}
