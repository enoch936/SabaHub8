"use client";

import { create } from 'zustand';
import type { TimeFrame, AnalyticsDataPoint, AnalyticsSummary, Transaction } from './types';

// Internal bucket type used during aggregation (balance computed at the end)
interface TimeBucket {
  label: string
  start: Date
  end: Date
  income: number
  expenses: number
  transactions: number
}

/**
 * Creates time buckets for the given timeframe.
 * - '7d'  → 7 daily buckets
 * - '30d' → 4 weekly buckets
 * - '90d' → 3 monthly buckets
 * - '1y'  → 4 quarterly buckets
 */
export function createTimeBuckets(timeframe: TimeFrame): TimeBucket[] {
  const now = new Date();

  if (timeframe === '7d') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        start,
        end,
        income: 0,
        expenses: 0,
        transactions: 0,
      };
    });
  }

  if (timeframe === '30d') {
    return Array.from({ length: 4 }, (_, i) => {
      const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);
      const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      return {
        label: `Week ${4 - i}`,
        start: weekStart,
        end: weekEnd,
        income: 0,
        expenses: 0,
        transactions: 0,
      };
    }).reverse();
  }

  if (timeframe === '90d') {
    return Array.from({ length: 3 }, (_, i) => {
      const monthDate = new Date(now); monthDate.setMonth(monthDate.getMonth() - (2 - i));
      const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
      return {
        label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        start,
        end,
        income: 0,
        expenses: 0,
        transactions: 0,
      };
    });
  }

  // '1y' → 4 quarterly buckets
  return Array.from({ length: 4 }, (_, i) => {
    const start = new Date(now.getFullYear(), i * 3, 1);
    const end = new Date(now.getFullYear(), i * 3 + 3, 0, 23, 59, 59, 999);
    return {
      label: `Q${i + 1}`,
      start,
      end,
      income: 0,
      expenses: 0,
      transactions: 0,
    };
  });
}

/**
 * Finds the bucket that contains the given ISO timestamp.
 * Returns null if no bucket covers the timestamp.
 */
export function findBucket(buckets: TimeBucket[], createdAt: string): TimeBucket | null {
  const ts = new Date(createdAt);
  return buckets.find((b) => ts >= b.start && ts <= b.end) ?? null;
}

/**
 * Aggregates transactions into time buckets and returns AnalyticsDataPoint[].
 *
 * Req 12.1 – aggregates transaction data into time buckets matching the selected period
 * Req 12.2 – each transaction is assigned to exactly one bucket
 * Req 12.3 – income summed from RECEIVE and DEPOSIT transactions
 * Req 12.4 – expenses summed from SEND and WITHDRAW transactions
 */
export function buildAnalyticsChartData(
  transactions: Transaction[],
  timeframe: TimeFrame,
): AnalyticsDataPoint[] {
  // ASSERT transactions is non-null array
  // ASSERT timeframe ∈ { '7d', '30d', '90d', '1y' }
  const buckets = createTimeBuckets(timeframe);

  // LOOP INVARIANT: each transaction is assigned to exactly one bucket
  for (const tx of transactions) {
    const bucket = findBucket(buckets, tx.createdAt);
    if (!bucket) continue;
    if (tx.type === 'RECEIVE' || tx.type === 'DEPOSIT') bucket.income += tx.amount;
    else if (tx.type === 'SEND' || tx.type === 'WITHDRAW') bucket.expenses += tx.amount;
    bucket.transactions += 1;
  }

  // ASSERT buckets.length matches expected period count for timeframe
  return buckets.map((b) => ({
    label: b.label,
    income: b.income,
    expenses: b.expenses,
    balance: b.income - b.expenses,
    transactions: b.transactions,
  }));
}

// Keep legacy alias for backward compatibility
const buildChartData = buildAnalyticsChartData;

/**
 * Computes the period-over-period percentage change for income, expenses, and profit.
 *
 * Req 12.6 – calculates percentage change for income, expenses, and profit between
 *            the current period and the previous equivalent period.
 *
 * Division-by-zero rules:
 *   - previous = 0 and current > 0  → 100 (%)
 *   - previous = 0 and current = 0  → 0 (%)
 *   - otherwise                     → ((current - previous) / previous) * 100
 */
