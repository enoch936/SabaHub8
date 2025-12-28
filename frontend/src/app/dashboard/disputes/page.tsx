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
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Disputes</h1>
        <p className="text-slate-600">Open and track disputes</p>
      </header>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Open a dispute</h2>
        <div className="space-y-2">
          <input className="w-full rounded border p-2" value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder="Contract ID" />
          <textarea className="w-full rounded border p-2" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
          <input className="w-full rounded border p-2" value={evidenceCsv} onChange={(e) => setEvidenceCsv(e.target.value)} placeholder="Evidence asset IDs (comma separated)" />
          <button onClick={() => create.mutate()} className="rounded bg-rose-600 px-4 py-2 text-white">Open Dispute</button>
          {create.isError && <p className="text-rose-600">Failed to open dispute</p>}
          {create.isSuccess && <p className="text-emerald-600">Dispute opened</p>}
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">My disputes</h2>
        {disputes.isLoading && <p>Loading...</p>}
        {disputes.error && <p className="text-rose-600">Failed to load disputes</p>}
        <ul className="space-y-2">
          {disputes.data?.map((d) => (
            <li key={d.id} className="rounded border p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{d.id}</p>
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
    </main>
  );
}
