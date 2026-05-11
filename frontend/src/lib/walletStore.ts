"use client";

import { create } from "zustand";
import { toast } from "sonner";
import {
  getWallet,
  getWalletWithdrawals,
  internalWalletTransfer,
  withdrawFromWallet,
  type WalletCurrencyBreakdown as ApiWalletCurrencyBreakdown,
  type WalletFxSnapshot as ApiWalletFxSnapshot,
  type WalletSnapshot,
  type WalletTransaction,
  type WalletWithdrawal,
} from "./api";
import type {
  WalletBalance,
  WalletCurrencyBreakdown,
  WalletCurrencyCode,
  WalletFxSnapshot,
  Transaction,
  TransactionFilters,
  SendMoneyPayload,
  WithdrawPayload,
  PaymentMethod,
} from "./types";
import { normalizeWalletCurrency } from "./walletCurrencies";

const DEFAULT_SUPPORTED_CURRENCIES: WalletCurrencyCode[] = ["ETB", "USD"];

function mapProviderToMethod(provider?: string | null): PaymentMethod {
  const normalized = (provider ?? "").toUpperCase();
  if (normalized.includes("STRIPE")) return "STRIPE";
  if (normalized.includes("CHAPA")) return "CHAPA";
  return "SABAHUB";
}

function normalizeStatus(status?: string | null): Transaction["status"] {
  const normalized = (status ?? "PENDING").toUpperCase();
  if (normalized === "SUCCESS" || normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "FAILED") return "FAILED";
  if (normalized === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function humanizeLabel(value?: string | null): string {
  if (!value) return "Wallet activity";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveCounterparty(metadata?: Record<string, unknown> | null) {
  if (!metadata) return undefined;
  const name = typeof metadata.counterpartyName === "string" ? metadata.counterpartyName.trim() : "";
  const email = typeof metadata.counterpartyEmail === "string" ? metadata.counterpartyEmail.trim() : "";
  const userId = typeof metadata.counterpartyUserId === "string" ? metadata.counterpartyUserId.trim() : "";
  return name || email || userId || undefined;
}

function resolveTransactionDescription(tx: WalletTransaction): string {
  const note = tx.metadata && typeof tx.metadata.note === "string" ? tx.metadata.note.trim() : "";
  if (note) return note;
  return humanizeLabel(tx.reason);
}

function mapDirectionToType(tx: WalletTransaction): Transaction["type"] {
  const reason = (tx.reason ?? "").toUpperCase();
  const direction = (tx.direction ?? "").toUpperCase();

  if (reason.includes("WITHDRAW")) return "WITHDRAW";
  if (reason.includes("TOPUP") || reason.includes("DEPOSIT")) return "DEPOSIT";
  if (direction === "OUT") return "SEND";
  return "RECEIVE";
}

function mapWalletTransaction(tx: WalletTransaction): Transaction {
  const type = mapDirectionToType(tx);
  const counterparty = resolveCounterparty(tx.metadata);

  return {
    id: tx.id,
    type,
    method: mapProviderToMethod(tx.provider),
    amount: tx.amount ?? 0,
    fee: 0,
    currency: normalizeWalletCurrency(tx.currency),
    status: normalizeStatus(tx.status),
    fromName: type === "RECEIVE" || type === "DEPOSIT" ? counterparty : undefined,
    toName: type === "SEND" ? counterparty : undefined,
    description: resolveTransactionDescription(tx),
    reference: tx.referenceId ?? tx.id,
    createdAt: tx.createdAt ?? new Date().toISOString(),
    metadata: tx.metadata ?? undefined,
  };
}

function mapWithdrawalToTransaction(withdrawal: WalletWithdrawal): Transaction {
  const paymentMethod = withdrawal.paymentMethod ?? "BANK_TRANSFER";
  const amount = withdrawal.amountDecimal ?? toNumber(withdrawal.amount);
  const accountNumber = withdrawal.accountNumber ?? withdrawal.bankDetails?.accountNumber;
  const accountSuffix = accountNumber ? String(accountNumber).slice(-4) : undefined;

  return {
    id: withdrawal.id,
    type: "WITHDRAW",
    method: mapProviderToMethod(paymentMethod),
    amount,
    fee: 0,
    currency: normalizeWalletCurrency(withdrawal.currency),
    status: normalizeStatus(withdrawal.statusEnum ?? withdrawal.status),
    description: withdrawal.notes?.trim() || `${humanizeLabel(paymentMethod)} withdrawal`,
    reference: withdrawal.referenceNumber ?? withdrawal.transactionId ?? withdrawal.id,
    createdAt:
      withdrawal.requestedAt ??
      withdrawal.createdAt ??
      withdrawal.updatedAt ??
      new Date().toISOString(),
    completedAt: withdrawal.completedAt ?? withdrawal.processedAt ?? undefined,
    metadata: {
      paymentMethod,
      bankName: withdrawal.bankName ?? withdrawal.bankDetails?.bankName,
      accountNumberLast4: accountSuffix,
      failureReason: withdrawal.failureReason ?? undefined,
    },
  };
}

function dedupeTransactions(transactions: Transaction[]) {
  const seen = new Map<string, Transaction>();
  for (const transaction of transactions) {
    seen.set(transaction.id, transaction);
  }

  return Array.from(seen.values()).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function normalizeSupportedCurrencies(wallet: WalletSnapshot): WalletCurrencyCode[] {
  const values = Array.isArray(wallet.supportedCurrencies)
    ? wallet.supportedCurrencies.map((entry) => normalizeWalletCurrency(String(entry)))
    : [];

  const unique = Array.from(new Set([...DEFAULT_SUPPORTED_CURRENCIES, ...values]));
  return unique.filter((value): value is WalletCurrencyCode => value === "ETB" || value === "USD");
}

function normalizeConvertedValues(
  values: Record<string, number> | null | undefined,
): Partial<Record<WalletCurrencyCode, number>> {
  return {
    ETB: toNumber(values?.ETB),
    USD: toNumber(values?.USD),
  };
}

function normalizeCurrencyBreakdown(
  payload: ApiWalletCurrencyBreakdown | null | undefined,
  currency: WalletCurrencyCode,
): WalletCurrencyBreakdown {
  return {
    currency,
    balance: toNumber(payload?.balance),
    availableBalance: toNumber(payload?.availableBalance ?? payload?.balance),
    escrowHeld: toNumber(payload?.escrowHeld),
    pendingPayouts: toNumber(payload?.pendingPayouts),
    holds: toNumber(payload?.holds),
    convertedBalance: normalizeConvertedValues(payload?.convertedBalance),
    convertedAvailableBalance: normalizeConvertedValues(payload?.convertedAvailableBalance),
  };
}

function normalizeBalanceMap(
  wallet: WalletSnapshot,
  supportedCurrencies: WalletCurrencyCode[],
): Partial<Record<WalletCurrencyCode, WalletCurrencyBreakdown>> {
  const source = wallet.balancesByCurrency ?? {};
  const primaryCurrency = normalizeWalletCurrency(wallet.currency);

  const balances = {} as Partial<Record<WalletCurrencyCode, WalletCurrencyBreakdown>>;
  for (const currency of supportedCurrencies) {
    const payload = source[currency];
    balances[currency] = normalizeCurrencyBreakdown(
      payload ??
        (currency === primaryCurrency
          ? {
              currency,
              balance: wallet.balance,
              availableBalance: wallet.availableBalance ?? wallet.balance,
              escrowHeld: wallet.escrowHeld,
              pendingPayouts: wallet.pendingPayouts,
              holds: wallet.holds,
            }
          : undefined),
      currency,
    );
  }

  return balances;
}

function normalizeFxSnapshot(
  payload: ApiWalletFxSnapshot | null | undefined,
  supportedCurrencies: WalletCurrencyCode[],
): WalletFxSnapshot {
  return {
    provider: typeof payload?.provider === "string" ? payload.provider : undefined,
    generatedAt: typeof payload?.generatedAt === "string" ? payload.generatedAt : undefined,
    supportedCurrencies,
    rates: payload?.rates ?? {},
  };
}

function buildSelectedWalletBalance(
  balances: Partial<Record<WalletCurrencyCode, WalletCurrencyBreakdown>>,
  selectedCurrency: WalletCurrencyCode,
  supportedCurrencies: WalletCurrencyCode[],
  fx: WalletFxSnapshot | null,
): WalletBalance {
  const activeCurrency = supportedCurrencies.includes(selectedCurrency)
    ? selectedCurrency
    : supportedCurrencies[0] ?? "ETB";
  const activeBalance = balances[activeCurrency] ?? normalizeCurrencyBreakdown(undefined, activeCurrency);

  return {
    available: activeBalance.availableBalance,
    pending: activeBalance.pendingPayouts,
    total: activeBalance.balance,
    holds: activeBalance.holds,
    currency: activeCurrency,
    supportedCurrencies,
    byCurrency: balances,
    fx,
    lastUpdated: new Date().toISOString(),
  };
}

async function fetchWalletState(selectedCurrency: WalletCurrencyCode) {
  const [wallet, withdrawalsPage] = await Promise.all([
    getWallet(),
    getWalletWithdrawals({ page: 0, size: 50 }),
  ]);

  const supportedCurrencies = normalizeSupportedCurrencies(wallet);
  const balances = normalizeBalanceMap(wallet, supportedCurrencies);
  const activeCurrency = supportedCurrencies.includes(selectedCurrency)
    ? selectedCurrency
    : normalizeWalletCurrency(wallet.currency);
  const fx = normalizeFxSnapshot(wallet.fx, supportedCurrencies);

  const walletTransactions = Array.isArray(wallet.transactions)
    ? wallet.transactions.map(mapWalletTransaction)
    : [];
  const withdrawalTransactions = Array.isArray(withdrawalsPage.content)
    ? withdrawalsPage.content.map(mapWithdrawalToTransaction)
    : [];

  return {
    walletUserId: typeof wallet.userId === "string" && wallet.userId.trim() ? wallet.userId.trim() : null,
    selectedCurrency: activeCurrency,
    supportedCurrencies,
    fx,
    balance: buildSelectedWalletBalance(balances, activeCurrency, supportedCurrencies, fx),
    transactions: dedupeTransactions([...walletTransactions, ...withdrawalTransactions]),
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
}

function getCurrencyBalance(balance: WalletBalance | null, currency: WalletCurrencyCode) {
  return balance?.byCurrency[currency] ?? null;
}

export function computeFee(method: PaymentMethod, amount: number): number {
  if (amount < 0) return 0;
  switch (method) {
    case "SABAHUB":
      return 0;
    case "STRIPE":
      return Math.round((amount * 0.029 + 0.3) * 100) / 100;
    case "CHAPA":
      return Math.round(amount * 0.015 * 100) / 100;
    default:
      return 0;
  }
}

export function filterAndSortTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  let result = [...transactions];

  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      (transaction) =>
        transaction.id.toLowerCase().includes(query) ||
        transaction.reference.toLowerCase().includes(query) ||
        transaction.fromName?.toLowerCase().includes(query) ||
        transaction.toName?.toLowerCase().includes(query) ||
        transaction.description?.toLowerCase().includes(query),
    );
  }

  if (filters.type) result = result.filter((transaction) => transaction.type === filters.type);
  if (filters.method) result = result.filter((transaction) => transaction.method === filters.method);
  if (filters.status) result = result.filter((transaction) => transaction.status === filters.status);
  const dateFrom = filters.dateFrom;
  if (dateFrom) result = result.filter((transaction) => transaction.createdAt >= dateFrom);
  const dateTo = filters.dateTo;
  if (dateTo) result = result.filter((transaction) => transaction.createdAt <= dateTo);

  const direction = filters.sortDir === "asc" ? 1 : -1;
  if (filters.sortBy === "amount") {
    result.sort((a, b) => (a.amount - b.amount) * direction);
  } else {
    result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1) * direction);
  }

  return result;
}

