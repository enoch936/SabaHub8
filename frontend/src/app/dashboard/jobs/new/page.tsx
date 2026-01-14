"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createJob } from "@/lib/api";
import { useState } from "react";
import Image from "next/image";
import { Badge, Button, Input, Textarea } from "@/components/ui";

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () => createJob({ title, description }),
    onSuccess: (job) => router.push(`/dashboard/jobs/${job.id}`),
  });

  return (
    <main className="relative mx-auto max-w-4xl p-6 pb-12">
      <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/images/backgrounds/geo-light-grid.svg')" }} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.22),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(167,139,250,0.22),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(16,185,129,0.18),transparent_35%)]" />

      <header className="mb-6 rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner">
            <Image src="/images/badges/info.png" alt="info badge" fill className="object-contain" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Post a Job</h1>
              <Badge variant="outline" className="bg-amber-50/80 text-amber-700">Beta workflow</Badge>
              <Badge variant="outline" className="bg-slate-100 text-slate-700">No live posting</Badge>
            </div>
            <p className="text-slate-700">Use concise titles and clear outcomes; this prototype saves to sandbox APIs only.</p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur">
        <div className="space-y-4">
          <div className="grid gap-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Role title or project headline" />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} placeholder="Describe the work, deliverables, constraints, and decision criteria." />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Create draft</Button>
            {mutation.isPending && <span className="text-sm text-slate-600">Creating in sandbox…</span>}
            {mutation.isError && <span className="text-sm text-rose-600">Failed to create.</span>}
          </div>
          <p className="text-xs text-slate-500">No public listing is generated here; connect production APIs to go live.</p>
        </div>
      </section>
    </main>
  );
}
