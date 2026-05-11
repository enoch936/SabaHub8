"use client";

import type { ReactNode } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Globe,
  Languages,
  MapPin,
  ShieldCheck,
  Star,
  WalletCards,
} from "lucide-react";
import type { WorkspaceProfileSummary, WorkspaceProfileTrustSignals } from "@/lib/api";

function formatMoney(value?: number | null, currency?: string | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function trustItems(trust: WorkspaceProfileTrustSignals) {
  return [
    { label: "Email", value: trust.emailVerified },
    { label: "Phone", value: trust.phoneVerified },
    { label: "Identity", value: trust.identityVerified },
    { label: "Business", value: trust.businessVerified },
    { label: "Payment", value: trust.paymentVerified },
    { label: "KYC", value: trust.kycVerified, helper: trust.kycStatus || "Pending" },
  ];
}

function DetailChip({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur">
      {icon}
      {label}
    </span>
  );
}

export default function WorkspaceProfileView({
  profile,
  actions,
  eyebrow,
}: {
  profile: WorkspaceProfileSummary;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  const rating = typeof profile.stats?.rating === "number" ? profile.stats.rating : undefined;
  const reviewCount = typeof profile.stats?.reviewCount === "number" ? profile.stats.reviewCount : undefined;
  const memberSince = profile.memberSince ? new Date(profile.memberSince).toLocaleDateString() : null;
  const moneyLabel =
    profile.kind === "EMPLOYER"
      ? formatMoney(profile.stats?.totalSpent, profile.currency)
      : formatMoney(profile.hourlyRate, profile.currency);

  const statCards = [
    {
      label: profile.kind === "EMPLOYER" ? "Posted jobs" : "Completed contracts",
      value:
        profile.kind === "EMPLOYER"
          ? formatCompact(profile.stats?.totalJobsPosted)
          : formatCompact(profile.stats?.completedContracts),
    },
    {
      label: profile.kind === "EMPLOYER" ? "Total hires" : "Active contracts",
      value:
        profile.kind === "EMPLOYER"
          ? formatCompact(profile.stats?.totalHires)
          : formatCompact(profile.stats?.activeContracts),
    },
    {
      label: profile.kind === "EMPLOYER" ? "Total spent" : "Rate",
      value: moneyLabel,
    },
    {
      label: "Rating",
      value:
        typeof rating === "number"
          ? `${rating.toFixed(1)}${typeof reviewCount === "number" ? ` · ${reviewCount} reviews` : ""}`
          : "No reviews yet",
    },
  ].filter((item) => item.value);

  const detailChips = [
    profile.location ? <DetailChip key="location" icon={<MapPin className="h-3.5 w-3.5" />} label={profile.location} /> : null,
    profile.timezone ? <DetailChip key="timezone" icon={<Globe className="h-3.5 w-3.5" />} label={profile.timezone} /> : null,
    memberSince ? <DetailChip key="member" icon={<CalendarDays className="h-3.5 w-3.5" />} label={`Member since ${memberSince}`} /> : null,
    profile.website ? <DetailChip key="website" icon={<Building2 className="h-3.5 w-3.5" />} label={profile.website.replace(/^https?:\/\//, "")} /> : null,
    profile.industry ? <DetailChip key="industry" icon={<BriefcaseBusiness className="h-3.5 w-3.5" />} label={profile.industry} /> : null,
    typeof profile.employeeCount === "number"
      ? <DetailChip key="size" icon={<Building2 className="h-3.5 w-3.5" />} label={`${profile.employeeCount}+ team`} />
      : null,
    profile.kind === "FREELANCER" && profile.availability
      ? <DetailChip key="availability" icon={<BadgeCheck className="h-3.5 w-3.5" />} label={profile.availability.replaceAll("_", " ")} />
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_20px_54px_rgba(15,23,42,0.06)]">
        <div
          className="relative overflow-hidden px-6 py-8 sm:px-8"
          style={{
            background: profile.coverImage
              ? `linear-gradient(135deg, rgba(15,23,42,0.68), rgba(15,118,110,0.48)), url(${profile.coverImage}) center/cover`
              : "linear-gradient(135deg, #f8fafc 0%, #ecfeff 45%, #fef3c7 100%)",
          }}
        >
          <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {eyebrow || `${profile.kind === "EMPLOYER" ? "Employer" : "Freelancer"} profile`}
              </p>
              <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="h-24 w-24 overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-[0_18px_44px_rgba(15,23,42,0.12)]">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-2xl font-semibold text-white">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                      {profile.displayName}
                    </h1>
                    {(profile.badges ?? []).map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-base font-medium text-slate-700">
                    {profile.headline || (profile.kind === "EMPLOYER" ? "Hiring team" : "Marketplace freelancer")}
                  </p>
                  {detailChips.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {detailChips}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </div>

        {statCards.length > 0 ? (
          <div className="grid gap-3 border-t border-slate-200/70 bg-slate-50/80 px-6 py-5 sm:grid-cols-2 xl:grid-cols-4 sm:px-8">
            {statCards.map((item) => (
              <div key={item.label} className="rounded-[22px] border border-white bg-white px-4 py-4 shadow-[0_12px_26px_rgba(15,23,42,0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">About</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {profile.about || "This profile has not added an about section yet."}
            </p>
          </div>

          {(profile.skills?.length || profile.categories?.length || profile.languages?.length) ? (
            <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Capabilities</p>
              {profile.skills?.length ? (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((item) => (
                      <span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {profile.categories?.length ? (
                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <BriefcaseBusiness className="h-4 w-4 text-sky-600" />
                    Categories
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.categories.map((item) => (
                      <span key={item} className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {profile.languages?.length ? (
                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Languages className="h-4 w-4 text-violet-600" />
                    Languages
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((item) => (
                      <span key={item} className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {(profile.portfolio?.length ?? 0) > 0 ? (
            <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Portfolio</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(profile.portfolio ?? []).map((item, index) => (
                  <article key={item.id || `${item.title || "portfolio"}-${index}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/70">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title || "Portfolio item"} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-[linear-gradient(135deg,#e2e8f0,#fef3c7)] text-sm font-semibold text-slate-600">
                        Portfolio sample
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-slate-950">{item.title || "Untitled work"}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description || "No extra description added."}
                      </p>
                      {item.technologies?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.technologies.map((tech) => (
                            <span key={tech} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
                              {tech}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {(profile.reviews?.length ?? 0) > 0 ? (
            <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Reviews</p>
                {typeof rating === "number" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {rating.toFixed(1)}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 space-y-3">
                {(profile.reviews ?? []).slice(0, 6).map((review, index) => (
                  <article key={review.id || `${review.reviewerId || "review"}-${index}`} className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{review.reviewerName || "Workspace user"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recent review"}
                        </p>
                      </div>
                      {typeof review.rating === "number" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {review.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {review.comment || "No written review provided."}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Trust signals
            </div>
            <div className="mt-4 space-y-3">
              {trustItems(profile.trust).map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    {item.helper ? <p className="mt-1 text-xs text-slate-500">{item.helper}</p> : null}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                      item.value
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {item.value ? "Verified" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <WalletCards className="h-4 w-4 text-sky-600" />
              Working model
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {profile.kind === "EMPLOYER" ? (
                <>
                  <p>Employer-funded escrow protects milestone delivery before releases happen.</p>
                  <p>Trust signals show payment readiness, business checks, and KYC state on one page.</p>
                </>
              ) : (
                <>
                  <p>Freelancer delivery is designed around milestone submission, employer approval, and protected release flows.</p>
                  <p>Skills, proof of work, and verification signals are grouped here so employers can review faster.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
