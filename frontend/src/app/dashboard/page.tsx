"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getUserFromToken, logout, isAuthenticated } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState("User");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Get user info from token
    const userInfo = getUserFromToken();
    if (userInfo?.email) {
      setUser(userInfo);
      // Extract name from email or use role-based greeting
      const namePart = userInfo.email.split("@")[0];
      setUserDisplayName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-white">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-sky-200 border-r-sky-600"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-white">
      {/* Navigation Header */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 rounded-lg bg-sky-100 p-2">
                <Image
                  src="/auth-illustration.svg"
                  alt="WorkHub"
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-slate-900">WorkHub</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="relative mb-12 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-blue-50 px-8 py-12 shadow-sm">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sky-200/20 blur-3xl" aria-hidden />
          <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-200/20 blur-3xl" aria-hidden />

          <div className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-sky-600 shadow-sm">
                {isAdmin ? "👨‍💼" : "👤"}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">
                  Welcome {isAdmin ? "Admin" : userDisplayName}!
                </h1>
                <p className="mt-2 text-lg text-slate-600">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block rounded-full bg-white/60 px-3 py-1 font-semibold text-sky-700">
                {isAdmin ? "👑 Administrator" : "👤 User"}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Account Info Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-slate-900">Account Info</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div>
                <span className="font-medium text-slate-900">Email:</span> {user?.email}
              </div>
              <div>
                <span className="font-medium text-slate-900">Role:</span>{" "}
                {isAdmin ? "Administrator" : "User"}
              </div>
              <div>
                <span className="font-medium text-slate-900">Status:</span>{" "}
                <span className="inline-block mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>{" "}
                Active
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-slate-900">Quick Stats</h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Projects</span>
                <span className="text-2xl font-bold text-sky-600">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tasks</span>
                <span className="text-2xl font-bold text-indigo-600">0</span>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-slate-900">Settings</h3>
            <div className="mt-4 space-y-2">
              <Link
                href="#"
                className="block text-sm text-sky-600 hover:text-sky-700 font-semibold transition"
              >
                Profile Settings →
              </Link>
              <Link
                href="#"
                className="block text-sm text-sky-600 hover:text-sky-700 font-semibold transition"
              >
                Security →
              </Link>
              <Link
                href="#"
                className="block text-sm text-sky-600 hover:text-sky-700 font-semibold transition"
              >
                Preferences →
              </Link>
            </div>
          </div>
        </div>

        {/* Admin Only Section */}
        {isAdmin && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Admin Controls</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-amber-900">User Management</h3>
                <p className="mt-2 text-sm text-amber-800">
                  Manage users, assign roles, and monitor system activity.
                </p>
                <button className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700">
                  Manage Users
                </button>
              </div>

              <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-purple-900">System Settings</h3>
                <p className="mt-2 text-sm text-purple-800">
                  Configure system settings, backup data, and manage integrations.
                </p>
                <button className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700">
                  System Config
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
