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
        bgcolor: "transparent",
        "&::-webkit-scrollbar": { display: "none" },
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      <div className="space-y-4">
        <div className="glass p-5 rounded-[28px] border-white/10 shadow-glass">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest">
            <Sparkles className="h-4 w-4 text-blue-400" />
            Collaboration Pulse
          </div>
          <div className="mt-4 space-y-2">
            {[
              { label: "Messages", value: unreadMessages, icon: <MessageSquareMore className="h-4 w-4 text-white/40" />, color: "bg-blue-500/10 text-blue-400" },
              { label: "Alerts", value: unreadNotifications, icon: <BellDot className="h-4 w-4 text-white/40" />, color: "bg-emerald-500/10 text-emerald-400" },
              { label: "Saved", value: savedJobs.size, icon: <ShieldCheck className="h-4 w-4 text-white/40" />, color: "bg-purple-500/10 text-purple-400" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 px-3 py-3 group hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 text-[11px] font-bold text-white/60">
                  {stat.icon}
                  {stat.label}
                </div>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[9px] uppercase tracking-[0.2em] font-bold text-white/20">
            {role === "EMPLOYER" ? "Employer surface" : "Freelancer surface"}
          </p>
        </div>

        {mode === "jobs" ? (
          <div className="glass p-5 rounded-[28px] border-white/10 shadow-glass">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest">
              <BriefcaseBusiness className="h-4 w-4 text-purple-400" />
              Live Market Radar
            </div>
            <div className="mt-4 space-y-3">
              {marketItems.map((job) => (
                <div key={job.id} className="rounded-2xl border border-white/5 bg-white/5 p-3 group hover:border-white/10 transition-all">
                  <p className="text-xs font-bold text-white line-clamp-2 group-hover:text-blue-400">{job.title}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-white/40">
                    <span>{resolveEmployerDisplayName(job as ApiJob | UiJob)}</span>
                    <span className="text-emerald-400">
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
              <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/20 mb-3">Skill velocity</p>
                <div className="space-y-2">
                  {skillRadar.map(([skill, count]) => (
                    <div key={skill} className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-white/60">{skill}</span>
                      <span className="text-blue-400">{count} briefs</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="glass p-5 rounded-[28px] border-white/10 shadow-glass group cursor-pointer hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white uppercase tracking-widest">Operations Guide</p>
            <ChevronRight className="h-4 w-4 text-white/40" />
          </div>
          <div className="mt-4 space-y-2 text-[11px] font-bold text-white/40">
            <p className="rounded-xl bg-white/5 p-3 leading-relaxed">
              Keep job, talent, escrow, and trust activities inside the same workspace loop.
            </p>
          </div>
        </div>
      </div>
    </Box>
  );
}
