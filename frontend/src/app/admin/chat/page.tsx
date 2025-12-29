"use client";

import { useEffect, useState } from "react";
import { adminBroadcast } from "@/lib/api";
import { connectWs, subscribeAnnouncements, type Subscription } from "@/lib/ws";

export default function AdminChatPage() {
  const [text, setText] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    let sub: Subscription | null = null;
    (async () => {
      await connectWs();
      sub = subscribeAnnouncements((payload) => {
        // Append announcement to local history
        setHistory((prev) => [...prev, { at: payload?.at, msg: payload?.message, by: payload?.by }]);
      });
    })();
    return () => { sub?.unsubscribe(); };
  }, []);

  const broadcast = async () => {
    if (!text.trim()) return;
    try {
      await adminBroadcast(text.trim());
      setText("");
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Failed to send");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Chat & Broadcasts</h1>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <div className="font-semibold">Announcement</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type an announcement to broadcast to all users"
          className="min-h-[120px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
        />
        <button
          onClick={broadcast}
          disabled={!text.trim()}
          className="w-fit rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
        >
          Broadcast
        </button>
      </div>

      {history.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
          <div className="font-semibold mb-2">Recent Broadcasts (live)</div>
          {history.slice().reverse().map((item, i) => (
            <div key={i} className="text-xs text-slate-400 border-b border-slate-800 pb-2">
              <div className="text-slate-300 text-sm mb-1">{item.msg}</div>
              <div>{item.at} by {item.by}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
