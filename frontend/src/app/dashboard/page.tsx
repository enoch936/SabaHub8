"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, bootstrapSession } from "@/lib/session";
import { Card, Badge, Avatar, Progress } from "@/components/ui";

export default function DashboardPage() {
  const router = useRouter();
  const role = useSession((s) => s.role);

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) router.replace("/login");
  }, [router]);

  const stats = {
    ADMIN: [
      { label: "Platform", value: "Production", change: "Live", trend: "up" },
      { label: "Analytics", value: "Real-time", change: "Connected", trend: "up" },
      { label: "Escrow", value: "Active", change: "Secured", trend: "up" },
      { label: "Support", value: "24/7 Ready", change: "Available", trend: "neutral" },
    ],
    EMPLOYER: [
      { label: "Jobs", value: "Active Posts", change: "Ready", trend: "up" },
      { label: "Proposals", value: "Live Tracking", change: "Connected", trend: "up" },
      { label: "Payments", value: "Escrow Active", change: "Secured", trend: "up" },
      { label: "Contracts", value: "System Ready", change: "Live", trend: "up" },
    ],
    FREELANCER: [
      { label: "Bids", value: "Active", change: "Live", trend: "up" },
      { label: "Projects", value: "Connected", change: "Ready", trend: "up" },
      { label: "Earnings", value: "Wallet Active", change: "Secured", trend: "up" },
      { label: "Profile", value: "Verified", change: "Complete", trend: "up" },
    ],
  } as const;

  const quickActions = {
    ADMIN: [
      { href: "/dashboard/content", title: "Manage Content", icon: "📝", desc: "CMS & Settings" },
      { href: "/dashboard/disputes/admin", title: "Review Disputes", icon: "⚖️", desc: "Pending cases" },
      { href: "/dashboard/analytics", title: "Analytics", icon: "📊", desc: "View reports" },
      { href: "/dashboard/content/admin", title: "User Management", icon: "👥", desc: "Manage users" },
    ],
    EMPLOYER: [
      { href: "/dashboard/jobs/new", title: "Post a Job", icon: "➕", desc: "Create new project" },
      { href: "/dashboard/jobs", title: "My Jobs", icon: "💼", desc: "Manage postings" },
      { href: "/dashboard/contracts", title: "Contracts", icon: "📄", desc: "Active agreements" },
      { href: "/dashboard/wallet", title: "Fund Wallet", icon: "💳", desc: "Add balance" },
    ],
    FREELANCER: [
      { href: "/dashboard/jobs", title: "Browse Jobs", icon: "🔍", desc: "Find work" },
      { href: "/dashboard/proposals", title: "My Proposals", icon: "📬", desc: "Track applications" },
      { href: "/dashboard/contracts", title: "Active Work", icon: "⚡", desc: "Current projects" },
      { href: "/dashboard/wallet", title: "Earnings", icon: "💰", desc: "View balance" },
    ],
  };

  const recentActivity = [
    { type: "status", title: "Real-time activity feed is now live.", time: "Connected", user: "", amount: "" },
  ];

  const currentStats = stats[role as keyof typeof stats] || stats.FREELANCER;
  const actions = quickActions[role as keyof typeof quickActions] || quickActions.FREELANCER;

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
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">Dashboard</span>
              {role && (
                <Badge variant="info" size="md" className="ml-3 align-middle">
                  {role}
                </Badge>
              )}
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Real-time platform metrics and analytics dashboard.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 px-3 py-2 transition hover:border-sky-300 hover:bg-sky-50/80 dark:hover:bg-slate-800"
            >
              <span className="sr-only">Messages</span>
              <svg className="h-5 w-5 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">3</span>
            </Link>
            <Link
              href="/dashboard/notifications"
              className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 px-3 py-2 transition hover:border-sky-300 hover:bg-sky-50/80 dark:hover:bg-slate-800"
            >
              <span className="sr-only">Notifications</span>
              <svg className="h-5 w-5 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">7</span>
            </Link>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {currentStats.map((stat) => (
            <Card
              key={stat.label}
              variant="elevated"
              className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</span>
                <Badge variant="default" size="sm">{stat.change || "Live"}</Badge>
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="mt-3">
                <Progress value={0} size="sm" variant="default" />
              </div>
            </Card>
          ))}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
              <Link key={action.href} href={action.href} className="block">
                <Card
                  hover
                  className="group p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/70 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-3 text-4xl transition-transform group-hover:scale-110 group-hover:-rotate-1">{action.icon}</div>
                  <h3 className="mb-1 font-semibold text-slate-900 dark:text-white transition group-hover:text-sky-600">
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{action.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Activity */}
          <section className="lg:col-span-2">
            <Card className="p-0 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/70 shadow-sm">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur px-6 py-4 rounded-t-2xl">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
                <Link href="/dashboard/analytics/audit-logs" className="text-sm font-medium text-sky-600 hover:text-sky-700">
                  View All →
                </Link>
              </div>
              <div className="p-6 space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-4 transition bg-white/90 dark:bg-slate-900/60">
                    <Avatar src="" fallback={activity.user?.charAt(0) || "A"} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{activity.title}</p>
                        <Badge variant="default" size="sm">{activity.type}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {activity.user && `by ${activity.user} • `}
                        {activity.time}
                      </p>
                      {activity.amount && (
                        <p className="mt-1 font-semibold text-emerald-600">{activity.amount}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Quick Stats Sidebar */}
          <section className="space-y-6">
            <Card className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/70 shadow-sm">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Profile Completion</h3>
              <Progress value={0} label="Complete your profile after API wiring" variant="default" />
              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>Profile status will update once authentication and profile APIs are connected.</p>
              </div>
            </Card>

            <Card className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/70 shadow-sm">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { href: "/dashboard/wallet", label: "Wallet", icon: "💳" },
                  { href: "/chat", label: "Messages", icon: "💬" },
                  { href: "/dashboard/disputes", label: "Disputes", icon: "⚖️" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg border border-transparent p-3 text-sm transition hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{link.label}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
