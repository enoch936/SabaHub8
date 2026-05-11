"use client";

import { Calendar, CheckCircle, DollarSign, Users } from "lucide-react";
import type { ContractStatus, PlatformContract } from "@/lib/types";

interface ContractCardProps {
  contract: PlatformContract;
  onClick: (contract: PlatformContract) => void;
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-emerald-100 text-emerald-700" },
  DELIVERED: { label: "Delivered", color: "bg-sky-100 text-sky-700" },
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700" },
  DISPUTED: { label: "Disputed", color: "bg-red-100 text-red-700" },
  PAUSED: { label: "Paused", color: "bg-yellow-100 text-yellow-700" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500" },
};

export function ContractCard({ contract, onClick }: ContractCardProps) {
  const status = STATUS_CONFIG[contract.status];
  const approvedMilestones = contract.milestones.filter((milestone) => milestone.status === "APPROVED").length;
  const totalMilestones = contract.milestones.length;
  const progressPct = totalMilestones > 0 ? (approvedMilestones / totalMilestones) * 100 : 0;

  return (
    <div
      onClick={() => onClick(contract)}
      className="sheet-panel cursor-pointer border border-transparent p-5 hover:border-slate-200/70"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{contract.jobTitle}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {contract.employerName} ↔ {contract.freelancerName}
            </span>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--accent)] p-3">
          <div className="mb-0.5 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <p className="text-sm font-bold text-green-600">
            {contract.currency} {contract.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--accent)] p-3">
          <div className="mb-0.5 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Paid</span>
          </div>
          <p className="text-sm font-bold">
            {contract.currency} {contract.paidAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {totalMilestones > 0 ? (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>
                {approvedMilestones} of {totalMilestones} milestones approved
              </span>
            </div>
            <span className="text-xs font-medium">{Math.round(progressPct)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--accent)]">
            <div className="h-full rounded-full bg-slate-400" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(contract.startDate).toLocaleDateString()}</span>
        </div>
        {contract.endDate ? (
          <>
            <span>→</span>
            <span>{new Date(contract.endDate).toLocaleDateString()}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
