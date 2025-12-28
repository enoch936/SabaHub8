"use client";

import { useEffect, useState } from "react";
import { createThread, listMessages, listThreads, sendMessage } from "@/lib/api";
import { connectWs, sendThreadMessage, subscribeThread } from "@/lib/ws";
import { Avatar, Badge, Button, Input } from "@/components/ui";

export default function ChatPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
    const tempMsg = { id: Date.now(), text, senderId: "me", createdAt: new Date().toISOString(), type: "TEXT" };
    setMessages((prev) => [...prev, tempMsg]);
    sendThreadMessage(activeId, { type: "TEXT", text });
    try {
      const msg = await sendMessage(activeId, { type: "TEXT", text });
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? msg : m)));
    } catch {
      // Keep optimistic update
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

  const filteredThreads = threads.filter((t) =>
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeThread = threads.find((t) => t.id === activeId);

  return (
    <main className="flex h-screen bg-slate-50">
      <aside className="flex w-80 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Messages</h2>
            <Button onClick={onCreateThread} size="sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <ul className="flex-1 overflow-y-auto">
          {filteredThreads.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setActiveId(t.id)}
                className={`flex w-full items-start gap-3 border-l-4 p-4 text-left transition hover:bg-slate-50 ${
                  activeId === t.id ? "border-sky-600 bg-sky-50/50" : "border-transparent"
                }`}
              >
                <Avatar src="" fallback={t.id.charAt(0).toUpperCase()} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-900 truncate">Thread {t.id.slice(0, 8)}</span>
                  </div>
                  <p className="truncate text-sm text-slate-600">{t.lastMessage || "No messages yet"}</p>
                </div>
              </button>
            </li>
          ))}
          {filteredThreads.length === 0 && (
            <li className="p-8 text-center text-sm text-slate-500">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </li>
          )}
        </ul>
      </aside>

      <section className="flex flex-1 flex-col">
        {activeId ? (
          <>
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <Avatar src="" fallback={activeThread?.id.charAt(0).toUpperCase() || "T"} size="md" />
                <div>
                  <h3 className="font-semibold text-slate-900">Thread {activeId.slice(0, 8)}</h3>
                  <p className="text-sm text-slate-600">{activeThread?.participantIds?.length || 0} participants</p>
                </div>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
              <div className="mx-auto max-w-4xl space-y-4">
                {messages.map((m, i) => {
                  const isMe = m.senderId === "me";
                  const showAvatar = i === 0 || messages[i - 1].senderId !== m.senderId;
                  return (
                    <div key={m.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      {showAvatar ? (
                        <Avatar src="" fallback={m.senderId.charAt(0).toUpperCase()} size="sm" className="flex-shrink-0" />
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}
                      <div className={`max-w-md rounded-2xl px-4 py-2.5 ${
                        isMe ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white" : "bg-white text-slate-900 shadow-sm"
                      }`}>
                        {!isMe && showAvatar && <div className="mb-1 text-xs font-semibold text-slate-700">{m.senderId}</div>}
                        <p className="break-words text-sm leading-relaxed">{m.text}</p>
                        <div className={`mt-1 text-xs ${isMe ? "text-sky-100" : "text-slate-500"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <div className="mb-4 text-6xl">💬</div>
                      <p className="text-lg font-medium text-slate-700">No messages yet</p>
                      <p className="text-sm text-slate-500">Start the conversation!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-slate-200 bg-white p-4">
              <div className="mx-auto max-w-4xl flex items-end gap-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
                <Button onClick={onSend} disabled={!text.trim()}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="mb-4 text-6xl">💬</div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Select a conversation</h3>
              <p className="text-slate-600">Choose a thread to start messaging</p>
              <Button onClick={onCreateThread} className="mt-6">Start New Conversation</Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
