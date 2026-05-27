"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  CircleEllipsis,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { AddMilestoneModal } from "./AddMilestoneModal";
import { ApproveMilestoneModal } from "./ApproveMilestoneModal";
import { DisputeContractModal } from "./DisputeContractModal";
import { MilestoneCard } from "./MilestoneCard";
import { SubmitMilestoneModal } from "./SubmitMilestoneModal";
import { AnimatedStarRating } from "@/components/reviews/AnimatedStarRating";
import {
  getMilestoneDeadlineStatus,
  useContractStore,
} from "@/lib/contractStore";
import { useDisputeStore } from "@/lib/disputeStore";
import { useReviewStore } from "@/lib/reviewStore";
import type {
  ContractStatus,
  Milestone,
  MilestoneStatus,
  PlatformContract,
} from "@/lib/types";
import { useWalletStore } from "@/lib/walletStore";
import CounterpartyProfileCard from "@/components/workspace/profile/CounterpartyProfileCard";

interface ContractDetailViewProps {
  contract: PlatformContract;
  onClose: () => void;
  userRole?: "EMPLOYER" | "FREELANCER";
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-emerald-100 text-emerald-700",
  },
  DELIVERED: { label: "Delivered", color: "bg-sky-100 text-sky-700" },
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700" },
  DISPUTED: { label: "Disputed", color: "bg-red-100 text-red-700" },
  PAUSED: { label: "Paused", color: "bg-yellow-100 text-yellow-700" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500" },
};

const MILESTONE_SUBMIT_STATUSES: MilestoneStatus[] = ["PENDING", "IN_PROGRESS"];

