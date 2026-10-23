"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Circle,
  Clock,
  Lock,
  Send,
  XCircle,
} from "lucide-react";
import type { Milestone } from "@/lib/types";
import { getMilestoneDeadlineStatus } from "@/lib/contractStore";

interface MilestoneCardProps {
  milestone: Milestone;
  canApprove?: boolean;
  canSubmit?: boolean;
  onSubmit?: () => void;
  onApprove?: () => void;
}

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-600", icon: <Circle className="h-3.5 w-3.5" /> },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3.5 w-3.5" /> },
  SUBMITTED: { label: "Submitted", color: "bg-yellow-100 text-yellow-700", icon: <Send className="h-3.5 w-3.5" /> },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700", icon: <XCircle className="h-3.5 w-3.5" /> },
} as const;

export function MilestoneCard({ milestone, canApprove, canSubmit, onSubmit, onApprove }: MilestoneCardProps) {
  const status = STATUS_CONFIG[milestone.status];
  const deadlineStatus = getMilestoneDeadlineStatus(milestone);
  const deadlineBadge =
    deadlineStatus === "overdue" ? (
      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        <AlertCircle className="h-3 w-3" />
        Overdue
      </span>
    ) : deadlineStatus === "due-soon" ? (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        Due Soon
      </span>
    ) : null;

  return (
    <div className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-4">
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${status.color}`}>
        {status.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{milestone.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{milestone.description}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-semibold text-green-600">${milestone.amount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Due {new Date(milestone.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
            {status.icon}
            {status.label}
          </span>
          {milestone.escrowLocked ? (
            <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              <Lock className="h-3 w-3" />
              Escrow Locked
            </span>
          ) : null}
          {deadlineBadge}
          {canSubmit ? (
            <button
              onClick={onSubmit ?? (() => {})}
              className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 transition-colors hover:bg-blue-200"
            >
              Submit Finished Work
            </button>
          ) : null}
          {canApprove ? (
            <button
              onClick={onApprove ?? (() => {})}
              className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 transition-colors hover:bg-green-200"
            >
              Approve & Release
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
