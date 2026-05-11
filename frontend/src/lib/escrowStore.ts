"use client";

import { create } from 'zustand';
import { toast } from 'sonner';
import type { EscrowEntry } from './types';

interface EscrowStore {
  escrowEntries: EscrowEntry[];
  /** Hold funds in escrow for all milestones when contract activates */
  holdFunds: (contractId: string, milestones: Array<{ id: string; amount: number }>) => void;
  /** Release a specific milestone's escrowed funds to freelancer */
  releaseFunds: (contractId: string, milestoneId: string) => void;
  /** Freeze held funds while a dispute is in progress */
  flagDisputed: (contractId: string) => void;
  /** Refund all held escrow entries for a contract back to employer */
  refundEscrow: (contractId: string) => void;
  /** Resolve disputed escrow with admin-controlled allocation */
  settleDispute: (
    contractId: string,
    settlement: { employerAmount: number; freelancerAmount: number; adminAmount: number; note?: string }
  ) => void;
  /** Get total held amount for a contract */
  getHeldAmount: (contractId: string) => number;
  /** Get escrow entry for a specific milestone */
  getEscrowEntry: (contractId: string, milestoneId: string) => EscrowEntry | undefined;
}

export const useEscrowStore = create<EscrowStore>((set, get) => ({
  escrowEntries: [],

  holdFunds: (contractId, milestones) => {
    const now = new Date().toISOString();
    const newEntries: EscrowEntry[] = milestones.map((m) => ({
      contractId,
      milestoneId: m.id,
      amount: m.amount,
      status: 'HELD',
      createdAt: now,
    }));
    set((state) => ({
      escrowEntries: [
        ...state.escrowEntries.filter(
          (e) => !(e.contractId === contractId && e.status === 'HELD')
        ),
        ...newEntries,
      ],
    }));
    const total = milestones.reduce((sum, m) => sum + m.amount, 0);
    toast.success(`$${total.toLocaleString()} held in escrow`);
  },

  releaseFunds: (contractId, milestoneId) => {
    set((state) => ({
      escrowEntries: state.escrowEntries.map((e) =>
        e.contractId === contractId && e.milestoneId === milestoneId && (e.status === 'HELD' || e.status === 'DISPUTED')
          ? { ...e, status: 'RELEASED', settledAt: new Date().toISOString() }
          : e
      ),
    }));
  },

  flagDisputed: (contractId) => {
    set((state) => ({
      escrowEntries: state.escrowEntries.map((entry) =>
        entry.contractId === contractId && entry.status === 'HELD'
          ? { ...entry, status: 'DISPUTED' }
          : entry
      ),
    }));
  },

  refundEscrow: (contractId) => {
    const held = get().escrowEntries.filter(
      (e) => e.contractId === contractId && (e.status === 'HELD' || e.status === 'DISPUTED')
    );
    if (held.length === 0) return;
    const total = held.reduce((sum, e) => sum + e.amount, 0);
    set((state) => ({
      escrowEntries: state.escrowEntries.map((e) =>
        e.contractId === contractId && (e.status === 'HELD' || e.status === 'DISPUTED')
          ? { ...e, status: 'REFUNDED', settledAt: new Date().toISOString() }
          : e
      ),
    }));
    toast.info(`$${total.toLocaleString()} returned from escrow`);
  },

  settleDispute: (contractId, settlement) => {
    const held = get().escrowEntries.filter(
      (entry) => entry.contractId === contractId && (entry.status === 'HELD' || entry.status === 'DISPUTED')
    );
    if (held.length === 0) {
      toast.error('No held escrow found for dispute settlement.');
      return;
    }

    set((state) => ({
      escrowEntries: state.escrowEntries.map((entry) =>
        entry.contractId === contractId && (entry.status === 'HELD' || entry.status === 'DISPUTED')
          ? {
              ...entry,
              status: 'SETTLED',
              settledAt: new Date().toISOString(),
              settlementNote: settlement.note,
              settlementBreakdown: {
                employerAmount: settlement.employerAmount,
                freelancerAmount: settlement.freelancerAmount,
                adminAmount: settlement.adminAmount,
              },
            }
          : entry
      ),
    }));

    toast.success('Escrow settled by admin decision.');
  },

  getHeldAmount: (contractId) => {
    return get()
      .escrowEntries.filter((e) => e.contractId === contractId && (e.status === 'HELD' || e.status === 'DISPUTED'))
      .reduce((sum, e) => sum + e.amount, 0);
  },

  getEscrowEntry: (contractId, milestoneId) => {
    return get().escrowEntries.find(
      (e) => e.contractId === contractId && e.milestoneId === milestoneId
    );
  },
}));
