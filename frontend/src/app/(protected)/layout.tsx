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

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className="transition-[margin] duration-300 ease-out"
        style={{ marginLeft: "var(--sidebar-width, 288px)" }}
      >
        <Navbar />
        <main className="pt-16">{children}</main>
      </div>
    </div>
  );
}
