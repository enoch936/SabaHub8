"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Radio, User, Wallet } from "lucide-react";
import { workspaceRoutes } from "@/lib/workspace-routes";

const NAV_ITEMS = [
  { href: workspaceRoutes.home, label: "Home", icon: Home },
  { href: workspaceRoutes.stream, label: "Stream", icon: Radio },
  { href: workspaceRoutes.wallet, label: "Wallet", icon: Wallet },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: workspaceRoutes.settings, label: "Profile", icon: User },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--surface)] safe-area-pb lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== workspaceRoutes.home && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
