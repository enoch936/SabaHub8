"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWallet, initChapa, localTopupRequest } from "@/lib/api";
import { useState } from "react";

export default function WalletPage() {
  const qc = useQueryClient();
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: getWallet });

  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("ETB");
  const [referenceId, setReferenceId] = useState("");

  const chapa = useMutation({
    mutationFn: () => initChapa({ amount, currency }, crypto.randomUUID()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet"] }),
  });
  const localReq = useMutation({
    mutationFn: () => localTopupRequest({ amount, currency, referenceId }, crypto.randomUUID()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet"] }),
  });

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>
      <div className="rounded-xl border p-4">
        <p className="text-lg">Balance: <strong>{wallet.data?.balance ?? 0} {wallet.data?.currency ?? "ETB"}</strong></p>
      </div>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Top-up</h2>
        <div className="flex flex-wrap gap-2">
          <input type="number" className="w-40 rounded border p-2" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" />
          <input className="w-24 rounded border p-2" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="Currency" />
          <button onClick={() => chapa.mutate()} className="rounded bg-indigo-600 px-4 py-2 text-white">Chapa</button>
          <input className="w-56 rounded border p-2" value={referenceId} onChange={(e) => setReferenceId(e.target.value)} placeholder="Local reference (receipt)" />
          <button onClick={() => localReq.mutate()} className="rounded bg-slate-900 px-4 py-2 text-white">Local Request</button>
        </div>
      </section>
    </main>
  );
}
