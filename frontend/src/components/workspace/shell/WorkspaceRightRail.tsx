"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  BellDot,
  BriefcaseBusiness,
  ChevronRight,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";
import {
  getWallet,
  listMarketplaceFreelancers,
  listTrendingJobs,
  type Job as ApiJob,
  type MarketplaceFreelancer,
  type WalletSnapshot,
} from "@/lib/api";
import { useChatInbox } from "@/lib/chatInbox";
import { resolveEmployerDisplayName } from "@/lib/jobStore";
import { useNotifications } from "@/lib/notifications";
import { useJobStore } from "@/lib/jobStore";
import { useSession } from "@/lib/session";
import type { Job as UiJob } from "@/lib/types";
import { WORKSPACE_HEADER_HEIGHT, WORKSPACE_RIGHT_RAIL_WIDTH } from "@/components/workspace-shell";

type RailMode = "jobs" | "talent" | "wallet" | "general";

function resolveMode(pathname: string): RailMode {
  if (pathname.startsWith("/jobs/talent")) return "talent";
  if (pathname.startsWith("/jobs/wallet")) return "wallet";
  if (pathname.startsWith("/jobs")) return "jobs";
  return "general";
}

export default function WorkspaceRightRail({ isOpen = true }: { isOpen?: boolean }) {
  const pathname = usePathname();
  const theme = useTheme();
  const isVisible = useMediaQuery(theme.breakpoints.up("xl"));
  const mode = resolveMode(pathname);
  const unreadMessages = useChatInbox((s) => s.unreadMessages);
  const unreadNotifications = useNotifications((s) => s.unread);
  const role = useSession((s) => s.role);
  const jobs = useJobStore((s) => s.jobs);
  const savedJobs = useJobStore((s) => s.savedJobs);
  const totalCount = useJobStore((s) => s.totalCount);

  const [trendingJobs, setTrendingJobs] = useState<ApiJob[]>([]);
  const [featuredTalent, setFeaturedTalent] = useState<MarketplaceFreelancer[]>([]);
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);

  useEffect(() => {
    let active = true;

    if (!isOpen || !isVisible) {
      return () => {
        active = false;
      };
    }

    if (mode === "jobs") {
      listTrendingJobs(4)
        .then((items) => {
          if (active) setTrendingJobs(items);
        })
        .catch(() => {
          if (active) setTrendingJobs([]);
        });
    }

    if (mode === "talent") {
      listMarketplaceFreelancers({ page: 0, size: 3 })
        .then((result) => {
          if (active) setFeaturedTalent(result.items);
        })
        .catch(() => {
          if (active) setFeaturedTalent([]);
        });
    }

    if (mode === "wallet") {
      getWallet()
        .then((snapshot) => {
          if (active) setWallet(snapshot);
        })
        .catch(() => {
          if (active) setWallet(null);
        });
    }

    return () => {
      active = false;
    };
  }, [isOpen, isVisible, mode]);

  const skillRadar = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      for (const skill of job.skills.slice(0, 4)) {
        counts.set(skill, (counts.get(skill) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [jobs]);

  const marketItems = (trendingJobs.length ? trendingJobs : jobs.slice(0, 4)) as Array<ApiJob | UiJob>;

  if (!isVisible || !isOpen) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: WORKSPACE_HEADER_HEIGHT,
        right: 0,
        bottom: 0,
        width: WORKSPACE_RIGHT_RAIL_WIDTH,
        px: 2,
        py: 2.5,
        overflowY: "auto",
      }}
    >
      <div className="space-y-4">
        <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Sparkles className="h-4 w-4 text-gray-700" />
            Collaboration Pulse
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MessageSquareMore className="h-4 w-4 text-gray-500" />
                Unread messages
              </div>
              <span className="text-sm font-semibold text-gray-900">{unreadMessages}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <BellDot className="h-4 w-4 text-gray-500" />
                Active alerts
              </div>
              <span className="text-sm font-semibold text-gray-900">{unreadNotifications}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <ShieldCheck className="h-4 w-4 text-gray-500" />
                Saved items
              </div>
              <span className="text-sm font-semibold text-gray-900">{savedJobs.size}</span>
            </div>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-gray-400">
            {role === "EMPLOYER" ? "Employer operating surface" : "Freelancer operating surface"}
          </p>
        </div>

        {mode === "jobs" ? (
          <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <BriefcaseBusiness className="h-4 w-4 text-gray-700" />
              Live Market Radar
            </div>
            <p className="mt-2 text-sm text-gray-500">{totalCount} live opportunities indexed from the backend.</p>
            <div className="mt-4 space-y-3">
              {marketItems.map((job) => (
                <div key={job.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{job.title}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{resolveEmployerDisplayName(job as ApiJob | UiJob)}</span>
                    <span>
                      $
                      {"budgetMax" in job
                        ? (job.budgetMax ?? job.budget?.max ?? 0)
                        : job.budget?.max ?? 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {skillRadar.length ? (
              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Skill velocity</p>
                <div className="mt-3 space-y-2">
                  {skillRadar.map(([skill, count]) => (
                    <div key={skill} className="flex items-center justify-between text-sm">
                      <span>{skill}</span>
                      <span className="text-gray-500">{count} briefs</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {mode === "talent" ? (
          <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <UsersRound className="h-4 w-4 text-gray-700" />
              Talent Signals
            </div>
            <div className="mt-4 space-y-3">
              {featuredTalent.map((person) => (
                <div key={person.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{person.name}</p>
                      <p className="truncate text-xs text-gray-500">{person.title ?? "Freelancer"}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">
                      {person.hourlyRate ? `$${person.hourlyRate}/hr` : "Rate on profile"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{person.location ?? "Remote ready"}</span>
                    <span>{person.rating ? `${person.rating.toFixed(1)} ★` : "New"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {mode === "wallet" ? (
          <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <WalletCards className="h-4 w-4 text-gray-700" />
              Escrow Watch
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Available</p>
                <p className="mt-2 text-2xl font-semibold">
                  {wallet?.currency ?? "ETB"} {(wallet?.availableBalance ?? wallet?.balance ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Escrow held</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{wallet?.escrowHeld ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Pending payouts</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{wallet?.pendingPayouts ?? 0}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Operations Guide</p>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p className="rounded-2xl bg-gray-50 px-3 py-3">
              Keep job, talent, escrow, and trust activities inside the same workspace loop.
            </p>
            <p className="rounded-2xl bg-gray-50 px-3 py-3">
              The layout stays connected to the current backend routes and data.
            </p>
          </div>
        </div>
      </div>
    </Box>
  );
}
