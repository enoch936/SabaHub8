"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { bootstrapSession, useSession } from "@/lib/session";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useSession((s) => s.role);

  useEffect(() => {
    bootstrapSession();
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    // Guard: only ADMIN may access /admin
    if (role && role !== "ADMIN") {
      router.replace("/forbidden");
    }
  }, [role, router, pathname]);

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-rose-500 to-fuchsia-600" />
            <div>
              <div className="text-slate-100 font-bold">SabaHub Admin</div>
              <div className="text-xs text-slate-400">Control Panel</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a className="text-slate-300 hover:text-white" href="/admin">Overview</a>
            <a className="text-slate-300 hover:text-white" href="/admin/analytics">Analytics</a>
            <a className="text-slate-300 hover:text-white" href="/admin/users">Users</a>
            <a className="text-slate-300 hover:text-white" href="/admin/disputes">CRP</a>
            <a className="text-slate-300 hover:text-white" href="/admin/content">CMP</a>
            <a className="text-slate-300 hover:text-white" href="/admin/audit-logs">Audit</a>
          </nav>
        </div>
      </header>
      <div className="pt-20">
        <aside className="fixed left-0 top-16 bottom-0 w-64 border-r border-slate-800 bg-slate-950/60 backdrop-blur overflow-y-auto">
          <ul className="p-4 space-y-2 text-sm">
            <li><a className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" href="/admin">Dashboard</a></li>
            <li><a className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" href="/admin/analytics">Analytics</a></li>
            <li><a className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" href="/admin/users">Manage Users</a></li>
            <li><a className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" href="/admin/jobs">Jobs Moderation</a></li>
            <li><a className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" href="/admin/proposals">Proposals</a></li>
            <li><a className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" href="/admin/transactions">Transactions</a></li>
            <li><a className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" href="/admin/chat">Admin Chat</a></li>
            <li><a className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" href="/admin/disputes">CRP (Disputes)</a></li>
            <li><a className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" href="/admin/content">CMP (Content)</a></li>
            <li><a className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" href="/admin/audit-logs">Audit Logs</a></li>
          </ul>
        </aside>
        <main className="lg:ml-64 p-6 text-slate-100">{children}</main>
      </div>
    </div>
  );
}
