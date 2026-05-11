"use client";

import { FormEvent, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertTriangle, FileText, Paperclip, ShieldAlert, Trash2, X } from "lucide-react";
import { saveAssetMetadata, uploadSignature } from "@/lib/api";
import { useDisputeStore } from "@/lib/disputeStore";
import type { PlatformContract } from "@/lib/types";

interface DisputeContractModalProps {
  contract: PlatformContract;
  isOpen: boolean;
  onClose: () => void;
  openedByRole?: "EMPLOYER" | "FREELANCER";
}

const DISPUTE_REASONS = [
  "Work not delivered as agreed",
  "Quality does not meet requirements",
  "Missed deadlines",
  "Communication breakdown",
  "Payment dispute",
  "Scope conflict",
  "Other",
] as const;

type EvidenceAsset = {
  id: string;
  title?: string;
  mimeType?: string;
  size?: number;
};

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function uploadDisputeAsset(file: File) {
  const timestamp = Math.floor(Date.now() / 1000);
  const sig = await uploadSignature({ timestamp, folder: "sabahub/disputes" });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", sig.signature);
  if (sig.params?.folder) form.append("folder", sig.params.folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName as string}/auto/upload`;
  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as Record<string, unknown>);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("POST", endpoint);
    xhr.send(form);
  });

  return saveAssetMetadata({
    scope: "DISPUTE",
    title: file.name,
    secureUrl: String(result.secure_url || ""),
    publicId: String(result.public_id || ""),
    resourceType: String(result.resource_type || ""),
    mimeType: file.type,
    size: (result.bytes as number) ?? file.size,
  });
}

export function DisputeContractModal({
  contract,
  isOpen,
  onClose,
  openedByRole = "EMPLOYER",
}: DisputeContractModalProps) {
  const { openDispute } = useDisputeStore();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [evidenceAssets, setEvidenceAssets] = useState<EvidenceAsset[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setReason("");
    setDetails("");
    setEvidenceAssets([]);
    setUploadError(null);
    setSubmitError(null);
    onClose();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploadingEvidence(true);
    setUploadError(null);

    try {
      const nextAssets: EvidenceAsset[] = [];
      for (const file of Array.from(files)) {
        const saved = await uploadDisputeAsset(file);
        nextAssets.push({
          id: saved.id,
          title: saved.title,
          mimeType: saved.mimeType,
          size: saved.size,
        });
      }
      setEvidenceAssets((current) => [...current, ...nextAssets]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload evidence.");
    } finally {
      setIsUploadingEvidence(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason) {
      setSubmitError("Select at least one dispute reason.");
      return;
    }
    if (!details.trim()) {
      setSubmitError("Add dispute details so admin can review the case.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await openDispute({
        contract,
        reason,
        details: details.trim() || undefined,
        openedByRole,
        evidenceAssetIds: evidenceAssets.map((asset) => asset.id),
      });
      handleClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit dispute.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="sheet-panel flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <h2 className="font-semibold">Open Enterprise Dispute</h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 hover:bg-slate-100/70"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Escrow is frozen for admin review</p>
                    <p className="mt-0.5 text-xs text-red-600">
                      Submitting this form opens a real dispute in the backend. New submissions and releases stop immediately.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)] p-3">
                  <p className="truncate text-sm font-medium">{contract.jobTitle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {contract.employerName} ↔ {contract.freelancerName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Escrow policy: {contract.escrowProtectionLevel || "FULL"} • Dispute window:{" "}
                    {contract.disputeWindowDays ?? 7} days
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Reason for dispute <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {DISPUTE_REASONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setReason(item);
                          setSubmitError(null);
                        }}
                        className={`rounded-lg border px-3 py-2 text-left text-sm ${
                          reason === item
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-[var(--border)] hover:border-slate-300/80"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Evidence and case details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(event) => {
                      setDetails(event.target.value);
                      if (submitError) {
                        setSubmitError(null);
                      }
                    }}
                    placeholder="Describe timeline issues, quality gaps, payment claims, evidence references, and what outcome you want from admin."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">Evidence uploads</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingEvidence || isSubmitting}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium disabled:opacity-50"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {isUploadingEvidence ? "Uploading..." : "Add files"}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={(event) => void handleFiles(event.target.files)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload screenshots, PDFs, archives, deliverables, or payment evidence. Files are attached to the dispute record for admin review.
                  </p>
                  {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
                  {evidenceAssets.length > 0 ? (
                    <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--accent)] p-3">
                      {evidenceAssets.map((asset) => (
                        <div key={asset.id} className="flex items-center gap-3 rounded-lg bg-[var(--surface)] px-3 py-2">
                          <FileText className="h-4 w-4 flex-shrink-0 text-slate-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{asset.title || asset.mimeType || asset.id}</p>
                            <p className="text-xs text-muted-foreground">{formatBytes(asset.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEvidenceAssets((current) => current.filter((item) => item.id !== asset.id))}
                            className="rounded p-1 text-slate-500 hover:bg-slate-100"
                            aria-label={`Remove ${asset.title || asset.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-[var(--border)] bg-white p-5">
                {submitError ? <p className="mb-3 text-sm text-red-600">{submitError}</p> : null}
                <div className="mb-3 text-xs text-muted-foreground">
                  Submitting creates a real dispute record and freezes escrow actions until admin review.
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm hover:border-slate-300/80 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reason || !details.trim() || isSubmitting || isUploadingEvidence}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-700 hover:bg-red-50/70 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4" />
                        Submit Dispute
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
