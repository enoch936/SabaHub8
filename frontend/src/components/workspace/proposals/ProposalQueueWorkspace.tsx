"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, FileText, RefreshCw, SlidersHorizontal, UserRound } from "lucide-react";
import {
  acceptProposal,
  cancelProposal,
  type Contract,
  listEmployerJobs,
  listContracts,
  listJobProposals,
  listMyApplications,
  rejectProposal,
  type Proposal,
} from "@/lib/api";
import { getNotificationMessage, getNotificationTitle } from "@/lib/notificationPresentation";
import { useNotifications } from "@/lib/notifications";
import {
  countUnreadProposalNotifications,
  hasUnreadProposalNotificationForProposal,
  isProposalNotificationForRole,
} from "@/lib/proposalNotifications";
import { ACTIVE_ROLE_STORAGE_KEY } from "@/lib/role-mode";
import { useSession } from "@/lib/session";
import { workspaceRoutes } from "@/lib/workspace-routes";
import { toast } from "sonner";

type ProposalQueueWorkspaceProps = {
  jobId?: string;
};

type WorkspaceRole = "EMPLOYER" | "FREELANCER";
type ProposalFilterKey = "all" | "pending" | "asking" | "accepted" | "failed" | "cancelled" | "withdrawn";

type FilterConfig = {
  key: ProposalFilterKey;
  label: string;
  statuses?: string[];
};

const PROPOSALS_FILTER_VISIBILITY_KEY = "workspace:proposals-filters-open";

const FREELANCER_FILTERS: FilterConfig[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending", statuses: ["SUBMITTED", "SHORTLISTED", "PENDING", "UNDER_REVIEW"] },
  { key: "accepted", label: "Accepted", statuses: ["ACCEPTED", "ACTIVE", "CONTRACT_CREATED"] },
  { key: "failed", label: "Failed", statuses: ["FAILED", "REJECTED"] },
  { key: "withdrawn", label: "Withdrawn/Cancelled", statuses: ["WITHDRAWN", "CANCELLED", "CANCELED"] },
];

const EMPLOYER_FILTERS: FilterConfig[] = [
  { key: "all", label: "All" },
  { key: "asking", label: "Asking", statuses: ["SUBMITTED", "SHORTLISTED", "PENDING", "UNDER_REVIEW"] },
  { key: "accepted", label: "Accepted (Contract)", statuses: ["ACCEPTED", "ACTIVE", "CONTRACT_CREATED"] },
  {
    key: "cancelled",
    label: "Unaccepted/Cancelled",
    statuses: ["REJECTED", "FAILED", "WITHDRAWN", "CANCELLED", "CANCELED"],
  },
];

function normalizeStatus(value?: string) {
  return (value ?? "SUBMITTED").toUpperCase();
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Not recorded";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleString();
}