interface WalletStore {
  walletUserId: string | null;
  balance: WalletBalance | null;
  transactions: Transaction[];
  selectedCurrency: WalletCurrencyCode;
  supportedCurrencies: WalletCurrencyCode[];
  fx: WalletFxSnapshot | null;
  isLoading: boolean;
  error: string | null;
  confettiTrigger: number;
  setSelectedCurrency: (currency: WalletCurrencyCode) => void;
  fetchBalance: () => Promise<void>;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  sendMoney: (payload: SendMoneyPayload) => Promise<Transaction>;
  withdraw: (payload: WithdrawPayload) => Promise<Transaction>;
  filterAndSort: (filters: TransactionFilters) => Transaction[];
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  walletUserId: null,
  balance: null,
  transactions: [],
  selectedCurrency: "ETB",
  supportedCurrencies: DEFAULT_SUPPORTED_CURRENCIES,
  fx: null,
  isLoading: false,
  error: null,
  confettiTrigger: 0,

  setSelectedCurrency: (currency) => {
    const { balance, supportedCurrencies, fx } = get();
    if (!supportedCurrencies.includes(currency) || !balance) {
      set({ selectedCurrency: currency });
      return;
    }

    set({
      selectedCurrency: currency,
      balance: buildSelectedWalletBalance(balance.byCurrency, currency, supportedCurrencies, fx),
    });
  },

