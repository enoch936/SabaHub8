"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Loader2, Settings, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import EmployerProfileStudio from "@/components/workspace/profile/EmployerProfileStudio";
import WorkspaceProfileView from "@/components/workspace/profile/WorkspaceProfileView";
import { getFreelancerPublicProfile, getMyFreelancerProfile, type WorkspaceProfileSummary } from "@/lib/api";
import { ACTIVE_ROLE_STORAGE_KEY } from "@/lib/role-mode";
import { useSession } from "@/lib/session";
import { workspaceRoutes } from "@/lib/workspace-routes";

type WorkspaceRole = "EMPLOYER" | "FREELANCER";

function FreelancerProfileHub() {
  const [profile, setProfile] = useState<WorkspaceProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const myProfile = await getMyFreelancerProfile();
        const publicProfile = await getFreelancerPublicProfile(myProfile.id);
        if (!active) return;
        setProfile(publicProfile);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Unable to load freelancer profile.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (isLoading && !profile) {
    return (
      <div className="rounded-[30px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        <p className="mt-4 text-sm text-slate-500">Loading freelancer profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-[30px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <p className="text-sm text-slate-500">Freelancer profile could not be loaded.</p>
      </div>
    );
  }

  return (
    <WorkspaceProfileView
      profile={profile}
      eyebrow="Freelancer profile"
      actions={(
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={workspaceRoutes.projects}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Sparkles className="h-4 w-4" />
            Manage content
          </Link>
          <Link
            href={workspaceRoutes.contracts}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FolderKanban className="h-4 w-4" />
            Contracts
          </Link>
          <Link
            href={workspaceRoutes.settings}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <Link
            href={workspaceRoutes.reviews}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Star className="h-4 w-4" />
            Reviews
          </Link>
        </div>
      )}
    />
  );
}

export default function ProfilePage() {
  const sessionRole = useSession((state) => state.role);
  const role = useMemo<WorkspaceRole>(() => {
    if (sessionRole === "EMPLOYER" || sessionRole === "FREELANCER") {
      return sessionRole;
    }

    if (typeof window !== "undefined") {
      const storedRole = window.localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
      if (storedRole === "EMPLOYER" || storedRole === "FREELANCER") {
        return storedRole;
      }
    }

    return "FREELANCER";
  }, [sessionRole]);

  return role === "EMPLOYER" ? <EmployerProfileStudio /> : <FreelancerProfileHub />;
}
