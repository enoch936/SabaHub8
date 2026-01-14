"use client";

import Link from "next/link";
import { Card, Badge, Progress } from "@/components/ui";

export default function AdminHome() {
  const kpis = [
    { label: "Users", value: "--", badge: "beta" },
    { label: "Jobs", value: "--", badge: "beta" },
    { label: "Revenue", value: "--", badge: "beta" },
    { label: "Active Disputes", value: "--", badge: "beta" },
  ];

  const quick = [
    { href: "/dashboard/content", title: "Manage Content", icon: "📝", desc: "CMS & Settings" },
    { href: "/dashboard/disputes/admin", title: "Review Disputes", icon: "⚖️", desc: "Pending cases" },
    { href: "/dashboard/analytics", title: "Analytics", icon: "📊", desc: "View reports" },
    { href: "/dashboard/content/admin", title: "Users", icon: "👥", desc: "User management" },
  ];

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-white dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100">
      {/* Backgrounds */}
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
        <img src="/images/backgrounds/aurora-blur.svg" alt="Aurora" className="h-full w-full object-cover opacity-60 dark:opacity-50" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <img src="/images/backgrounds/geo-light-grid.svg" alt="Grid" className="h-full w-full object-cover opacity-40 dark:opacity-30" />
      </div>

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">Admin Dashboard</span>
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Enterprise view — core admin modules are in beta.</p>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card
              key={k.label}
              className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{k.label}</span>
                <Badge size="sm">{k.badge}</Badge>
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white">{k.value}</div>
              <div className="mt-3">
                <Progress value={0} size="sm" />
              </div>
            </Card>
          ))}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quick.map((q) => (
              <Link key={q.href} href={q.href} className="block">
                <Card className="group p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/70 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-3 text-4xl transition-transform group-hover:scale-110 group-hover:-rotate-1">{q.icon}</div>
                  <h3 className="mb-1 font-semibold text-slate-900 dark:text-white transition group-hover:text-sky-600">{q.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{q.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Announcement */}
        <section>
          <Card className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/70 shadow-sm">
            <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Announcements</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Post broadcasts to all users via Admin Chat.</p>
          </Card>
        </section>
      </div>
    </main>
  );
}
