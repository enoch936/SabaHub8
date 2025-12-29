"use client";

import { useEffect, useMemo, useState } from "react";
import { listDisputes, adminPatchDispute, type Dispute } from "@/lib/api";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDisputes();
      setDisputes(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onUpdate = async (id: string, status: Dispute["status"]) => {
    try {
      setSavingId(id);
      const note = notes[id]?.trim();
      await adminPatchDispute(id, note ? { status, adminNote: note } : { status });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Update failed");
    } finally {
      setSavingId(null);
    }
  };

  const statusColor = (s?: string) => {
    switch (s) {
      case "OPEN": return "bg-amber-500/20 text-amber-300 border-amber-600/50";
      case "INVESTIGATING": return "bg-sky-500/20 text-sky-300 border-sky-600/50";
      case "RESOLVED": return "bg-emerald-500/20 text-emerald-300 border-emerald-600/50";
      case "CLOSED": return "bg-slate-500/20 text-slate-300 border-slate-600/50";
      default: return "bg-slate-500/20 text-slate-300 border-slate-600/50";
    }
  };

  const statuses: Array<Dispute["status"]> = useMemo(() => [
    "OPEN",
    "INVESTIGATING",
    "RESOLVED",
    "CLOSED",
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">CRP – Disputes</h1>
        <button onClick={load} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700">Reload</button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700 bg-rose-900/20 p-3 text-rose-200 text-sm">{error}</div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="min-w-full text-sm text-slate-200">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Contract</th>
              <th className="px-4 py-3 text-left font-semibold">Reason</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Note</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading...</td>
              </tr>
            ) : disputes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">No disputes</td>
              </tr>
            ) : (
              disputes.map((d) => (
                <tr key={d.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 align-top font-mono text-xs text-slate-400">{d.id}</td>
                  <td className="px-4 py-3 align-top">{d.contractId}</td>
                  <td className="px-4 py-3 align-top max-w-md">
                    <div className="text-slate-200">{d.reason || "—"}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`inline-flex items-center gap-2 rounded border px-2 py-0.5 text-xs ${statusColor(d.status)}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      value={notes[d.id] ?? ""}
                      onChange={(e) => setNotes((s) => ({ ...s, [d.id]: e.target.value }))}
                      placeholder="Admin note (optional)"
                      className="w-56 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      {statuses.map((s) => (
                        <button
                          key={s}
                          disabled={savingId === d.id || d.status === s}
                          onClick={() => onUpdate(d.id, s)}
                          className={`rounded-md px-2 py-1 text-xs border transition ${
                            d.status === s
                              ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-400"
                              : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