export function computePeriodOverPeriodChange(
  transactions: Transaction[],
  timeframe: TimeFrame,
): { income: number; expenses: number; profit: number } {
  const periodDays: Record<TimeFrame, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };

  const days = periodDays[timeframe];
  const now = new Date();

  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);
  currentStart.setHours(0, 0, 0, 0);

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - days);
  previousStart.setHours(0, 0, 0, 0);

  const previousEnd = new Date(currentStart);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);

  let currentIncome = 0;
  let currentExpenses = 0;
  let previousIncome = 0;
  let previousExpenses = 0;

  for (const tx of transactions) {
    const ts = new Date(tx.createdAt);
    const isIncome = tx.type === 'RECEIVE' || tx.type === 'DEPOSIT';
    const isExpense = tx.type === 'SEND' || tx.type === 'WITHDRAW';

    if (ts >= currentStart && ts <= now) {
      if (isIncome) currentIncome += tx.amount;
      else if (isExpense) currentExpenses += tx.amount;
    } else if (ts >= previousStart && ts <= previousEnd) {
      if (isIncome) previousIncome += tx.amount;
      else if (isExpense) previousExpenses += tx.amount;
    }
  }

  const pctChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const currentProfit = currentIncome - currentExpenses;
  const previousProfit = previousIncome - previousExpenses;

  return {
    income: pctChange(currentIncome, previousIncome),
    expenses: pctChange(currentExpenses, previousExpenses),
    profit: pctChange(currentProfit, previousProfit),
  };
}

/**
 * Computes success rate: percentage of COMPLETED transactions out of all non-CANCELLED ones.
 * Req 8.3.5
 */
export function computeSuccessRate(transactions: Transaction[]): number {
  const eligible = transactions.filter((t) => t.status !== 'CANCELLED');
  if (!eligible.length) return 0;
  const completed = eligible.filter((t) => t.status === 'COMPLETED').length;
  return Math.round((completed / eligible.length) * 100);
}

function computeSummary(data: AnalyticsDataPoint[], transactions?: Transaction[], timeframe?: TimeFrame): AnalyticsSummary {
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
  const netProfit = totalIncome - totalExpenses;
  const totalTransactions = data.reduce((s, d) => s + d.transactions, 0);
  const avgTransactionValue = totalTransactions > 0 ? (totalIncome + totalExpenses) / totalTransactions : 0;
  const hiringSuccessRate = transactions ? computeSuccessRate(transactions) : undefined;

  const periodChange =
    transactions && timeframe
      ? computePeriodOverPeriodChange(transactions, timeframe)
      : { income: 0, expenses: 0, profit: 0 };

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    totalTransactions,
    avgTransactionValue,
    hiringSuccessRate,
    periodChange,
  };
}

interface AnalyticsStore {
  timeframe: TimeFrame;
  data: AnalyticsDataPoint[];
  summary: AnalyticsSummary | null;
  isLoading: boolean;
  error: string | null;
  setTimeframe: (tf: TimeFrame) => void;
  fetchAnalytics: (transactions: Transaction[], timeframe?: TimeFrame) => Promise<void>;
  buildChartData: (transactions: Transaction[], timeframe: TimeFrame) => AnalyticsDataPoint[];
  buildAnalyticsChartData: (transactions: Transaction[], timeframe: TimeFrame) => AnalyticsDataPoint[];
  computeSummary: () => void;
}

function createEmptyData(timeframe: TimeFrame): AnalyticsDataPoint[] {
  return buildChartData([], timeframe);
}

const DEFAULT_TIMEFRAME: TimeFrame = '30d';
const DEFAULT_DATA = createEmptyData(DEFAULT_TIMEFRAME);

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  timeframe: DEFAULT_TIMEFRAME,
  data: DEFAULT_DATA,
  summary: computeSummary(DEFAULT_DATA, [], DEFAULT_TIMEFRAME),
  isLoading: false,
  error: null,

  setTimeframe: (tf) => {
    const data = createEmptyData(tf);
    set({ timeframe: tf, data, summary: computeSummary(data, [], tf) });
  },

  fetchAnalytics: async (transactions, timeframe) => {
    set({ isLoading: true, error: null });
    try {
      const tf = timeframe ?? get().timeframe;
      const data = buildChartData(transactions, tf);
      const summary = computeSummary(data, transactions, tf);
      set({ data, summary, timeframe: tf, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to build analytics', isLoading: false });
    }
  },

  buildChartData,
  buildAnalyticsChartData,

  computeSummary: () => {
    const { data } = get();
    set({ summary: computeSummary(data) });
  },
}));
