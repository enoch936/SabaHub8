"use client";

import type { Transaction } from "./types";

const METHOD_COLORS: Record<string, string> = {
  SABAHUB: "#2563eb",
  STRIPE: "#7c3aed",
  CHAPA: "#059669",
  BANK_TRANSFER: "#ea580c",
  CARD: "#dc2626",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#16a34a",
  PENDING: "#ca8a04",
  FAILED: "#dc2626",
  CANCELLED: "#6b7280",
};

export function isIncomingTransaction(transaction: Transaction) {
  return transaction.type === "RECEIVE" || transaction.type === "DEPOSIT";
}

export function isOutgoingTransaction(transaction: Transaction) {
  return transaction.type === "SEND" || transaction.type === "WITHDRAW";
}

export function humanizeToken(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysDiff = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (daysDiff === 0) return `Today, ${time}`;
  if (daysDiff === 1) return `Yesterday, ${time}`;
  return `${formatDate(value)}, ${time}`;
}

export function getTransactionCounterparty(transaction: Transaction) {
  return (
    transaction.fromName ??
    transaction.toName ??
    (typeof transaction.metadata?.counterpartyEmail === "string" ? transaction.metadata.counterpartyEmail : undefined) ??
    (typeof transaction.metadata?.counterpartyUserId === "string" ? transaction.metadata.counterpartyUserId : undefined) ??
    transaction.description ??
    "Wallet activity"
  );
}

export function getTransactionMethodLabel(transaction: Transaction) {
  const paymentMethod = typeof transaction.metadata?.paymentMethod === "string"
    ? transaction.metadata.paymentMethod
    : transaction.method;

  return humanizeToken(paymentMethod);
}

export function buildHourlyTransactionData(transactions: Transaction[]) {
  const counts = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    transactions: 0,
  }));

  transactions.forEach((transaction) => {
    const hour = new Date(transaction.createdAt).getHours();
    counts[hour].transactions += 1;
  });

  return counts;
}

export function buildMethodBreakdown(transactions: Transaction[]) {
  const totals = new Map<string, number>();

  transactions.forEach((transaction) => {
    const key = typeof transaction.metadata?.paymentMethod === "string"
      ? transaction.metadata.paymentMethod
      : transaction.method;
    totals.set(key, (totals.get(key) ?? 0) + Math.abs(transaction.amount));
  });

  return Array.from(totals.entries())
    .map(([key, value]) => ({
      name: humanizeToken(key),
      value,
      color: METHOD_COLORS[key] ?? "#64748b",
    }))
    .sort((left, right) => right.value - left.value);
}

export function buildStatusBreakdown(transactions: Transaction[]) {
  const totals = new Map<string, number>();

  transactions.forEach((transaction) => {
    totals.set(transaction.status, (totals.get(transaction.status) ?? 0) + 1);
  });

  return Array.from(totals.entries())
    .map(([key, value]) => ({
      name: humanizeToken(key),
      value,
      color: STATUS_COLORS[key] ?? "#64748b",
    }))
    .sort((left, right) => right.value - left.value);
}

export function getStartOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

