"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { bootstrapSession, useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Input, Select, Table } from "@/components/ui";

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
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-slate-600">Security-sensitive actions trace</p>
        </div>
        <div className="flex items-center gap-2">
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
        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-rose-700">
          Failed to load audit logs. Ensure backend exposes GET /api/admin/audit-logs with params: action, entityType, actorUserId, page, size.
        </div>
      )}

      <section className="space-y-3">
        <Table columns={columns} rows={query.data?.items ?? []} />
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">Total: {query.data?.total ?? 0}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
            <div className="text-sm">Page {page + 1}</div>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={(query.data?.items?.length ?? 0) < size}>Next</Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Details</h2>
        <p className="text-sm text-slate-700">Click a row to inspect metadata in console for now.</p>
        <p className="text-xs text-slate-500">You can enhance this to open a modal and render JSON pretty-view.</p>
      </section>
    </main>
  );
}
