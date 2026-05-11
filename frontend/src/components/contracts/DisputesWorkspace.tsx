"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CircleEllipsis, FileSearch, Paperclip, ShieldCheck } from "lucide-react";
import { useContractStore } from "@/lib/contractStore";
import { useDisputeStore } from "@/lib/disputeStore";
import { DisputeContractModal } from "./DisputeContractModal";
import { ACTIVE_ROLE_STORAGE_KEY } from "@/lib/role-mode";
import { useSession } from "@/lib/session";
import type { PlatformContract } from "@/lib/types";

type WorkspaceRole = "EMPLOYER" | "FREELANCER";

export function DisputesWorkspace() {
  const { contracts, fetchContracts } = useContractStore();
  const disputes = useDisputeStore((state) => state.disputes);
  const fetchDisputes = useDisputeStore((state) => state.fetchDisputes);
  const sessionRole = useSession((state) => state.role);
  const [selectedContract, setSelectedContract] = useState<PlatformContract | null>(null);

  useEffect(() => {
    void fetchContracts();
    void fetchDisputes();
  }, [fetchContracts, fetchDisputes]);

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

    return "FREELANCER";
  }, [sessionRole]);

  const enriched = useMemo(
    () =>
      disputes.map((dispute) => ({
        ...dispute,
        contract: contracts.find((contract) => contract.id === dispute.contractId),
      })),
    [contracts, disputes],
  );

  const disputedContractIds = useMemo(() => new Set(disputes.map((dispute) => dispute.contractId)), [disputes]);
  const disputableContracts = useMemo(
    () =>
      contracts.filter((contract) => {
        if (disputedContractIds.has(contract.id) || contract.disputeId) {
          return false;
        }
        return contract.status === "ACTIVE" || contract.status === "IN_PROGRESS" || contract.status === "DELIVERED";
      }),
    [contracts, disputedContractIds],
  );

  return (
    <div className="sheet-shell min-h-screen">
      <div className="sheet-container space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Disputes</h1>
              <p className="text-sm text-muted-foreground">
                Enterprise dispute cases, escrow freezes, and admin-driven settlement records.
              </p>
            </div>
            <div className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
              {enriched.length} active case{enriched.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Submit a dispute</h2>
              <p className="text-sm text-muted-foreground">
                Open a real dispute directly from the web workspace. The form below writes to the backend dispute APIs and
                freezes escrow for admin review.
              </p>
            </div>
            <div className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-slate-700">
              {disputableContracts.length} eligible contract{disputableContracts.length === 1 ? "" : "s"}
            </div>
          </div>

          {disputableContracts.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4 text-sm text-muted-foreground">
              No active contracts are currently eligible for a new dispute.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {disputableContracts.map((contract) => (
                <div key={contract.id} className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{contract.jobTitle}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {contract.employerName} ↔ {contract.freelancerName}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium">
                      {contract.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>Total value: {contract.currency} {contract.totalAmount.toLocaleString()}</p>
                    <p>Paid before dispute: {contract.currency} {contract.paidAmount.toLocaleString()}</p>
                    <p>Dispute window: {contract.disputeWindowDays ?? 7} days</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedContract(contract)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Open dispute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {enriched.length === 0 ? (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
            <p className="font-medium">No disputes are open.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Escrow-protected contracts will appear here if either party escalates a formal case.
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {enriched.map((dispute) => (
              <article
                key={dispute.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-[var(--accent)] px-2 py-1">#{dispute.id}</span>
                      <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-red-700">
                        {dispute.status}
                      </span>
                      <span className="rounded-full border border-[var(--border)] px-2 py-1">
                        Contract {dispute.contractId}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{dispute.contractTitle}</h2>
                      <p className="text-sm text-muted-foreground">
                        {dispute.employerName} ↔ {dispute.freelancerName}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                    {dispute.details ? (
                      <p className="rounded-xl bg-[var(--accent)] p-3 text-sm text-muted-foreground">
                        {dispute.details}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--accent)] px-2.5 py-1">
                        <Paperclip className="h-3.5 w-3.5" />
                        {dispute.evidenceAssetIds.length} evidence file{dispute.evidenceAssetIds.length === 1 ? "" : "s"}
                      </span>
                      {dispute.contract?.freelancerId ? (
                        <Link
                          href={`/chat?user=${encodeURIComponent(dispute.contract.freelancerId)}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-medium text-slate-700"
                        >
                          <CircleEllipsis className="h-3.5 w-3.5" />
                          Chat with freelancer
                        </Link>
                      ) : null}
                      {dispute.contract?.employerId ? (
                        <Link
                          href={`/chat?user=${encodeURIComponent(dispute.contract.employerId)}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-medium text-slate-700"
                        >
                          <CircleEllipsis className="h-3.5 w-3.5" />
                          Chat with employer
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-[220px] rounded-2xl border border-[var(--border)] bg-[var(--accent)] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileSearch className="h-4 w-4" />
                      Case controls
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <p>Held escrow: {dispute.currency} {dispute.heldAmount.toLocaleString()}</p>
                      <p>Paid before dispute: {dispute.currency} {dispute.paidAmount.toLocaleString()}</p>
                      <p>
                        Account actions: employer {dispute.participantControls.employer.toLowerCase()}, freelancer{" "}
                        {dispute.participantControls.freelancer.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {dispute.settlement ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    Settlement: employer {dispute.settlement.employerPercent}%, freelancer{" "}
                    {dispute.settlement.freelancerPercent}%, admin {dispute.settlement.adminPercent}%.
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Awaiting administrator review, message routing, or settlement decision.
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedContract ? (
        <DisputeContractModal
          contract={selectedContract}
          isOpen={Boolean(selectedContract)}
          onClose={() => setSelectedContract(null)}
          openedByRole={role}
        />
      ) : null}
    </div>
  );
}
