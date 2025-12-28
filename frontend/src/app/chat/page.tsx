"use client";

import { useEffect, useState } from "react";
import { createThread, listMessages, listThreads, sendMessage } from "@/lib/api";
import { connectWs, sendThreadMessage, subscribeThread } from "@/lib/ws";

export default function ChatPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    listThreads().then(setThreads).catch(() => setThreads([]));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let sub: any;
    (async () => {
      await connectWs();
      listMessages(activeId).then(setMessages).catch(() => setMessages([]));
      sub = subscribeThread(activeId, (msg) => setMessages((prev) => [...prev, msg]));
    })();
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [activeId]);

  async function onSend() {
    if (!activeId || !text.trim()) return;
    // Optimistic: publish via WS and also persist via REST (service will also broadcast)
    sendThreadMessage(activeId, { type: "TEXT", text });
    try {
      const msg = await sendMessage(activeId, { type: "TEXT", text });
      setMessages((prev) => [...prev, msg]);
    } catch {
      // ignore, WS likely delivered
    }
    setText("");
  }

  async function onCreateThread() {
    const ids = prompt("Enter participant IDs comma-separated", "");
    if (!ids) return;
    const t = await createThread(ids.split(",").map((s) => s.trim()).filter(Boolean));
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
  }

  return (
    <main className="mx-auto max-w-5xl p-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <aside className="rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Threads</h2>
          <button onClick={onCreateThread} className="rounded bg-sky-600 px-2 py-1 text-white text-sm">New</button>
        </div>
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.id}>
              <button onClick={() => setActiveId(t.id)} className={`w-full rounded border p-2 text-left ${activeId === t.id ? "border-sky-600" : ""}`}>
                {t.id}
              </button>
            </li>
          ))}
          {threads.length === 0 && <p className="text-slate-600">No threads</p>}
        </ul>
      </aside>

      <section className="md:col-span-2 rounded-xl border p-4 flex flex-col">
        <div className="mb-2 font-semibold">Messages</div>
        <div className="flex-1 space-y-2 overflow-auto rounded border p-2">
          {messages.map((m) => (
            <div key={m.id} className="rounded bg-slate-50 p-2">
              <div className="text-xs text-slate-500">{m.senderId} — {m.createdAt}</div>
              <div>{m.text}</div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-slate-600">No messages</p>}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded border p-2" placeholder="Type a message" />
          <button onClick={onSend} className="rounded bg-slate-900 px-3 py-2 text-white">Send</button>
        </div>
      </section>
    </main>
  );
}
