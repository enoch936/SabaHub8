"use client";

import { useState } from "react";
import { adminVerifyLocal } from "@/lib/api";

export default function AdminTransactionsPage() {
  const [txId, setTxId] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    try {
      setLoading(true);
      const res = await adminVerifyLocal({ transactionId: txId });
      alert(res.ok ? "Verified and credited" : "Failed");
      setTxId("");
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Verify failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions & Escrow</h1>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <div className="font-semibold">Verify Local Top-up</div>
        <div className="flex items-center gap-2">
          <input
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="Transaction ID"
            className="w-80 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
          />
          <button
            disabled={loading || !txId}
            onClick={verify}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}
