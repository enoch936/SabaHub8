"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Balance,
  Calendar,
  CheckCircle,
  FileText,
  Gavel,
  History,
  MessageSquare,
  Scale,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { useDisputeStore } from "@/lib/disputeStore";
import type { Dispute, DisputeStatus } from "@/lib/types";

interface DisputesWorkspaceProps {
  userRole?: "ADMIN" | "EMPLOYER" | "FREELANCER";
}

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string }> = {
  OPEN: { label: "Open / Under Review", color: "bg-blue-100 text-blue-700" },
  NEGOTIATION: { label: "In Negotiation", color: "bg-amber-100 text-amber-700" },
  ARBITRATION: { label: "Arbitration", color: "bg-purple-100 text-purple-700" },
  RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-600" },
};

export function DisputesWorkspace({
  userRole = "ADMIN",
}: DisputesWorkspaceProps) {
  const { disputes, fetchDisputes, updateDisputeStatus } = useDisputeStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void fetchDisputes();
  }, [fetchDisputes]);

  const selectedDispute = useMemo(
    () => disputes.find((d) => d.id === selectedId),
    [disputes, selectedId],
  );

  const filteredDisputes = useMemo(() => {
    // If not admin, you'd filter by participation. For now, showing all for the dev workspace.
    return disputes;
  }, [disputes]);

  return (
    <div className="flex h-full min-h-[600px] gap-6">
      {/* Sidebar List */}
      <div className="sheet-panel w-80 flex flex-col overflow-hidden">
        <div className="border-b border-[var(--border)] p-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Active Disputes</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {filteredDisputes.length} cases requiring attention
          </p>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {filteredDisputes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <ShieldAlert className="mx-auto mb-2 h-8 w-8 opacity-20" />
              <p className="text-sm">No active dispute cases</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {filteredDisputes.map((dispute) => {
                const config = STATUS_CONFIG[dispute.status];
                return (
                  <button
                    key={dispute.id}
                    onClick={() => setSelectedId(dispute.id)}
                    className={`flex w-full flex-col gap-1 p-4 text-left transition-colors hover:bg-slate-50 ${
                      selectedId === dispute.id ? "bg-slate-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-xs font-mono font-medium text-muted-foreground">
                        {dispute.id}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${config.color}`}
                      >
                        {dispute.status}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm font-semibold">
                      Contract {dispute.contractId}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Detail Area */}
      <div className="min-w-0 flex-1 space-y-6">
        {selectedDispute ? (
          <>
            {/* Header Card */}
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold">Case {selectedDispute.id}</h1>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_CONFIG[selectedDispute.status].color}`}
                    >
                      {STATUS_CONFIG[selectedDispute.status].label}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    Originating from contract{" "}
                    <span className="font-medium text-slate-900">
                      {selectedDispute.contractId}
                    </span>
                  </p>
                </div>

                {userRole === "ADMIN" && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        void updateDisputeStatus(selectedDispute.id, "RESOLVED")
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Resolve Case
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
                      <Gavel className="h-4 w-4" />
                      Arbitrate
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Reason
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedDispute.reason}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Disputed By
                  </p>
                  <p className="mt-1 text-sm font-semibold capitalize">
                    {selectedDispute.openedByRole.toLowerCase()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Review Started
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {new Date(selectedDispute.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </section>

            {/* Description & Evidence */}
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6">
              <h3 className="flex items-center gap-2 font-bold">
                <FileText className="h-4 w-4 text-primary" />
                Case Description
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {selectedDispute.description}
              </p>

              <div className="mt-8 border-t border-[var(--border)] pt-6">
                <h3 className="mb-4 text-sm font-bold">Evidence Items</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedDispute.evidence.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground">
                      No attachments provided with this case.
                    </p>
                  ) : (
                    selectedDispute.evidence.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-2.5 py-1 text-xs font-medium"
                      >
                        {item.type}: {item.id}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Admin Internal Log / Chat (Simplified) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Case Timeline &amp; Activity</h3>
                <button className="text-xs font-bold text-primary">
                  View Full Audit Log
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <History className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Case opened</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedDispute.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Balance className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 rounded-xl bg-blue-50/50 p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      Arbitrator Assigned
                    </p>
                    <p className="mt-1 text-sm text-blue-800">
                      System automatically flagged for priority review based on
                      payment model.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-10 text-center">
            <Balance className="mx-auto mb-4 h-12 w-12 opacity-10" />
            <h2 className="text-lg font-bold">Select a dispute case</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a case from the sidebar to review evidence and make an
              arbitration decision.
            </p>
          </section>
        )}

        {/* Messaging (Placeholder) */}
        {selectedDispute && (
          <div className="mt-8 border-t border-[var(--border)] pt-8">
            <div className="flex items-center gap-2 px-1">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="font-bold">Case Messages</h3>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                      SY
                    </div>
                    <div>
                      <p className="text-xs font-bold">System Notification</p>
                      <p className="text-[10px] text-muted-foreground">
                        2 days ago
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    PUBLIC
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  The dispute has been formally opened. Parties are encouraged
                  to upload any additional evidence within 48 hours.
                </p>
              </div>

              <div className="flex items-center gap-3 px-2">
                <input
                  type="text"
                  placeholder="Type a message to parties..."
                  className="flex-1 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm outline-none"
                />
                <button className="rounded-full bg-primary p-2 text-white">
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 px-2">
                <button className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-2.5 py-1 font-medium text-slate-700">
                  <Users className="h-3 w-3" />
                  <span className="text-[10px]">Notify Parties</span>
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-2.5 py-1 font-medium text-slate-700">
                  <ShieldAlert className="h-3 w-3 text-red-500" />
                  <span className="text-[10px]">Internal Note</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
