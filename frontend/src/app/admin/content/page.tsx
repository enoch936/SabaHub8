"use client";

import { useEffect, useState } from "react";
import { adminCreateContent, adminUpdateContent, listContent, type ContentItem } from "@/lib/api";

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<ContentItem>>({ type: "FAQ", title: "", body: "", status: "PUBLISHED" });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listContent("FAQ");
      setItems(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      setCreating(true);
      const created = await adminCreateContent(draft);
      setItems((s) => [created, ...s]);
      setDraft({ type: "FAQ", title: "", body: "", status: "PUBLISHED" });
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const save = async (id: string, patch: Partial<ContentItem>) => {
    try {
      const updated = await adminUpdateContent(id, patch);
      setItems((s) => s.map((it) => (it.id === id ? updated : it)));
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Update failed");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">CMP – Content Management</h1>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <div className="font-semibold">Create FAQ</div>
        <div className="grid grid-cols-1 gap-2">
          <input
            value={draft.title || ""}
            onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
            placeholder="Title"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
          />
          <textarea
            value={draft.body || ""}
            onChange={(e) => setDraft((s) => ({ ...s, body: e.target.value }))}
            placeholder="Body"
            className="min-h-[100px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
          />
          <button
            disabled={creating}
            onClick={create}
            className="w-fit rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-700 bg-rose-900/20 p-3 text-rose-200 text-sm">{error}</div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <table className="min-w-full text-sm text-slate-200">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No content</td></tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 align-top">{it.title}</td>
                  <td className="px-4 py-3 align-top">
                    <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs">{it.status}</span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-2">
                      <button
                        onClick={() => save(it.id, { status: it.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })}
                        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                      >
                        Toggle Publish
                      </button>
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
