"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stamp,
  Users,
} from "lucide-react";
import {
  adminReviewUserIdentity,
  adminUsersWorkspace,
  type AdminIdentityWorkspace,
  type AppUser,
} from "@/lib/api";

type ReviewFormState = {
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  documentVerified: boolean;
  reviewNote: string;
  kycMethod: string;
};

const reviewStatuses = ["UNVERIFIED", "PENDING", "REVIEW", "VERIFIED", "REJECTED"];
const kycMethods = ["MANUAL_REVIEW", "EMAIL", "PHONE_OTP", "DOCUMENT", "GOVERNMENT_ID", "BUSINESS_REGISTRATION"];

function formatDateTime(value?: string | null) {
  if (!value) {
    return "--";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function toReviewForm(user: AppUser): ReviewFormState {
  return {
    status: user.identity?.status ?? "UNVERIFIED",
    emailVerified: Boolean(user.identity?.emailVerified),
    phoneVerified: Boolean(user.identity?.phoneVerified),
    documentVerified: Boolean(user.identity?.documentVerified),
    reviewNote: user.identity?.reviewNote ?? "",
    kycMethod: user.identity?.kycMethod ?? "MANUAL_REVIEW",
  };
}

function progressValue(user: AppUser) {
  return [user.identity?.emailVerified, user.identity?.phoneVerified, user.identity?.documentVerified].filter(Boolean).length;
}

function colorForStatus(status?: string | null) {
  switch ((status ?? "").toUpperCase()) {
    case "VERIFIED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "REJECTED":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "REVIEW":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "PENDING":
      return "bg-sky-100 text-sky-700 border-sky-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function AdminIdentityPage() {
  const [workspace, setWorkspace] = useState<AdminIdentityWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    status: "UNVERIFIED",
    emailVerified: false,
    phoneVerified: false,
    documentVerified: false,
    reviewNote: "",
    kycMethod: "MANUAL_REVIEW",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextWorkspace = await adminUsersWorkspace();
      setWorkspace(nextWorkspace);
    } catch (loadError) {
      setWorkspace(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load identity operations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const users = workspace?.users ?? [];

  const selectedUser = useMemo(() => {
    if (!users.length) {
      return null;
    }
    if (!selectedUserId) {
      return users[0];
    }
    return users.find((user) => user.id === selectedUserId) ?? users[0];
  }, [selectedUserId, users]);

  useEffect(() => {
    if (selectedUser) {
      setReviewForm(toReviewForm(selectedUser));
    }
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const status = (user.identity?.status ?? "UNVERIFIED").toUpperCase();
      if (filter !== "all" && status !== filter.toUpperCase()) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return [user.fullName, user.email, user.username ?? "", user.companyName ?? "", user.identity?.kycMethod ?? ""]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [filter, query, users]);

  const metrics = useMemo(() => {
    const total = users.length;
    const verified = users.filter((user) => (user.identity?.status ?? "").toUpperCase() === "VERIFIED").length;
    const review = users.filter((user) => (user.identity?.status ?? "").toUpperCase() === "REVIEW").length;
    const pending = users.filter((user) => ["PENDING", "UNVERIFIED"].includes((user.identity?.status ?? "UNVERIFIED").toUpperCase())).length;
    const rejected = users.filter((user) => (user.identity?.status ?? "").toUpperCase() === "REJECTED").length;
    return { total, verified, review, pending, rejected };
  }, [users]);

  const updateReview = async () => {
    if (!selectedUser) {
      return;
    }
    setSaving(true);
    try {
      await adminReviewUserIdentity(selectedUser.id, {
        status: reviewForm.status,
        emailVerified: reviewForm.emailVerified,
        phoneVerified: reviewForm.phoneVerified,
        documentVerified: reviewForm.documentVerified,
        reviewNote: reviewForm.reviewNote || undefined,
        kycMethod: reviewForm.kycMethod,
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save identity review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,#081225_0%,#0f172a_48%,#0f766e_100%)] text-white shadow-[0_24px_72px_rgba(15,23,42,0.18)]">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              <BadgeCheck className="h-4 w-4" />
              Identity Operations
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-[-0.04em] lg:text-5xl">Admin identity review now runs as a dedicated operations console.</h1>
              <p className="max-w-3xl text-sm leading-7 text-white/76 lg:text-base">
                Review KYC progress, adjust verification state, and resolve exceptions from the same persistent identity record the user KYC page writes to.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/users" className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                Open full user workspace
              </Link>
              <button onClick={() => void load()} className="rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Refresh queue
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <StatBlock label="Pending" value={String(metrics.pending)} detail="Users waiting for KYC completion" tone="amber" />
            <StatBlock label="Verified" value={String(metrics.verified)} detail="Identity records already approved" tone="emerald" />
            <StatBlock label="In review" value={String(metrics.review)} detail="Currently under manual review" tone="sky" />
            <StatBlock label="Rejected" value={String(metrics.rejected)} detail="Records that need rework or escalation" tone="rose" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Identity records" value={String(metrics.total)} tone="neutral" />
        <MetricCard label="Verified accounts" value={String(metrics.verified)} tone="success" />
        <MetricCard label="Manual review" value={String(metrics.review)} tone="warning" />
        <MetricCard label="Open risk" value={String(metrics.pending + metrics.rejected)} tone="critical" />
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Users className="h-5 w-5 text-gray-700" />
                Review queue
              </div>
              <p className="mt-2 text-sm text-gray-500">Search, filter, and open one identity record at a time.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-full border border-gray-200 px-4 py-3 pl-10 text-sm outline-none"
                  placeholder="Search user, email, company, or method"
                />
              </div>
              <div className="relative">
                <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-full border border-gray-200 bg-white px-10 py-3 text-sm outline-none">
                  <option value="all">All statuses</option>
                  {reviewStatuses.map((status) => (
                    <option key={status} value={status.toLowerCase()}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-gray-200">
            <div className="grid grid-cols-[1.3fr_0.75fr_0.7fr_0.55fr] gap-0 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              <div>User</div>
              <div>Identity</div>
              <div>Method</div>
              <div></div>
            </div>
            <div className="max-h-[690px] overflow-auto">
              {filteredUsers.map((user) => {
                const active = user.id === selectedUser?.id;
                const progress = progressValue(user);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`grid w-full grid-cols-[1.3fr_0.75fr_0.7fr_0.55fr] gap-0 border-b border-gray-100 px-4 py-4 text-left transition last:border-b-0 ${active ? "bg-slate-50" : "bg-white hover:bg-gray-50"}`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-950">{user.fullName}</div>
                      <div className="mt-1 text-xs text-gray-500">{user.email}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                        <span className="rounded-full border border-gray-200 px-2 py-1">{user.accountType ?? "user"}</span>
                        {user.companyName ? <span className="rounded-full border border-gray-200 px-2 py-1">{user.companyName}</span> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${colorForStatus(user.identity?.status)}`}>{user.identity?.status ?? "UNVERIFIED"}</span>
                      <div className="text-xs text-gray-500">{progress}/3 signals verified</div>
                    </div>
                    <div className="text-sm font-medium text-gray-700">{user.identity?.kycMethod ?? "MANUAL_REVIEW"}</div>
                    <div className="flex items-center justify-end text-gray-400">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                  </button>
                );
              })}
              {!filteredUsers.length ? <div className="px-4 py-8 text-center text-sm text-gray-500">No users match the current filter.</div> : null}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ShieldCheck className="h-5 w-5 text-gray-700" />
              Review details
            </div>
            {selectedUser ? (
              <>
                <div className="mt-4 rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-semibold text-gray-950">{selectedUser.fullName}</div>
                      <div className="mt-1 text-sm text-gray-500">{selectedUser.email}</div>
                      <div className="mt-2 text-xs text-gray-500">User ID {selectedUser.id}</div>
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${colorForStatus(selectedUser.identity?.status)}`}>{selectedUser.identity?.status ?? "UNVERIFIED"}</span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2"><span>Email proof</span><span className="font-semibold text-gray-900">{selectedUser.identity?.emailVerified ? "Yes" : "No"}</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2"><span>Phone proof</span><span className="font-semibold text-gray-900">{selectedUser.identity?.phoneVerified ? "Yes" : "No"}</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2"><span>Document proof</span><span className="font-semibold text-gray-900">{selectedUser.identity?.documentVerified ? "Yes" : "No"}</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2"><span>KYC method</span><span className="font-semibold text-gray-900">{selectedUser.identity?.kycMethod ?? "MANUAL_REVIEW"}</span></div>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2"><span>Progress</span><span className="font-semibold text-gray-900">{progressValue(selectedUser)}/3</span></div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-900">Status</span>
                    <select
                      value={reviewForm.status}
                      onChange={(event) => setReviewForm((current) => ({ ...current, status: event.target.value }))}
                      className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                    >
                      {reviewStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-900">KYC method</span>
                    <select
                      value={reviewForm.kycMethod}
                      onChange={(event) => setReviewForm((current) => ({ ...current, kycMethod: event.target.value }))}
                      className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                    >
                      {kycMethods.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <TogglePill label="Email verified" checked={reviewForm.emailVerified} onChange={(checked) => setReviewForm((current) => ({ ...current, emailVerified: checked }))} />
                  <TogglePill label="Phone verified" checked={reviewForm.phoneVerified} onChange={(checked) => setReviewForm((current) => ({ ...current, phoneVerified: checked }))} />
                  <TogglePill label="Document verified" checked={reviewForm.documentVerified} onChange={(checked) => setReviewForm((current) => ({ ...current, documentVerified: checked }))} />
                </div>

                <label className="mt-4 grid gap-2">
                  <span className="text-sm font-semibold text-gray-900">Review note</span>
                  <textarea
                    value={reviewForm.reviewNote}
                    onChange={(event) => setReviewForm((current) => ({ ...current, reviewNote: event.target.value }))}
                    rows={5}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                    placeholder="Add reviewer observations, evidence summary, or escalation notes."
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void updateReview()}
                  disabled={saving}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {saving ? "Saving review..." : "Save identity review"}
                </button>
              </>
            ) : (
              <div className="mt-4 rounded-[24px] border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                Select a user from the queue to open the review form.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Stamp className="h-5 w-5 text-gray-700" />
              Live signal map
            </div>
            <div className="mt-4 space-y-3">
              {(workspace?.verificationDistribution ?? []).map((entry) => (
                <div key={entry.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span>{entry.label}</span>
                    <span className="font-semibold text-gray-950">{entry.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-gray-950" style={{ width: `${Math.max(8, Math.min(100, entry.value * 10))}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
              User-side KYC submissions and admin reviews now converge on the same persistent identity record.
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatBlock({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "amber" | "emerald" | "sky" | "rose" }) {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone];

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
      <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses}`}>{label}</div>
      <div className="mt-3 text-3xl font-semibold text-gray-950">{value}</div>
      <div className="mt-2 text-sm leading-6 text-gray-500">{detail}</div>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  const tones: Record<string, string> = {
    critical: "border-rose-200 bg-rose-50 text-rose-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
    neutral: "border-gray-200 bg-gray-50 text-gray-700",
  };

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-gray-950">{value}</div>
      <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] ?? tones.neutral}`}>{tone.toUpperCase()}</div>
    </div>
  );
}

function TogglePill({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-[18px] border px-4 py-3 text-left transition ${checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-white"}`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xs">{checked ? "Included in the review" : "Not yet confirmed"}</div>
    </button>
  );
}