function normalizeReviewKey(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function getApprovalTone(status?: string) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export function ContractDetailView({
  contract,
  onClose,
  userRole = "EMPLOYER",
}: ContractDetailViewProps) {
  const {
    acceptTerms,
    fundEscrowFromWallet,
    requestContractRefund,
    decideContractRefund,
  } = useContractStore();
  const fetchDisputes = useDisputeStore((state) => state.fetchDisputes);
  const linkedDispute = useDisputeStore((state) =>
    state.getByContractId(contract.id),
  );
  const reviews = useReviewStore((state) => state.reviews);
  const fetchReviews = useReviewStore((state) => state.fetchReviews);
  const submitReview = useReviewStore((state) => state.submitReview);
  const walletBalance = useWalletStore((state) => state.balance);
  const fetchWalletBalance = useWalletStore((state) => state.fetchBalance);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [submitMilestoneTarget, setSubmitMilestoneTarget] =
    useState<Milestone | null>(null);
  const [approveMilestoneTarget, setApproveMilestoneTarget] =
    useState<Milestone | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [refundNote, setRefundNote] = useState("");
  const [escrowAction, setEscrowAction] = useState<
    "fund" | "request" | "approve" | "reject" | null
  >(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const status = STATUS_CONFIG[contract.status];
  const approvedCount = contract.milestones.filter(
    (item) => item.status === "APPROVED",
  ).length;
  const totalCount = contract.milestones.length;
  const progressPct = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;
  const overdueCount = contract.milestones.filter(
    (item) => getMilestoneDeadlineStatus(item) === "overdue",
  ).length;
  const isEmployer = userRole === "EMPLOYER";
  const isFreelancer = userRole === "FREELANCER";
  const isActive =
    contract.status === "ACTIVE" ||
    contract.status === "IN_PROGRESS" ||
    contract.status === "DELIVERED";
  const isCompleted = contract.status === "COMPLETED";
  const isDraft = contract.status === "DRAFT";
  const counterpartyId = isEmployer
    ? contract.freelancerId
    : contract.employerId;
  const counterpartyName = isEmployer
    ? contract.freelancerName
    : contract.employerName;
  const myPartyId = isEmployer ? contract.employerId : contract.freelancerId;
  const secureChatHref = `/chat?user=${encodeURIComponent(counterpartyId)}`;
  const employerSigned = Boolean(contract.signatures?.employerSigned);
  const freelancerSigned = Boolean(contract.signatures?.freelancerSigned);
  const escrowHeld = contract.escrowedAmount ?? 0;
  const escrowRequired = contract.escrowRequiredAmount ?? contract.totalAmount;
  const escrowRemaining = Math.max(
    0,
    Math.round((escrowRequired - escrowHeld) * 100) / 100,
  );
  const refundRequest = contract.refundRequest;
  const myRefundApproval = isEmployer
    ? refundRequest?.employerApproval
    : refundRequest?.freelancerApproval;
  const refundRequestPending = refundRequest?.status === "PENDING";
  const refundRequestExecuted = refundRequest?.status === "EXECUTED";
  const refundRequestRejected = refundRequest?.status === "REJECTED";
  const walletCurrency =
    contract.currency === "ETB" || contract.currency === "USD"
      ? contract.currency
      : walletBalance?.currency ?? "USD";
  const walletCurrencyBalance =
    walletBalance?.byCurrency?.[walletCurrency] ??
    (walletBalance?.currency === walletCurrency
      ? {
          availableBalance: walletBalance.available,
          balance: walletBalance.total,
          currency: walletCurrency,
          escrowHeld: 0,
          pendingPayouts: walletBalance.pending,
          holds: walletBalance.holds,
        }
      : undefined);
  const walletAvailable = walletCurrencyBalance?.availableBalance;
  const canFundEscrow =
    isEmployer &&
    !linkedDispute &&
    escrowRemaining > 0 &&
    contract.status !== "COMPLETED" &&
    contract.status !== "CANCELLED";
  const canRequestRefund =
    !linkedDispute &&
    escrowHeld > 0 &&
    (isEmployer || isFreelancer) &&
    (!refundRequest || refundRequestExecuted || refundRequestRejected);
  const canDecideRefund =
    !linkedDispute &&
    refundRequestPending &&
    myRefundApproval?.status === "PENDING";
  const reviewCommentLength = reviewComment.trim().length;

  const contractReviews = useMemo(
    () =>
      reviews.filter(
        (review) =>
          normalizeReviewKey(review.contractId) ===
          normalizeReviewKey(contract.id),
      ),
    [reviews, contract.id],
  );

  const submittedReview = useMemo(() => {
    const targetKey = normalizeReviewKey(counterpartyId);
    if (!targetKey) {
      return undefined;
    }
    return contractReviews.find(
      (review) => normalizeReviewKey(review.targetId) === targetKey,
    );
  }, [contractReviews, counterpartyId]);

  const receivedReview = useMemo(() => {
    const myTargetKey = normalizeReviewKey(myPartyId);
    if (!myTargetKey) {
      return undefined;
    }
    return contractReviews.find(
      (review) => normalizeReviewKey(review.targetId) === myTargetKey,
    );
  }, [contractReviews, myPartyId]);

  const governanceItems = useMemo(
    () => [
      { label: "Payment model", value: contract.paymentModel ?? "MILESTONE" },
      {
        label: "Escrow",
        value:
          contract.requiresEscrow === false
            ? "Optional"
            : contract.escrowProtectionLevel ?? "FULL",
      },
      {
        label: "Dispute window",
        value: `${contract.disputeWindowDays ?? 7} days`,
      },
      { label: "Auto-release", value: `${contract.autoReleaseDays ?? 5} days` },
      {
        label: "Agreement",
        value: contract.agreementEstablishedAt
          ? "Established"
          : "Draft negotiation",
      },
      {
        label: "Escrow lock",
        value: contract.escrowLockedAt
          ? new Date(contract.escrowLockedAt).toLocaleDateString()
          : "Pending lock",
      },
    ],
    [contract],
  );

  const handleAcceptTerms = async () => {
    setIsAccepting(true);
    try {
      await acceptTerms(contract.id);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to activate contract agreement.",
      );
    } finally {
      setIsAccepting(false);
    }
  };

  const handleFundEscrow = async () => {
    setEscrowAction("fund");
    try {
      await fundEscrowFromWallet(contract.id);
      await fetchWalletBalance();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to fund escrow from wallet.",
      );
    } finally {
      setEscrowAction(null);
    }
  };

  const handleRefundRequest = async () => {
    setEscrowAction("request");
    try {
      await requestContractRefund(
        contract.id,
        refundNote || undefined,
        escrowHeld,
      );
      setRefundNote("");
      await fetchWalletBalance();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to create escrow refund request.",
      );
    } finally {
      setEscrowAction(null);
    }
  };

  const handleRefundDecision = async (approve: boolean) => {
    setEscrowAction(approve ? "approve" : "reject");
    try {
      await decideContractRefund(contract.id, approve, refundNote || undefined);
      setRefundNote("");
      await fetchWalletBalance();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to update escrow refund decision.",
      );
    } finally {
      setEscrowAction(null);
    }
  };

  const handleSubmitReview = async () => {
    const normalizedComment = reviewComment.trim();
    if (!counterpartyId) {
      toast.error("Unable to resolve who should receive this review.");
      return;
    }
    if (normalizedComment.length < 10) {
      toast.error("Please write at least 10 characters for your review.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const created = await submitReview({
        contractId: contract.id,
        targetId: counterpartyId,
        rating: reviewRating,
        comment: normalizedComment,
        tags: [],
      });
      if (created) {
        setReviewComment("");
        setReviewRating(5);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    void fetchDisputes();
  }, [fetchDisputes]);

  useEffect(() => {
    if (isEmployer) {
      void fetchWalletBalance();
    }
  }, [fetchWalletBalance, isEmployer]);

  useEffect(() => {
    if (!isCompleted) {
      return;
    }
    void fetchReviews();
  }, [fetchReviews, isCompleted, contract.id]);

  return (
    <>
      <div className="sheet-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto">
        <div className="flex items-start justify-between border-b border-[var(--border)] p-6">
          <div className="min-w-0 flex-1 pr-4">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold leading-tight">
                {contract.jobTitle}
              </h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}
              >
                {status.label}
              </span>
              {linkedDispute ? (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  Dispute {linkedDispute.id}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>
                {contract.employerName} ↔ {contract.freelancerName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-[var(--accent)] p-3 text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 text-green-600" />
                Total
              </div>
              <p className="font-bold text-green-600">
                {contract.currency} {contract.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--accent)] p-3 text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Paid
              </div>
              <p className="font-bold">
                {contract.currency} {contract.paidAmount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-xs font-medium text-blue-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Escrow
              </div>
              <p className="font-bold text-blue-700">
                {contract.currency}{" "}
                {(contract.escrowedAmount ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-blue-600/80">
                Required: {contract.currency}{" "}
                {(
                  contract.escrowRequiredAmount ?? contract.totalAmount
                ).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--accent)] p-3 text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5" />
                Milestones
              </div>
              <p className="font-bold">
                {approvedCount}/{totalCount}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {governanceItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Signatures
              </p>
              <p className="mt-2 text-sm font-semibold">
                Employer: {employerSigned ? "Signed" : "Pending"} • Freelancer:{" "}
                {freelancerSigned ? "Signed" : "Pending"}
              </p>
              {contract.signatures?.contractHash ? (
                <p className="mt-2 break-all text-xs text-muted-foreground">
                  Agreement hash: {contract.signatures.contractHash.slice(0, 24)}
                  ...
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Agreement Version
              </p>
              <p className="mt-2 text-sm font-semibold">
                v{contract.agreementVersion ?? 1}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Contract completion is blocked until every milestone is approved
                and held escrow reaches zero.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CounterpartyProfileCard
              kind={isEmployer ? "freelancer" : "employer"}
              id={counterpartyId}
              fallbackName={counterpartyName}
            />
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Escrow flow
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    Escrow is funded from the employer wallet and locked before
                    payout.
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    escrowRemaining <= 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {escrowRemaining <= 0 ? "Fully funded" : "Funding required"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-3">
                  <p className="text-xs text-muted-foreground">Held now</p>
                  <p className="mt-1 font-semibold">
                    {contract.currency} {escrowHeld.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-3">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="mt-1 font-semibold">
                    {contract.currency} {escrowRemaining.toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Wallet available for {walletCurrency}:{" "}
                {walletAvailable === undefined
                  ? "Loading..."
                  : `${walletCurrency} ${walletAvailable.toLocaleString()}`}
              </p>

              {canFundEscrow ? (
                <button
                  onClick={handleFundEscrow}
                  disabled={
                    escrowAction === "fund" ||
                    (walletAvailable !== undefined &&
                      walletAvailable + 0.01 < escrowRemaining)
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] py-2 text-sm font-medium disabled:opacity-50"
                >
                  {escrowAction === "fund" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Funding escrow...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Fund Remaining From Wallet
                    </>
                  )}
                </button>
              ) : null}

              <p className="mt-3 text-xs text-muted-foreground">
                Refunds never move automatically. Held funds can go back only
                after both client and freelancer approve the refund request, or
                when admin resolves the case.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Refund governance
                </p>
                <p className="mt-2 text-sm font-semibold">
                  Escrow can return to the client only with dual approval or
                  admin resolution.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Current refundable balance: {contract.currency}{" "}
                  {escrowHeld.toLocaleString()}
                </p>
              </div>
              {refundRequest ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    refundRequest.status === "EXECUTED"
                      ? "bg-emerald-100 text-emerald-700"
                      : refundRequest.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : refundRequest.status === "APPROVED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                  }`}
                >
                  Refund {refundRequest.status.toLowerCase()}
                </span>
              ) : null}
            </div>

            {refundRequest ? (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div
                    className={`rounded-xl border p-3 text-sm ${getApprovalTone(refundRequest.employerApproval?.status)}`}
                  >
                    <p className="text-xs uppercase tracking-[0.12em]">
                      Client approval
                    </p>
                    <p className="mt-1 font-semibold">
                      {refundRequest.employerApproval?.status ?? "PENDING"}
                    </p>
                    {refundRequest.employerApproval?.actedAt ? (
                      <p className="mt-1 text-xs opacity-80">
                        {new Date(
                          refundRequest.employerApproval.actedAt,
                        ).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                  <div
                    className={`rounded-xl border p-3 text-sm ${getApprovalTone(refundRequest.freelancerApproval?.status)}`}
                  >
                    <p className="text-xs uppercase tracking-[0.12em]">
                      Freelancer approval
                    </p>
                    <p className="mt-1 font-semibold">
                      {refundRequest.freelancerApproval?.status ?? "PENDING"}
                    </p>
                    {refundRequest.freelancerApproval?.actedAt ? (
                      <p className="mt-1 text-xs opacity-80">
                        {new Date(
                          refundRequest.freelancerApproval.actedAt,
                        ).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-3 text-sm">
                  <p className="font-medium">
                    Requested refund: {refundRequest.currency}{" "}
                    {refundRequest.amount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested by {refundRequest.requestedByRole?.toLowerCase() ?? "party"}
                    {refundRequest.requestedAt
                      ? ` on ${new Date(refundRequest.requestedAt).toLocaleString()}`
                      : ""}
                  </p>
                  {refundRequest.note ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {refundRequest.note}
                    </p>
                  ) : null}
                  {refundRequest.resolutionNote ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Resolution: {refundRequest.resolutionNote}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            {(canRequestRefund || canDecideRefund) && escrowHeld > 0 ? (
              <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                <textarea
                  value={refundNote}
                  onChange={(event) => setRefundNote(event.target.value)}
                  placeholder={
                    canRequestRefund
                      ? "State why the remaining escrow should return to the client wallet."
                      : "Add an approval or rejection note for the audit trail."
                  }
                  className="min-h-[96px] w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none"
                />

                {canRequestRefund ? (
                  <button
                    onClick={handleRefundRequest}
                    disabled={escrowAction === "request"}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {escrowAction === "request" ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Sending request...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        Request Refund To Client Wallet
                      </>
                    )}
                  </button>
                ) : null}

                {canDecideRefund ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => handleRefundDecision(true)}
                      disabled={
                        escrowAction === "approve" || escrowAction === "reject"
                      }
                      className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50"
                    >
                      {escrowAction === "approve" ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Approve Refund
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRefundDecision(false)}
                      disabled={
                        escrowAction === "approve" || escrowAction === "reject"
                      }
                      className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
                    >
                      {escrowAction === "reject" ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-700" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Reject Refund
                        </>
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {refundRequestPending && !canDecideRefund ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Waiting for the other party to confirm the refund request. If
                this stalls, open a dispute so admin can make the final escrow
                decision.
              </p>
            ) : null}
          </div>

          {totalCount > 0 ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {approvedCount} of {totalCount} milestones approved
                </span>
                <span className="font-medium">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--accent)]">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                Started {new Date(contract.startDate).toLocaleDateString()}
              </span>
            </div>
            {contract.endDate ? (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>
                  Due {new Date(contract.endDate).toLocaleDateString()}
                </span>
              </div>
            ) : null}
            {counterpartyId ? (
              <Link
                href={secureChatHref}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                <CircleEllipsis className="h-3.5 w-3.5" />
                Open secure chat with {counterpartyName}
              </Link>
            ) : null}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Milestones</h3>
              {(isActive || isDraft) && isEmployer ? (
                <button
                  onClick={() => setShowAddMilestone(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {isDraft ? "Add Draft Milestone" : "Add Milestone"}
                </button>
              ) : null}
            </div>

            {overdueCount > 0 ? (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  {overdueCount} overdue milestone{overdueCount > 1 ? "s" : ""}
                </span>
              </div>
            ) : null}

            {contract.milestones.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">No milestones yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contract.milestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    canSubmit={
                      isFreelancer &&
                      isActive &&
                      MILESTONE_SUBMIT_STATUSES.includes(milestone.status)
                    }
                    canApprove={
                      isEmployer && isActive && milestone.status === "SUBMITTED"
                    }
                    onSubmit={() => setSubmitMilestoneTarget(milestone)}
                    onApprove={() => setApproveMilestoneTarget(milestone)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Contract Terms</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {contract.terms || "No detailed contract terms were added."}
            </p>

            {isDraft && isFreelancer ? (
              <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--accent)] p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-sm">
                    I have reviewed the end date, milestones, escrow lock,
                    dispute window, and release conditions and accept the
                    contract agreement.
                  </span>
                </label>
                <button
                  onClick={handleAcceptTerms}
                  disabled={!termsAccepted || isAccepting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] py-2 text-sm font-medium disabled:opacity-50"
                >
                  {isAccepting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Accept and Activate Contract
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </div>

          {isCompleted ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Contract Reviews
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    Employer and freelancer can review each other once this
                    contract is completed.
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    submittedReview
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {submittedReview ? "Your review submitted" : "Your review pending"}
                </span>
              </div>

              {submittedReview ? (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-3">
                  <p className="text-xs text-muted-foreground">
                    Your review for {counterpartyName}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <AnimatedStarRating
                      rating={submittedReview.rating}
                      size="sm"
                      animated={false}
                    />
                    <span className="text-xs text-muted-foreground">
                      {new Date(submittedReview.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {submittedReview.comment}
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Rate {counterpartyName}
                    </p>
                    <div className="mt-2">
                      <AnimatedStarRating
                        rating={reviewRating}
                        size="md"
                        interactive
                        onChange={(nextRating) => setReviewRating(nextRating)}
                      />
                    </div>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder={`Share your experience working with ${counterpartyName}.`}
                    className="min-h-[96px] w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none"
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={
                      isSubmittingReview ||
                      reviewCommentLength < 10 ||
                      !counterpartyId
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {isSubmittingReview ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Submitting review...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </button>
                </div>
              )}

              {receivedReview ? (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-3">
                  <p className="text-xs text-muted-foreground">
                    Review from {counterpartyName}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <AnimatedStarRating
                      rating={receivedReview.rating}
                      size="sm"
                      animated={false}
                    />
                    <span className="text-xs text-muted-foreground">
                      {new Date(receivedReview.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {receivedReview.comment}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  {counterpartyName} has not submitted a review yet.
                </p>
              )}
            </div>
          ) : null}

          {linkedDispute ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              This contract is in dispute. Admin can message parties, apply
              restrictions, and settle escrow by full, partial, or percentage
              allocation.
            </div>
          ) : isActive ? (
            <div className="border-t border-[var(--border)] pt-3">
              <p className="mb-2 text-xs text-muted-foreground">
                If delivery, quality, payment, or scope breaks down, open a real
                dispute for admin review.
              </p>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <AlertTriangle className="h-4 w-4" />
                Open Dispute
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <AddMilestoneModal
        contractId={contract.id}
        isOpen={showAddMilestone}
        onClose={() => setShowAddMilestone(false)}
      />
      {submitMilestoneTarget ? (
        <SubmitMilestoneModal
          contractId={contract.id}
          milestone={submitMilestoneTarget}
          isOpen={Boolean(submitMilestoneTarget)}
          onClose={() => setSubmitMilestoneTarget(null)}
        />
      ) : null}
      {approveMilestoneTarget ? (
        <ApproveMilestoneModal
          contractId={contract.id}
          milestone={approveMilestoneTarget}
          isOpen={Boolean(approveMilestoneTarget)}
          onClose={() => setApproveMilestoneTarget(null)}
        />
      ) : null}
      <DisputeContractModal
        contract={contract}
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        openedByRole={userRole}
      />
    </>
  );
}
