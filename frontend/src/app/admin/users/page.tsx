"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, bootstrapSession } from "@/lib/session";
import {
  adminListUsers,
  adminPatchUser,
  searchUsersByName,
  searchUserByEmail,
  listAllUsers,
  type AppUser,
} from "@/lib/api";
import { Card, Badge } from "@/components/ui";

export default function AdminUsersPage() {
  const router = useRouter();
  const role = useSession((s) => s.role);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    bootstrapSession();
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!role) return;
    if (role !== "ADMIN") {
      router.replace("/forbidden");
      return;
    }
    loadUsers();
  }, [role]);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      let data = await adminListUsers();
      if (!data || data.length === 0) {
        const fallback = await listAllUsers(100);
        data = fallback?.users ?? [];
      }
      setUsers(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      await loadUsers();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Try email search first
      if (query.includes("@")) {
        const u = await searchUserByEmail(query.trim());
        setUsers(u ? [u] : []);
      } else {
        const res = await searchUsersByName(query.trim());
        setUsers(res?.results ?? []);
      }
      setPage(1);
    } catch (e: any) {
      setError("No results");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, page]);

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));

  async function updateUser(id: string, patch: Partial<AppUser>) {
    try {
      const updated = await adminPatchUser(id, patch);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    } catch (e: any) {
      setError(e?.message || "Update failed");
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-white dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">Manage Users</span>
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Search, edit roles, and deactivate accounts.</p>
          </div>
          <form onSubmit={onSearch} className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
            <button className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">Search</button>
            <button type="button" onClick={loadUsers} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Reset</button>
          </form>
        </header>

        <Card className="p-0 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/70 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 px-4 py-3">
            <div className="text-sm text-slate-600 dark:text-slate-400">{users.length} users</div>
            {error && <div className="text-sm text-rose-600">{error}</div>}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 dark:text-slate-300">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">Loading...</td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">No users found</td>
                  </tr>
                ) : (
                  paged.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{u.fullName || "—"}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(u.roles || []).map((r) => (
                            <Badge key={r} size="sm" className="capitalize">{r.toLowerCase()}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.suspended ? (
                          <Badge variant="danger" size="sm">Suspended</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Active</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => updateUser(u.id, { suspended: !u.suspended })}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${u.suspended ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-rose-600 text-white hover:bg-rose-700"}`}
                          >
                            {u.suspended ? "Activate" : "Suspend"}
                          </button>
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 px-4 py-3 text-sm">
            <div className="text-slate-600 dark:text-slate-400">Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
