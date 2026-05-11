"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, FileText, Paperclip, Send, Trash2, X } from "lucide-react";
import { useContractStore } from "@/lib/contractStore";
import type { Milestone } from "@/lib/types";

interface SubmitMilestoneModalProps {
  contractId: string;
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
}

interface AttachedFile {
  name: string;
  size: number;
  type: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SubmitMilestoneModal({
  contractId,
  milestone,
  isOpen,
  onClose,
}: SubmitMilestoneModalProps) {
  const { submitMilestone } = useContractStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleClose = () => {
    setNotes("");
    setFiles([]);
    setFileError(null);
    setSubmitError(null);
    setIsDragging(false);
    onClose();
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) {
      return;
    }

    setFileError(null);

    setFiles((current) => {
      const next = [...current];

      for (const file of Array.from(incoming)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setFileError(`"${file.name}" is not a supported file type.`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setFileError(`"${file.name}" exceeds the 10 MB limit.`);
          continue;
        }

        if (next.length >= 5) {
          setFileError("You can attach up to 5 files.");
          break;
        }

        if (next.some((existing) => existing.name === file.name)) {
          continue;
        }

        next.push({
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }

      return next;
    });
  };

  const removeFile = (name: string) => {
    setFiles((current) => current.filter((file) => file.name !== name));
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitMilestone(contractId, milestone.id, notes.trim() || undefined);
      handleClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit milestone. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="sheet-panel w-full max-w-lg">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Submit Milestone</h2>
              </div>
              <button type="button" onClick={handleClose} className="rounded-lg p-1.5" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)] p-3">
                <p className="text-sm font-medium">{milestone.title}</p>
                {milestone.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{milestone.description}</p>
                ) : null}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-green-600">${milestone.amount.toLocaleString()}</span>
                  <span>·</span>
                  <span>Due {new Date(milestone.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Submission Notes <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Describe what you've completed, any relevant links, or notes for the employer..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Attachments <span className="font-normal text-muted-foreground">(up to 5 files, 10 MB each)</span>
                </label>
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-[var(--border)]"
                  }`}
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                  <p className="text-center text-sm text-muted-foreground">
                    Drag &amp; drop files here, or <span className="font-medium text-primary">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, images, ZIP, DOCX, TXT</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.zip,.txt,.doc,.docx"
                  className="hidden"
                  onChange={(event) => addFiles(event.target.files)}
                />
              </div>

              {fileError ? (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {fileError}
                </div>
              ) : null}

              {submitError ? (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {submitError}
                </div>
              ) : null}

              {files.length > 0 ? (
                <ul className="space-y-2">
                  {files.map((file) => (
                    <li
                      key={file.name}
                      className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.name)}
                        className="rounded p-1"
                        aria-label={`Remove ${file.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="text-xs text-muted-foreground">
                Submitting will change the milestone status to <span className="font-medium">SUBMITTED</span> and notify the
                employer for review.
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 text-sm disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Milestone
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
