"use client";

import { create } from "zustand";
import { toast } from "sonner";
import type {
  EscrowRefundRequest,
  PlatformContract,
  ContractStatus,
  Milestone,
  MilestoneStatus,
} from "./types";
import {
  acceptContract,
  addContractMilestone,
  approveContractMilestone,
  createContract as createContractApi,
  decideEscrowRefund,
  escrowFund,
  listContracts,
  requestEscrowRefund,
  submitContractMilestone,
  type Contract as ApiContract,
} from "./api";

const VALID_TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
  PENDING: ["IN_PROGRESS", "SUBMITTED"],
  IN_PROGRESS: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: ["IN_PROGRESS"],
};

export function checkContractCompletion(milestones: Milestone[]): boolean {
  return milestones.length > 0 && milestones.every((milestone) => milestone.status === "APPROVED");
}

export type MilestoneDeadlineStatus = "overdue" | "due-soon" | "on-track";

export function getMilestoneDeadlineStatus(milestone: Milestone): MilestoneDeadlineStatus {
  if (milestone.status === "APPROVED") return "on-track";
  const now = new Date();
  const due = new Date(milestone.dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "due-soon";
  return "on-track";
}

export function validateMilestoneTransition(
  currentStatus: MilestoneStatus,
  newStatus: MilestoneStatus,
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

const MOCK_CONTRACTS: PlatformContract[] = [
  {
    id: "CON001",
    jobId: "JOB001",
    jobTitle: "Senior React Developer for SaaS Dashboard",
    employerId: "EMP001",
    freelancerId: "FL001",
    employerName: "TechCorp Inc",
    freelancerName: "Alice Chen",
    status: "ACTIVE",
    totalAmount: 5000,
    paidAmount: 2000,
    escrowedAmount: 3000,
    escrowRequiredAmount: 5000,
    currency: "USD",
    startDate: "2026-03-01",
    endDate: "2026-05-31",
    terms: "Standard freelance agreement with milestone-based payments and escrow lock before activation.",
    createdAt: "2026-02-28T10:00:00Z",
    agreementVersion: 1,
    escrowLockedAt: "2026-03-01T09:00:00Z",
    agreementEstablishedAt: "2026-03-01T09:00:00Z",
    paymentModel: "MILESTONE",
    escrowProtectionLevel: "FULL",
    disputeWindowDays: 7,
    autoReleaseDays: 5,
    requiresEscrow: true,
    adminReviewRequired: true,
    available: true,
    signatures: {
      employerSigned: true,
      freelancerSigned: true,
      contractHash: "seed-contract-hash-001",
    },
    milestones: [
      {
        id: "MS001",
        contractId: "CON001",
        sequence: 1,
        title: "UI Design & Wireframes",
        description: "Complete all wireframes and design mockups",
        amount: 1000,
        dueDate: "2026-03-15",
        status: "APPROVED",
        approvedAt: "2026-03-14T10:00:00Z",
        escrowLocked: true,
      },
      {
        id: "MS002",
        contractId: "CON001",
        sequence: 2,
        title: "Frontend Development",
        description: "Implement all React components",
        amount: 2000,
        dueDate: "2026-04-15",
        status: "SUBMITTED",
        submittedAt: "2026-04-14T10:00:00Z",
        escrowLocked: true,
      },
      {
        id: "MS003",
        contractId: "CON001",
        sequence: 3,
        title: "API Integration & Testing",
        description: "Connect to backend APIs and write tests",
        amount: 2000,
        dueDate: "2026-05-15",
        status: "PENDING",
        escrowLocked: true,
      },
    ],
  },
];

function normalizeContractStatus(status?: string): ContractStatus {
  const normalized = (status ?? "DRAFT").trim().toUpperCase();
  if (normalized === "PENDING") return "DRAFT";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "DELIVERED") return "DELIVERED";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "DISPUTED") return "DISPUTED";
  if (normalized === "CANCELLED") return "CANCELLED";
  if (normalized === "PAUSED") return "PAUSED";
  return normalized === "ACTIVE" ? "ACTIVE" : "DRAFT";
}

