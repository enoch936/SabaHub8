"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminReviewLocal, listPendingLocalTopups } from "@/lib/api";

export default function AdminTransactionsPage() {
  const qc = useQueryClient();
  const [txId, setTxId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  const pending = useQuery({
    queryKey: ["admin-local-topups-pending"],
    queryFn: () => listPendingLocalTopups({ page: 0, size: 50 }),
    refetchInterval: 20000,
  });

  const review = useMutation({
    mutationFn: (input: { transactionId: string; approved: boolean; note?: string }) =>
      adminReviewLocal(input, crypto.randomUUID()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-local-topups-pending"] }),
  });

  const verify = async () => {
    try {
      setLoading(true);
      const res = await adminReviewLocal(
        {
          transactionId: txId,
          approved: true,
          note: note.trim() || undefined,
        },
        crypto.randomUUID()
      );
      alert(res.ok ? "Verified and credited" : "Failed");
      setTxId("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["admin-local-topups-pending"] });
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Verify failed");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (label: string, value: string) => {
    if (!value) return;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (typeof document !== "undefined") {
        const el = document.createElement("textarea");
        el.value = value;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      } else {
        throw new Error("Clipboard unavailable");
      }
      setCopyFeedback({ text: `${label} copied.`, tone: "success" });
      window.setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback({ text: `Unable to copy ${label.toLowerCase()}.`, tone: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions & Escrow</h1>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
        <div className="font-semibold">Pending Local Top-ups (Admin Approval Queue)</div>
        {copyFeedback && (
          <div className={`text-xs ${copyFeedback.tone === "success" ? "text-emerald-400" : "text-rose-400"}`}>
            {copyFeedback.text}
          </div>
        )}

        {pending.isLoading && <div className="text-sm text-slate-400">Loading pending requests...</div>}
        {pending.error && (
          <div className="text-sm text-rose-400">
            Failed to load pending requests: {(pending.error as any)?.response?.data?.error || (pending.error as any)?.message}
          </div>
        )}

        {!pending.isLoading && !pending.error && (
          <div className="space-y-3">
            {(pending.data?.content ?? []).length === 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-400">
                No pending local top-up requests.
              </div>
            )}

            {(pending.data?.content ?? []).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-100">
                      {item.amount} {item.currency} • {item.status}
                    </p>
                    <p className="text-xs text-slate-400">User ID</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        readOnly
                        value={item.userId}
                        onFocus={(e) => e.currentTarget.select()}
                        className="w-[360px] max-w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => copyText("User ID", item.userId)}
                        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Copy User ID
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">Transaction ID</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        readOnly
                        value={item.id}
                        onFocus={(e) => e.currentTarget.select()}
                        className="w-[360px] max-w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => copyText("Transaction ID", item.id)}
                        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Copy Tx ID
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">Reference: {item.providerRef || "N/A"}</p>
                    <p className="text-xs text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={review.isPending}
                      onClick={() => review.mutate({ transactionId: item.id, approved: true })}
                      className="rounded-lg border border-emerald-700 bg-emerald-900/40 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-900/60"
                    >
                      Approve
                    </button>
                    <button
                      disabled={review.isPending}
                      onClick={() => review.mutate({ transactionId: item.id, approved: false })}
                      className="rounded-lg border border-rose-700 bg-rose-900/40 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-900/60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <div className="font-semibold">Manual Verify by Transaction ID</div>
        <div className="flex items-center gap-2">
          <input
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="Transaction ID"
            className="w-80 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Admin note (optional)"
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
        {review.error && (
          <div className="text-xs text-rose-400">
            {(review.error as any)?.response?.data?.error || (review.error as any)?.message || "Review failed"}
          </div>
        )}
      </div>
    </div>
  );
}
