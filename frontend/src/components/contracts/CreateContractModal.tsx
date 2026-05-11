"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, FileText, X } from "lucide-react";
import { useContractStore } from "@/lib/contractStore";

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES = ["USD", "EUR", "GBP", "ETB"] as const;

const initialForm = {
  jobTitle: "",
  freelancerName: "",
  freelancerId: "",
  employerName: "",
  totalAmount: "",
  currency: "USD",
  startDate: "",
  endDate: "",
  paymentModel: "MILESTONE",
  escrowProtectionLevel: "FULL",
  disputeWindowDays: "7",
  autoReleaseDays: "5",
  terms: "",
};

export function CreateContractModal({ isOpen, onClose }: CreateContractModalProps): ReactElement {
  const { createContract } = useContractStore();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField =
    (key: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const handleClose = () => {
    setForm(initialForm);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.jobTitle.trim()) {
      setError("Job title is required.");
      return;
    }

    if (!form.freelancerName.trim()) {
      setError("Freelancer name is required.");
      return;
    }

    if (!form.freelancerId.trim()) {
      setError("Freelancer email or ID is required.");
      return;
    }

    if (!form.startDate) {
      setError("Start date is required.");
      return;
    }

    if (!form.endDate) {
      setError("End date is required.");
      return;
    }

    if (!form.totalAmount || Number.parseFloat(form.totalAmount) <= 0) {
      setError("Contract amount must be greater than 0.");
      return;
    }

    if (!form.terms.trim()) {
      setError("Contract terms are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await createContract({
        jobTitle: form.jobTitle.trim(),
        freelancerName: form.freelancerName.trim(),
        freelancerId: form.freelancerId.trim(),
        employerName: form.employerName.trim(),
        totalAmount: Number.parseFloat(form.totalAmount) || 0,
        currency: form.currency,
        startDate: form.startDate,
        endDate: form.endDate,
        paymentModel: form.paymentModel as "FIXED" | "MILESTONE" | "HOURLY",
        escrowProtectionLevel: "FULL",
        disputeWindowDays: Number.parseInt(form.disputeWindowDays, 10) || 7,
        autoReleaseDays: Number.parseInt(form.autoReleaseDays, 10) || 5,
        requiresEscrow: true,
        adminReviewRequired: true,
        terms: form.terms.trim(),
        status: "DRAFT",
        milestones: [],
      });
      handleClose();
    } catch {
      setError("Failed to create contract. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="sheet-panel max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">New Contract</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 hover:bg-slate-100/70"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {error ? (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-medium">Job Title *</label>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={setField("jobTitle")}
                  placeholder="e.g. Senior React Developer"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Freelancer Name *</label>
                  <input
                    type="text"
                    value={form.freelancerName}
                    onChange={setField("freelancerName")}
                    placeholder="Full name"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Freelancer Email / ID</label>
                  <input
                    type="text"
                    value={form.freelancerId}
                    onChange={setField("freelancerId")}
                    placeholder="email or user ID"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Employer / Company Name</label>
                <input
                  type="text"
                  value={form.employerName}
                  onChange={setField("employerName")}
                  placeholder="Your company name"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Total Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalAmount}
                    onChange={setField("totalAmount")}
                    placeholder="0"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Currency</label>
                  <select
                    value={form.currency}
                    onChange={setField("currency")}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={setField("startDate")}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={setField("endDate")}
                    min={form.startDate || undefined}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Payment Model</label>
                  <select
                    value={form.paymentModel}
                    onChange={setField("paymentModel")}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="MILESTONE">Milestone</option>
                    <option value="FIXED">Fixed price</option>
                    <option value="HOURLY">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Escrow Protection</label>
                  <select
                    value={form.escrowProtectionLevel}
                    onChange={setField("escrowProtectionLevel")}
                    disabled
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="FULL">Full</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Dispute Window (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.disputeWindowDays}
                    onChange={setField("disputeWindowDays")}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Auto-Release (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.autoReleaseDays}
                    onChange={setField("autoReleaseDays")}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Terms &amp; Conditions *</label>
                <textarea
                  value={form.terms}
                  onChange={setField("terms")}
                  placeholder="Describe scope, acceptance criteria, milestone release logic, evidence requirements, dispute path, and admin intervention rules..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Contract is created as <span className="font-medium">DRAFT</span>. Full escrow lock is required before
                the agreement can activate, and milestones must finish on or before the contract end date.
              </p>

              <div className="flex gap-3 pt-1">
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
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 text-sm hover:border-slate-300/80 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Creating...
                    </>
                  ) : (
                    "Create Contract"
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
