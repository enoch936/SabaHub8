"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, BriefcaseBusiness, FolderKanban, Loader2, Save, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import {
  getEmployerWorkspaceProfile,
  updateEmployerWorkspaceProfile,
  type EmployerProfileUpdateInput,
  type EmployerWorkspaceProfile,
  type WorkspaceProfileSummary,
} from "@/lib/api";
import { workspaceRoutes } from "@/lib/workspace-routes";
import WorkspaceProfileView from "./WorkspaceProfileView";

type EmployerProfileForm = {
  companyName: string;
  companyWebsite: string;
  companyLogo: string;
  industry: string;
  employeeCount: string;
  description: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  registrationNumber: string;
  paymentType: string;
  paymentAccountId: string;
  paymentCurrency: string;
};

const EMPTY_FORM: EmployerProfileForm = {
  companyName: "",
  companyWebsite: "",
  companyLogo: "",
  industry: "",
  employeeCount: "",
  description: "",
  address: "",
  city: "",
  country: "",
  taxId: "",
  registrationNumber: "",
  paymentType: "BANK_TRANSFER",
  paymentAccountId: "",
  paymentCurrency: "USD",
};

function toForm(profile?: EmployerWorkspaceProfile | null): EmployerProfileForm {
  if (!profile) {
    return EMPTY_FORM;
  }

  return {
    companyName: profile.companyName ?? "",
    companyWebsite: profile.companyWebsite ?? "",
    companyLogo: profile.companyLogo ?? "",
    industry: profile.industry ?? "",
    employeeCount:
      typeof profile.employeeCount === "number" && Number.isFinite(profile.employeeCount)
        ? String(profile.employeeCount)
        : "",
    description: profile.description ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    country: profile.country ?? "",
    taxId: profile.taxId ?? "",
    registrationNumber: profile.registrationNumber ?? "",
    paymentType: profile.paymentType ?? "BANK_TRANSFER",
    paymentAccountId: profile.paymentAccountId ?? "",
    paymentCurrency: profile.paymentCurrency ?? "USD",
  };
}

function toPublicSummary(profile: EmployerWorkspaceProfile): WorkspaceProfileSummary {
  const location = [profile.city, profile.country].filter(Boolean).join(", ") || null;
  return {
    kind: "EMPLOYER",
    id: profile.id,
    userId: profile.userId ?? undefined,
    displayName: profile.companyName?.trim() || "Employer",
    headline: profile.industry?.trim() || "Hiring team",
    about: profile.description ?? null,
    avatarUrl: profile.companyLogo ?? null,
    coverImage: null,
    location,
    timezone: null,
    website: profile.companyWebsite ?? null,
    industry: profile.industry ?? null,
    employeeCount: profile.employeeCount ?? null,
    availability: null,
    hourlyRate: null,
    currency: profile.paymentCurrency ?? null,
    memberSince: profile.memberSince ?? null,
    badges: profile.badges ?? [],
    skills: [],
    categories: [],
    languages: [],
    trust: profile.trust,
    stats: profile.stats,
    portfolio: [],
    reviews: profile.reviews ?? [],
  };
}

function normalizePayload(form: EmployerProfileForm): EmployerProfileUpdateInput {
  const employeeCount = Number.parseInt(form.employeeCount, 10);
  const maybe = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  };

  return {
    companyName: maybe(form.companyName),
    companyWebsite: maybe(form.companyWebsite),
    companyLogo: maybe(form.companyLogo),
    industry: maybe(form.industry),
    employeeCount: Number.isFinite(employeeCount) ? employeeCount : undefined,
    description: maybe(form.description),
    address: maybe(form.address),
    city: maybe(form.city),
    country: maybe(form.country),
    taxId: maybe(form.taxId),
    registrationNumber: maybe(form.registrationNumber),
    paymentType: maybe(form.paymentType),
    paymentAccountId: maybe(form.paymentAccountId),
    paymentCurrency: maybe(form.paymentCurrency),
  };
}

export default function EmployerProfileStudio() {
  const [profile, setProfile] = useState<EmployerWorkspaceProfile | null>(null);
  const [form, setForm] = useState<EmployerProfileForm>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const next = await getEmployerWorkspaceProfile();
        if (!active) return;
        setProfile(next);
        setForm(toForm(next));
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Unable to load employer profile.");
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

  const summary = useMemo(() => (profile ? toPublicSummary(profile) : null), [profile]);

  const quickActions = [
    {
      href: workspaceRoutes.createJob,
      label: "Post a job",
      detail: "Open a new hiring brief with requirements and trust cues.",
      icon: <BriefcaseBusiness className="h-4 w-4" />,
    },
    {
      href: workspaceRoutes.contracts,
      label: "Manage contracts",
      detail: "Track escrow, milestones, delivery, and disputes.",
      icon: <FolderKanban className="h-4 w-4" />,
    },
    {
      href: workspaceRoutes.team,
      label: "Manage team",
      detail: "Invite recruiters and coordinate your hiring workspace.",
      icon: <UsersRound className="h-4 w-4" />,
    },
  ];

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const next = await updateEmployerWorkspaceProfile(normalizePayload(form));
      setProfile(next);
      setForm(toForm(next));
      toast.success("Employer profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save employer profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const setField = <K extends keyof EmployerProfileForm>(key: K, value: EmployerProfileForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  if (isLoading && !profile) {
    return (
      <div className="rounded-[30px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        <p className="mt-4 text-sm text-slate-500">Loading employer profile…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary ? (
        <WorkspaceProfileView
          profile={summary}
          eyebrow="Employer profile studio"
          actions={(
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={workspaceRoutes.publicProfile("employer", profile?.id || "")}
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View public profile
              </Link>
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save profile
              </button>
            </div>
          )}
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Building2 className="h-4 w-4 text-sky-600" />
            Company and billing profile
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Keep the employer card, verification posture, and billing trust details consistent across jobs, proposals, and contracts.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Company name</span>
              <input value={form.companyName} onChange={(event) => setField("companyName", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Industry</span>
              <input value={form.industry} onChange={(event) => setField("industry", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Website</span>
              <input value={form.companyWebsite} onChange={(event) => setField("companyWebsite", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Company logo URL</span>
              <input value={form.companyLogo} onChange={(event) => setField("companyLogo", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Employee count</span>
              <input value={form.employeeCount} onChange={(event) => setField("employeeCount", event.target.value)} inputMode="numeric" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Country</span>
              <input value={form.country} onChange={(event) => setField("country", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Description</span>
              <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Address</span>
              <input value={form.address} onChange={(event) => setField("address", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">City</span>
              <input value={form.city} onChange={(event) => setField("city", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Registration number</span>
              <input value={form.registrationNumber} onChange={(event) => setField("registrationNumber", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tax ID</span>
              <input value={form.taxId} onChange={(event) => setField("taxId", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Payment type</span>
              <input value={form.paymentType} onChange={(event) => setField("paymentType", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Payment account reference</span>
              <input value={form.paymentAccountId} onChange={(event) => setField("paymentAccountId", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Payment currency</span>
              <input value={form.paymentCurrency} onChange={(event) => setField("paymentCurrency", event.target.value.toUpperCase())} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-400" />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Quick actions
            </div>
            <div className="mt-4 space-y-3">
              {quickActions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    {item.icon}
                    {item.label}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-semibold text-slate-950">Why this matters</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Jobs, proposals, and contracts all look more credible when the employer profile shows real company, billing, and verification context.</p>
              <p>Freelancers can inspect these trust signals before accepting milestone work, especially where escrow and release timing matter.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
