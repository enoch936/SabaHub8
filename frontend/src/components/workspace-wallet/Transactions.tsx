"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Download, Search } from "lucide-react";
import type { TransactionFilters, TransactionStatus, TransactionType } from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  getTransactionCounterparty,
  getTransactionMethodLabel,
  isIncomingTransaction,
  isOutgoingTransaction,
} from "@/lib/walletMetrics";
import { filterAndSortTransactions, useWalletStore } from "@/lib/walletStore";

function downloadTransactionsCsv(rows: ReturnType<typeof filterAndSortTransactions>) {
  const header = [
    "Transaction ID",
    "Reference",
    "Type",
    "Counterparty",
    "Method",
    "Amount",
    "Currency",
    "Status",
    "Created Date",
    "Description",
  ];

  const lines = rows.map((transaction) =>
    [
      transaction.id,
      transaction.reference,
      transaction.type,
      getTransactionCounterparty(transaction),
      getTransactionMethodLabel(transaction),
      transaction.amount.toFixed(2),
      transaction.currency,
      transaction.status,
      transaction.createdAt,
      transaction.description ?? "",
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(","),
  );

  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wallet-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function Transactions() {
  const transactions = useWalletStore((state) => state.transactions);
  const balance = useWalletStore((state) => state.balance);
  const currency = balance?.currency ?? "ETB";
  const transactionsInCurrency = useMemo(
    () => transactions.filter((transaction) => transaction.currency === currency),
    [currency, transactions],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [filterMethod, setFilterMethod] = useState<"all" | "SABAHUB" | "STRIPE" | "CHAPA">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | TransactionStatus>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">(
    "date-desc",
  );

  const filters = useMemo<TransactionFilters>(
    () => ({
      search: searchTerm || undefined,
      type: filterType === "all" ? undefined : filterType,
      method: filterMethod === "all" ? undefined : filterMethod,
      status: filterStatus === "all" ? undefined : filterStatus,
      sortBy: sortBy.includes("amount") ? "amount" : "date",
      sortDir: sortBy.endsWith("asc") ? "asc" : "desc",
    }),
    [filterMethod, filterStatus, filterType, searchTerm, sortBy],
  );

  const filteredTransactions = useMemo(
    () => filterAndSortTransactions(transactionsInCurrency, filters),
    [transactionsInCurrency, filters],
  );

  const totalReceived = useMemo(
    () =>
      transactionsInCurrency
        .filter((transaction) => isIncomingTransaction(transaction) && transaction.status === "COMPLETED")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactionsInCurrency],
  );

  const totalSent = useMemo(
    () =>
      transactionsInCurrency
        .filter((transaction) => isOutgoingTransaction(transaction) && transaction.status === "COMPLETED")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactionsInCurrency],
  );

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-2">Transactions</h1>
          <p className="text-muted-foreground">
            Review the live {currency} transaction history returned by your wallet backend
          </p>
        </div>
        <button
          onClick={() => downloadTransactionsCsv(filteredTransactions)}
          disabled={filteredTransactions.length === 0}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-2 text-sm text-muted-foreground">Completed In</div>
          <div className="text-2xl font-semibold text-green-600">
            {formatCurrency(totalReceived, currency)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-2 text-sm text-muted-foreground">Completed Out</div>
          <div className="text-2xl font-semibold text-red-600">
            {formatCurrency(totalSent, currency)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-2 text-sm text-muted-foreground">Available Balance</div>
          <div className="text-2xl font-semibold">
            {formatCurrency(balance?.available ?? 0, currency)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by ID, reference, counterparty, or note"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value as typeof filterType)}
            className="rounded-lg border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="RECEIVE">Receive</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="SEND">Send</option>
            <option value="WITHDRAW">Withdraw</option>
          </select>

          <select
            value={filterMethod}
            onChange={(event) => setFilterMethod(event.target.value as typeof filterMethod)}
            className="rounded-lg border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Methods</option>
            <option value="SABAHUB">SabaHub</option>
            <option value="STRIPE">Stripe</option>
            <option value="CHAPA">Chapa</option>
          </select>

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as typeof filterStatus)}
            className="rounded-lg border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            className="rounded-lg border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="amount-asc">Amount (Low to High)</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="p-4 text-left font-medium">Transaction</th>
                <th className="p-4 text-left font-medium">Type</th>
                <th className="p-4 text-left font-medium">Counterparty</th>
                <th className="p-4 text-left font-medium">Method</th>
                <th className="p-4 text-left font-medium">Amount</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Date &amp; Time</th>
                <th className="p-4 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const incoming = isIncomingTransaction(transaction);
                const timestamp = formatDateTime(transaction.createdAt);

                return (
                  <tr
                    key={transaction.id}
                    className="border-b border-border transition-colors hover:bg-accent"
                  >
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-mono text-sm">{transaction.id}</div>
                        <div className="text-xs text-muted-foreground">
                          Ref: {transaction.reference}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            incoming ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {incoming ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <span className="text-sm">
                          {incoming ? "Incoming" : "Outgoing"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{getTransactionCounterparty(transaction)}</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-sm">
                        {getTransactionMethodLabel(transaction)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-semibold ${
                          incoming ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {incoming ? "+" : "-"}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${
                          transaction.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : transaction.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : transaction.status === "FAILED"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{timestamp.date}</div>
                        <div className="text-muted-foreground">{timestamp.time}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {transaction.description ?? "No description"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No transactions found matching your filters
          </div>
        ) : null}
      </div>
    </div>
  );
}