  fetchBalance: async () => {
    const { selectedCurrency } = get();
    set({ isLoading: true, error: null });
    try {
      const walletState = await fetchWalletState(selectedCurrency);
      set({ ...walletState, isLoading: false });
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch wallet balance");
      set({ isLoading: false, error: message });
      toast.error(message);
    }
  },

  fetchTransactions: async () => {
    const { selectedCurrency } = get();
    set({ isLoading: true, error: null });
    try {
      const walletState = await fetchWalletState(selectedCurrency);
      set({ ...walletState, isLoading: false });
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch transactions");
      set({ isLoading: false, error: message });
      toast.error(message);
    }
  },

  sendMoney: async (payload) => {
    const { balance, confettiTrigger } = get();
    if (!balance) throw new Error("Balance not loaded");

    if (payload.method !== "SABAHUB") {
      const message = "Only SabaHub wallet-to-wallet transfers are enabled on the live backend right now.";
      toast.error(message);
      throw new Error(message);
    }

    const transferCurrency = payload.currency ?? balance.currency;
    const activeCurrencyBalance = getCurrencyBalance(balance, transferCurrency);
    if (!activeCurrencyBalance) {
      throw new Error("Selected wallet currency is unavailable");
    }

    const fee = computeFee(payload.method, payload.amount);
    const total = payload.amount + fee;
    if (activeCurrencyBalance.availableBalance < total) {
      const message = "Insufficient balance";
      toast.error(message);
      throw new Error(message);
    }

    set({ isLoading: true, error: null });

    try {
      const result = await internalWalletTransfer(
        {
          recipient: payload.recipient,
          amount: payload.amount,
          currency: transferCurrency,
          note: payload.description,
        },
        `wallet-transfer-${Date.now()}`,
      );

      const transaction: Transaction = {
        id: result.transactionId,
        type: "SEND",
        method: payload.method,
        amount: result.amount,
        fee,
        currency: normalizeWalletCurrency(result.currency),
        status: normalizeStatus(result.status),
        toUserId: result.recipient.id,
        toName: result.recipient.fullName || result.recipient.email,
        description: payload.description || "SabaHub wallet transfer",
        reference: result.transferReference,
        createdAt: new Date().toISOString(),
        metadata: {
          transferReference: result.transferReference,
          recipientEmail: result.recipient.email,
          idempotent: result.idempotent ?? false,
        },
      };

      const walletState = await fetchWalletState(transferCurrency);
      set({
        ...walletState,
        isLoading: false,
        confettiTrigger:
          transaction.status === "COMPLETED" ? confettiTrigger + 1 : confettiTrigger,
      });

      toast.success(
        transaction.status === "PENDING"
          ? "Transfer submitted for review."
          : "Payment sent successfully!",
      );
      return transaction;
    } catch (error) {
      const message = getErrorMessage(error, "Payment failed. Please try again.");
      set({ isLoading: false, error: message });
      toast.error(message);
      throw error;
    }
  },

