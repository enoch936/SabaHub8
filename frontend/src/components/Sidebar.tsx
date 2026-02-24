"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
  Menu,
  TrendingUp,
  Shield,
  Sparkles,
  LogOut,
  User,
  Zap,
  Award,
  Search,
  Send,
  Clock,
  CheckCircle,
  DollarSign,
  Star,
  Building2,
  Scale,
  FileCheck2,
  Banknote,
  LineChart,
  Pin,
  PinOff,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useNotifications } from "@/lib/notifications";
import { Avatar, Badge } from "./ui";
import { SegmentedThemeToggle } from "./useTheme";

const MotionLink = motion.create(Link);
const MotionButton = motion.create("button");

const baseSections = [
  {
    title: "Main",
    items: [
      // Dashboard href will be injected based on role in the component
      { href: "/__DASHBOARD__", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
      { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
      { href: "/dashboard/contracts", label: "Contracts", icon: FileText, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet, roles: ["ADMIN", "EMPLOYER", "FREELANCER"], badge: "new" },
    ],
  },
  {
    title: "Freelancer",
    items: [
      { href: "/freelancer/profile", label: "Profile & Skills", icon: User, roles: ["FREELANCER"] },
      { href: "/freelancer/projects/search", label: "Search Projects", icon: Search, roles: ["FREELANCER"] },
      { href: "/freelancer/time-tracker", label: "Time Tracking", icon: Clock, roles: ["FREELANCER"] },
      { href: "/freelancer/earnings", label: "Earnings", icon: DollarSign, roles: ["FREELANCER"] },
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
  {
    title: "Enterprise Suite",
    items: [
      { href: "/dashboard/vendor-hub", label: "Vendor Hub", icon: Building2, roles: ["ADMIN", "EMPLOYER"] },
      { href: "/dashboard/compliance", label: "Compliance", icon: FileCheck2, roles: ["ADMIN", "EMPLOYER"] },
      { href: "/dashboard/risk", label: "Risk & Legal", icon: Scale, roles: ["ADMIN", "EMPLOYER"] },
      { href: "/dashboard/spend", label: "Spend Control", icon: Banknote, roles: ["ADMIN", "EMPLOYER"] },
      { href: "/dashboard/insights", label: "Portfolio Insights", icon: LineChart, roles: ["ADMIN", "EMPLOYER"] },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/dashboard/settings", label: "Settings & Profile", icon: Settings, roles: ["ADMIN", "EMPLOYER", "FREELANCER"] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [hoverExpand, setHoverExpand] = useState(false);
  const [pinned, setPinned] = useState(false);
  const hoverTimeout = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const role = useSession((s) => s.role);
  const fullName = useSession((s) => s.fullName);
  const profilePictureUrl = useSession((s) => s.profilePictureUrl);
  const emailVerified = useSession((s) => s.emailVerified);
  const clear = useSession((s) => s.clear);
  const unread = useNotifications((s) => s.unread);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedCollapsed = localStorage.getItem("sidebar_collapsed");
      const storedPinned = localStorage.getItem("sidebar_pinned");
      if (storedCollapsed !== null) setCollapsed(storedCollapsed !== "false");
      if (storedPinned !== null) setPinned(storedPinned === "true");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const width = collapsed && !hoverExpand && !pinned ? "80px" : "288px";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [collapsed, hoverExpand, pinned, mounted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebar_pinned", String(pinned));
  }, [pinned]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setCollapsed((prev) => !prev);
      }
      if (event.ctrlKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setPinned((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Single authoritative dashboard path by role
  const dashboardHref = role === "ADMIN" ? "/admin" : "/dashboard";

  // Clone and inject resolved dashboard path
  const navSections = baseSections.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.href === "/__DASHBOARD__" ? { ...item, href: dashboardHref } : item
    ),
  }));

  const handleLogout = () => {
    clear();
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  };

  return (
    <aside
      className={`hidden lg:block fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out ${
        collapsed && !hoverExpand && !pinned ? "w-20" : "w-72"
      } border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl`}
      onMouseEnter={() => {
        if (pinned) return;
        if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current);
        hoverTimeout.current = window.setTimeout(() => setHoverExpand(true), 180);
      }}
      onMouseLeave={() => {
        if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current);
        setHoverExpand(false);
      }}
    >
      <div className="flex h-full flex-col">
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
          <MotionLink
            href="/dashboard"
            className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${
              collapsed && !hoverExpand ? "opacity-0 w-0" : "opacity-100"
            }`}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
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
          </MotionLink>
          <div className="flex items-center gap-2">
            <span className="tooltip-wrap">
              <MotionButton
                onClick={() => setCollapsed(!collapsed)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-md active:scale-95"
                aria-label={!mounted ? "Expand sidebar (Ctrl+B)" : collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                {!mounted || (collapsed && !hoverExpand) ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </MotionButton>
              <span className="tooltip-bubble">Toggle sidebar (Ctrl+B)</span>
            </span>
            <span className="tooltip-wrap">
              <MotionButton
                onClick={() => setPinned((prev) => !prev)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:shadow-md active:scale-95 ${
                  pinned ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
                aria-label={pinned ? "Unpin sidebar (Ctrl+P)" : "Pin sidebar (Ctrl+P)"}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </MotionButton>
              <span className="tooltip-bubble">Pin sidebar (Ctrl+P)</span>
            </span>
          </div>
        </div>

        {/* User Profile */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-4">
          <div className={`flex items-center gap-3 ${collapsed && !hoverExpand && !pinned ? "justify-center" : ""}`}>
            <div className="relative">
              <Avatar
                src={mounted ? profilePictureUrl : undefined}
                fallback={fullName || "User"}
                size="md"
                className="ring-2 ring-emerald-200 ring-offset-2"
              />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
            </div>
            {(!collapsed || hoverExpand || pinned) && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-slate-900">{fullName || "User"}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={role === "ADMIN" ? "danger" : role === "EMPLOYER" ? "warning" : "info"} className="text-xs">
                    {role || "USER"}
                  </Badge>
                  <Badge variant={emailVerified ? "success" : "warning"} className="text-[10px]">
                    {emailVerified ? "Email Verified" : "Email Unverified"}
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
                {(!collapsed || hoverExpand || pinned) && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {allowed.map((item) => {
                    const isDashboard = item.href === dashboardHref;
                    const isActive = isDashboard
                      ? pathname === dashboardHref
                      : pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
                    const Icon = item.icon;
                    const showNotificationBadge = item.href === "/dashboard/notifications" && unread > 0;

                    return (
                      <li key={item.href}>
                        <MotionLink
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/50 dark:from-sky-600 dark:to-blue-700"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600"
                          } ${collapsed && !hoverExpand && !pinned ? "justify-center" : ""}`}
                          whileHover={{ x: collapsed ? 0 : 2 }}
                          whileTap={{ scale: 0.98 }}
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
                          {(!collapsed || hoverExpand || pinned) && (
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
                          {collapsed && !hoverExpand && !pinned && (
                            <div className="pointer-events-none absolute left-full ml-4 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-white opacity-0 shadow-xl transition-opacity group-hover:block group-hover:opacity-100">
                              {item.label}
                              <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
                            </div>
                          )}
                        </MotionLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 p-3 space-y-3">
          {/* Theme Toggle */}
          <div className={`${collapsed && !hoverExpand && !pinned ? "flex justify-center" : "px-1"}`}>
            {collapsed && !hoverExpand && !pinned ? (
              <div className="relative group">
                <SegmentedThemeToggle className="scale-90 origin-left" />
                <div className="pointer-events-none absolute left-full ml-4 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-white opacity-0 shadow-xl transition-opacity group-hover:block group-hover:opacity-100">
                  Theme
                  <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
                </div>
              </div>
            ) : (
              <SegmentedThemeToggle />
            )}
          </div>
          <MotionLink
            href="/dashboard/settings"
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 ${
              collapsed && !hoverExpand && !pinned ? "justify-center" : ""
            }`}
            whileHover={{ x: collapsed ? 0 : 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
            {(!collapsed || hoverExpand || pinned) && <span className="text-sm font-medium">Settings</span>}
            {collapsed && !hoverExpand && !pinned && (
              <div className="pointer-events-none absolute left-full ml-4 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-white opacity-0 shadow-xl transition-opacity group-hover:block group-hover:opacity-100">
                Settings
                <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
              </div>
            )}
          </MotionLink>
          <MotionButton
            onClick={handleLogout}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-rose-600 dark:text-rose-400 transition-all duration-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-300 active:scale-95 ${
              collapsed && !hoverExpand && !pinned ? "justify-center" : ""
            }`}
            whileHover={{ x: collapsed ? 0 : 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            {(!collapsed || hoverExpand || pinned) && <span className="text-sm font-medium">Logout</span>}
            {collapsed && !hoverExpand && !pinned && (
              <div className="pointer-events-none absolute left-full ml-4 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-white opacity-0 shadow-xl transition-opacity group-hover:block group-hover:opacity-100">
                Logout
                <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
              </div>
            )}
          </MotionButton>
        </div>
      </div>
    </aside>
  );
}
