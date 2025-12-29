"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { bootstrapSession } from "@/lib/session";
import { useNotifications } from "@/lib/notifications";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const connect = useNotifications((s) => s.connect);

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) router.replace("/login");
    else connect();
  }, [router, connect]);

  useEffect(() => {
    // If user is admin and is hitting the generic protected shell, route them to admin area for distinct UI
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        const roles = (payload?.roles as string[]) || (payload?.role ? [payload.role] : []);
        const isAdmin = roles.includes("ADMIN") || roles.includes("ROLE_ADMIN");
        if (isAdmin && !window.location.pathname.startsWith("/admin")) {
          router.replace("/admin");
        }
      }
    } catch {}
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-72">
        <Navbar />
        <main className="pt-16">{children}</main>
      </div>
    </div>
  );
}
