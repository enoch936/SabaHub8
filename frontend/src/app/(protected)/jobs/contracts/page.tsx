"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FileText, Plus } from "lucide-react";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import { ContractCard } from "@/components/contracts/ContractCard";
import { ContractDetailView } from "@/components/contracts/ContractDetailView";
import { CreateContractModal } from "@/components/contracts/CreateContractModal";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useContractStore } from "@/lib/contractStore";
import { ACTIVE_ROLE_STORAGE_KEY } from "@/lib/role-mode";
import { useSession } from "@/lib/session";
import type { ContractStatus, PlatformContract } from "@/lib/types";

type WorkspaceRole = "EMPLOYER" | "FREELANCER";

export default function ContractsPage() {
  const { contracts, isLoading, fetchContracts } = useContractStore();
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

    return "FREELANCER";
  }, [sessionRole]);

  const [selectedContract, setSelectedContract] = useState<PlatformContract | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "ALL">("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const isEmployer = role === "EMPLOYER";

  const handleContractCreated = () => {
    setShowCreate(false);
    setConfettiTrigger((value) => value + 1);
  };

  useEffect(() => {
    void fetchContracts();
  }, [fetchContracts, role]);

  useEffect(() => {
    if (!selectedContract) {
      return;
    }

    const updated = contracts.find((contract) => contract.id === selectedContract.id);
    if (updated) {
      setSelectedContract(updated);
    }
  }, [contracts, selectedContract]);

  const filtered = statusFilter === "ALL" ? contracts : contracts.filter((contract) => contract.status === statusFilter);

  if (isLoading) {
    return (
      <div className="sheet-shell min-h-screen">
        <div className="sheet-container">
          <LoadingSkeleton rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-shell min-h-screen">
      <div className="sheet-container">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold">Contracts</h1>
            <p className="text-sm text-muted-foreground">{contracts.length} total contracts</p>
          </div>

          {isEmployer ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              New Contract
            </button>
          ) : null}
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {(["ALL", "ACTIVE", "IN_PROGRESS", "DELIVERED", "COMPLETED", "DISPUTED", "DRAFT", "CANCELLED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg border px-3 py-1.5 text-sm whitespace-nowrap ${
                statusFilter === status
                  ? "border-[var(--border)] bg-[var(--accent)] text-foreground"
                  : "border-[var(--border)]"
              }`}
            >
              {status === "ALL"
                ? "All"
                : status === "IN_PROGRESS"
                  ? "In Progress"
                  : status === "DELIVERED"
                    ? "Delivered"
                    : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((contract) => (
            <ContractCard key={contract.id} contract={contract} onClick={setSelectedContract} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">No contracts found</p>
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {selectedContract ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <ContractDetailView
              contract={selectedContract}
              onClose={() => setSelectedContract(null)}
              userRole={role}
            />
          </div>
        ) : null}
      </AnimatePresence>

      {isEmployer ? <CreateContractModal isOpen={showCreate} onClose={handleContractCreated} /> : null}
      <ConfettiCelebration trigger={confettiTrigger} duration={3000} />
    </div>
  );
}
