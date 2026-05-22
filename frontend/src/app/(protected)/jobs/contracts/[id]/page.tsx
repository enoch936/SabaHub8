"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ContractDetailView } from "@/components/contracts/ContractDetailView";
import { useContractStore } from "@/lib/contractStore";
import { useSession } from "@/lib/session";
import { workspaceRoutes } from "@/lib/workspace-routes";
import { ACTIVE_ROLE_STORAGE_KEY } from "@/lib/role-mode";

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const { contracts, isLoading, fetchContracts } = useContractStore();
  const sessionRole = useSession((s) => s.role);

  const role = useMemo<"EMPLOYER" | "FREELANCER">(() => {
    if (sessionRole === "EMPLOYER" || sessionRole === "FREELANCER") return sessionRole;
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
      if (stored === "EMPLOYER" || stored === "FREELANCER") return stored;
    }
    return "FREELANCER";
  }, [sessionRole]);

  useEffect(() => {
    void fetchContracts();
  }, [fetchContracts]);

  const contract = contracts.find((c) => c.id === id);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">📄</div>
        <h2 className="text-xl font-semibold text-slate-900">Contract not found</h2>
        <p className="text-sm text-slate-500">This contract may have been removed or you don&apos;t have access.</p>
        <Link
          href={workspaceRoutes.contracts}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to contracts
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back nav */}
      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <Link
          href={workspaceRoutes.contracts}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All contracts
        </Link>
      </div>

      {/* Full contract detail — reuse existing component, onClose navigates back */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ContractDetailView
          contract={contract}
          userRole={role}
          onClose={() => router.push(workspaceRoutes.contracts)}
        />
      </div>
    </div>
  );
}
