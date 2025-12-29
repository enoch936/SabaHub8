"use client";

import { useEffect, useState } from "react";
import { adminListJobs, adminPatchJob, type Job } from "@/lib/api";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListJobs(status);
      setJobs(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const patch = async (id: string, status: Job["status"]) => {
    try {
      setSavingId(id);
      await adminPatchJob(id, { status });
      await load(filter || undefined);
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Action failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs Moderation</h1>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); load(e.target.value || undefined); }}
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
          >
            <option value="">All</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button onClick={() => load(filter || undefined)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700">Reload</button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-700 bg-rose-900/20 p-3 text-rose-200 text-sm">{error}</div>}

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
            ) : jobs.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No jobs</td></tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 align-top">{j.title}</td>
                  <td className="px-4 py-3 align-top">{j.status}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      {(["OPEN","IN_PROGRESS","COMPLETED","CANCELLED"] as Job["status"][]).map((s) => (
                        <button
                          key={s}
                          disabled={savingId === j.id || j.status === s}
                          onClick={() => patch(j.id, s)}
                          className={`rounded-md border px-2 py-1 text-xs ${j.status === s ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-400" : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"}`}
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
