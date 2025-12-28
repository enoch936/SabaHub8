"use client";

import { useNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui";

export default function NotificationsPage() {
  const items = useNotifications((s) => s.items);
  const markAllRead = useNotifications((s) => s.markAllRead);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="outline" onClick={markAllRead}>Mark all read</Button>
      </div>
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{n.type}</p>
                <p className="text-sm text-slate-600">{n.createdAt}</p>
              </div>
              {!n.read && <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">new</span>}
            </div>
            {n.payload && <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2 text-xs">{JSON.stringify(n.payload, null, 2)}</pre>}
          </li>
        ))}
        {items.length === 0 && <p className="text-slate-600">No notifications</p>}
      </ul>
    </main>
  );
}
