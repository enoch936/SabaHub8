"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Drawer, IconButton } from "@mui/material";
import { ArrowRight, Camera, CheckCircle2, FolderOpenDot, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";
import {
  type ProfileCompletionItem,
  type ProfileCompletionSummary,
} from "@/lib/profile-completion";
import { WORKSPACE_HEADER_HEIGHT } from "@/components/workspace-shell";

function ProgressRing({
  percent,
  avatarUrl,
  label,
}: {
  percent: number;
  avatarUrl: string | null;
  label: string;
}) {
  const size = 132;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, percent)) / 100) * circumference;

  return (
    <div className="relative h-[132px] w-[132px] shrink-0">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(15,23,42,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#profile-completion-ring)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="profile-completion-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-[18px] overflow-hidden rounded-full border border-white/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        {avatarUrl ? (
          <img src={avatarUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#fef3c7,#e2e8f0_70%)] text-3xl font-semibold text-slate-700">
            {label.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function itemIcon(item: ProfileCompletionItem) {
  switch (item.id) {
    case "photo":
      return Camera;
    case "overview":
      return UserRound;
    case "skills":
      return Sparkles;
    case "portfolio":
      return FolderOpenDot;
    case "verification":
      return ShieldCheck;
    default:
      return Sparkles;
  }
}

export default function ProfileCompletionSidebar({
  open,
  loading,
  summary,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  summary: ProfileCompletionSummary | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const nextIncompleteItem = useMemo(
    () => summary?.items.find((item) => !item.complete) ?? null,
    [summary],
  );

  const goTo = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(15,23,42,0.18)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 440, xl: 470 },
          top: { xs: 0, md: `${WORKSPACE_HEADER_HEIGHT + 14}px` },
          height: { xs: "100%", md: `calc(100% - ${WORKSPACE_HEADER_HEIGHT + 28}px)` },
          borderTopLeftRadius: { xs: 0, md: "30px" },
          borderBottomLeftRadius: { xs: 0, md: "30px" },
          background: "#f8fafc",
          boxShadow: "0 28px 60px rgba(15, 23, 42, 0.18)",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ height: "100%", overflowY: "auto" }}>
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Profile completion
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              Right-side onboarding panel
            </p>
          </div>
          <IconButton onClick={onClose} aria-label="Close profile completion sidebar">
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="space-y-5 p-5">
          <section className="relative overflow-hidden rounded-[30px] border border-emerald-100 bg-[linear-gradient(160deg,#ffffff_0%,#effdf5_44%,#ecfccb_100%)] p-5 shadow-[0_24px_54px_rgba(15,23,42,0.08)]">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-200/30 blur-2xl" />
            <div className="absolute -bottom-16 left-0 h-32 w-32 rounded-full bg-lime-200/40 blur-2xl" />

            {loading && !summary ? (
              <div className="space-y-4">
                <div className="h-5 w-36 animate-pulse rounded-full bg-slate-200" />
                <div className="h-24 animate-pulse rounded-[24px] bg-white/70" />
                <div className="h-20 animate-pulse rounded-[24px] bg-white/60" />
              </div>
            ) : summary ? (
              <div className="relative space-y-5">
                <div className="flex items-start gap-4">
                  <ProgressRing
                    percent={summary.percent}
                    avatarUrl={summary.avatarUrl}
                    label={summary.displayName}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      {summary.percent}% complete
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                      {summary.headline}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {summary.supportingText}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Completed
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {summary.completedCount}/{summary.totalCount}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Next move
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {nextIncompleteItem?.title ?? "All sections are complete"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] bg-white/70 p-4 text-sm text-slate-600">
                We could not load profile completion details right now.
              </div>
            )}
          </section>

          <section className="space-y-3">
            {(summary?.items ?? []).map((item) => {
              const Icon = itemIcon(item);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(item.href)}
                  className="group w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                        item.complete
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {item.complete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-slate-950">{item.title}</div>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                            item.complete
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.complete ? "Done" : item.rewardLabel}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-slate-500">{item.detail}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 transition group-hover:text-emerald-700">
                          {item.actionLabel}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
            {summary?.complete ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  All set
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  Your freelancer profile has the core signals in place. You can still refine it any time from the workspace.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">
                  The fastest way forward is to finish the next incomplete section and let the rest of the profile build from there.
                </p>
                <button
                  type="button"
                  onClick={() => goTo(summary?.nextActionHref ?? nextIncompleteItem?.href ?? "/jobs")}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {summary?.nextActionLabel ?? "Continue setup"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>
        </div>
      </Box>
    </Drawer>
  );
}
