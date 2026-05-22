"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileBadge2,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stamp,
} from "lucide-react";
import { toast } from "sonner";
import {
  confirmEmailVerification,
  confirmPhoneVerification,
  getUserSettings,
  requestEmailVerification,
  requestPhoneVerification,
  type UserProfile,
  updateUserSettings,
  verifyIdentity,
} from "@/lib/api";

type IdentityDraft = {
  country: string;
  location: string;
  timezone: string;
  bio: string;
  taxId: string;
  paymentMethod: string;
  phoneCountryCode: string;
  phoneNumber: string;
};

type VerificationMethod = "DOCUMENT" | "GOVERNMENT_ID" | "BUSINESS_REGISTRATION" | "MANUAL_REVIEW";

const identityMethods: Array<{ value: VerificationMethod; title: string; description: string }> = [
  {
    value: "DOCUMENT",
    title: "Document upload",
    description: "Best for freelancers and standard account reviews.",
  },
  {
    value: "GOVERNMENT_ID",
    title: "Government ID",
    description: "Use a national ID, passport, or equivalent identity document.",
  },
  {
    value: "BUSINESS_REGISTRATION",
    title: "Business registration",
    description: "Recommended for employers, agencies, and company accounts.",
  },
  {
    value: "MANUAL_REVIEW",
    title: "Manual review",
    description: "For escalations, edge cases, and operational exceptions.",
  },
];

