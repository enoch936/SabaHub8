"use client";

import { create } from "zustand";
import { toast } from "sonner";
import {
  adminApplyDisputeSettlement,
  adminPatchDispute,
  adminSendDisputeMessage,
  adminUpdateDisputeParticipantControl,
  listDisputes,
  openDispute as openDisputeApi,
  type Dispute as ApiDispute,
} from "./api";
import type {
  DisputeMessageTarget,
  DisputeStatus,
  PlatformContract,
  PlatformDispute,
  RestrictionAction,
} from "./types";

type OpenDisputeInput = {
  contract: PlatformContract;
  reason: string;
  details?: string;
  openedByRole: "EMPLOYER" | "FREELANCER";
  evidenceAssetIds?: string[];
};

type SettlementInput = {
  disputeId: string;
  employerPercent: number;
  freelancerPercent: number;
  adminPercent: number;
  note: string;
  reserveRecipientUserId?: string;
};

type SendMessageInput = {
  disputeId: string;
  target: DisputeMessageTarget;
  content: string;
};

type RestrictionInput = {
  disputeId: string;
  subject: "EMPLOYER" | "FREELANCER";
  action: RestrictionAction;
  adminNote?: string;
};

interface DisputeStore {
  disputes: PlatformDispute[];
  isLoading: boolean;
  fetchDisputes: () => Promise<void>;
  openDispute: (input: OpenDisputeInput) => Promise<string>;
  setStatus: (disputeId: string, status: DisputeStatus, note?: string) => Promise<void>;
  applySettlement: (input: SettlementInput) => Promise<void>;
  sendAdminMessage: (input: SendMessageInput) => Promise<void>;
  setParticipantRestriction: (input: RestrictionInput) => Promise<void>;
  getByContractId: (contractId: string) => PlatformDispute | undefined;
}

function mapApiDispute(dispute: ApiDispute): PlatformDispute {
  return {
    id: dispute.id,
    contractId: dispute.contractId,
    contractTitle: dispute.contractTitle ?? dispute.contractId,
    employerId: dispute.employerId ?? "",
    employerName: dispute.employerName ?? dispute.employerId ?? "Employer",
    freelancerId: dispute.freelancerId ?? "",
    freelancerName: dispute.freelancerName ?? dispute.freelancerId ?? "Freelancer",
    openedByUserId: dispute.openedByUserId,
    openedByRole: dispute.openedByRole,
    status: (dispute.status as DisputeStatus) ?? "OPEN",
    reason: dispute.reason ?? "",
    details: dispute.details,
    evidenceAssetIds: dispute.evidenceAssetIds ?? [],
    createdAt: dispute.createdAt ?? new Date().toISOString(),
    updatedAt: dispute.updatedAt,
    adminNotes: dispute.adminNotes ?? [],
    heldAmount: dispute.heldAmount ?? 0,
    paidAmount: dispute.paidAmount ?? 0,
    currency: dispute.currency ?? "USD",
    messages: (dispute.adminMessages ?? []).map((message) => ({
      id: message.id,
      target: message.target,
      content: message.content,
      sentAt: message.sentAt ?? new Date().toISOString(),
      sentBy: message.sentByName ?? message.sentByUserId ?? "Admin",
    })),
    participantControls: {
      employer: dispute.participantControls?.employerAction ?? "NONE",
      freelancer: dispute.participantControls?.freelancerAction ?? "NONE",
      updatedAt: dispute.participantControls?.updatedAt,
    },
    settlement: dispute.settlement
      ? {
          employerPercent: dispute.settlement.employerPercent ?? 0,
          freelancerPercent: dispute.settlement.freelancerPercent ?? 0,
          adminPercent: dispute.settlement.adminPercent ?? 0,
          employerAmount: dispute.settlement.employerAmount ?? 0,
          freelancerAmount: dispute.settlement.freelancerAmount ?? 0,
          adminAmount: dispute.settlement.adminAmount ?? 0,
          currency: dispute.settlement.currency ?? dispute.currency ?? "USD",
          note: dispute.settlement.note ?? "",
          decidedAt: dispute.settlement.decidedAt ?? new Date().toISOString(),
          decidedBy: dispute.settlement.decidedByName ?? dispute.settlement.decidedByUserId ?? "Admin",
        }
      : undefined,
  };
}

export const useDisputeStore = create<DisputeStore>((set, get) => ({
  disputes: [],
  isLoading: false,

  fetchDisputes: async () => {
    set({ isLoading: true });
    try {
      const disputes = await listDisputes();
      set({
        disputes: (Array.isArray(disputes) ? disputes : []).map(mapApiDispute),
        isLoading: false,
      });
    } catch (error) {
      set({ disputes: [], isLoading: false });
      toast.error(error instanceof Error ? error.message : "Failed to load disputes.");
    }
  },

  openDispute: async ({ contract, reason, details, evidenceAssetIds = [] }) => {
    const existing = get().getByContractId(contract.id);
    if (existing) {
      toast.error("A dispute is already open for this contract.");
      return existing.id;
    }

    const created = await openDisputeApi({
      contractId: contract.id,
      reason,
      details,
      evidenceAssetIds,
    });
    const mapped = mapApiDispute(created);
    set((state) => ({ disputes: [mapped, ...state.disputes.filter((item) => item.id !== mapped.id)] }));
    toast.success("Dispute opened and persisted.");
    return mapped.id;
  },

  setStatus: async (disputeId, status, note) => {
    const updated = await adminPatchDispute(disputeId, {
      status,
      adminNote: note,
    });
    set((state) => ({
      disputes: state.disputes.map((item) => (item.id === disputeId ? mapApiDispute(updated) : item)),
    }));
  },

  applySettlement: async ({ disputeId, employerPercent, freelancerPercent, adminPercent, note, reserveRecipientUserId }) => {
    const updated = await adminApplyDisputeSettlement(disputeId, {
      employerPercent,
      freelancerPercent,
      adminPercent,
      reserveRecipientUserId,
      note,
    });
    set((state) => ({
      disputes: state.disputes.map((item) => (item.id === disputeId ? mapApiDispute(updated) : item)),
    }));
    toast.success("Dispute settlement applied.");
  },

  sendAdminMessage: async ({ disputeId, target, content }) => {
    const updated = await adminSendDisputeMessage(disputeId, { target, content });
    set((state) => ({
      disputes: state.disputes.map((item) => (item.id === disputeId ? mapApiDispute(updated) : item)),
    }));
    toast.success(`Message sent to ${target === "BOTH" ? "both parties" : target.toLowerCase()}.`);
  },

  setParticipantRestriction: async ({ disputeId, subject, action, adminNote }) => {
    const updated = await adminUpdateDisputeParticipantControl(disputeId, {
      subject,
      action,
      adminNote,
    });
    set((state) => ({
      disputes: state.disputes.map((item) => (item.id === disputeId ? mapApiDispute(updated) : item)),
    }));
    toast.success(`${subject} action updated to ${action}.`);
  },

  getByContractId: (contractId) => get().disputes.find((item) => item.contractId === contractId),
}));
