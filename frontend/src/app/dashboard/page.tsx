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

  // Mock data - replace with real API calls
  const stats = {
    ADMIN: [
      { label: "Total Users", value: "2,543", change: "+12%", trend: "up" },
      { label: "Active Jobs", value: "186", change: "+8%", trend: "up" },
      { label: "Revenue", value: "$48.2K", change: "+23%", trend: "up" },
      { label: "Disputes", value: "12", change: "-5%", trend: "down" },
    ],
    EMPLOYER: [
      { label: "Active Jobs", value: "8", change: "+2", trend: "up" },
      { label: "Proposals", value: "34", change: "+12", trend: "up" },
      { label: "Total Spent", value: "$12.4K", change: "+$2.3K", trend: "up" },
      { label: "Active Contracts", value: "5", change: "0", trend: "neutral" },
    ],
    FREELANCER: [
      { label: "Active Bids", value: "6", change: "+2", trend: "up" },
      { label: "Won Projects", value: "23", change: "+3", trend: "up" },
      { label: "Total Earned", value: "$18.7K", change: "+$4.2K", trend: "up" },
      { label: "Success Rate", value: "94%", change: "+2%", trend: "up" },
    ],
  };

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
    { type: "job", title: "New proposal received", time: "5 min ago", user: "John Doe" },
    { type: "payment", title: "Payment released", time: "2 hours ago", amount: "$250" },
    { type: "contract", title: "Contract started", time: "1 day ago", user: "Jane Smith" },
    { type: "message", title: "New message", time: "3 days ago", user: "Mike Wilson" },
  ];

  const currentStats = stats[role as keyof typeof stats] || stats.FREELANCER;
  const actions = quickActions[role as keyof typeof quickActions] || quickActions.FREELANCER;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Dashboard
              {role && (
                <Badge variant="info" size="md" className="ml-3 align-middle">
                  {role}
                </Badge>
              )}
            </h1>
            <p className="mt-1 text-slate-600">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="relative rounded-xl border-2 border-slate-200 bg-white p-3 transition hover:border-sky-300 hover:bg-sky-50"
            >
              <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                3
              </span>
            </Link>
            <Link
              href="/dashboard/notifications"
              className="relative rounded-xl border-2 border-slate-200 bg-white p-3 transition hover:border-sky-300 hover:bg-sky-50"
            >
              <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                7
              </span>
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {currentStats.map((stat) => (
            <Card key={stat.label} variant="elevated" className="p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">{stat.label}</span>
                <Badge
                  variant={stat.trend === "up" ? "success" : stat.trend === "down" ? "danger" : "default"}
                  size="sm"
                >
                  {stat.change}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="mt-3">
                <Progress value={75} size="sm" variant={stat.trend === "up" ? "success" : "default"} />
              </div>
            </Card>
          ))}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card hover className="group p-6">
                  <div className="mb-3 text-4xl">{action.icon}</div>
                  <h3 className="mb-1 font-semibold text-slate-900 group-hover:text-sky-600 transition">
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-600">{action.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Activity */}
          <section className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
                <Link href="/dashboard/analytics/audit-logs" className="text-sm font-medium text-sky-600 hover:text-sky-700">
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                    <Avatar
                      src=""
                      fallback={activity.user?.charAt(0) || "A"}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 truncate">{activity.title}</p>
                        <Badge variant="default" size="sm">
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
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
            <Card className="p-6">
              <h3 className="mb-4 font-bold text-slate-900">Profile Completion</h3>
              <Progress value={65} label="Complete your profile" variant="success" />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Email verified</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Profile picture added</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>Add portfolio items</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-bold text-slate-900">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { href: "/dashboard/wallet", label: "Wallet", icon: "💳" },
                  { href: "/chat", label: "Messages", icon: "💬" },
                  { href: "/dashboard/disputes", label: "Disputes", icon: "⚖️" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg border border-transparent p-3 text-sm transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="font-medium text-slate-700">{link.label}</span>
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
