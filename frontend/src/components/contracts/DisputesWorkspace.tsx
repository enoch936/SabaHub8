"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Download,
  ExternalLink,
  FileText,
  Gavel,
  History,
  MessageSquare,
  Plus,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useDisputeStore } from "@/lib/disputeStore";
import type { DisputeStatus, PlatformDispute } from "@/lib/types";

interface DisputesWorkspaceProps {
  userRole?: "ADMIN" | "EMPLOYER" | "FREELANCER";
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "bg-blue-100 text-blue-700" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-indigo-100 text-indigo-700" },
  EVIDENCE_REQUIRED: { label: "Evidence Required", color: "bg-amber-100 text-amber-700" },
  SETTLEMENT_PENDING: { label: "Settlement Pending", color: "bg-purple-100 text-purple-700" },
  RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-700" },
  CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-600" },
  NEGOTIATION: { label: "In Negotiation", color: "bg-amber-100 text-amber-700" },
  ARBITRATION: { label: "Arbitration", color: "bg-purple-100 text-purple-700" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-600" },
};

export function DisputesWorkspace({
  userRole = "ADMIN",
}: DisputesWorkspaceProps) {
  const { disputes, fetchDisputes, setStatus } = useDisputeStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetchDisputes();
  }, [fetchDisputes]);

  const selectedDispute = useMemo(
    () => disputes.find((d) => d.id === selectedId),
    [disputes, selectedId],
  );

  const handleAddEvidence = () => {
    toast.info("Evidence upload initiated. Please select your files.");
    // In a real implementation, this would open a file picker and call an upload API.
  };

  const handleProposeSettlement = () => {
    toast.info("Opening settlement negotiation builder...");
  };

  const handleWithdrawCase = () => {
    if (confirm("Are you sure you want to withdraw this dispute? This action is permanent.")) {
      toast.success("Dispute withdrawal request submitted.");
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    toast.success("Message sent to the arbitration channel.");
    setMessage("");
  };

  const filteredDisputes = useMemo(() => {
    // In a real app, the API would handle this. For now, we simulate client-side filtering.
    if (userRole === "ADMIN") return disputes;
    
    // For employers and freelancers, we'd normally filter by their ID.
    // For this dev workspace, we'll show all but label them.
    return disputes;
  }, [disputes, userRole]);

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-600" };
  };

  const getCaseIntegrity = (dispute: PlatformDispute) => {
    const hasDetails = (dispute.details?.length ?? 0) > 50;
    const hasEvidence = (dispute.evidenceAssetIds?.length ?? 0) > 0;
    
    if (hasDetails && hasEvidence) return { score: 95, label: "High", color: "text-green-600" };
    if (hasDetails || hasEvidence) return { score: 60, label: "Medium", color: "text-amber-600" };
    return { score: 30, label: "Low", color: "text-red-600" };
  };

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
                const config = getStatusConfig(dispute.status);
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
      <div className="min-w-0 flex-1 overflow-y-auto pr-1">
        {selectedDispute ? (
          <div className="space-y-6 pb-12">
            {/* Header Card */}
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight">Case {selectedDispute.id}</h1>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${getStatusConfig(selectedDispute.status).color}`}
                    >
                      {getStatusConfig(selectedDispute.status).label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Contract</span>
                    <span className="font-mono font-medium text-slate-900">
                      {selectedDispute.contractId}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1">
                      {selectedDispute.contractTitle}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {userRole === "ADMIN" ? (
                    <>
                      <button
                        onClick={() => void setStatus(selectedDispute.id, "RESOLVED")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg active:scale-95"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve Case
                      </button>
                      <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-bold shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                        <Gavel className="h-4 w-4" />
                        Arbitrate
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={handleProposeSettlement}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Propose Settlement
                      </button>
                      <button 
                        onClick={handleWithdrawCase}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 shadow-sm transition-all hover:bg-red-100 active:scale-95"
                      >
                        <XCircle className="h-4 w-4" />
                        Withdraw Case
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Dispute Reason
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-slate-900 capitalize">
                    {selectedDispute.reason.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Initiated By
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-slate-900 capitalize">
                    {selectedDispute.openedByRole?.toLowerCase() || "System"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Funds at Stake
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-slate-900">
                    {selectedDispute.currency} {selectedDispute.heldAmount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Case Integrity
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`text-sm font-bold ${getCaseIntegrity(selectedDispute).color}`}>
                      {getCaseIntegrity(selectedDispute).label}
                    </span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                      <div 
                        className={`h-full transition-all duration-1000 ${getCaseIntegrity(selectedDispute).score > 80 ? "bg-green-500" : getCaseIntegrity(selectedDispute).score > 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${getCaseIntegrity(selectedDispute).score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Description & Evidence */}
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2 font-bold text-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      Incident Statement
                    </h3>
                    <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                      <History className="h-3 w-3" />
                      View Edit History
                    </button>
                  </div>
                  
                  <div className="rounded-xl bg-slate-50/30 border border-slate-100 p-5">
                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                      {selectedDispute.details || "The initiator has not provided a detailed statement yet."}
                    </p>
                  </div>

                  <div className="mt-8 border-t border-[var(--border)] pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        Verified Evidence Assets
                      </h3>
                      {userRole !== "ADMIN" && (
                        <button 
                          onClick={handleAddEvidence}
                          className="text-xs font-bold text-primary flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 transition-colors hover:bg-primary/10"
                        >
                          <Upload className="h-3 w-3" />
                          Add Evidence
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedDispute.evidenceAssetIds?.length ?? 0) === 0 ? (
                        <div className="col-span-full rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                          <Upload className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-xs font-medium text-slate-500">
                            No visual or document evidence has been attached to this case yet.
                          </p>
                        </div>
                      ) : (
                        selectedDispute.evidenceAssetIds?.map((assetId) => (
                          <div
                            key={assetId}
                            className="group flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-primary/30 hover:shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-primary">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-slate-900">
                                  {assetId}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Verified on {new Date(selectedDispute.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-primary transition-colors">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                {/* Communication */}
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2 font-bold text-lg">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Resolution Hub
                    </h3>
                    <div className="flex items-center gap-2">
                       <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Live Support Active</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* System Banner */}
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 text-center">
                      <p className="text-[11px] font-semibold text-indigo-800">
                        Dispute channel is now open. All messages are archived for arbitration review.
                      </p>
                    </div>

                    {selectedDispute.messages.length > 0 ? (
                      selectedDispute.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.target === "BOTH" ? "justify-center" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl p-4 ${msg.target === "BOTH" ? "bg-slate-100 border border-slate-200 text-center" : "bg-white border border-slate-100 shadow-sm"}`}>
                             <div className="flex items-center gap-2 mb-1">
                               <span className="text-[10px] font-bold text-primary uppercase">{msg.sentBy}</span>
                               <span className="text-[10px] text-muted-foreground">{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                             <p className="text-sm text-slate-800">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center opacity-40">
                         <MessageSquare className="mx-auto h-12 w-12 mb-2" />
                         <p className="text-sm">No communication history yet.</p>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <textarea
                      placeholder="Type your response or settlement offer..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm outline-none focus:border-primary/30 focus:bg-white transition-all resize-none"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                       <button 
                         onClick={handleSendMessage}
                         className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-primary/90 transition-all"
                       >
                          Send Message
                       </button>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                {/* Timeline Card */}
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-sm">
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <History className="h-4 w-4 text-primary" />
                    Case Progression
                  </h3>

                  <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    <div className="relative pl-10">
                      <div className="absolute left-2 top-0 h-4 w-4 rounded-full border-4 border-white bg-green-500 shadow-sm" />
                      <p className="text-xs font-bold text-slate-900">Dispute Initiated</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(selectedDispute.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="relative pl-10">
                      <div className="absolute left-2 top-0 h-4 w-4 rounded-full border-4 border-white bg-blue-500 shadow-sm" />
                      <p className="text-xs font-bold text-slate-900">Evidence Window Opened</p>
                      <p className="text-[10px] text-muted-foreground">Standard 48-hour period</p>
                    </div>

                    <div className="relative pl-10">
                      <div className={`absolute left-2 top-0 h-4 w-4 rounded-full border-4 border-white shadow-sm ${selectedDispute.status !== "OPEN" ? "bg-indigo-500" : "bg-slate-200"}`} />
                      <p className={`text-xs font-bold ${selectedDispute.status !== "OPEN" ? "text-slate-900" : "text-slate-400"}`}>Under Review</p>
                      <p className="text-[10px] text-muted-foreground">Arbitrator assigned</p>
                    </div>

                    <div className="relative pl-10 opacity-50">
                      <div className="absolute left-2 top-0 h-4 w-4 rounded-full border-4 border-white bg-slate-200 shadow-sm" />
                      <p className="text-xs font-bold text-slate-400">Resolution Proposed</p>
                      <p className="text-[10px] text-muted-foreground">Awaiting proposal</p>
                    </div>
                  </div>
                </section>

                {/* Integrity & Actions Card */}
                <section className="rounded-2xl border border-primary/10 bg-primary/5 p-6 shadow-sm">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                    <Scale className="h-4 w-4" />
                    Arbitration Tip
                  </h3>
                  <div className="space-y-4">
                    <p className="text-xs leading-relaxed text-slate-700">
                      {userRole === "FREELANCER" 
                        ? "Ensure you have uploaded all final deliverables and communication logs. Cases with complete evidence are resolved 4x faster."
                        : "Clearly state which part of the deliverables did not meet the agreed contract terms. Reference specific milestone requirements."}
                    </p>
                    <div className="pt-2">
                       <button className="w-full rounded-xl bg-white border border-primary/20 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Mark Evidence Complete
                       </button>
                    </div>
                  </div>
                </section>
                
                {/* Contract Quick View */}
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-sm">
                   <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      Contract Details
                   </h3>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Budget</span>
                         <span className="text-sm font-bold text-slate-900">{selectedDispute.currency} {selectedDispute.heldAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
                         <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">ACTIVE DISPUTE</span>
                      </div>
                      <div className="pt-2">
                         <button className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            View Original Contract
                         </button>
                      </div>
                   </div>
                </section>
              </div>
            </div>
          </div>
        ) : (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-10 text-center">
            <Scale className="mx-auto mb-4 h-12 w-12 opacity-10" />
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
