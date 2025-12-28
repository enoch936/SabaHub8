"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completeContract, deliverContract, escrowFund, escrowRefund, escrowRelease, getContract } from "@/lib/api";
import { useState } from "react";
import Uploader from "@/components/Uploader";

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const qc = useQueryClient();
  const { data: contract, isLoading } = useQuery({ queryKey: ["contract", id], queryFn: () => getContract(id), enabled: !!id });

  const [note, setNote] = useState("");
  const [deliveryAssetId, setDeliveryAssetId] = useState<string | undefined>(undefined);
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("ETB");
  const [fee, setFee] = useState<number>(0);

  const deliver = useMutation({ mutationFn: () => deliverContract(id, { note, deliveryAssetId }), onSuccess: () => qc.invalidateQueries({ queryKey: ["contract", id] }) });
  const complete = useMutation({ mutationFn: () => completeContract(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["contract", id] }) });
  const fund = useMutation({ mutationFn: () => escrowFund({ contractId: id, amount, currency }), onSuccess: () => qc.invalidateQueries({ queryKey: ["contract", id] }) });
  const release = useMutation({ mutationFn: () => escrowRelease({ contractId: id, amount, platformFeeAmount: fee }), onSuccess: () => qc.invalidateQueries({ queryKey: ["contract", id] }) });
  const refund = useMutation({ mutationFn: () => escrowRefund({ contractId: id, amount }), onSuccess: () => qc.invalidateQueries({ queryKey: ["contract", id] }) });

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (!contract) return <p className="p-6">Not found</p>;

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Contract {contract.id}</h1>
        <p className="text-slate-700">Status: {contract.status}</p>
        <p className="text-slate-700">Escrow: {contract.escrow?.totalHeld ?? 0} {contract.escrow?.currency ?? "ETB"}</p>
      </header>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Delivery (Freelancer)</h2>
        <textarea className="w-full rounded border p-2" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Delivery note" />
        <input className="mt-2 w-full rounded border p-2" value={deliveryAssetId ?? ""} onChange={(e) => setDeliveryAssetId(e.target.value)} placeholder="Delivery assetId (optional)" />
        <div className="mt-2">
          <Uploader scope="JOB" accept="image/*,application/pdf" onUploaded={(asset) => setDeliveryAssetId(asset.id)} />
          {deliveryAssetId ? (
            <p className="mt-1 text-sm text-slate-700">Selected assetId: {deliveryAssetId}</p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">You can paste an existing assetId or upload a file.</p>
          )}
        </div>
        <button onClick={() => deliver.mutate()} className="mt-2 rounded bg-sky-600 px-4 py-2 text-white">Submit Delivery</button>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Completion (Employer)</h2>
        <button onClick={() => complete.mutate()} className="rounded bg-emerald-600 px-4 py-2 text-white">Mark Complete</button>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Escrow</h2>
        <div className="flex flex-wrap gap-2">
          <input type="number" className="w-40 rounded border p-2" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" />
          <input className="w-24 rounded border p-2" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="Currency" />
          <button onClick={() => fund.mutate()} className="rounded bg-slate-900 px-4 py-2 text-white">Fund</button>
          <input type="number" className="w-40 rounded border p-2" value={fee} onChange={(e) => setFee(Number(e.target.value))} placeholder="Platform fee" />
          <button onClick={() => release.mutate()} className="rounded bg-indigo-600 px-4 py-2 text-white">Release</button>
          <button onClick={() => refund.mutate()} className="rounded bg-rose-600 px-4 py-2 text-white">Refund</button>
        </div>
      </section>
    </main>
  );
}
