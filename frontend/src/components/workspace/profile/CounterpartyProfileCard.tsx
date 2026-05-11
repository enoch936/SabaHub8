"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Star } from "lucide-react";
import {
  getEmployerPublicProfile,
  getFreelancerPublicProfile,
  type WorkspaceProfileSummary,
} from "@/lib/api";
import { workspaceRoutes } from "@/lib/workspace-routes";

export default function CounterpartyProfileCard({
  kind,
  id,
  fallbackName,
}: {
  kind: "employer" | "freelancer";
  id?: string | null;
  fallbackName?: string | null;
}) {
  const [profile, setProfile] = useState<WorkspaceProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const next =
          kind === "freelancer"
            ? await getFreelancerPublicProfile(id)
            : await getEmployerPublicProfile(id);
        if (!active) return;
        setProfile(next);
      } catch {
        if (!active) return;
        setProfile(null);
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
  }, [kind, id]);

  const displayName = profile?.displayName || fallbackName || "Counterparty";
  const verifiedCount = profile
    ? [
        profile.trust.emailVerified,
        profile.trust.phoneVerified,
        profile.trust.identityVerified,
        profile.trust.businessVerified,
        profile.trust.paymentVerified,
        profile.trust.kycVerified,
      ].filter(Boolean).length
    : 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {kind === "freelancer" ? "Freelancer profile" : "Employer profile"}
          </p>
          <p className="mt-2 text-sm font-semibold">{displayName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {profile?.headline || "Profile summary available"}
          </p>
        </div>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-slate-700">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          {verifiedCount} trust checks
        </span>
        {typeof profile?.stats?.rating === "number" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-amber-700">
            <Star className="h-3.5 w-3.5 fill-current" />
            {profile.stats.rating.toFixed(1)}
          </span>
        ) : null}
        {profile?.trust.kycStatus ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-slate-700">
            KYC {profile.trust.kycStatus}
          </span>
        ) : null}
      </div>

      {id ? (
        <Link
          href={workspaceRoutes.publicProfile(kind, id)}
          className="mt-4 inline-flex rounded-full border border-white bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Open full profile
        </Link>
      ) : null}
    </div>
  );
}
