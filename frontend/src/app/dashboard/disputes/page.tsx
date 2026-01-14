"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listDisputes, openDispute } from "@/lib/api";
import { useState } from "react";

export default function DisputesPage() {
  const qc = useQueryClient();
  const disputes = useQuery({ queryKey: ["disputes"], queryFn: listDisputes });

  const [contractId, setContractId] = useState("");
  const [reason, setReason] = useState("");
  const [evidenceCsv, setEvidenceCsv] = useState("");

  const create = useMutation({
    mutationFn: () => openDispute({ contractId, reason, evidenceAssetIds: evidenceCsv.split(",").map((s) => s.trim()).filter(Boolean) }),
    onSuccess: () => {
      setContractId("");
      setReason("");
      setEvidenceCsv("");
      qc.invalidateQueries({ queryKey: ["disputes"] });
    }
  });

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
        <img src="/images/backgrounds/aurora-blur.svg" alt="Aurora" className="h-full w-full object-cover opacity-80" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <img src="/images/backgrounds/geo-light-grid.svg" alt="Grid" className="h-full w-full object-cover opacity-55" />
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        <header className="text-center text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Disputes</p>
          <h1 className="mt-2 text-3xl font-bold">Resolution center</h1>
          <p className="mt-2 text-sm text-cyan-100/80">Beta preview — live dispute data appears once APIs are wired.</p>
        </header>

        <section className="rounded-3xl border border-white/15 bg-white/85 p-6 shadow-[0_22px_70px_rgba(8,47,73,0.35)] backdrop-blur">
          <h2 className="mb-2 font-semibold text-slate-900">Open a dispute</h2>
          <div className="space-y-2">
            <input className="w-full rounded border border-white/30 bg-white/90 p-2" value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder="Contract ID" />
            <textarea className="w-full rounded border border-white/30 bg-white/90 p-2" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
            <input className="w-full rounded border border-white/30 bg-white/90 p-2" value={evidenceCsv} onChange={(e) => setEvidenceCsv(e.target.value)} placeholder="Evidence asset IDs (comma separated)" />
            <button onClick={() => create.mutate()} className="rounded bg-rose-600 px-4 py-2 text-white">Open Dispute</button>
            {create.isError && <p className="text-rose-600">Failed to open dispute</p>}
            {create.isSuccess && <p className="text-emerald-600">Dispute opened</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-white/15 bg-white/85 p-6 shadow-[0_22px_70px_rgba(8,47,73,0.35)] backdrop-blur">
          <h2 className="mb-2 font-semibold text-slate-900">My disputes</h2>
          {disputes.isLoading && <p>Loading...</p>}
          {disputes.error && <p className="text-rose-600">Failed to load disputes</p>}
          <ul className="space-y-2">
            {disputes.data?.map((d) => (
              <li key={d.id} className="rounded-2xl border border-white/30 bg-white/80 p-3 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{d.id}</p>
                    <p className="text-sm text-slate-600">Contract: {d.contractId}</p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-1 text-sm">{d.status}</span>
                </div>
                {d.reason && <p className="mt-1 text-sm text-slate-700">{d.reason}</p>}
              </li>
            ))}
            {(!disputes.data || disputes.data.length === 0) && <p className="text-slate-600">No disputes</p>}
          </ul>
        </section>
      </div>
    </main>
  );
}
