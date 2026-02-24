"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Bell,
  User,
  Menu,
  X,
  Settings,
  LogOut,
  Sparkles,
  TrendingUp,
  DollarSign,
  MessageSquare,
  ChevronDown,
  Banknote,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { useNotifications } from "@/lib/notifications";
import { Avatar, Badge } from "./ui";
import { ThemeIconButton } from "./useTheme";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const role = useSession((s) => s.role);
  const fullName = useSession((s) => s.fullName);
  const email = useSession((s) => s.email);
  const profilePictureUrl = useSession((s) => s.profilePictureUrl);
  const emailVerified = useSession((s) => s.emailVerified);
  const clear = useSession((s) => s.clear);
  const unread = useNotifications((s) => s.unread);

  type QuickAction = {
    label: string;
    icon: any;
    href: string;
    color: string;
    badge?: string | number;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll as EventListener);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuOpen || notificationsOpen) {
        const target = e.target as HTMLElement;
        if (!target.closest(".user-menu") && !target.closest(".notifications-menu")) {
          setUserMenuOpen(false);
          setNotificationsOpen(false);
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen, notificationsOpen]);

  const handleLogout = () => {
    clear();
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  };

  const quickActions: QuickAction[] = [
    { label: "Post Job", icon: Sparkles, href: "/dashboard/jobs/new", color: "text-sky-600" },
    { label: "Vendor Hub", icon: Building2, href: "/dashboard/vendor-hub", color: "text-cyan-600" },
    { label: "Spend Control", icon: Banknote, href: "/dashboard/spend", color: "text-emerald-600" },
    { label: "Risk Center", icon: ShieldCheck, href: "/dashboard/risk", color: "text-rose-600" },
    { label: "Analytics", icon: TrendingUp, href: "/dashboard/analytics", color: "text-purple-600" },
  ];

  const dummyNotifications = [
    { id: 1, title: "New proposal received", time: "2 min ago", unread: true },
    { id: 2, title: "Contract completed", time: "1 hour ago", unread: true },
    { id: 3, title: "Payment received", time: "3 hours ago", unread: false },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 right-0 left-0 lg:left-72 z-30 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-200"
            : "bg-white border-b border-slate-200"
        }`}
      >
        <div className="mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all hover:bg-slate-200 hover:shadow-md active:scale-95"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs, freelancers, contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 transition-all focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <p className="px-3 py-2 text-sm text-slate-500">No results found for &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="hidden xl:flex items-center gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group relative flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 transition-all hover:bg-slate-100 hover:shadow-md"
                  >
                    <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${action.color}`} />
                    <span className="text-sm font-medium">{action.label}</span>
                    {action.badge && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
                        {action.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeIconButton />
              {/* Notifications */}
              <div className="relative notifications-menu">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationsOpen(!notificationsOpen);
                    setUserMenuOpen(false);
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all hover:bg-slate-200 hover:shadow-md active:scale-95"
                >
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <>
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white ring-2 ring-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                      <span className="absolute right-1 top-1 h-5 w-5 animate-ping rounded-full bg-rose-600 opacity-75" />
                    </>
                  )}
                </button>
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-2xl"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="border-b border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                          <Badge variant="danger" className="text-xs">
                            {unread} new
                          </Badge>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {dummyNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`border-b border-slate-100 p-4 transition-colors hover:bg-slate-50 ${
                              notif.unread ? "bg-sky-50/50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {notif.unread && <div className="mt-2 h-2 w-2 rounded-full bg-sky-600" />}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                                <p className="text-xs text-slate-500">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-200 p-3">
                        <Link
                          href="/dashboard/notifications"
                          className="flex items-center justify-center rounded-lg py-2 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-50"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              <div className="relative user-menu">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                    setNotificationsOpen(false);
                  }}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 transition-all hover:border-sky-500 hover:shadow-md active:scale-95"
                >
                  <div className="relative">
                    <Avatar
                      src={mounted ? profilePictureUrl : undefined}
                      fallback={fullName || "User"}
                      size="sm"
                      className="shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-900">{fullName || "User"}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-2xl"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="border-b border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={mounted ? profilePictureUrl : undefined}
                            fallback={fullName || "User"}
                            size="lg"
                            className="shadow-lg"
                          />
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate font-semibold text-slate-900">{fullName || "User"}</p>
                            <p className="truncate text-sm text-slate-500">{email || "user@example.com"}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge
                            variant={role === "ADMIN" ? "danger" : role === "EMPLOYER" ? "warning" : "info"}
                            className="text-xs"
                          >
                            {role || "USER"}
                          </Badge>
                          <Badge variant={emailVerified ? "success" : "warning"} className="text-xs">
                            {emailVerified ? "Email Verified" : "Email Unverified"}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          <User className="h-4 w-4" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          href="/dashboard/wallet"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          <DollarSign className="h-4 w-4" />
                          <span>Wallet</span>
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </div>
                      <div className="border-t border-slate-200 p-2">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50 active:scale-95"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl"
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Icon className={`h-5 w-5 ${action.color}`} />
                        <span className="font-medium">{action.label}</span>
                        {action.badge && (
                          <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
                            {action.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
