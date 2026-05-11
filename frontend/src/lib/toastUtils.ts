"use client";

import { toast } from 'sonner';

/** Success toast for completed transactions */
export function toastTransactionSuccess(description?: string) {
  toast.success('Transaction successful', { description });
}

/** Error toast with optional retry action */
export function toastTransactionError(reason?: string, onRetry?: () => void) {
  toast.error('Transaction failed', {
    description: reason ?? 'An unexpected error occurred.',
    action: onRetry ? { label: 'Retry', onClick: onRetry } : undefined,
  });
}

/** Info toast for general messages */
export function toastInfo(message: string, description?: string) {
  toast.info(message, { description });
}

/** Success toast for milestone approval */
export function toastMilestoneApproved(milestoneTitle: string) {
  toast.success(`Milestone approved: ${milestoneTitle}`, {
    description: 'Payment has been released.',
  });
}

/** Success toast for contract signing */
export function toastContractSigned() {
  toast.success('Contract signed!', { description: 'Both parties have agreed to the terms.' });
}

/** Success toast for successful hire */
export function toastHireSuccess(freelancerName: string) {
  toast.success(`${freelancerName} has been hired!`, { description: 'A contract draft has been created.' });
}
