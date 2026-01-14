"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completeContract, deliverContract, escrowFund, escrowRefund, escrowRelease, getContract } from "@/lib/api";
import { useState } from "react";
import Uploader from "@/components/Uploader";
import Image from "next/image";
import { Badge, Button, Input, Textarea } from "@/components/ui";

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
    <main className="relative mx-auto max-w-5xl p-6 pb-12 space-y-6">
      <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/images/backgrounds/geo-light-grid.svg')" }} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.22),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.22),transparent_40%),radial-gradient(circle_at_40%_85%,rgba(16,185,129,0.18),transparent_35%)]" />

      <header className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur">
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner">
            <Image src="/images/badges/secure.png" alt="secure badge" fill className="object-contain" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Contract {contract.id}</h1>
              <Badge variant="outline" className="bg-emerald-50/80 text-emerald-700">{contract.status}</Badge>
              <Badge variant="outline" className="bg-amber-50/80 text-amber-700">Sandbox flow</Badge>
            </div>
            <p className="text-slate-700">Escrow balance: {contract.escrow?.totalHeld ?? 0} {contract.escrow?.currency ?? "ETB"}</p>
            <p className="text-xs text-slate-500">Prototype only — no real funds move until production payment rails are connected.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Delivery (Freelancer)</h2>
            <Badge variant="outline" className="bg-slate-100 text-slate-700">Uploads stay in beta</Badge>
          </div>
          <div className="mt-4 space-y-3">
            <Textarea className="min-h-[120px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Delivery note, links, and acceptance criteria coverage." />
            <Input value={deliveryAssetId ?? ""} onChange={(e) => setDeliveryAssetId(e.target.value)} placeholder="Delivery assetId (optional)" />
            <div className="rounded-xl border border-white/30 bg-white/70 p-3 shadow-inner">
              <Uploader scope="JOB" accept="image/*,application/pdf" onUploaded={(asset) => setDeliveryAssetId(asset.id)} />
              {deliveryAssetId ? (
                <p className="mt-1 text-sm text-slate-700">Selected assetId: {deliveryAssetId}</p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Upload to generate an assetId or paste an existing one.</p>
              )}
            </div>
            <Button onClick={() => deliver.mutate()} disabled={deliver.isPending}>Submit delivery</Button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Completion (Employer)</h2>
              <Badge variant="outline" className="bg-emerald-50/80 text-emerald-700">Manual accept</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">Mark complete after you review the delivery in this beta environment.</p>
            <Button className="mt-3" onClick={() => complete.mutate()} disabled={complete.isPending}>Mark complete</Button>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Escrow</h2>
              <Badge variant="outline" className="bg-amber-50/80 text-amber-700">Demo rails</Badge>
            </div>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" />
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="Currency" />
                <Button variant="secondary" onClick={() => fund.mutate()} disabled={fund.isPending}>Fund</Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} placeholder="Platform fee" />
                <Button onClick={() => release.mutate()} disabled={release.isPending}>Release</Button>
                <Button variant="destructive" onClick={() => refund.mutate()} disabled={refund.isPending}>Refund</Button>
              </div>
              <p className="text-xs text-slate-500">These controls hit sandbox endpoints; connect live payment provider to move funds.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
