"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
    <nav className="fixed bottom-4 left-4 right-4 z-[100] glass rounded-[24px] border border-white/10 shadow-glass safe-area-pb lg:hidden">
      <div className="flex items-center justify-around px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== workspaceRoutes.home && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex min-w-[56px] flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? "text-blue-400" : "text-white/40 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-glow"
                  className="absolute -top-1 w-8 h-8 bg-blue-500/20 blur-xl rounded-full"
                />
              )}
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? "opacity-100" : "opacity-0"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
