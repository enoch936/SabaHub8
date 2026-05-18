"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Archive,
  BellOff,
  BellRing,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Link2,
  Music4,
  Pin,
  Plus,
  Radio,
  Settings2,
  UserMinus,
  Users,
} from "lucide-react";
import type { AppUser, Asset, ChatMessage, ChatThread } from "@/lib/api";
import { workspaceRoutes } from "@/lib/workspace-routes";
import {
  formatAssetLabel,
  formatAssetSize,
  getAssetAccessUrl,
  formatRelativeActivity,
  getAssetKind,
  getConversationInitial,
  getThreadBadgeLabel,
  isReadableAsset,
} from "./chat-helpers";

type MemberEntry = {
  id: string;
  label: string;
  online: boolean;
};

interface ConversationDetailsRailProps {
  activeConversation: ChatThread | null;
  currentUserId: string | null;
  memberDirectory: MemberEntry[];
  messages: ChatMessage[];
  assetsById: Record<string, Asset | null>;
  title: string;
  subtitle: string;
  liveMemberCount?: number;
  canManageConversation: boolean;
  groupName: string;
  channelDescription: string;
  memberMessagingEnabled: boolean;
  onGroupNameChange: (value: string) => void;
  onChannelDescriptionChange: (value: string) => void;
  onMemberMessagingEnabledChange: (value: boolean) => void;
  onSaveSettings: () => void;
  savingSettings: boolean;
  manageQuery: string;
  onManageQueryChange: (value: string) => void;
  onRunManageLookup: () => void;
  manageResults: AppUser[];
  manageLoading: boolean;
  onAddParticipant: (userId: string) => void;
  onRemoveParticipant: (participantId: string) => void;
  onTogglePinned: () => void;
  onToggleMuted: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onClearPin: () => void;
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#d8e0d6] bg-white px-4 py-4 shadow-[0_18px_28px_rgba(38,67,56,0.05)]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#1f312a]">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-[#7d8c84]">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ConversationDetailsRail({
  activeConversation,
  currentUserId,
  memberDirectory,
  messages,
  assetsById,
  title,
  subtitle,
  liveMemberCount = 0,
  canManageConversation,
  groupName,
  channelDescription,
  memberMessagingEnabled,
  onGroupNameChange,
  onChannelDescriptionChange,
  onMemberMessagingEnabledChange,
  onSaveSettings,
  savingSettings,
  manageQuery,
  onManageQueryChange,
  onRunManageLookup,
  manageResults,
  manageLoading,
  onAddParticipant,
  onRemoveParticipant,
  onTogglePinned,
  onToggleMuted,
  onArchive,
  onRestore,
  onClearPin,
}: ConversationDetailsRailProps) {
  if (!activeConversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-[24px] border border-white/70 bg-white/80 text-[#708078] shadow-[0_20px_36px_rgba(38,67,56,0.06)]">
          <Settings2 className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-[#20332d]">Conversation details</h3>
        <p className="mt-2 max-w-[240px] text-sm text-[#63716a]">
          Open a conversation to view participants, shared media, and real governance controls.
        </p>
      </div>
    );
  }

  const assetEntries = messages
    .filter((message) => message.type === "ASSET" && message.assetId)
    .map((message) => ({
      message,
      asset: message.assetId ? assetsById[message.assetId] : null,
    }))
    .filter((entry) => entry.asset);

  const mediaEntries = assetEntries.filter((entry) => {
    const kind = getAssetKind(entry.asset);
    return kind === "image" || kind === "video";
  });

  const fileEntries = assetEntries.filter((entry) => {
    const kind = getAssetKind(entry.asset);
    return kind === "file" || kind === "audio";
  });

  return (
    <div className="space-y-4 p-4">
      <SectionCard title="Thread overview" subtitle="Live details from the current workspace thread.">
        <div className="flex items-start gap-3">
          <div className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#8eb6a0,#6f95d2)] text-base font-bold text-white shadow-[0_18px_30px_rgba(78,108,145,0.18)]">
            {getConversationInitial(title)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-[#1f312a]">{title}</p>
              <span className="rounded-full border border-[#d8e0d6] bg-[#f5f8f3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7b73]">
                {getThreadBadgeLabel(activeConversation.threadType)}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#63716a]">{subtitle}</p>
            <p className="mt-3 text-xs font-medium text-[#8f9c95]">
              Last active {formatRelativeActivity(activeConversation.lastMessageAt)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[20px] border border-[#d8e0d6] bg-[#f6f8f3] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a9890]">Participants</p>
            <p className="mt-2 text-sm font-semibold text-[#1f312a]">
              {activeConversation.participantIds?.length ?? 0}
            </p>
          </div>
          <div className="rounded-[20px] border border-[#d8e0d6] bg-[#f6f8f3] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a9890]">Posting</p>
            <p className="mt-2 text-sm font-semibold text-[#1f312a]">
              {(activeConversation.threadType ?? "DIRECT") === "CHANNEL"
                ? activeConversation.memberMessagingEnabled
                  ? "Open"
                  : "Owner only"
                : "Members"}
            </p>
          </div>
          <div className="rounded-[20px] border border-[#cce7d5] bg-[#effaf2] px-3 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#287047]">
              <Radio className="h-3.5 w-3.5" />
              Live now
            </p>
            <p className="mt-2 text-sm font-semibold text-[#1f312a]">{liveMemberCount}</p>
          </div>
          <div className="rounded-[20px] border border-[#d8e0d6] bg-[#f6f8f3] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a9890]">Messages</p>
            <p className="mt-2 text-sm font-semibold text-[#1f312a]">{messages.length}</p>
          </div>
        </div>
      </SectionCard>

      {(activeConversation.threadType ?? "DIRECT") !== "DIRECT" ? (
        <SectionCard
          title="Governance"
          subtitle={
            canManageConversation
              ? "Owner-managed thread settings."
              : "Only the owner can change these controls."
          }
        >
          <div className="space-y-3">
            <input
              value={groupName}
              onChange={(event) => onGroupNameChange(event.target.value)}
              disabled={!canManageConversation}
              placeholder="Conversation name"
              className="w-full rounded-[20px] border border-[#d8e0d6] bg-[#f6f8f3] px-4 py-3 text-sm text-[#1f312a] outline-none transition focus:border-[#c6d6c6] disabled:cursor-not-allowed disabled:opacity-60"
            />

            {(activeConversation.threadType ?? "DIRECT") === "CHANNEL" ? (
              <>
                <textarea
                  value={channelDescription}
                  onChange={(event) => onChannelDescriptionChange(event.target.value)}
                  disabled={!canManageConversation}
                  rows={3}
                  placeholder="Describe the channel purpose and moderation expectations"
                  className="w-full rounded-[20px] border border-[#d8e0d6] bg-[#f6f8f3] px-4 py-3 text-sm text-[#1f312a] outline-none transition focus:border-[#c6d6c6] disabled:cursor-not-allowed disabled:opacity-60"
                />
                <label className="flex items-center gap-2 rounded-[20px] border border-[#d8e0d6] bg-[#f6f8f3] px-4 py-3 text-sm text-[#42554c]">
                  <input
                    type="checkbox"
                    checked={memberMessagingEnabled}
                    disabled={!canManageConversation}
                    onChange={(event) => onMemberMessagingEnabledChange(event.target.checked)}
                  />
                  Allow all members to post in this channel
                </label>
              </>
            ) : null}

            {canManageConversation ? (
              <button
                type="button"
                onClick={onSaveSettings}
                disabled={savingSettings}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#27463b] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(39,70,59,0.18)] transition hover:bg-[#315447] disabled:opacity-60"
              >
                <Settings2 className="h-4 w-4" />
                {savingSettings ? "Saving…" : "Save settings"}
              </button>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Participants" subtitle={`${memberDirectory.length} other people in this conversation`}>
        <div className="space-y-3">
          {memberDirectory.length > 0 ? (
            memberDirectory.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-[20px] border border-[#d8e0d6] bg-[#f6f8f3] px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f312a]">{member.label}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#7d8c84]">
                    <span className={`inline-flex h-2 w-2 rounded-full ${member.online ? "bg-[#4e9d71]" : "bg-[#bcc7bf]"}`} />
                    <span>
                      {member.id === activeConversation.ownerUserId
                        ? "Owner"
                        : member.online
                          ? "Online"
                          : "Offline"}
                    </span>
                  </div>
                </div>
                {canManageConversation ? (
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(member.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#f1cbc1] bg-white px-3 py-1.5 text-xs font-semibold text-[#b45a4b] transition hover:bg-[#fff5f2]"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Remove
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[20px] border border-dashed border-[#d8e0d6] bg-[#f6f8f3] px-4 py-4 text-sm text-[#63716a]">
              No other participants are visible yet.
            </div>
          )}

          {(activeConversation.threadType ?? "DIRECT") !== "DIRECT" && canManageConversation ? (
            <div className="rounded-[22px] border border-[#d8e0d6] bg-[#f6f8f3] p-3">
              <div className="flex items-center gap-2 rounded-[18px] border border-[#d8e0d6] bg-white px-3 py-2">
                <Users className="h-4 w-4 text-[#7d8c84]" />
                <input
                  value={manageQuery}
                  onChange={(event) => onManageQueryChange(event.target.value)}
                  placeholder="Find users by name, username, email, or ID"
                  className="w-full bg-transparent text-sm text-[#1f312a] outline-none placeholder:text-[#94a198]"
                />
                <button
                  type="button"
                  onClick={onRunManageLookup}
                  className="rounded-full bg-[#27463b] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white"
                >
                  {manageLoading ? "..." : "Find"}
                </button>
              </div>

              {manageResults.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {manageResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => onAddParticipant(user.id)}
                      className="flex w-full items-center justify-between rounded-[18px] border border-[#d8e0d6] bg-white px-3 py-3 text-left transition hover:bg-[#f8fbf7]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1f312a]">
                          {user.fullName || user.username || user.email || user.id}
                        </p>
                        <p className="truncate text-xs text-[#7d8c84]">
                          {user.username || user.email || user.id}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#edf4ec] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#315447]">
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {currentUserId && (activeConversation.threadType ?? "DIRECT") !== "DIRECT" ? (
            <button
              type="button"
              onClick={() => onRemoveParticipant(currentUserId)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[#f1cbc1] bg-white px-4 py-3 text-sm font-semibold text-[#b45a4b] transition hover:bg-[#fff5f2]"
            >
              <UserMinus className="h-4 w-4" />
              Leave conversation
            </button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Shared media" subtitle="Live previews taken from this conversation.">
        {mediaEntries.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {mediaEntries.slice(-6).reverse().map(({ message, asset }) => {
              const kind = getAssetKind(asset);
              const accessUrl = getAssetAccessUrl(asset);
              return kind === "video" ? (
                <div
                  key={message.id}
                  className="overflow-hidden rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3]"
                >
                  {asset?.url ? (
                    <video controls preload="metadata" className="h-28 w-full bg-slate-900 object-cover">
                      <source src={asset?.url} />
                    </video>
                  ) : null}
                  {accessUrl ? (
                    <Link
                      href={accessUrl}
                      target="_blank"
                      className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#315447]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Open
                    </Link>
                  ) : null}
                </div>
              ) : (
                <Link
                  key={message.id}
                  href={accessUrl || "#"}
                  target={accessUrl ? "_blank" : undefined}
                  className="group overflow-hidden rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3]"
                >
                  <img
                    src={asset?.url}
                    alt={formatAssetLabel(asset, message.assetId)}
                    className="h-28 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-[#d8e0d6] bg-[#f6f8f3] px-4 py-4 text-sm text-[#63716a]">
            No media has been shared in this conversation yet.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Files and audio" subtitle="Attachments grouped from the live thread timeline.">
        {fileEntries.length > 0 ? (
          <div className="space-y-2">
            {fileEntries.slice(-6).reverse().map(({ message, asset }) => {
              const kind = getAssetKind(asset);
              const accessUrl = getAssetAccessUrl(asset);
              const readable = isReadableAsset(asset);
              return (
                <div
                  key={message.id}
                  className="rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3] px-3 py-3 transition hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-2 text-[#5f6d65] shadow-[0_10px_18px_rgba(38,67,56,0.04)]">
                      {kind === "audio" ? <Music4 className="h-4 w-4" /> : readable ? <FileText className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1f312a]">
                        {formatAssetLabel(asset, message.assetId)}
                      </p>
                      <p className="truncate text-xs text-[#7d8c84]">
                        {[asset?.mimeType, formatAssetSize(asset?.size)].filter(Boolean).join(" • ") || "Attachment"}
                      </p>
                    </div>
                    {accessUrl ? (
                      <Link
                        href={accessUrl}
                        target="_blank"
                        className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-[#315447] shadow-[0_10px_18px_rgba(38,67,56,0.04)]"
                        aria-label="Open attachment"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    ) : null}
                    {asset?.downloadUrl ? (
                      <Link
                        href={asset.downloadUrl}
                        target="_blank"
                        className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-[#315447] shadow-[0_10px_18px_rgba(38,67,56,0.04)]"
                        aria-label="Download attachment"
                      >
                        <Download className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>

                  {kind === "audio" && asset?.url ? (
                    <audio controls className="mt-3 w-full">
                      <source src={asset.url} />
                    </audio>
                  ) : null}

                  {readable && accessUrl ? (
                    <div className="mt-3 overflow-hidden rounded-[16px] border border-[#d8e0d6] bg-white">
                      <iframe
                        title={formatAssetLabel(asset, message.assetId)}
                        src={accessUrl}
                        className="h-[220px] w-full bg-white"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-[#d8e0d6] bg-[#f6f8f3] px-4 py-4 text-sm text-[#63716a]">
            No files or audio notes have been shared yet.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Conversation controls" subtitle="These actions use the existing live thread API.">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onTogglePinned}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3] px-3 py-3 text-sm font-semibold text-[#42554c] transition hover:bg-white"
          >
            <Pin className="h-4 w-4" />
            {activeConversation.pinned ? "Unpin chat" : "Pin chat"}
          </button>
          <button
            type="button"
            onClick={onToggleMuted}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3] px-3 py-3 text-sm font-semibold text-[#42554c] transition hover:bg-white"
          >
            {activeConversation.muted ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {activeConversation.muted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            onClick={activeConversation.archived ? onRestore : onArchive}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3] px-3 py-3 text-sm font-semibold text-[#42554c] transition hover:bg-white"
          >
            <Archive className="h-4 w-4" />
            {activeConversation.archived ? "Restore" : "Archive"}
          </button>
          <button
            type="button"
            onClick={onClearPin}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[#d8e0d6] bg-[#f6f8f3] px-3 py-3 text-sm font-semibold text-[#42554c] transition hover:bg-white"
          >
            <Pin className="h-4 w-4" />
            Clear pin
          </button>
        </div>

        <div className="mt-4 rounded-[20px] border border-[#d8e0d6] bg-[#f6f8f3] p-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-2 text-[#5f6d65] shadow-[0_10px_18px_rgba(38,67,56,0.04)]">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1f312a]">Workspace settings</p>
              <p className="mt-1 text-xs text-[#7d8c84]">
                Open broader workspace settings for account, notification, and verification controls.
              </p>
              <Link
                href={workspaceRoutes.settings}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#27463b] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Open settings
              </Link>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
