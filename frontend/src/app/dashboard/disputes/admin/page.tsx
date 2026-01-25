"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminPatchDispute, listDisputes } from "@/lib/api";
import { bootstrapSession, useSession } from "@/lib/session";
import Image from "next/image";
import { Badge, Button, Input, Select, Textarea } from "@/components/ui";

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
    <main className="relative mx-auto max-w-6xl p-6 pb-12 space-y-6">
      <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/images/backgrounds/geo-light-grid.svg')" }} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.2),transparent_45%),radial-gradient(circle_at_80%_5%,rgba(99,102,241,0.2),transparent_40%),radial-gradient(circle_at_45%_85%,rgba(16,185,129,0.16),transparent_35%)]" />

      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner">
            <Image src="/images/badges/secure.png" alt="secure badge" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Disputes — Admin</h1>
            <p className="text-slate-600">Moderate and resolve — sandbox data only.</p>
          </div>
        </div>
        <Input className="w-64" placeholder="Filter by status or id" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </header>

      {disputes.isLoading && <p className="text-slate-700">Loading...</p>}
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
    <div className="rounded-2xl border border-white/20 bg-white/85 p-5 shadow-xl shadow-sky-500/10 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{d.id}</p>
          <p className="text-sm text-slate-600">Contract: {d.contractId}</p>
        </div>
        <Badge variant="outline" className="bg-slate-100 text-slate-700">{d.status}</Badge>
      </div>
      {d.reason && <p className="mt-2 text-sm text-slate-700">{d.reason}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="OPEN">OPEN</option>
          <option value="INVESTIGATING">INVESTIGATING</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </Select>
        <Textarea className="min-w-64 flex-1" rows={2} placeholder="Admin note" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button disabled={isPending} onClick={() => onPatch(status, note)} variant="secondary">Update</Button>
      </div>
      <p className="mt-2 text-xs text-slate-500">All actions are logged and auditable. Sensitive information is encrypted and secure.</p>
    </div>
  );
}
