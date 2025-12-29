"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { bootstrapSession, useSession } from "@/lib/session";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useSession((s) => s.role);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    bootstrapSession();
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    
    // Initialize theme from localStorage
    const theme = localStorage.getItem('theme') || 'dark';
    setIsDark(theme === 'dark');
  }, [router]);

  useEffect(() => {
    // Guard: only ADMIN may access /admin
    if (role && role !== "ADMIN") {
      router.replace("/forbidden");
    }
  }, [role, router, pathname]);

  const onLogout = () => {
    try {
      // Clear token and session, then redirect
      localStorage.removeItem("auth_token");
    } finally {
      router.replace("/login");
    }
  };

  const toggleTheme = () => {
    try {
      const root = document.documentElement;
      const newIsDark = !isDark;
      setIsDark(newIsDark);
      
      root.classList.remove('theme-light', 'theme-dark');
      const next = newIsDark ? 'theme-dark' : 'theme-light';
      root.classList.add(next);
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
      
      // Set cookie for server-side rendering
      document.cookie = `theme=${newIsDark ? 'dark' : 'light'}; path=/; max-age=31536000`;
    } catch {}
  };

  return (
    <div className={isDark ? "min-h-screen bg-slate-900" : "min-h-screen bg-white"}>
      <header className={isDark ? "fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur" : "fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur"}>
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-rose-500 to-fuchsia-600" />
            <div>
              <div className={isDark ? "text-slate-100 font-bold" : "text-slate-900 font-bold"}>SabaHub Admin</div>
              <div className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>Control Panel</div>
            </div>
          </div>
          <nav className={isDark ? "hidden md:flex items-center gap-2 text-sm" : "hidden md:flex items-center gap-2 text-sm"}>
            <a className={isDark ? "mx-2 text-slate-300 hover:text-white" : "mx-2 text-slate-600 hover:text-slate-900"} href="/admin">Overview</a>
            <a className={isDark ? "mx-2 text-slate-300 hover:text-white" : "mx-2 text-slate-600 hover:text-slate-900"} href="/admin/analytics">Analytics</a>
            <a className={isDark ? "mx-2 text-slate-300 hover:text-white" : "mx-2 text-slate-600 hover:text-slate-900"} href="/admin/users">Users</a>
            <a className={isDark ? "mx-2 text-slate-300 hover:text-white" : "mx-2 text-slate-600 hover:text-slate-900"} href="/admin/disputes">CRP</a>
            <a className={isDark ? "mx-2 text-slate-300 hover:text-white" : "mx-2 text-slate-600 hover:text-slate-900"} href="/admin/content">CMP</a>
            <a className={isDark ? "mx-2 text-slate-300 hover:text-white" : "mx-2 text-slate-600 hover:text-slate-900"} href="/admin/audit-logs">Audit</a>
            <button onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme" className={isDark ? "ml-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors" : "ml-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-slate-700 hover:bg-gray-200 transition-colors"}>
              {isDark ? (
                // Sun icon for light mode
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                // Moon icon for dark mode
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            <button onClick={onLogout} className={isDark ? "ml-2 rounded bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700" : "ml-2 rounded bg-gray-200 px-3 py-1.5 text-slate-900 hover:bg-gray-300"}>Logout</button>
          </nav>
        </div>
      </header>
      <div className="pt-20">
        <aside className={isDark ? "fixed left-0 top-16 bottom-0 w-64 border-r border-slate-800 bg-slate-950/60 backdrop-blur overflow-y-auto" : "fixed left-0 top-16 bottom-0 w-64 border-r border-gray-200 bg-gray-50/60 backdrop-blur overflow-y-auto"}>
          <ul className={isDark ? "p-4 space-y-2 text-sm" : "p-4 space-y-2 text-sm"}>
            <li><a className={isDark ? "block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" : "block rounded px-3 py-2 text-slate-600 hover:bg-gray-200 hover:text-slate-900"} href="/admin">Dashboard</a></li>
            <li><a className={isDark ? "block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" : "block rounded px-3 py-2 text-slate-600 hover:bg-gray-200 hover:text-slate-900"} href="/admin/analytics">Analytics</a></li>
            <li><a className={isDark ? "block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" : "block rounded px-3 py-2 text-slate-600 hover:bg-gray-200 hover:text-slate-900"} href="/admin/users">Manage Users</a></li>
            <li><a className={isDark ? "block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" : "block rounded px-3 py-2 text-slate-600 hover:bg-gray-200 hover:text-slate-900"} href="/admin/jobs">Jobs Moderation</a></li>
            <li><a className={isDark ? "block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" : "block rounded px-3 py-2 text-slate-600 hover:bg-gray-200 hover:text-slate-900"} href="/admin/proposals">Proposals</a></li>
            <li><a className={isDark ? "block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" : "block rounded px-3 py-2 text-slate-600 hover:bg-gray-200 hover:text-slate-900"} href="/admin/transactions">Transactions</a></li>
            <li><a className={isDark ? "block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" : "block rounded px-3 py-2 text-slate-600 hover:bg-gray-200 hover:text-slate-900"} href="/admin/chat">Admin Chat</a></li>
            <li><a className={isDark ? "block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" : "block rounded px-3 py-2 text-slate-600 hover:bg-gray-200 hover:text-slate-900"} href="/admin/disputes">CRP (Disputes)</a></li>
            <li><a className={isDark ? "block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" : "block rounded px-3 py-2 text-slate-600 hover:bg-gray-200 hover:text-slate-900"} href="/admin/content">CMP (Content)</a></li>
            <li><a className={isDark ? "block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white" : "block rounded px-3 py-2 text-slate-600 hover:bg-gray-200 hover:text-slate-900"} href="/admin/audit-logs">Audit Logs</a></li>
          </ul>
        </aside>
        <main className={isDark ? "lg:ml-64 p-6 text-slate-100" : "lg:ml-64 p-6 text-slate-900"}>{children}</main>
      </div>
    </div>
  );
}
