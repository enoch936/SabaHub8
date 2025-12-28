"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { bootstrapSession, useSession } from "@/lib/session";
import { useNotifications } from "@/lib/notifications";

const navItems = [
  { href: "/dashboard", label: "Home", roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
  { href: "/dashboard/jobs", label: "Jobs", roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
  { href: "/dashboard/contracts", label: "Contracts", roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
  { href: "/dashboard/wallet", label: "Wallet", roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
  { href: "/chat", label: "Chat", roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
  { href: "/dashboard/disputes", label: "Disputes", roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
  { href: "/dashboard/content", label: "Content", roles: ["ADMIN"] },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useSession((s) => s.role);
  const clear = useSession((s) => s.clear);
  const unread = useNotifications((s) => s.unread);
  const connect = useNotifications((s) => s.connect);

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) router.replace("/login");
    else connect();
  }, [router, connect]);

  const allowed = navItems.filter((n) => !n.roles || (role && n.roles.includes(role)));

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link href="/dashboard" className="font-bold">SabaHub</Link>
          <nav className="flex items-center gap-4">
            {allowed.map((n) => (
              <Link key={n.href} href={n.href} className={pathname?.startsWith(n.href) ? "text-sky-700 font-semibold" : "text-slate-700"}>
                {n.label}
              </Link>
            ))}
            <Link href="/dashboard/notifications" className="relative text-slate-700">
              Notifications
              {unread > 0 && (
                <span className="absolute -right-3 -top-2 rounded-full bg-rose-600 px-1.5 text-xs font-bold text-white">{unread}</span>
              )}
            </Link>
          </nav>
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={() => {
              localStorage.removeItem("auth_token");
              clear();
              router.push("/login");
            }}
          >Logout</button>
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}
