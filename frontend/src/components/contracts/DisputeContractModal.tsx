"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  FileText,
  Paperclip,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { useDisputeStore } from "@/lib/disputeStore";
import type { PlatformContract } from "@/lib/types";

interface DisputeContractModalProps {
  contract: PlatformContract;
  isOpen: boolean;
  onClose: () => void;
  openedByRole?: "EMPLOYER" | "FREELANCER";
}

interface AttachedAsset {
  id: string;
  name: string;
  size: number;
}

export function DisputeContractModal({
  contract,
  isOpen,
  onClose,
  openedByRole = "EMPLOYER",
}: DisputeContractModalProps) {
  const { openDispute } = useDisputeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<AttachedAsset[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleClose = () => {
    setReason("");
    setDescription("");
    setError(null);
    setAssets([]);
    onClose();
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files) {
      return;
    }
    const newAssets: AttachedAsset[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).slice(2, 9),
      name: file.name,
      size: file.size,
    }));
    setAssets((current) => [...current, ...newAssets]);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleAddFiles(e.dataTransfer.files);
  };

  const handleRemoveAsset = (id: string) => {
    setAssets((current) => current.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select a primary reason for the dispute.");
      return;
    }
    if (description.trim().length < 20) {
      setError("Please provide a detailed description (at least 20 chars).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await openDispute({
        contractId: contract.id,
        reason,
        description: description.trim(),
        openedByRole,
      });
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to open dispute case.",
      );
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
                <h2 className="font-semibold">Open Dispute Case</h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 hover:bg-slate-100/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Important Notice</p>
                    <p className="mt-1 leading-relaxed">
                      Opening a dispute freezes the contract and involves SabaHub
                      arbitration. We encourage resolving issues directly through
                      chat first. Once opened, an admin will review the
                      evidence.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Primary Reason *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="QUALITY">Poor Quality of Work</option>
                    <option value="DELAY">Missed Deadlines / Delayed Delivery</option>
                    <option value="COMMUNICATION">Lack of Communication</option>
                    <option value="SCOPE">Scope Disagreement</option>
                    <option value="PAYMENT">Payment/Milestone Issue</option>
                    <option value="OTHER">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Detailed Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a clear timeline of events, what went wrong, and your proposed resolution..."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Evidence &amp; Attachments
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors ${
                      isDragging
                        ? "border-red-500 bg-red-50"
                        : "border-[var(--border)] hover:bg-slate-50"
                    }`}
                  >
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drop evidence here or{" "}
                      <span className="font-medium text-red-600">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Screenshots, logs, or documents (max 5 files)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAddFiles(e.target.files)}
                  />

                  {assets.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center gap-3 rounded-lg bg-[var(--surface-solid)] px-3 py-2"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 truncate text-xs font-medium">
                            {asset.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(asset.id)}
                            className="text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-3 border-t border-[var(--border)] pt-5">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Opening Dispute...
                      </>
                    ) : (
                      "Open Formal Dispute"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
