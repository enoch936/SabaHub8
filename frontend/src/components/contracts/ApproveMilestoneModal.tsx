"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, DollarSign, X } from "lucide-react";
import { useContractStore } from "@/lib/contractStore";
import type { Milestone } from "@/lib/types";

interface ApproveMilestoneModalProps {
  contractId: string;
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
}

export function ApproveMilestoneModal({
  contractId,
  milestone,
  isOpen,
  onClose,
}: ApproveMilestoneModalProps) {
  const { approveMilestone } = useContractStore();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleApprove = async () => {
    setError(null);
    setIsApproving(true);
    try {
      await approveMilestone(contractId, milestone.id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve milestone. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="sheet-panel w-full max-w-md">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h2 className="font-semibold">Approve Milestone</h2>
              </div>
              <button onClick={handleClose} className="rounded-lg p-1.5 hover:bg-slate-100/70" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {error ? (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              ) : null}

              <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)] p-3">
                <p className="text-sm font-medium">{milestone.title}</p>
                {milestone.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{milestone.description}</p>
                ) : null}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-green-600">${milestone.amount.toLocaleString()}</span>
                  <span>·</span>
                  <span>Due {new Date(milestone.dueDate).toLocaleDateString()}</span>
                  {milestone.submittedAt ? (
                    <>
                      <span>·</span>
                      <span>Submitted {new Date(milestone.submittedAt).toLocaleDateString()}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                <DollarSign className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Payment Release</p>
                  <p className="mt-0.5 text-xs text-green-700">
                    Approving this milestone releases <span className="font-semibold">${milestone.amount.toLocaleString()}</span>{" "}
                    from locked escrow to the freelancer.
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Approval records the employer decision, releases the milestone payment, and may complete the contract if this
                is the final funded milestone.
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isApproving}
                  className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm hover:border-slate-300/80 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 text-sm hover:border-slate-300/80 disabled:opacity-60"
                >
                  {isApproving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Approve & Release Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
