"use client";

import { useEffect, useState } from "react";
import { adminListUsers, adminPatchUser, type AppUser } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const patch = async (id: string, body: Partial<AppUser>) => {
    try {
      setSavingId(id);
      const updated = await adminPatchUser(id, body);
      setUsers((s) => s.map((u) => (u.id === id ? updated : u)));
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Action failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <button onClick={load} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700">Reload</button>
      </div>

      {error && <div className="rounded-lg border border-rose-700 bg-rose-900/20 p-3 text-rose-200 text-sm">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="min-w-full text-sm text-slate-200">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Roles</th>
              <th className="px-4 py-3 text-left font-semibold">Suspended</th>
              <th className="px-4 py-3 text-left font-semibold">Docs Verified</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No users</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 align-top">{u.email}</td>
                  <td className="px-4 py-3 align-top">{u.fullName}</td>
                  <td className="px-4 py-3 align-top text-xs text-slate-400">{u.roles?.join(", ")}</td>
                  <td className="px-4 py-3 align-top">{u.suspended ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 align-top">{u.documentsVerified ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={savingId === u.id}
                        onClick={() => patch(u.id, { suspended: !u.suspended })}
                        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                      >
                        {u.suspended ? "Unsuspend" : "Suspend"}
                      </button>
                      <button
                        disabled={savingId === u.id}
                        onClick={() => patch(u.id, { documentsVerified: !u.documentsVerified })}
                        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                      >
                        {u.documentsVerified ? "Unverify Docs" : "Verify Docs"}
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
