"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Wallet,
  MessageSquare,
  AlertTriangle,
  FileImage,
  Users,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Shield,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useNotifications } from "@/lib/notifications";
import { Badge } from "./ui";

const navSections = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
      { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
      { href: "/dashboard/contracts", label: "Contracts", icon: FileText, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet, roles: ["ADMIN", "EMPLOYER", "FREELANCER"], badge: "new" },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/chat", label: "Messages", icon: MessageSquare, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/dashboard/disputes", label: "Disputes", icon: AlertTriangle, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
      { href: "/dashboard/proposals", label: "Proposals", icon: TrendingUp, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
      { href: "/admin", label: "Admin", icon: Shield, roles: ["ADMIN"], badge: "new" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const role = useSession((s) => s.role);
  const fullName = useSession((s) => s.fullName);
  const clear = useSession((s) => s.clear);
  const unread = useNotifications((s) => s.unread);

  const handleLogout = () => {
    clear();
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-72"
      } border-r border-slate-200 bg-white shadow-xl`}
    >
      <div className="flex h-full flex-col">
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${
              collapsed ? "opacity-0 w-0" : "opacity-100"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                SabaHub
              </h1>
              <p className="text-xs text-slate-500">Enterprise Platform</p>
            </div>
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-all duration-200 hover:bg-slate-200 hover:text-slate-900 hover:shadow-md active:scale-95"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* User Profile */}
        <div className="border-b border-slate-200 p-4">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 font-semibold text-white shadow-lg ring-2 ring-emerald-200 ring-offset-2">
                {fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-slate-900">{fullName || "User"}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={role === "ADMIN" ? "danger" : role === "EMPLOYER" ? "warning" : "info"} className="text-xs">
                    {role || "USER"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {navSections.map((section) => {
            const allowed = section.items.filter((item) => !item.roles || (role && item.roles.includes(role)));
            if (allowed.length === 0) return null;

            return (
              <div key={section.title}>
                {!collapsed && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {allowed.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    const Icon = item.icon;
                    const showNotificationBadge = item.href === "/dashboard/notifications" && unread > 0;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/50"
                              : "text-slate-700 hover:bg-slate-100 hover:text-sky-600"
                          } ${collapsed ? "justify-center" : ""}`}
                        >
                          <div className="relative">
                            <Icon
                              className={`h-5 w-5 transition-all duration-200 ${
                                isActive ? "scale-110" : "group-hover:scale-110"
                              }`}
                            />
                            {showNotificationBadge && (
                              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                                {unread > 9 ? "9+" : unread}
                              </span>
                            )}
                          </div>
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-sm font-medium">{item.label}</span>
                              {item.badge && (
                                <Badge
                                  variant={item.badge === "new" ? "success" : item.badge === "beta" ? "warning" : "info"}
                                  className="text-[10px] px-1.5 py-0.5"
                                >
                                  {item.badge.toUpperCase()}
                                </Badge>
                              )}
                              {showNotificationBadge && !item.badge && (
                                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                                  {unread}
                                </span>
                              )}
                            </>
                          )}
                          {/* Hover tooltip for collapsed state */}
                          {collapsed && (
                            <div className="pointer-events-none absolute left-full ml-4 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-white opacity-0 shadow-xl transition-opacity group-hover:block group-hover:opacity-100">
                              {item.label}
                              <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 p-3 space-y-1">
          <Link
            href="/dashboard/settings"
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Settings className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
            {collapsed && (
              <div className="pointer-events-none absolute left-full ml-4 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-white opacity-0 shadow-xl transition-opacity group-hover:block group-hover:opacity-100">
                Settings
                <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-rose-600 transition-all duration-200 hover:bg-rose-50 hover:text-rose-700 active:scale-95 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
            {collapsed && (
              <div className="pointer-events-none absolute left-full ml-4 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-white opacity-0 shadow-xl transition-opacity group-hover:block group-hover:opacity-100">
                Logout
                <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