function getStatusBadgeClass(status?: string) {
  switch (normalizeStatus(status)) {
    case "ACCEPTED":
    case "ACTIVE":
    case "CONTRACT_CREATED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "WITHDRAWN":
    case "CANCELLED":
    case "CANCELED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "SHORTLISTED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function canAccept(status?: string) {
  const normalized = normalizeStatus(status);
  return normalized === "SUBMITTED" || normalized === "SHORTLISTED" || normalized === "PENDING";
}

function extractContractId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;
  if (typeof root.id === "string" && root.id.trim()) {
    return root.id;
  }

  if (root.contract && typeof root.contract === "object") {
    const nested = root.contract as Record<string, unknown>;
    if (typeof nested.id === "string" && nested.id.trim()) {
      return nested.id;
    }
  }

  if (root.data && typeof root.data === "object") {
    const nested = root.data as Record<string, unknown>;
    if (typeof nested.id === "string" && nested.id.trim()) {
      return nested.id;
    }
    if (nested.contract && typeof nested.contract === "object") {
      const contract = nested.contract as Record<string, unknown>;
      if (typeof contract.id === "string" && contract.id.trim()) {
        return contract.id;
      }
    }
  }

  return null;
}

function matchesFilter(proposal: Proposal, filter: FilterConfig) {
  if (!filter.statuses || filter.statuses.length === 0) {
    return true;
  }
  const status = normalizeStatus(proposal.status);
  return filter.statuses.includes(status);
}

function findLinkedContract(proposal: Proposal, contracts: Contract[]) {
  return contracts.find(
    (contract) =>
      contract.jobId === proposal.jobId &&
      (!proposal.freelancerId || contract.freelancerId === proposal.freelancerId) &&
      normalizeStatus(contract.status) !== "CANCELLED",
  );
}

export default function ProposalQueueWorkspace({ jobId }: ProposalQueueWorkspaceProps) {
  const searchParams = useSearchParams();
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

    // If the page is opened with a job id, default to employer behavior for proposal operations.
    return jobId ? "EMPLOYER" : "FREELANCER";
  }, [jobId, sessionRole]);
  const highlightProposalId = searchParams.get("proposalId") ?? "";
  const notifications = useNotifications((state) => state.items);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyProposalId, setBusyProposalId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ProposalFilterKey>("all");
  const [filtersVisible, setFiltersVisible] = useState(true);
  const loadSequenceRef = useRef(0);
  const latestProposalNotificationRef = useRef<string>("");

  const filterConfig = role === "EMPLOYER" ? EMPLOYER_FILTERS : FREELANCER_FILTERS;

  const loadEmployerProposals = useCallback(async () => {
    if (jobId) {
      return listJobProposals(jobId);
    }

    const employerJobs = await listEmployerJobs({ page: 0, size: 100 });
    if (!Array.isArray(employerJobs) || employerJobs.length === 0) {
      return [] as Proposal[];
    }

    const results = await Promise.allSettled(
      employerJobs.map((job) => {
        if (!job.id) {
          return Promise.resolve([] as Proposal[]);
        }
        return listJobProposals(job.id);
      }),
    );

    const merged = results
      .filter((result): result is PromiseFulfilledResult<Proposal[]> => result.status === "fulfilled")
      .flatMap((result) => (Array.isArray(result.value) ? result.value : []));

    const seen = new Set<string>();
    return merged.filter((proposal) => {
      if (!proposal.id || seen.has(proposal.id)) {
        return false;
      }
      seen.add(proposal.id);
      return true;
    });
  }, [jobId]);

  useEffect(() => {
    setActiveFilter("all");
  }, [role, jobId]);

  useEffect(() => {
    const stored = window.localStorage.getItem(PROPOSALS_FILTER_VISIBILITY_KEY);
    setFiltersVisible(stored === null ? true : stored === "1");
  }, []);

  const toggleFiltersVisible = () => {
    setFiltersVisible((current) => {
      const next = !current;
      window.localStorage.setItem(PROPOSALS_FILTER_VISIBILITY_KEY, next ? "1" : "0");
      return next;
    });
  };

  const loadProposals = useCallback(async (options: { showLoader?: boolean } = {}) => {
    const { showLoader = true } = options;
    const loadId = ++loadSequenceRef.current;

    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);
      const [proposalData, contractData] = await Promise.all([
        role === "EMPLOYER" ? loadEmployerProposals() : listMyApplications(),
        listContracts().catch(() => [] as Contract[]),
      ]);

      if (loadId !== loadSequenceRef.current) {
        return;
      }

      setProposals(Array.isArray(proposalData) ? proposalData : []);
      setContracts(Array.isArray(contractData) ? contractData : []);
    } catch (err) {
      if (loadId !== loadSequenceRef.current) {
        return;
      }
      const message = err instanceof Error && err.message ? err.message : "Failed to load proposals.";
      setError(message);
      setProposals([]);
      setContracts([]);
    } finally {
      if (loadId === loadSequenceRef.current) {
        setLoading(false);
      }
    }
  }, [loadEmployerProposals, role]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  const proposalNotifications = useMemo(
    () => notifications.filter((item) => isProposalNotificationForRole(item, role)),
    [notifications, role],
  );
  const unreadProposalUpdates = useMemo(
    () => countUnreadProposalNotifications(notifications, role),
    [notifications, role],
  );
  const latestProposalNotification = proposalNotifications[0] ?? null;

  useEffect(() => {
    if (!latestProposalNotification?.id) {
      return;
    }

    if (!latestProposalNotificationRef.current) {
      latestProposalNotificationRef.current = latestProposalNotification.id;
      return;
    }

    if (latestProposalNotificationRef.current === latestProposalNotification.id) {
      return;
    }

    latestProposalNotificationRef.current = latestProposalNotification.id;
    void loadProposals({ showLoader: false });

    const title = getNotificationTitle(latestProposalNotification);
    const message = getNotificationMessage(latestProposalNotification);
    toast(title, {
      description: message || "Proposal activity just changed in your workspace.",
    });
  }, [latestProposalNotification, loadProposals]);

  const sortedProposals = useMemo(() => {
    const currentFilter = filterConfig.find((item) => item.key === activeFilter) ?? filterConfig[0];
    const matchesCurrentFilter = (proposal: Proposal) => {
      const status = normalizeStatus(proposal.status);
      const hasContract = Boolean(findLinkedContract(proposal, contracts));

      if (currentFilter.key === "accepted") {
        return matchesFilter(proposal, currentFilter) && hasContract;
      }

      if ((currentFilter.key === "pending" || currentFilter.key === "asking") && status === "ACCEPTED" && !hasContract) {
        return true;
      }

      return matchesFilter(proposal, currentFilter);
    };

    return [...proposals]
      .filter(matchesCurrentFilter)
      .sort((left, right) => {
        if (left.id === highlightProposalId) {
          return -1;
        }
        if (right.id === highlightProposalId) {
          return 1;
        }

        const leftDate = left.createdAt ? Date.parse(left.createdAt) : 0;
        const rightDate = right.createdAt ? Date.parse(right.createdAt) : 0;
        return rightDate - leftDate;
      });
  }, [activeFilter, contracts, filterConfig, highlightProposalId, proposals]);

  const filterCounts = useMemo(() => {
    return filterConfig.reduce<Record<string, number>>((acc, filter) => {
      acc[filter.key] = proposals.filter((proposal) => {
        const status = normalizeStatus(proposal.status);
        const hasContract = Boolean(findLinkedContract(proposal, contracts));

        if (filter.key === "accepted") {
          return matchesFilter(proposal, filter) && hasContract;
        }

        if ((filter.key === "pending" || filter.key === "asking") && status === "ACCEPTED" && !hasContract) {
          return true;
        }

        return matchesFilter(proposal, filter);
      }).length;
      return acc;
    }, {});
  }, [contracts, filterConfig, proposals]);

  const onAccept = async (proposal: Proposal) => {
    try {
      setBusyProposalId(proposal.id);
      const accepted = await acceptProposal(proposal.id);
      let contractId = extractContractId(accepted);

      if (!contractId) {
        for (let attempt = 0; attempt < 3 && !contractId; attempt += 1) {
          const contracts = await listContracts();
          const matched = contracts.find(
            (contract) =>
              contract.jobId === proposal.jobId &&
              (!proposal.freelancerId || contract.freelancerId === proposal.freelancerId),
          );

          if (matched?.id) {
            contractId = matched.id;
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }

      if (!contractId) {
        throw new Error("Proposal was accepted, but no contract was created yet. Please retry in a moment.");
      }

      setProposals((current) =>
        current.map((item) =>
          item.id === proposal.id
            ? {
                ...item,
                status: "ACCEPTED",
              }
            : item,
        ),
      );
      const refreshedContracts = await listContracts().catch(() => [] as Contract[]);
      setContracts(Array.isArray(refreshedContracts) ? refreshedContracts : []);

      toast.success(`Proposal accepted. Contract ${contractId} is ready.`);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to accept proposal.";
      toast.error(message);
    } finally {
      setBusyProposalId(null);
    }
  };

  const onReject = async (proposal: Proposal) => {
    try {
      setBusyProposalId(proposal.id);
      const updated = await rejectProposal(proposal.id);
      setProposals((current) =>
        current.map((item) =>
          item.id === proposal.id
            ? {
                ...item,
                status: updated?.status || "REJECTED",
                updatedAt: updated?.updatedAt || item.updatedAt,
              }
            : item,
        ),
      );
      const refreshedContracts = await listContracts().catch(() => [] as Contract[]);
      setContracts(Array.isArray(refreshedContracts) ? refreshedContracts : []);
      toast.success("Proposal unaccepted/rejected.");
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to reject proposal.";
      toast.error(message);
    } finally {
      setBusyProposalId(null);
    }
  };

  const onCancel = async (proposal: Proposal) => {
    try {
      setBusyProposalId(proposal.id);
      const updated = await cancelProposal(proposal.id);
      setProposals((current) =>
        current.map((item) =>
          item.id === proposal.id
            ? {
                ...item,
                status: updated?.status || "WITHDRAWN",
                updatedAt: updated?.updatedAt || item.updatedAt,
              }
            : item,
        ),
      );
      const refreshedContracts = await listContracts().catch(() => [] as Contract[]);
      setContracts(Array.isArray(refreshedContracts) ? refreshedContracts : []);
      toast.success("Proposal/contract flow cancelled.");
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to cancel proposal.";
      toast.error(message);
    } finally {
      setBusyProposalId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {role === "EMPLOYER" ? "Employer Proposal Operations" : "Freelancer Proposal Pipeline"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {role === "EMPLOYER"
                ? jobId
                  ? `Track asking, accepted-contract, and unaccepted/cancel flows for job ${jobId}.`
                  : "Track asking, accepted-contract, and unaccepted/cancel flows across all your posted jobs."
                : "Track all, pending, accepted, failed, and withdrawn proposal outcomes with date-time traces."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-sky-700">
                Live updates {unreadProposalUpdates > 99 ? "99+" : unreadProposalUpdates}
              </span>
              <span className="rounded-full border border-[var(--border)] px-2 py-1 text-muted-foreground">
                {role === "EMPLOYER" ? "Employer alerts in real time" : "Status updates in real time"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadProposals()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--accent)] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-4 grid gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Proposal governance</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Accepted proposals move into contract creation, milestone planning, escrow protection, and a formal dispute path.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Contract readiness</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Employer review now expects bid, delivery window, contract linkage, and payment release governance.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Escalation path</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Once work is disputed, escrow freezes and admin can later resolve by full refund, partial split, or custom percentages.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.14em] text-sky-700">Live proposal feed</p>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-sky-700">
                {unreadProposalUpdates > 99 ? "99+" : unreadProposalUpdates}
              </span>
            </div>
            <p className="mt-2 text-sm text-sky-900">
              {latestProposalNotification
                ? getNotificationTitle(latestProposalNotification)
                : "Proposal notifications will land here the moment something changes."}
            </p>
            <p className="mt-1 text-sm text-sky-700">
              {latestProposalNotification
                ? getNotificationMessage(latestProposalNotification) || "A proposal changed in your workspace."
                : role === "EMPLOYER"
                  ? "New submissions refresh this queue automatically."
                  : "Accepted, rejected, and cancelled proposals refresh automatically."}
            </p>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Filter bar</p>
          <button
            type="button"
            onClick={toggleFiltersVisible}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--accent)]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filtersVisible ? "Hide filters" : "Show filters"}
          </button>
        </div>

        {filtersVisible ? (
          <div className="flex flex-wrap gap-2">
            {filterConfig.map((filter) => {
              const active = activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    active
                      ? "border-sky-300 bg-sky-50 text-sky-700"
                      : "border-[var(--border)] text-muted-foreground hover:bg-[var(--accent)]"
                  }`}
                >
                  {filter.label}
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-700">
                    {filterCounts[filter.key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      {error ? <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-muted-foreground">
          Loading proposals...
        </div>
      ) : null}

      {!loading && sortedProposals.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No proposals found for this filter</p>
          <p className="text-sm text-muted-foreground">Try another status tab or refresh the proposal pipeline.</p>
        </div>
      ) : null}

      {!loading && sortedProposals.length > 0 ? (
        <div className="space-y-3">
          {sortedProposals.map((proposal) => {
            const status = normalizeStatus(proposal.status);
            const isHighlighted = proposal.id === highlightProposalId;
            const accepting = busyProposalId === proposal.id;
            const linkedContract = findLinkedContract(proposal, contracts);
            const hasContract = Boolean(linkedContract);
            const hasUnreadStatusUpdate = hasUnreadProposalNotificationForProposal(notifications, proposal.id, role);
            const canRejectAction = role === "EMPLOYER" && canAccept(status);
            const canCancelAction = role === "EMPLOYER" && ["ACCEPTED", "ACTIVE", "CONTRACT_CREATED"].includes(status);
            const canProcessContract = role === "EMPLOYER" && status === "ACCEPTED" && !hasContract;
            const proposalTitle = proposal.jobTitle || `Job ${proposal.jobId || "Unknown"}`;
            const counterpartyLabel = role === "EMPLOYER"
              ? proposal.freelancerName || proposal.freelancerId || "Unknown freelancer"
              : proposal.employerName || "Employer";
            const freelancerProfileHref = proposal.freelancerId
              ? workspaceRoutes.publicProfile("freelancer", proposal.freelancerId)
              : null;
            const employerProfileHref = proposal.employerId
              ? workspaceRoutes.publicProfile("employer", proposal.employerId)
              : null;
            const priceLabel = typeof proposal.bidAmount === "number"
              ? `$${proposal.bidAmount.toLocaleString()}`
              : "Bid unavailable";

            return (
              <article
                key={proposal.id}
                className={`rounded-2xl border bg-[var(--surface)] p-5 ${
                  isHighlighted ? "border-sky-400 shadow-[0_0_0_2px_rgba(56,189,248,0.2)]" : "border-[var(--border)]"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-[var(--accent)] px-2 py-1">#{proposal.id}</span>
                      <span className={`rounded-full border px-2 py-1 ${getStatusBadgeClass(status)}`}>{status}</span>
                      {hasContract ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                          Contract {linkedContract?.id}
                        </span>
                      ) : status === "ACCEPTED" ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Contract pending</span>
                      ) : null}
                      {isHighlighted ? (
                        <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">From notification</span>
                      ) : null}
                      {hasUnreadStatusUpdate ? (
                        <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">Unread update</span>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-foreground">{proposalTitle}</h2>
                      <p className="text-sm text-muted-foreground">
                        {role === "EMPLOYER"
                          ? `${counterpartyLabel} is waiting on your hiring decision.`
                          : `${counterpartyLabel} owns this opportunity and its latest decision trail.`}
                      </p>
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {proposal.coverLetter || "No cover letter provided."}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <UserRound className="h-4 w-4" />
                        {counterpartyLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {proposal.jobId || "Unknown job"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        {typeof proposal.timelineDays === "number" ? `${proposal.timelineDays} days` : "Timeline pending"}
                      </span>
                      <span className="rounded-full bg-[var(--accent)] px-2 py-1 text-xs text-muted-foreground">
                        Ask Type: Bid + Delivery Window
                      </span>
                      <span className="font-semibold">{priceLabel}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <span>Created: {formatDateTime(proposal.createdAt)}</span>
                      <span>Updated: {formatDateTime(proposal.updatedAt)}</span>
                    </div>

                    {(freelancerProfileHref || employerProfileHref) ? (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {freelancerProfileHref ? (
                          <Link
                            href={freelancerProfileHref}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-medium text-slate-700"
                          >
                            View freelancer profile
                          </Link>
                        ) : null}
                        {employerProfileHref ? (
                          <Link
                            href={employerProfileHref}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-medium text-slate-700"
                          >
                            View employer profile
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {role === "EMPLOYER" ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!canAccept(status) || accepting}
                        onClick={() => void onAccept(proposal)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {accepting ? "Processing..." : "Accept (Create Contract)"}
                      </button>
                      {canProcessContract ? (
                        <button
                          type="button"
                          disabled={accepting}
                          onClick={() => void onAccept(proposal)}
                          className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {accepting ? "Processing..." : "Process Contract"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={!canRejectAction || accepting}
                        onClick={() => void onReject(proposal)}
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {accepting ? "Working..." : "Unaccept/Reject"}
                      </button>
                      <button
                        type="button"
                        disabled={!canCancelAction || accepting}
                        onClick={() => void onCancel(proposal)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {accepting ? "Working..." : "Cancel"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
