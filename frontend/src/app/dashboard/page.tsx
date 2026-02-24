"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, bootstrapSession } from "@/lib/session";
import { Badge, Avatar } from "@/components/ui";

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
      { label: "Enterprise briefs", value: "42", change: "Live", trend: "up" },
      { label: "Spend governed", value: "$4.8M", change: "Secured", trend: "up" },
      { label: "Vendor score", value: "96%", change: "A+", trend: "up" },
      { label: "Compliance lanes", value: "12", change: "Active", trend: "up" },
    ],
    EMPLOYER: [
      { label: "Active portfolios", value: "18", change: "Live", trend: "up" },
      { label: "Escrow coverage", value: "$860k", change: "Secured", trend: "up" },
      { label: "Vendor utilization", value: "72%", change: "Healthy", trend: "up" },
      { label: "Risk flags", value: "2", change: "Low", trend: "neutral" },
    ],
    FREELANCER: [
      { label: "Enterprise bids", value: "8", change: "Live", trend: "up" },
      { label: "Projects", value: "Connected", change: "Ready", trend: "up" },
      { label: "Earnings", value: "$42k", change: "Secured", trend: "up" },
      { label: "Profile", value: "Verified", change: "Complete", trend: "up" },
    ],
  } as const;

  const quickActions = {
    ADMIN: [
      { href: "/dashboard/vendor-hub", title: "Vendor Hub", icon: "🏢", desc: "Enterprise vendor ops" },
      { href: "/dashboard/spend", title: "Spend Control", icon: "💳", desc: "Budget governance" },
      { href: "/dashboard/compliance", title: "Compliance", icon: "🧾", desc: "Audit readiness" },
      { href: "/dashboard/insights", title: "Portfolio Insights", icon: "📈", desc: "Global analytics" },
    ],
    EMPLOYER: [
      { href: "/dashboard/jobs/new", title: "Post Enterprise Brief", icon: "➕", desc: "Launch new brief" },
      { href: "/dashboard/jobs", title: "Active Briefs", icon: "💼", desc: "Manage postings" },
      { href: "/dashboard/contracts", title: "Contract Hub", icon: "📄", desc: "Active agreements" },
      { href: "/dashboard/wallet", title: "Fund Escrow", icon: "💳", desc: "Secure payouts" },
    ],
    FREELANCER: [
      { href: "/dashboard/jobs", title: "Enterprise Jobs", icon: "🔍", desc: "Find work" },
      { href: "/dashboard/proposals", title: "My Proposals", icon: "📬", desc: "Track applications" },
      { href: "/dashboard/contracts", title: "Active Work", icon: "⚡", desc: "Current projects" },
      { href: "/dashboard/wallet", title: "Earnings", icon: "💰", desc: "View balance" },
    ],
  };

  const recentActivity = [
    { type: "Compliance", title: "SOC2 evidence pack delivered to audit vault.", time: "2h ago", user: "Ops Team", amount: "" },
    { type: "Spend", title: "Escrow approved for Global Brand Launch.", time: "Today", user: "Finance", amount: "$210,000" },
    { type: "Vendor", title: "Preferred studio onboarded to Tier A.", time: "Yesterday", user: "Vendor Hub", amount: "" },
  ];

  const healthSignals = useMemo(() => ([
    { label: "Risk score", value: 12, max: 100, status: "Low" },
    { label: "SLA adherence", value: 92, max: 100, status: "On track" },
    { label: "Vendor coverage", value: 78, max: 100, status: "Healthy" },
  ]), []);

  const currentStats = stats[role as keyof typeof stats] || stats.FREELANCER;

  const CountUp = ({ value }: { value: string }) => {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      if (!numeric) {
        setDisplay(0);
        return;
      }
      const duration = 700;
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        setDisplay(Math.round(numeric * progress));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, [numeric]);
    const prefix = value.trim().startsWith("$") ? "$" : "";
    const suffix = value.includes("%") ? "%" : "";
    return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
  };
  const actions = quickActions[role as keyof typeof quickActions] || quickActions.FREELANCER;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Enterprise command center</p>
            <h1 className="mt-3 text-4xl font-semibold">Portfolio intelligence dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">
              Real-time governance, spend oversight, vendor readiness, and pipeline health for enterprise delivery.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/notifications"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:text-white"
            >
              Alerts
            </Link>
            <Link
              href="/dashboard/analytics"
              className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/30"
            >
              Open analytics
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {currentStats.map((stat) => (
            <div key={stat.label} className="relative rounded-2xl border border-white/10 bg-white/5 p-5 kpi-card">
              <span className="kpi-tooltip">{stat.change}</span>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{stat.label}</span>
                <Badge variant="info" size="sm">{stat.change}</Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold"><CountUp value={stat.value} /></p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Portfolio analyzer</h2>
            <p className="mt-2 text-xs text-slate-400">Spend coverage, risk profile, and delivery momentum.</p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Spend allocation</p>
                <div className="mt-4 flex items-center gap-5">
                  <svg viewBox="0 0 120 120" className="h-24 w-24">
                    <circle cx="60" cy="60" r="46" stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
                    <circle cx="60" cy="60" r="46" stroke="#34d399" strokeWidth="12" fill="none" strokeDasharray="140 289" transform="rotate(-90 60 60)" />
                    <circle cx="60" cy="60" r="46" stroke="#60a5fa" strokeWidth="12" fill="none" strokeDasharray="90 339" transform="rotate(80 60 60)" />
                    <circle cx="60" cy="60" r="46" stroke="#f59e0b" strokeWidth="12" fill="none" strokeDasharray="59 370" transform="rotate(190 60 60)" />
                  </svg>
                  <div className="space-y-2 text-xs text-slate-300">
                    <p><span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-2" />Escrow</p>
                    <p><span className="inline-block h-2 w-2 rounded-full bg-sky-400 mr-2" />Ops</p>
                    <p><span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-2" />Legal</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Delivery velocity</p>
                <div className="mt-4 space-y-4">
                  {[72, 54, 88, 61].map((value, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Lane {index + 1}</span>
                        <span>{value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-emerald-500/20 to-slate-950/70 p-6">
              <h3 className="text-lg font-semibold">Health signals</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                {healthSignals.map((signal) => (
                  <div key={signal.label} className="flex items-center justify-between">
                    <span>{signal.label}</span>
                    <span className="text-emerald-300">{signal.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold">Quick actions</h3>
              <div className="mt-4 space-y-3">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 hover:border-emerald-400/40"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{action.icon}</span>
                      <span>{action.title}</span>
                    </span>
                    <span className="text-xs text-slate-400">{action.desc}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Enterprise activity feed</h2>
              <Link href="/dashboard/analytics/audit-logs" className="text-xs text-emerald-300">
                View all →
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-start gap-4">
                    <Avatar src="" fallback={activity.user?.charAt(0) || "E"} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{activity.title}</p>
                        <Badge variant="default" size="sm">{activity.type}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{activity.user} • {activity.time}</p>
                      {activity.amount && <p className="mt-2 text-sm text-emerald-300">{activity.amount}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">Risk & compliance</h3>
            <p className="mt-2 text-xs text-slate-400">Upcoming renewals and audit checkpoints.</p>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                SOC2 attestation • Due in 14 days
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                Vendor NDA refresh • 6 contracts
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                Escrow review • Q1 checkpoint
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
