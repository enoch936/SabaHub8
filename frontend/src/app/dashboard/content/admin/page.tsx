"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCreateContent, adminUpdateContent, listContent } from "@/lib/api";
import { bootstrapSession, useSession } from "@/lib/session";
import Image from "next/image";
import { Badge, Button, Input, Select, Textarea } from "@/components/ui";

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
    <main className="relative mx-auto max-w-6xl p-6 pb-12 space-y-6">
      <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/images/backgrounds/geo-light-grid.svg')" }} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,233,0.22),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.22),transparent_40%),radial-gradient(circle_at_45%_80%,rgba(52,211,153,0.18),transparent_35%)]" />

      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner">
            <Image src="/images/badges/verified.png" alt="verified" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Content — Admin</h1>
            <p className="text-slate-600">Manage items in sandbox mode.</p>
          </div>
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option>FAQ</option>
          <option>PAGE</option>
          <option>BLOG</option>
          <option>CATEGORY</option>
          <option>ANNOUNCEMENT</option>
        </Select>
      </header>

      <section className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg text-slate-900">Create new</h2>
          <Badge variant="outline" className="bg-amber-50/80 text-amber-700">Sandbox only</Badge>
        </div>
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea rows={6} placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </Select>
          <Button onClick={() => create.mutate({ type, title, body, status })} disabled={create.isPending}>Create</Button>
          {create.isPending && <span className="text-sm text-slate-600">Saving…</span>}
        </div>
        <p className="text-xs text-slate-500">Actions write to beta APIs; connect production CMS before publishing externally.</p>
      </section>

      <section className="rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Existing</h2>
          <Badge variant="outline" className="bg-slate-100 text-slate-700">Demo data</Badge>
        </div>
        {content.isLoading && <p className="text-slate-700">Loading...</p>}
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
    <li className="rounded-2xl border border-white/20 bg-white/75 p-4 shadow-inner shadow-sky-500/10 backdrop-blur space-y-2">
      <div className="flex items-center justify-between">
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{item.type}</span>
        <span className="text-xs text-slate-500">{item.id}</span>
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </Select>
        <Button onClick={() => onUpdate({ title, body, status })}>Save</Button>
      </div>
    </li>
  );
}