function formatTimestamp(value?: number | null) {
  if (!value) {
    return "Waiting for review";
  }
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function buildDraft(profile: UserProfile): IdentityDraft {
  return {
    country: profile.country ?? "",
    location: profile.location ?? "",
    timezone: profile.timezone ?? "",
    bio: profile.bio ?? "",
    taxId: profile.taxId ?? "",
    paymentMethod: profile.paymentMethod ?? "",
    phoneCountryCode: profile.phoneCountryCode ?? "+251",
    phoneNumber: profile.phoneNumber ?? "",
  };
}

export default function IdentityVerificationPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod>("DOCUMENT");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingIdentity, setSubmittingIdentity] = useState(false);
  const [channelLoading, setChannelLoading] = useState<"email" | "phone" | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const currentProfile = await getUserSettings();
      setProfile(currentProfile);
      setDraft(buildDraft(currentProfile));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load identity center.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const verificationScore = useMemo(() => {
    const signals = [profile?.emailVerified, profile?.phoneVerified, profile?.identityVerified].filter(Boolean).length;
    return Math.round((signals / 3) * 100);
  }, [profile?.emailVerified, profile?.identityVerified, profile?.phoneVerified]);

  const verificationState = useMemo(() => {
    if (profile?.identityVerified) {
      return { tone: "emerald", label: "Verified", detail: "Identity review is active and visible to the admin queue." };
    }
    if (profile?.emailVerified || profile?.phoneVerified) {
      return { tone: "amber", label: "In progress", detail: "Contact proof is present, but KYC still needs submission." };
    }
    return { tone: "slate", label: "Not started", detail: "No persistent verification state has been completed yet." };
  }, [profile?.emailVerified, profile?.identityVerified, profile?.phoneVerified]);

  const saveDraft = async () => {
    if (!draft) {
      return;
    }

    setSaving(true);
    try {
      const nextProfile = await updateUserSettings({
        country: draft.country || undefined,
        location: draft.location || undefined,
        timezone: draft.timezone || undefined,
        bio: draft.bio || undefined,
        taxId: draft.taxId || undefined,
        paymentMethod: draft.paymentMethod || undefined,
        phoneCountryCode: draft.phoneCountryCode || undefined,
        phoneNumber: draft.phoneNumber || undefined,
      });
      setProfile(nextProfile);
      setDraft(buildDraft(nextProfile));
      toast.success("Identity intake saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save identity intake.");
    } finally {
      setSaving(false);
    }
  };

  const requestChannel = async (channel: "email" | "phone") => {
    setChannelLoading(channel);
    try {
      if (channel === "email") {
        const result = await requestEmailVerification();
        toast.success(result.message ?? "Email verification code sent.");
      } else {
        const result = await requestPhoneVerification();
        toast.success(result.message ?? "Phone verification code sent.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to request ${channel} verification.`);
    } finally {
      setChannelLoading(null);
    }
  };

  const confirmChannel = async (channel: "email" | "phone") => {
    const code = channel === "email" ? emailOtp.trim() : phoneOtp.trim();
    if (!code) {
      toast.error("Enter the verification code first.");
      return;
    }

    setChannelLoading(channel);
    try {
      const nextProfile = channel === "email" ? await confirmEmailVerification(code) : await confirmPhoneVerification(code);
      setProfile(nextProfile);
      setDraft(buildDraft(nextProfile));
      if (channel === "email") {
        setEmailOtp("");
      } else {
        setPhoneOtp("");
      }
      toast.success(`${channel === "email" ? "Email" : "Phone"} verification confirmed.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${channel === "email" ? "Email" : "Phone"} verification failed.`);
    } finally {
      setChannelLoading(null);
    }
  };

  const submitIdentity = async () => {
    setSubmittingIdentity(true);
    try {
      const message = await verifyIdentity(selectedMethod);
      const nextProfile = await getUserSettings();
      setProfile(nextProfile);
      setDraft(buildDraft(nextProfile));
      toast.success(message || `Identity verification started with ${selectedMethod}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start identity verification.");
    } finally {
      setSubmittingIdentity(false);
    }
  };

  const verificationSteps = [
    { label: "Profile intake", done: Boolean(profile?.country || profile?.location || profile?.timezone) },
    { label: "Email ownership", done: Boolean(profile?.emailVerified) },
    { label: "Phone ownership", done: Boolean(profile?.phoneVerified) },
    { label: "Identity review", done: Boolean(profile?.identityVerified) },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#0f766e_100%)] text-white shadow-[0_24px_72px_rgba(15,23,42,0.18)]">
        <div className="grid gap-8 px-6 py-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:px-8 lg:py-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              <BadgeCheck className="h-4 w-4" />
              KYC Center
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-[-0.04em] lg:text-5xl">Real identity verification with persistent state and admin handoff.</h1>
              <p className="max-w-3xl text-sm leading-7 text-white/76 lg:text-base">
                Start with profile intake, verify your email and phone, then launch a real identity review method that becomes visible in the operational admin console.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/jobs/settings?section=verification" className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                Back to settings
              </Link>
              <Link href="/admin/identity" className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Open admin review
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Verification score</div>
              <div className="mt-2 text-4xl font-semibold">{verificationScore}%</div>
              <div className="mt-2 text-sm text-white/70">Based on email, phone, and identity state.</div>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Status</div>
              <div className="mt-2 text-xl font-semibold">{verificationState.label}</div>
              <div className="mt-2 text-sm text-white/70">{verificationState.detail}</div>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Last update</div>
              <div className="mt-2 text-xl font-semibold">{formatTimestamp(profile?.identityVerifiedAt)}</div>
              <div className="mt-2 text-sm text-white/70">The admin console reads the same identity record.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Mail} label="Email" value={profile?.emailVerified ? "Verified" : "Pending"} detail={profile?.email ?? "No email saved"} tone={profile?.emailVerified ? "emerald" : "slate"} />
        <StatCard icon={Smartphone} label="Phone" value={profile?.phoneVerified ? "Verified" : "Pending"} detail={profile?.phoneNumber ?? "No phone saved"} tone={profile?.phoneVerified ? "emerald" : "slate"} />
        <StatCard icon={BadgeCheck} label="Identity" value={profile?.identityVerified ? "Verified" : "Waiting"} detail={profile?.identityVerificationMethod ?? "Method not started"} tone={profile?.identityVerified ? "emerald" : "amber"} />
        <StatCard icon={Stamp} label="Admin queue" value={profile?.identityVerified ? "Visible" : "Ready"} detail="Operational review binds to the same state." tone="sky" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Sparkles className="h-5 w-5 text-gray-700" />
              Identity intake
            </div>
            <p className="mt-2 text-sm text-gray-500">Keep the underlying profile record clean before you trigger the verification flow. This data is what the admin sees during review.</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">Country</span>
                <input
                  value={draft?.country ?? ""}
                  onChange={(event) => setDraft((current) => (current ? { ...current, country: event.target.value } : current))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="Country"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">Location</span>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={draft?.location ?? ""}
                    onChange={(event) => setDraft((current) => (current ? { ...current, location: event.target.value } : current))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 pl-11 text-sm outline-none"
                    placeholder="City or region"
                  />
                </div>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">Timezone</span>
                <input
                  value={draft?.timezone ?? ""}
                  onChange={(event) => setDraft((current) => (current ? { ...current, timezone: event.target.value } : current))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="Africa/Addis_Ababa"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">Tax / business ID</span>
                <input
                  value={draft?.taxId ?? ""}
                  onChange={(event) => setDraft((current) => (current ? { ...current, taxId: event.target.value } : current))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="Optional tax or registration number"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-semibold text-gray-900">Identity notes</span>
                <textarea
                  value={draft?.bio ?? ""}
                  onChange={(event) => setDraft((current) => (current ? { ...current, bio: event.target.value } : current))}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="Add a short note for the reviewer, the document source, or any special handling instruction."
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">Phone country code</span>
                <input
                  value={draft?.phoneCountryCode ?? ""}
                  onChange={(event) => setDraft((current) => (current ? { ...current, phoneCountryCode: event.target.value } : current))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="+251"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">Phone number</span>
                <input
                  value={draft?.phoneNumber ?? ""}
                  onChange={(event) => setDraft((current) => (current ? { ...current, phoneNumber: event.target.value.replace(/[^\\d]/g, "") } : current))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="911223344"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={saving || !draft}
                className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? "Saving intake..." : "Save intake"}
              </button>
              <button
                type="button"
                onClick={() => void loadProfile()}
                className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700"
              >
                Refresh profile
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Smartphone className="h-5 w-5 text-gray-700" />
              Channel proof
            </div>
            <p className="mt-2 text-sm text-gray-500">Email and phone verification are persistent and feed the same identity record that the admin console reads.</p>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <VerificationCard
                title="Email verification"
                verified={Boolean(profile?.emailVerified)}
                detail={profile?.email ?? "No email saved"}
                code={emailOtp}
                setCode={setEmailOtp}
                onRequest={() => void requestChannel("email")}
                onConfirm={() => void confirmChannel("email")}
                busy={channelLoading === "email"}
                placeholder="Enter email code"
              />
              <VerificationCard
                title="Phone verification"
                verified={Boolean(profile?.phoneVerified)}
                detail={profile?.phoneNumber ? `${profile.phoneCountryCode ?? ""} ${profile.phoneNumber}` : "No phone saved"}
                code={phoneOtp}
                setCode={setPhoneOtp}
                onRequest={() => void requestChannel("phone")}
                onConfirm={() => void confirmChannel("phone")}
                busy={channelLoading === "phone"}
                placeholder="Enter phone code"
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FileBadge2 className="h-5 w-5 text-gray-700" />
              Verification methods
            </div>
            <p className="mt-2 text-sm text-gray-500">Choose how this identity should be reviewed. The selected method is saved into the same backend state the admin workflow uses.</p>

            <div className="mt-5 space-y-3">
              {identityMethods.map((method) => {
                const active = selectedMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setSelectedMethod(method.value)}
                    className={`w-full rounded-[22px] border p-4 text-left transition ${active ? "border-gray-950 bg-gray-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]" : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{method.title}</div>
                        <div className={`mt-1 text-xs leading-5 ${active ? "text-white/72" : "text-gray-500"}`}>{method.description}</div>
                      </div>
                      <ChevronRight className={`h-4 w-4 ${active ? "text-white" : "text-gray-400"}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void submitIdentity()}
              disabled={submittingIdentity || loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submittingIdentity ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {submittingIdentity ? "Starting review..." : `Start ${selectedMethod.replace(/_/g, " ").toLowerCase()}`}
            </button>

            <div className="mt-5 rounded-[22px] border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
              Admins will see the same verification method, timestamps, and channel state on the operational identity page.
            </div>
          </section>

          <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Clock3 className="h-5 w-5 text-gray-700" />
              Verification timeline
            </div>
            <div className="mt-5 space-y-3">
              {verificationSteps.map((step, index) => (
                <div key={step.label} className="flex items-start gap-3 rounded-[20px] border border-gray-100 bg-gray-50 p-4">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{step.label}</div>
                    <div className="mt-1 text-xs text-gray-500">{step.done ? "Completed and stored." : "Pending completion."}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  tone: "emerald" | "amber" | "slate" | "sky";
}) {
  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
  }[tone];

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-950">{value}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${toneClasses}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 text-sm leading-6 text-gray-500">{detail}</div>
    </div>
  );
}

function VerificationCard({
  title,
  verified,
  detail,
  code,
  setCode,
  onRequest,
  onConfirm,
  busy,
  placeholder,
}: {
  title: string;
  verified: boolean;
  detail: string;
  code: string;
  setCode: (value: string) => void;
  onRequest: () => void;
  onConfirm: () => void;
  busy: boolean;
  placeholder: string;
}) {
  return (
    <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="mt-1 text-xs text-gray-500">{detail}</div>
        </div>
        <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${verified ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          {verified ? "Verified" : "Pending"}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={onRequest}
          disabled={busy}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-60"
        >
          {busy ? "Sending..." : `Send ${title.toLowerCase()} code`}
        </button>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy || !code.trim()}
          className="rounded-full bg-gray-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Confirming..." : `Confirm ${title.toLowerCase()}`}
        </button>
      </div>
    </div>
  );
}
