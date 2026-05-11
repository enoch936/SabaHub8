"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getWalletForecast, type WalletForecastPoint } from "@/lib/api";
import {
  buildAnalyticsChartData,
  computePeriodOverPeriodChange,
  computeSuccessRate,
} from "@/lib/analyticsStore";
import type { TimeFrame } from "@/lib/types";
import {
  buildHourlyTransactionData,
  buildMethodBreakdown,
  buildStatusBreakdown,
  formatCurrency,
} from "@/lib/walletMetrics";
import { useWalletStore } from "@/lib/walletStore";

const RANGE_BY_TIMEFRAME: Record<TimeFrame, "7D" | "30D" | "90D" | "1Y"> = {
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
  "1y": "1Y",
};

export function Analytics() {
  const balance = useWalletStore((state) => state.balance);
  const transactions = useWalletStore((state) => state.transactions);
  const fetchTransactions = useWalletStore((state) => state.fetchTransactions);

  const [timeframe, setTimeframe] = useState<TimeFrame>("30d");
  const [forecast, setForecast] = useState<WalletForecastPoint[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const currency = balance?.currency ?? "ETB";
  const transactionsInCurrency = useMemo(
    () => transactions.filter((transaction) => transaction.currency === currency),
    [currency, transactions],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadForecast() {
      setForecastLoading(true);
      setForecastError(null);
      try {
        const response = await getWalletForecast({
          range: RANGE_BY_TIMEFRAME[timeframe],
          currency,
          baselineCumulative: balance?.available ?? 0,
        });
        if (!cancelled) {
          setForecast(response.points);
        }
      } catch (error) {
        if (!cancelled) {
          setForecast([]);
          setForecastError(
            error instanceof Error && error.message ? error.message : "Unable to load forecast.",
          );
        }
      } finally {
        if (!cancelled) {
          setForecastLoading(false);
        }
      }
    }

    void loadForecast();
    return () => {
      cancelled = true;
    };
  }, [balance?.available, currency, timeframe]);

  const chartData = useMemo(() => buildAnalyticsChartData(transactionsInCurrency, timeframe), [timeframe, transactionsInCurrency]);
  const periodChange = useMemo(
    () => computePeriodOverPeriodChange(transactionsInCurrency, timeframe),
    [timeframe, transactionsInCurrency],
  );
  const methodBreakdown = useMemo(() => buildMethodBreakdown(transactionsInCurrency), [transactionsInCurrency]);
  const statusBreakdown = useMemo(() => buildStatusBreakdown(transactionsInCurrency), [transactionsInCurrency]);
  const hourlyActivity = useMemo(() => buildHourlyTransactionData(transactionsInCurrency), [transactionsInCurrency]);

  const totals = useMemo(() => {
    const income = chartData.reduce((sum, point) => sum + point.income, 0);
    const expenses = chartData.reduce((sum, point) => sum + point.expenses, 0);
    const totalTransactions = transactionsInCurrency.length;
    const avgTransactionValue =
      totalTransactions > 0
        ? transactionsInCurrency.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / totalTransactions
        : 0;
    return {
      income,
      expenses,
      net: income - expenses,
      totalTransactions,
      avgTransactionValue,
      successRate: computeSuccessRate(transactionsInCurrency),
    };
  }, [chartData, transactionsInCurrency]);

  const refresh = async () => {
    await fetchTransactions();
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-2">Wallet Analytics</h1>
          <p className="text-muted-foreground">
            Live transaction analytics, payment rail mix, success health, and backend-generated balance forecast.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {(["7d", "30d", "90d", "1y"] as TimeFrame[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTimeframe(option)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  timeframe === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Income",
            value: formatCurrency(totals.income, currency),
            change: `${periodChange.income >= 0 ? "+" : ""}${periodChange.income.toFixed(1)}%`,
            icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
          },
          {
            label: "Expenses",
            value: formatCurrency(totals.expenses, currency),
            change: `${periodChange.expenses >= 0 ? "+" : ""}${periodChange.expenses.toFixed(1)}%`,
            icon: <TrendingDown className="h-5 w-5 text-amber-600" />,
          },
          {
            label: "Net",
            value: formatCurrency(totals.net, currency),
            change: `${periodChange.profit >= 0 ? "+" : ""}${periodChange.profit.toFixed(1)}%`,
            icon: <DollarSign className="h-5 w-5 text-blue-600" />,
          },
          {
            label: "Transactions",
            value: totals.totalTransactions.toString(),
            change: `${totals.successRate}% success`,
            icon: <ArrowUpRight className="h-5 w-5 text-slate-700" />,
          },
          {
            label: "Average Size",
            value: formatCurrency(totals.avgTransactionValue, currency),
            change: balance ? `${formatCurrency(balance.available, currency)} available` : "Balance syncing",
            icon: <ArrowDownLeft className="h-5 w-5 text-violet-600" />,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <div className="rounded-lg bg-muted p-2">{card.icon}</div>
            </div>
            <div className="text-2xl font-semibold">{card.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{card.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">Income Vs Expenses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Bar dataKey="income" fill="#16a34a" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Wallet Forecast</h3>
            {forecastLoading ? <span className="text-sm text-muted-foreground">Loading…</span> : null}
          </div>
          {forecastError ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{forecastError}</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={forecast.map((point) => ({
                  label: point.label,
                  projectedNet: point.projectedNet,
                  projectedCumulative: point.projectedCumulative,
                }))}
              >
                <defs>
                  <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="projectedCumulative"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#forecastFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">By Payment Rail</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={methodBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={82}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {methodBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {statusBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">24h Activity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} interval={3} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="transactions" stroke="#14b8a6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
