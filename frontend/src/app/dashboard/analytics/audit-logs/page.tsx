"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { bootstrapSession, useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Badge, Button, Input, Select, Table } from "@/components/ui";
import Image from "next/image";

export default function AuditLogsPage() {
  const router = useRouter();
  const role = useSession((s) => s.role);

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) router.replace("/login");
  }, [router]);

  // Admin-only guard
  useEffect(() => {
    if (role && role !== "ADMIN") router.replace("/dashboard");
  }, [role, router]);

  const [action, setAction] = useState<string>("");
  const [entityType, setEntityType] = useState<string>("");
  const [actorUserId, setActorUserId] = useState<string>("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const params = useMemo(() => ({ action, entityType, actorUserId, page, size }), [action, entityType, actorUserId, page, size]);

  const query = useQuery({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/audit-logs", { params });
      // Expected format: { items: AuditLog[], total: number }
      return data as { items: any[]; total: number };
    },
    enabled: role === "ADMIN",
  });

  const columns = [
    { key: "createdAt", header: "Time" },
    { key: "actorUserId", header: "Actor" },
    { key: "action", header: "Action" },
    { key: "entity", header: "Entity", render: (r: any) => `${r.entityType}:${r.entityId}` },
    { key: "ip", header: "IP" },
    { key: "userAgent", header: "UA" },
  ];

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
            <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
            <p className="text-slate-600">Complete audit trail of all security-sensitive platform actions.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Actor User ID" value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} />
          <Input placeholder="Action" value={action} onChange={(e) => setAction(e.target.value)} />
          <Input placeholder="Entity Type" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
          <Select value={String(size)} onChange={(e) => { setPage(0); setSize(Number(e.target.value)); }}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </Select>
          <Button onClick={() => query.refetch()}>Apply</Button>
        </div>
      </header>

      {query.isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          Failed to load audit logs. Ensure backend exposes GET /api/admin/audit-logs with params: action, entityType, actorUserId, page, size.
        </div>
      )}

      <section className="rounded-2xl border border-white/20 bg-white/85 p-4 shadow-xl shadow-sky-500/10 backdrop-blur space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">Total: {query.data?.total ?? 0}</div>
          <Badge variant="warning">Prototype view</Badge>
        </div>
        <Table columns={columns} rows={query.data?.items ?? []} />
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">Page {page + 1}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={(query.data?.items?.length ?? 0) < size}>Next</Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/20 bg-white/80 p-4 shadow-xl shadow-sky-500/10 backdrop-blur">
        <h2 className="mb-2 font-semibold text-slate-900">Details</h2>
        <p className="text-sm text-slate-700">Click a row to inspect metadata in console for now.</p>
        <p className="text-xs text-slate-500">Detailed audit logs with PII protection and compliance-ready export functionality.</p>
      </section>
    </main>
  );
}
