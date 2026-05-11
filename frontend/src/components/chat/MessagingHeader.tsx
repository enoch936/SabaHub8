"use client";

import Link from "next/link";
import { Bell, PanelLeftOpen, Plus, Search, Settings2 } from "lucide-react";
import { workspaceRoutes } from "@/lib/workspace-routes";

interface MessagingHeaderProps {
  inboxQuery: string;
  onInboxQueryChange: (value: string) => void;
  totalUnread: number;
  onCreate: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  profileName: string;
  profileEmail?: string;
  profilePictureUrl?: string | null;
}

export function MessagingHeader({
  inboxQuery,
  onInboxQueryChange,
  totalUnread,
  onCreate,
  onToggleSidebar,
  sidebarOpen,
  profileName,
  profileEmail,
  profilePictureUrl,
}: MessagingHeaderProps) {
  return (
    <header className="rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Messaging workspace</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">Real-time team communication</h1>
          <p className="mt-1 text-sm text-slate-500">Direct chats, groups, channels, files, and voice notes using live workspace data.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white lg:hidden"
            aria-label={sidebarOpen ? "Hide conversation sidebar" : "Show conversation sidebar"}
          >
            <PanelLeftOpen className="h-4.5 w-4.5" />
          </button>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            <Bell className="h-4 w-4 text-slate-400" />
            <span className="font-medium">Unread</span>
            <span className="rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          </div>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-92"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>

          <Link
            href={workspaceRoutes.notifications}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white"
            aria-label="Open workspace notifications"
          >
            <Bell className="h-4.5 w-4.5" />
          </Link>

          <Link
            href={workspaceRoutes.settings}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white"
            aria-label="Open workspace settings"
          >
            <Settings2 className="h-4.5 w-4.5" />
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 xl:min-w-[420px] xl:flex-1 xl:max-w-[720px]">
          <Search className="h-4.5 w-4.5 text-slate-400" />
          <input
            value={inboxQuery}
            onChange={(event) => onInboxQueryChange(event.target.value)}
            placeholder="Search users, groups, channels, and messages"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt={profileName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-sm font-semibold text-white">
              {profileName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{profileName}</p>
            <p className="truncate text-xs text-slate-500">{profileEmail || "Workspace member"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
