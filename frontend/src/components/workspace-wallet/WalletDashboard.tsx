"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpRight,
  Clock,
  QrCode,
  Send,
} from "lucide-react";
import { Area, AreaChart } from "recharts";
import {
  buildAnalyticsChartData,
  computePeriodOverPeriodChange,
} from "@/lib/analyticsStore";
import {
  formatCurrency,
  formatRelativeDate,
  getTransactionCounterparty,
  isIncomingTransaction,
  isOutgoingTransaction,
} from "@/lib/walletMetrics";
import { useWalletStore } from "@/lib/walletStore";

type WalletTab =
  | "dashboard"
  | "send"
  | "receive"
  | "withdraw"
  | "transactions"
  | "analytics";

export function WalletDashboard({
  onNavigate,
}: {
  onNavigate: (tab: WalletTab) => void;
}) {
  const balance = useWalletStore((state) => state.balance);
  const transactions = useWalletStore((state) => state.transactions);
  const currency = balance?.currency ?? "ETB";
  const transactionsInCurrency = useMemo(
    () => transactions.filter((transaction) => transaction.currency === currency),
    [currency, transactions],
  );

  const recentTransactions = useMemo(() => transactionsInCurrency.slice(0, 5), [transactionsInCurrency]);

  const miniChartData = useMemo(
    () =>
      buildAnalyticsChartData(transactionsInCurrency, "7d").map((point) => ({
        label: point.label,
        value: point.balance,
      })),
    [transactionsInCurrency],
  );

  const lastThirtyDays = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return transactionsInCurrency.filter((transaction) => new Date(transaction.createdAt) >= start);
  }, [transactionsInCurrency]);

  const recentIn = useMemo(
    () =>
      lastThirtyDays
        .filter(isIncomingTransaction)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [lastThirtyDays],
  );

  const recentOut = useMemo(
    () =>
      lastThirtyDays
        .filter(isOutgoingTransaction)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [lastThirtyDays],
  );

  const periodChange = useMemo(
    () => computePeriodOverPeriodChange(transactionsInCurrency, "30d"),
    [transactionsInCurrency],
  );

  const netDirectionPositive = periodChange.profit >= 0;
  const netChangeLabel = `${netDirectionPositive ? "+" : ""}${periodChange.profit.toFixed(1)}% vs prior 30 days`;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-8 text-white"
        style={{ background: "linear-gradient(135deg, #14532d 0%, #0f766e 48%, #1d4ed8 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)",
          }}
        />

        <div className="relative z-10">
          <p className="mb-1 text-sm text-white/70">Available Balance</p>
          <motion.div
            key={balance?.available}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="mb-1 text-5xl font-bold"
          >
            {balance ? formatCurrency(balance.available, currency) : "-"}
          </motion.div>
          <p className="text-sm text-white/60">{currency}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-white/60">Pending</p>
              <p className="font-semibold text-white">
                {formatCurrency(balance?.pending ?? 0, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/60">Recent In</p>
              <p className="font-semibold text-green-200">
                {formatCurrency(recentIn, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/60">Recent Out</p>
              <p className="font-semibold text-amber-200">
                {formatCurrency(recentOut, currency)}
              </p>
            </div>
          </div>

          <p
            className={`mt-4 text-sm ${
              netDirectionPositive ? "text-green-200" : "text-amber-200"
            }`}
          >
            {transactionsInCurrency.length > 0 ? netChangeLabel : "No recent wallet activity yet"}
          </p>
        </div>

        <div className="pointer-events-none absolute bottom-0 right-0 opacity-30">
          <AreaChart width={192} height={96} data={miniChartData}>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#fff"
              fill="rgba(255,255,255,0.22)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Send",
            icon: <Send className="h-5 w-5" />,
            tab: "send" as WalletTab,
            color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
          },
          {
            label: "Receive",
            icon: <QrCode className="h-5 w-5" />,
            tab: "receive" as WalletTab,
            color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
          },
          {
            label: "Withdraw",
            icon: <ArrowDownToLine className="h-5 w-5" />,
            tab: "withdraw" as WalletTab,
            color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          },
        ].map((action) => (
          <motion.button
            key={action.tab}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate(action.tab)}
            className="sheet-panel flex flex-col items-center gap-2 p-4 transition-colors hover:border-primary/40"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
              {action.icon}
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="sheet-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Recent Transactions</h3>
          <button
            onClick={() => onNavigate("transactions")}
            className="text-sm text-primary hover:underline"
          >
            View all
          </button>
        </div>

        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No transactions yet
            </p>
          ) : null}

          {recentTransactions.map((transaction) => {
            const incoming = isIncomingTransaction(transaction);

            return (
              <div key={transaction.id} className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                    incoming ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  }`}
                >
                  {incoming ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {getTransactionCounterparty(transaction)}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatRelativeDate(transaction.createdAt)}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      incoming ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {incoming ? "+" : "-"}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      transaction.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : transaction.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
