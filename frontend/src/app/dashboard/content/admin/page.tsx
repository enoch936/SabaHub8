"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCreateContent, adminUpdateContent, listContent } from "@/lib/api";
import { bootstrapSession, useSession } from "@/lib/session";

export default function ContentAdminPage() {
  const router = useRouter();
  const role = useSession((s) => s.role);
  const qc = useQueryClient();

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (role && role !== "ADMIN") router.replace("/dashboard");
  }, [role, router]);

  const [type, setType] = useState("FAQ");
  const content = useQuery({ queryKey: ["content-admin", type], queryFn: () => listContent(type), enabled: role === "ADMIN" });

  const create = useMutation({
    mutationFn: (body: any) => adminCreateContent(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-admin", type] }),
  });
  const update = useMutation({
    mutationFn: (vars: { id: string; body: any }) => adminUpdateContent(vars.id, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-admin", type] }),
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("DRAFT");

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content — Admin</h1>
          <p className="text-slate-600">Manage content items</p>
        </div>
        <select className="rounded border p-2" value={type} onChange={(e) => setType(e.target.value)}>
          <option>FAQ</option>
          <option>PAGE</option>
          <option>BLOG</option>
          <option>CATEGORY</option>
          <option>ANNOUNCEMENT</option>
        </select>
      </header>

      <section className="rounded-xl border p-4 space-y-2">
        <h2 className="font-semibold">Create new</h2>
        <input className="w-full rounded border p-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full rounded border p-2" rows={5} placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex items-center gap-2">
          <select className="rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
          <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={() => create.mutate({ type, title, body, status })}>Create</button>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Existing</h2>
        {content.isLoading && <p>Loading...</p>}
        {content.error && <p className="text-rose-600">Failed to load</p>}
        <ul className="space-y-3">
          {content.data?.map((c) => (
            <ContentItem key={c.id} item={c} onUpdate={(patch) => update.mutate({ id: c.id, body: patch })} />
          ))}
          {(!content.data || content.data.length === 0) && <p className="text-slate-600">No content</p>}
        </ul>
      </section>
    </main>
  );
}

function ContentItem({ item, onUpdate }: { item: any; onUpdate: (patch: any) => void }) {
  const [title, setTitle] = useState(item.title || "");
  const [body, setBody] = useState(item.body || "");
  const [status, setStatus] = useState(item.status || "DRAFT");
  return (
    <li className="rounded border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="rounded bg-slate-100 px-2 py-1 text-xs">{item.type}</span>
        <span className="text-xs text-slate-600">{item.id}</span>
      </div>
      <input className="w-full rounded border p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="w-full rounded border p-2" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex items-center gap-2">
        <select className="rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </select>
        <button className="rounded bg-sky-600 px-3 py-2 text-white" onClick={() => onUpdate({ title, body, status })}>Save</button>
      </div>
    </li>
  );
}