function normalizeMilestoneStatus(status?: string): MilestoneStatus {
  const normalized = (status ?? "PENDING").trim().toUpperCase();
  if (normalized === "IN_ESCROW") return "PENDING";
  if (normalized === "RELEASED") return "APPROVED";
  if (normalized === "SUBMITTED") return "SUBMITTED";
  if (normalized === "APPROVED") return "APPROVED";
  if (normalized === "REJECTED") return "REJECTED";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  return "PENDING";
}

function toTermsText(contract: ApiContract): string {
  if (typeof contract.terms === "string" && contract.terms.trim()) {
    return contract.terms;
  }
  if (contract.terms && typeof contract.terms === "object") {
    const terms = contract.terms as Record<string, unknown>;
    const ordered = [
      terms.scope,
      terms.deliverables,
      terms.acceptanceCriteria,
      terms.paymentSchedule,
      terms.confidentiality,
      terms.ipRights,
      terms.terminationClause,
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join("\n\n");

    if (ordered) {
      return ordered;
    }
  }

  if (typeof contract.specification === "string" && contract.specification.trim()) {
    return contract.specification;
  }
  if (contract.specification && typeof contract.specification === "object") {
    return JSON.stringify(contract.specification, null, 2);
  }
  return "";
}

function toPlatformContract(contract: ApiContract): PlatformContract {
  const rawMilestones = Array.isArray(contract.paymentMilestones)
    ? contract.paymentMilestones
    : Array.isArray(contract.milestones)
      ? contract.milestones
      : [];

  const milestones: Milestone[] = rawMilestones
    .flatMap((milestone, index) => {
      const milestoneId = milestone.id;
      if (!milestoneId) return [];

      return [
        {
          id: milestoneId,
          contractId: contract.id,
          sequence:
            typeof milestone.sequence === "number" && Number.isFinite(milestone.sequence)
              ? milestone.sequence
              : index + 1,
          title: milestone.title ?? `Milestone ${index + 1}`,
          description: milestone.description ?? milestone.deliverables ?? "",
          amount: milestone.amount ?? 0,
          dueDate:
            milestone.dueDate ??
            contract.endDate ??
            contract.startDate ??
            new Date().toISOString().slice(0, 10),
          status: normalizeMilestoneStatus(milestone.status),
          submittedAt: milestone.submittedAt,
          approvedAt: milestone.approvedAt,
          releaseDate: milestone.releaseDate,
          submissionNote: milestone.submissionNote,
          feedbackFromEmployer: milestone.feedbackFromEmployer,
          escrowLocked: milestone.escrowLocked,
          escrowLockedAt: milestone.escrowLockedAt,
        } satisfies Milestone,
      ];
    })
    .sort((left, right) => {
      const sequenceDelta = (left.sequence ?? 0) - (right.sequence ?? 0);
      if (sequenceDelta !== 0) return sequenceDelta;
      return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
    });

  const approvedAmount = milestones
    .filter((milestone) => milestone.status === "APPROVED")
    .reduce((sum, milestone) => sum + milestone.amount, 0);

  const refundRequest: EscrowRefundRequest | undefined = contract.refundRequest
    ? {
        id: contract.refundRequest.id ?? `refund-${contract.id}`,
        status:
          contract.refundRequest.status === "APPROVED" ||
          contract.refundRequest.status === "REJECTED" ||
          contract.refundRequest.status === "EXECUTED"
            ? contract.refundRequest.status
            : "PENDING",
        amount: contract.refundRequest.amount ?? 0,
        currency: contract.refundRequest.currency ?? contract.currency ?? "USD",
        note: contract.refundRequest.note,
        requestedByUserId: contract.refundRequest.requestedByUserId,
        requestedByRole:
          contract.refundRequest.requestedByRole === "EMPLOYER" ||
          contract.refundRequest.requestedByRole === "FREELANCER" ||
          contract.refundRequest.requestedByRole === "ADMIN" ||
          contract.refundRequest.requestedByRole === "SYSTEM"
            ? contract.refundRequest.requestedByRole
            : undefined,
        requestedAt: contract.refundRequest.requestedAt,
        employerApproval: contract.refundRequest.employerApproval
          ? {
              partyRole: "EMPLOYER",
              status:
                contract.refundRequest.employerApproval.status === "APPROVED" ||
                contract.refundRequest.employerApproval.status === "REJECTED"
                  ? contract.refundRequest.employerApproval.status
                  : "PENDING",
              actedByUserId: contract.refundRequest.employerApproval.actedByUserId,
              note: contract.refundRequest.employerApproval.note,
              actedAt: contract.refundRequest.employerApproval.actedAt,
            }
          : undefined,
        freelancerApproval: contract.refundRequest.freelancerApproval
          ? {
              partyRole: "FREELANCER",
              status:
                contract.refundRequest.freelancerApproval.status === "APPROVED" ||
                contract.refundRequest.freelancerApproval.status === "REJECTED"
                  ? contract.refundRequest.freelancerApproval.status
                  : "PENDING",
              actedByUserId: contract.refundRequest.freelancerApproval.actedByUserId,
              note: contract.refundRequest.freelancerApproval.note,
              actedAt: contract.refundRequest.freelancerApproval.actedAt,
            }
          : undefined,
        resolvedByUserId: contract.refundRequest.resolvedByUserId,
        resolutionType: contract.refundRequest.resolutionType,
        resolutionNote: contract.refundRequest.resolutionNote,
        resolvedAt: contract.refundRequest.resolvedAt,
        executedAt: contract.refundRequest.executedAt,
      }
    : undefined;

  return {
    id: contract.id,
    jobId: contract.jobId,
    jobTitle: contract.jobTitle ?? contract.id,
    employerId: contract.employerId,
    freelancerId: contract.freelancerId,
    employerName: contract.employerName ?? contract.employerId,
    freelancerName: contract.freelancerName ?? contract.freelancerId,
    status: normalizeContractStatus(contract.status),
    totalAmount:
      contract.totalAmount ??
      contract.escrowRequiredAmount ??
      milestones.reduce((sum, milestone) => sum + milestone.amount, 0),
    paidAmount: contract.paidAmount ?? approvedAmount,
    escrowedAmount: contract.escrow?.totalHeld ?? contract.escrowTotalHeld ?? 0,
    escrowRequiredAmount:
      contract.escrowRequiredAmount ??
      contract.totalAmount ??
      milestones.reduce((sum, milestone) => sum + milestone.amount, 0),
    currency: contract.currency ?? contract.escrow?.currency ?? "USD",
    startDate:
      contract.startDate ??
      (contract.createdAt ? contract.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    endDate: contract.endDate,
    milestones,
    terms: toTermsText(contract),
    createdAt: contract.createdAt ?? new Date().toISOString(),
    agreementVersion: contract.agreementVersion,
    escrowLockedAt: contract.escrowLockedAt,
    agreementEstablishedAt: contract.agreementEstablishedAt,
    signatures: contract.signatures,
    paymentModel:
      contract.paymentModel === "FIXED" || contract.paymentModel === "HOURLY"
        ? contract.paymentModel
        : "MILESTONE",
    escrowProtectionLevel:
      contract.escrowProtectionLevel === "PARTIAL" || contract.escrowProtectionLevel === "NONE"
        ? contract.escrowProtectionLevel
        : "FULL",
    disputeWindowDays: contract.disputeWindowDays ?? 7,
    autoReleaseDays: contract.autoReleaseDays ?? 5,
    requiresEscrow: contract.requiresEscrow ?? true,
    adminReviewRequired: contract.adminReviewRequired ?? true,
    available: contract.available ?? true,
    refundRequest,
  };
}

function replaceContract(
  contracts: PlatformContract[],
  updated: ApiContract,
): PlatformContract[] {
  const next = toPlatformContract(updated);
  return contracts.map((contract) => (contract.id === next.id ? next : contract));
}

interface ContractStore {
  contracts: PlatformContract[];
  isLoading: boolean;
  fetchContracts: (statusFilter?: ContractStatus) => Promise<void>;
  createContract: (data: Partial<PlatformContract>) => Promise<void>;
  addMilestone: (contractId: string, milestone: Omit<Milestone, "id" | "contractId">) => Promise<void>;
  submitMilestone: (contractId: string, milestoneId: string, note?: string) => Promise<void>;
  approveMilestone: (contractId: string, milestoneId: string, feedback?: string) => Promise<void>;
  fundEscrowFromWallet: (contractId: string) => Promise<void>;
  requestContractRefund: (contractId: string, note?: string, amount?: number) => Promise<void>;
  decideContractRefund: (contractId: string, approve: boolean, note?: string) => Promise<void>;
  updateContractStatus: (contractId: string, status: ContractStatus) => void;
  acceptTerms: (contractId: string) => Promise<void>;
}

export const useContractStore = create<ContractStore>((set, get) => ({
  contracts: [],
  isLoading: false,

  fetchContracts: async (statusFilter) => {
    set({ isLoading: true });
    try {
      const apiContracts = await listContracts();
      const normalized = (Array.isArray(apiContracts) ? apiContracts : []).map(toPlatformContract);
      set({
        contracts: statusFilter ? normalized.filter((contract) => contract.status === statusFilter) : normalized,
        isLoading: false,
      });
    } catch {
      set({
        contracts: MOCK_CONTRACTS,
        isLoading: false,
      });
    }
  },

  createContract: async (data) => {
    const created = await createContractApi({
      jobId: data.jobId ?? "",
      title: data.jobTitle ?? "Untitled Contract",
      description: data.terms ?? "",
      freelancerId: data.freelancerId ?? "",
      totalAmount: data.totalAmount ?? 0,
      currency: data.currency ?? "USD",
      startDate: data.startDate ? `${data.startDate}T00:00:00` : null,
      endDate: data.endDate ? `${data.endDate}T00:00:00` : null,
      paymentModel: data.paymentModel ?? "MILESTONE",
      escrowProtectionLevel: "FULL",
      disputeWindowDays: data.disputeWindowDays ?? 7,
      autoReleaseDays: data.autoReleaseDays ?? 5,
      requiresEscrow: true,
      adminReviewRequired: true,
      terms: {
        scope: data.terms ?? "",
        deliverables: data.terms ?? "",
        acceptanceCriteria: "Escrow remains locked until each milestone is approved.",
        paymentSchedule: data.paymentModel ?? "MILESTONE",
      },
    });

    set((state) => ({
      contracts: [toPlatformContract(created), ...state.contracts.filter((item) => item.id !== created.id)],
    }));
    toast.success("Contract draft created");
  },

  addMilestone: async (contractId, milestone) => {
    const updated = await addContractMilestone(contractId, {
      title: milestone.title,
      description: milestone.description,
      amount: milestone.amount,
      dueDate: milestone.dueDate ? `${milestone.dueDate}T00:00:00` : undefined,
      deliverables: milestone.description,
    });

    set((state) => ({
      contracts: state.contracts.map((contract) =>
        contract.id === contractId ? toPlatformContract(updated) : contract,
      ),
    }));
    toast.success("Milestone added");
  },

  submitMilestone: async (contractId, milestoneId, note) => {
    const contract = get().contracts.find((item) => item.id === contractId);
    if (!contract) {
      toast.error("Contract not found");
      return;
    }

    const milestone = contract.milestones.find((item) => item.id === milestoneId);
    if (!milestone) {
      toast.error("Milestone not found");
      return;
    }
    if (!validateMilestoneTransition(milestone.status, "SUBMITTED")) {
      toast.error(`Cannot submit milestone with status ${milestone.status}`);
      return;
    }

    const updated = await submitContractMilestone(contractId, milestoneId, { note });
    set((state) => ({
      contracts: state.contracts.map((item) => (item.id === contractId ? toPlatformContract(updated) : item)),
    }));
    toast.success("Milestone submitted for review");
  },

  approveMilestone: async (contractId, milestoneId, feedback) => {
    const contract = get().contracts.find((item) => item.id === contractId);
    if (!contract) {
      toast.error("Contract not found");
      return;
    }

    const milestone = contract.milestones.find((item) => item.id === milestoneId);
    if (!milestone) {
      toast.error("Milestone not found");
      return;
    }
    if (!validateMilestoneTransition(milestone.status, "APPROVED")) {
      toast.error(`Cannot approve milestone with status ${milestone.status}`);
      return;
    }

    const updated = await approveContractMilestone(contractId, milestoneId, { feedback });
    set((state) => ({
      contracts: state.contracts.map((item) => (item.id === contractId ? toPlatformContract(updated) : item)),
    }));
    toast.success("Milestone approved and escrow released");
  },

  fundEscrowFromWallet: async (contractId) => {
    const contract = get().contracts.find((item) => item.id === contractId);
    if (!contract) {
      toast.error("Contract not found");
      return;
    }

    const required = contract.escrowRequiredAmount ?? contract.totalAmount;
    const currentlyHeld = contract.escrowedAmount ?? 0;
    const remaining = Math.round(Math.max(0, required - currentlyHeld) * 100) / 100;
    if (remaining <= 0) {
      toast.success("Escrow is already fully funded");
      return;
    }

    const updated = await escrowFund({
      contractId,
      amount: remaining,
      currency: contract.currency,
    });
    set((state) => ({
      contracts: replaceContract(state.contracts, updated),
    }));
    toast.success("Escrow funded from wallet");
  },

  requestContractRefund: async (contractId, note, amount) => {
    const contract = get().contracts.find((item) => item.id === contractId);
    if (!contract) {
      toast.error("Contract not found");
      return;
    }

    const held = contract.escrowedAmount ?? 0;
    const refundAmount = Math.round((amount ?? held) * 100) / 100;
    if (refundAmount <= 0) {
      toast.error("No escrow balance is available to refund");
      return;
    }

    const updated = await requestEscrowRefund({
      contractId,
      amount: refundAmount,
      note,
    });
    set((state) => ({
      contracts: replaceContract(state.contracts, updated),
    }));
    toast.success("Escrow refund request sent for counterparty approval");
  },

  decideContractRefund: async (contractId, approve, note) => {
    const updated = await decideEscrowRefund({
      contractId,
      approve,
      note,
    });
    set((state) => ({
      contracts: replaceContract(state.contracts, updated),
    }));
    toast.success(approve ? "Escrow refund decision recorded" : "Escrow refund request rejected");
  },

  acceptTerms: async (contractId) => {
    const contract = get().contracts.find((item) => item.id === contractId);
    if (!contract) {
      toast.error("Contract not found");
      return;
    }
    if (contract.status !== "DRAFT") {
      toast.error("Only draft contracts can be activated");
      return;
    }

    const accepted = await acceptContract(contractId);
    set((state) => ({
      contracts: state.contracts.map((item) =>
        item.id === contractId ? toPlatformContract(accepted) : item,
      ),
    }));
    toast.success("Contract agreement established");
  },

  updateContractStatus: (contractId, status) => {
    set((state) => ({
      contracts: state.contracts.map((contract) =>
        contract.id === contractId ? { ...contract, status } : contract,
      ),
    }));
  },
}));
