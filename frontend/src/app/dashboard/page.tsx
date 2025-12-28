"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, bootstrapSession } from "@/lib/session";

const cards = [
  { href: "/dashboard/jobs", title: "Jobs", desc: "Browse or manage jobs" },
  { href: "/dashboard/proposals", title: "Proposals", desc: "Your proposals" },
  { href: "/dashboard/contracts", title: "Contracts", desc: "Active contracts" },
  { href: "/dashboard/wallet", title: "Wallet", desc: "Balance and top-ups" },
  { href: "/chat", title: "Chat", desc: "Threads and messages" },
  { href: "/dashboard/disputes", title: "Disputes", desc: "Open or manage" },
  { href: "/dashboard/content", title: "Content", desc: "Admin CMS" },
];

export default function DashboardPage() {
  const router = useRouter();
  const role = useSession((s) => s.role);

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) router.replace("/login");
  }, [router]);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard {role ? `— ${role}` : ""}</h1>
        <p className="text-slate-600">Quick links</p>
      </header>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-xl border border-slate-200 p-4 hover:shadow-sm">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm text-slate-600">{c.desc}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
