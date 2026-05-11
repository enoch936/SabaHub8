"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import WorkspaceProfileView from "@/components/workspace/profile/WorkspaceProfileView";
import {
  getEmployerPublicProfile,
  getFreelancerPublicProfile,
  type WorkspaceProfileSummary,
} from "@/lib/api";

type ProfileKind = "employer" | "freelancer";

function normalizeKind(value?: string | null): ProfileKind | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "employer" || normalized === "employers") return "employer";
  if (normalized === "freelancer" || normalized === "freelancers") return "freelancer";
  return null;
}

export default function WorkspacePublicProfilePage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const resolvedParams = use(params);
  const kind = useMemo(() => normalizeKind(resolvedParams.kind), [resolvedParams.kind]);
  const [profile, setProfile] = useState<WorkspaceProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!kind) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const next =
          kind === "freelancer"
            ? await getFreelancerPublicProfile(resolvedParams.id)
            : await getEmployerPublicProfile(resolvedParams.id);
        if (!active) return;
        setProfile(next);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Unable to load profile.");
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
  }, [kind, resolvedParams.id]);

  if (!kind) {
    return (
      <div className="rounded-[30px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <p className="text-sm text-slate-500">This profile type is not supported.</p>
      </div>
    );
  }

  if (isLoading && !profile) {
    return (
      <div className="rounded-[30px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        <p className="mt-4 text-sm text-slate-500">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-[30px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <p className="text-sm text-slate-500">Profile could not be loaded.</p>
      </div>
    );
  }

  return (
    <WorkspaceProfileView
      profile={profile}
      eyebrow={kind === "employer" ? "Employer profile" : "Freelancer profile"}
      actions={profile.userId ? (
        <Link
          href={`/chat?user=${encodeURIComponent(profile.userId)}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <MessageSquare className="h-4 w-4" />
          Message
        </Link>
      ) : null}
    />
  );
}
