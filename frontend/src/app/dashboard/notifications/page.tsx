"use client";

import { useNotifications } from "@/lib/notifications";
import { Badge, Button } from "@/components/ui";
import Image from "next/image";

export default function NotificationsPage() {
  const items = useNotifications((s) => s.items);
  const markAllRead = useNotifications((s) => s.markAllRead);

  return (
    <main className="relative mx-auto max-w-4xl p-6 pb-12 space-y-6">
      <div className="absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/images/backgrounds/geo-light-grid.svg')" }} />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_75%_5%,rgba(167,139,250,0.2),transparent_40%),radial-gradient(circle_at_45%_80%,rgba(16,185,129,0.16),transparent_35%)]" />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/85 p-6 shadow-xl shadow-sky-500/10 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/30 bg-white/60 shadow-inner">
            <Image src="/images/badges/chat.png" alt="chat badge" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-600">Prototype feed — nothing pushes in real-time yet.</p>
          </div>
        </div>
        <Button variant="outline" onClick={markAllRead}>Mark all read</Button>
      </div>

      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className="rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg shadow-sky-500/10 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="font-medium text-slate-900">{n.type}</p>
                <p className="text-sm text-slate-600">{n.createdAt}</p>
              </div>
              {!n.read && <Badge variant="outline" className="bg-emerald-50 text-emerald-700">new</Badge>}
            </div>
            {n.payload && <pre className="mt-2 overflow-auto rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-800 shadow-inner">{JSON.stringify(n.payload, null, 2)}</pre>}
          </li>
        ))}
        {items.length === 0 && <p className="text-slate-600">No notifications. You're all caught up!</p>}
      </ul>
    </main>
  );
}
