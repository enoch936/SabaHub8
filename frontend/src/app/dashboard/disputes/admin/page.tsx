"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminPatchDispute, listDisputes } from "@/lib/api";
import { bootstrapSession, useSession } from "@/lib/session";

export default function DisputesAdminPage() {
  const router = useRouter();
  const role = useSession((s) => s.role);
  const qc = useQueryClient();

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) router.replace("/login");
  }, [router]);

  // Guard: Admin only
  useEffect(() => {
    if (role && role !== "ADMIN") router.replace("/dashboard");
  }, [role, router]);

  const disputes = useQuery({ queryKey: ["admin-disputes"], queryFn: listDisputes, enabled: role === "ADMIN" });

  const patch = useMutation({
    mutationFn: (vars: { id: string; status?: string; adminNote?: string }) => adminPatchDispute(vars.id, { status: vars.status, adminNote: vars.adminNote }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-disputes"] }),
  });

  const [filter, setFilter] = useState<string>("");
  const filtered = useMemo(() => {
    if (!disputes.data) return [] as any[];
    if (!filter) return disputes.data;
    return disputes.data.filter((d: any) => d.status?.toLowerCase().includes(filter.toLowerCase()) || d.id?.includes(filter));
  }, [disputes.data, filter]);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Disputes — Admin</h1>
          <p className="text-slate-600">Moderate and resolve disputes</p>
        </div>
        <input className="w-64 rounded border p-2" placeholder="Filter by status or id" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </header>

      {disputes.isLoading && <p>Loading...</p>}
      {disputes.error && <p className="text-rose-600">Failed to load disputes</p>}

      <section className="space-y-3">
        {filtered.map((d: any) => (
          <DisputeItem key={d.id} d={d} onPatch={(status, note) => patch.mutate({ id: d.id, status, adminNote: note })} isPending={patch.isPending} />
        ))}
        {filtered.length === 0 && !disputes.isLoading && <p className="text-slate-600">No disputes</p>}
      </section>
    </main>
  );
}

function DisputeItem({ d, onPatch, isPending }: { d: any; onPatch: (status?: string, note?: string) => void; isPending: boolean }) {
  const [status, setStatus] = useState<string>(d.status || "");
  const [note, setNote] = useState<string>("");

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{d.id}</p>
          <p className="text-sm text-slate-600">Contract: {d.contractId}</p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-sm">{d.status}</span>
      </div>
      {d.reason && <p className="mt-2 text-sm text-slate-700">{d.reason}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select className="rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="OPEN">OPEN</option>
          <option value="INVESTIGATING">INVESTIGATING</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <input className="min-w-64 flex-1 rounded border p-2" placeholder="Admin note" value={note} onChange={(e) => setNote(e.target.value)} />
        <button disabled={isPending} onClick={() => onPatch(status, note)} className="rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-60">Update</button>
      </div>
    </div>
  );
}