  withdraw: async (payload) => {
    const { balance } = get();
    if (!balance) throw new Error("Balance not loaded");

    const withdrawalCurrency = payload.currency ?? balance.currency;
    const activeCurrencyBalance = getCurrencyBalance(balance, withdrawalCurrency);
    if (!activeCurrencyBalance) {
      throw new Error("Selected wallet currency is unavailable");
    }

    if (activeCurrencyBalance.availableBalance < payload.amount) {
      const message = "Insufficient balance";
      toast.error(message);
      throw new Error(message);
    }

    set({ isLoading: true, error: null });

    try {
      const result = await withdrawFromWallet({
        amount: payload.amount,
        currency: withdrawalCurrency,
        paymentMethod: payload.method === "BANK" ? "BANK_TRANSFER" : "CARD",
        bankDetails: {
          accountNumber: payload.accountNumber,
          bankName: payload.bankName ?? "Card payout",
          accountName: payload.accountName ?? "Card payout",
          cardExpiry: payload.cardExpiry ?? "",
          cardCvv: payload.cardCvv ?? "",
        },
      });

      const transaction: Transaction = {
        id: result.withdrawalId,
        type: "WITHDRAW",
        method: "SABAHUB",
        amount: payload.amount,
        fee: 0,
        currency: withdrawalCurrency,
        status: normalizeStatus(result.status),
        description: `${payload.method === "BANK" ? "Bank" : "Card"} withdrawal`,
        reference: result.withdrawalId,
        createdAt: new Date().toISOString(),
      };

      const walletState = await fetchWalletState(withdrawalCurrency);
      set({ ...walletState, isLoading: false });

      toast.success("Withdrawal submitted!");
      return transaction;
    } catch (error) {
      const message = getErrorMessage(error, "Withdrawal failed. Please try again.");
      set({ isLoading: false, error: message });
      toast.error(message);
      throw error;
    }
  },

  filterAndSort: (filters) => filterAndSortTransactions(get().transactions, filters),
}));
