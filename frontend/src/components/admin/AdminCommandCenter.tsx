"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Skeleton,
  Stack,
  Switch,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import NoSsrResponsiveContainer from "@/components/charts/NoSsrResponsiveContainer";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import {
  type AdminCommandCenterFeatureFlag,
  type AdminCommandCenterOverviewResponse,
  type AppUser,
  type Job,
  type PendingLocalTopup,
  type Proposal,
  adminAnalyticsDaily,
  adminAnalyticsSummary,
  adminCommandCenterOverview,
  adminCommandCenterUpdateFeatureFlag,
  adminListJobs,
  adminListProposals,
  adminListUsers,
  listPendingLocalTopups,
} from "@/lib/api";

const chartPalette = [
  "#0b5bd1",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

const statusTone: Record<string, { color: string; border: string; bg: string; score: number }> = {
  operational: { color: "#166534", border: "rgba(34,197,94,0.32)", bg: "rgba(240,253,244,0.92)", score: 96 },
  success: { color: "#166534", border: "rgba(34,197,94,0.32)", bg: "rgba(240,253,244,0.92)", score: 96 },
  info: { color: "#1d4ed8", border: "rgba(59,130,246,0.28)", bg: "rgba(239,246,255,0.92)", score: 78 },
  attention: { color: "#92400e", border: "rgba(245,158,11,0.32)", bg: "rgba(255,251,235,0.94)", score: 68 },
  warning: { color: "#92400e", border: "rgba(245,158,11,0.32)", bg: "rgba(255,251,235,0.94)", score: 68 },
  degraded: { color: "#991b1b", border: "rgba(239,68,68,0.3)", bg: "rgba(254,242,242,0.94)", score: 38 },
  critical: { color: "#991b1b", border: "rgba(239,68,68,0.3)", bg: "rgba(254,242,242,0.94)", score: 38 },
};

const adminSourceCatalog = [
  { key: "command center", title: "Overview", helper: "Domains, alerts, and flags" },
  { key: "summary analytics", title: "Summary Analytics", helper: "Users, jobs, revenue, disputes" },
  { key: "daily analytics", title: "Daily Trends", helper: "30-day creation and revenue signals" },
  { key: "users", title: "Users Feed", helper: "Identity, verification, last-seen state" },
  { key: "jobs", title: "Jobs Feed", helper: "Supply, budgets, recent listings" },
  { key: "proposals", title: "Proposals Feed", helper: "Marketplace pipeline conversion" },
  { key: "manual top-up queue", title: "Payments Queue", helper: "Manual deposit review backlog" },
] as const;

const heroSignalColor: Record<string, string> = {
  success: "#4ade80",
  info: "#7dd3fc",
  primary: "#7dd3fc",
  warning: "#fdba74",
  danger: "#fda4af",
  critical: "#fda4af",
  neutral: "#cbd5e1",
};

const paperCardSx = {
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
  transition: "box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
    borderColor: "rgba(148,163,184,0.6)",
  },
} as const;

type AnalyticsSummary = Awaited<ReturnType<typeof adminAnalyticsSummary>>;
type AnalyticsDaily = Awaited<ReturnType<typeof adminAnalyticsDaily>>;

type AdminDashboardState = {
  overview: AdminCommandCenterOverviewResponse | null;
  summary: AnalyticsSummary | null;
  daily: AnalyticsDaily | null;
  users: AppUser[];
  jobs: Job[];
  proposals: Proposal[];
  pendingTopups: PendingLocalTopup[];
  totalPendingTopups: number;
  failedSources: string[];
};

type MetricCard = {
  label: string;
  value: string;
  helper: string;
  gradient: string;
};

type HeroSignal = {
  label: string;
  value: string;
  trend: string;
  tone: string;
};

type DrilldownStat = {
  label: string;
  value: string;
  tone?: keyof typeof statusTone | "neutral";
};

type DrilldownItem = {
  title: string;
  helper: string;
  badge: string;
  tone?: keyof typeof statusTone | "neutral";
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return "No timestamp";
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Date(timestamp).toLocaleString();
}

function formatShortDay(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(value?: string | null) {
  if (!value) {
    return "No timestamp";
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  if (Math.abs(diffMinutes) < 60) {
    return `${Math.max(0, diffMinutes)}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 48) {
    return `${Math.max(0, diffHours)}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return `${Math.max(0, diffDays)}d ago`;
  }

  const diffMonths = Math.round(diffDays / 30);
  return `${Math.max(0, diffMonths)}mo ago`;
}

function normalizeRole(roles: string[] | undefined) {
  const normalized = (roles ?? []).map((role) => role.replace(/^ROLE_/, "").toUpperCase());
  if (normalized.includes("ADMIN") || normalized.includes("SUPER_ADMIN")) {
    return "Admin";
  }
  if (normalized.includes("EMPLOYER")) {
    return "Employer";
  }
  if (normalized.includes("FREELANCER")) {
    return "Freelancer";
  }
  return "Other";
}

function normalizeBucket(value: string | undefined, fallback: string) {
  if (!value || !value.trim()) {
    return fallback;
  }

  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function groupCounts<T>(items: T[], readKey: (item: T) => string) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = readKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value);
}

function sumPendingTopupAmount(items: PendingLocalTopup[]) {
  return items.reduce((total, item) => total + (typeof item.amount === "number" ? item.amount : 0), 0);
}

function sortByCreatedAtDesc<T extends { createdAt?: string | null }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
    const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
    return rightTime - leftTime;
  });
}

function percentOf(part: number, whole: number) {
  if (whole <= 0) {
    return 0;
  }

  return Math.round((part / whole) * 100);
}

function growthDelta(series: number[]) {
  if (series.length < 2) {
    return 0;
  }

  const baseline = series.slice(0, Math.max(1, Math.floor(series.length / 2))).reduce((sum, value) => sum + value, 0);
  const current = series.slice(Math.max(1, Math.floor(series.length / 2))).reduce((sum, value) => sum + value, 0);
  if (baseline === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - baseline) / baseline) * 100);
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value}%`;
}

function formatUserLabel(user: AppUser) {
  if (user.fullName?.trim()) {
    return user.fullName;
  }
  if (user.username?.trim()) {
    return user.username;
  }
  return user.email;
}

function formatJobBudget(job: Job) {
  const currency = job.currency || "USD";
  const min = typeof job.budgetMin === "number" ? job.budgetMin : 0;
  const max = typeof job.budgetMax === "number" ? job.budgetMax : 0;
  if (min <= 0 && max <= 0) {
    return `${currency} budget pending`;
  }
  return `${currency} ${formatCompactNumber(min)} - ${formatCompactNumber(max)}`;
}

function escapeCsvValue(value: unknown) {
  const normalized = value == null ? "" : String(value);
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }
  return normalized;
}

function toCsv(columns: string[], rows: Array<Record<string, unknown>>) {
  const header = columns.map((column) => escapeCsvValue(column)).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCsvValue(row[column])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function downloadFile(filename: string, content: string, mimeType: string) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function EmptyVisualization({
  title,
  detail,
  height,
}: {
  title: string;
  detail: string;
  height: number;
}) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{
        height,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "rgba(248,250,252,0.72)",
        px: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="subtitle2" fontWeight={800}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        {detail}
      </Typography>
    </Stack>
  );
}

function DrilldownPanel({
  title,
  subtitle,
  icon,
  href,
  ctaLabel,
  accent,
  stats,
  items,
  emptyTitle,
  emptyDetail,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  href: string;
  ctaLabel: string;
  accent: string;
  stats: DrilldownStat[];
  items: DrilldownItem[];
  emptyTitle: string;
  emptyDetail: string;
}) {
  return (
    <SoftCard sx={{ ...paperCardSx, height: "100%" }}>
      <CardContent sx={{ height: "100%" }}>
        <Stack spacing={1.2} sx={{ height: "100%" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ sm: "flex-start" }}
            gap={1}
          >
            <Stack direction="row" spacing={1.1} alignItems="flex-start">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: accent,
                  background: `${accent}14`,
                  border: "1px solid",
                  borderColor: `${accent}55`,
                  flexShrink: 0,
                }}
              >
                {icon}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              </Box>
            </Stack>
            <SoftButton component={Link} href={href} variant="text" size="small" endIcon={<ArrowForwardRoundedIcon />} sx={{ px: 0 }}>
              {ctaLabel}
            </SoftButton>
          </Stack>

          <Grid container spacing={1}>
            {stats.map((stat) => {
              const tone = stat.tone && stat.tone !== "neutral" ? statusTone[stat.tone] : null;
              return (
                <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: tone?.border ?? "divider",
                      bgcolor: tone?.bg ?? "rgba(248,250,252,0.9)",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} sx={{ color: tone?.color ?? "text.primary" }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          <Stack spacing={0.9} sx={{ flex: 1 }}>
            {items.length > 0 ? (
              items.map((item, index) => {
                const tone = item.tone && item.tone !== "neutral" ? statusTone[item.tone] : null;
                return (
                  <Box
                    key={`${item.title}-${item.badge}-${index}`}
                    sx={{
                      p: 1.05,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: tone?.border ?? "divider",
                      bgcolor: tone?.bg ?? "background.paper",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.helper}
                        </Typography>
                      </Box>
                      <Chip
                        label={item.badge}
                        size="small"
                        variant="outlined"
                        sx={{
                          color: tone?.color ?? "text.secondary",
                          borderColor: tone?.border ?? "divider",
                          bgcolor: tone ? "rgba(255,255,255,0.5)" : undefined,
                        }}
                      />
                    </Stack>
                  </Box>
                );
              })
            ) : (
              <EmptyVisualization title={emptyTitle} detail={emptyDetail} height={220} />
            )}
          </Stack>
        </Stack>
      </CardContent>
    </SoftCard>
  );
}

export default function AdminCommandCenter() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));
  const chartTickFont = isSmallScreen ? 10 : 12;
  const pieInnerRadius = isSmallScreen ? 44 : 62;
  const pieOuterRadius = isSmallScreen ? 76 : 102;
  const radarOuterRadius = isSmallScreen ? 72 : 94;

  const [state, setState] = useState<AdminDashboardState>({
    overview: null,
    summary: null,
    daily: null,
    users: [],
    jobs: [],
    proposals: [],
    pendingTopups: [],
    totalPendingTopups: 0,
    failedSources: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [updatingFlag, setUpdatingFlag] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      adminCommandCenterOverview(),
      adminAnalyticsSummary(),
      adminAnalyticsDaily(),
      adminListUsers(),
      adminListJobs(),
      adminListProposals(),
      listPendingLocalTopups({ page: 0, size: 8 }),
    ]);

    const failedSources: string[] = [];

    const overview =
      results[0].status === "fulfilled"
        ? results[0].value
        : (failedSources.push("command center"), null);
    const summary =
      results[1].status === "fulfilled"
        ? results[1].value
        : (failedSources.push("summary analytics"), null);
    const daily =
      results[2].status === "fulfilled"
        ? results[2].value
        : (failedSources.push("daily analytics"), null);
    const users =
      results[3].status === "fulfilled" && Array.isArray(results[3].value)
        ? results[3].value
        : (failedSources.push("users"), []);
    const jobs =
      results[4].status === "fulfilled" && Array.isArray(results[4].value)
        ? results[4].value
        : (failedSources.push("jobs"), []);
    const proposals =
      results[5].status === "fulfilled" && Array.isArray(results[5].value)
        ? results[5].value
        : (failedSources.push("proposals"), []);
    const pendingTopupsPayload =
      results[6].status === "fulfilled" && results[6].value && typeof results[6].value === "object"
        ? results[6].value
        : (failedSources.push("manual top-up queue"), null);

    setState({
      overview,
      summary,
      daily,
      users,
      jobs,
      proposals,
      pendingTopups: Array.isArray(pendingTopupsPayload?.content) ? pendingTopupsPayload.content : [],
      totalPendingTopups:
        typeof pendingTopupsPayload?.totalElements === "number"
          ? pendingTopupsPayload.totalElements
          : Array.isArray(pendingTopupsPayload?.content)
            ? pendingTopupsPayload.content.length
            : 0,
      failedSources,
    });

    if (
      overview == null &&
      summary == null &&
      daily == null &&
      users.length === 0 &&
      jobs.length === 0 &&
      proposals.length === 0 &&
      pendingTopupsPayload == null
    ) {
      setError("Unable to load admin control data.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const featureFlags = useMemo(() => state.overview?.featureFlags ?? [], [state.overview]);
  const enabledFlags = useMemo(() => featureFlags.filter((flag) => flag.enabled).length, [featureFlags]);
  const generatedAtLabel = formatDateLabel(state.overview?.generatedAt);
  const feedHealth = useMemo(
    () =>
      adminSourceCatalog.map((source) => ({
        ...source,
        ok: !state.failedSources.includes(source.key),
      })),
    [state.failedSources],
  );
  const liveFeedCount = feedHealth.filter((source) => source.ok).length;

  const roleMix = useMemo(
    () => groupCounts(state.users, (user) => normalizeRole(user.roles)).filter((entry) => entry.value > 0),
    [state.users],
  );

  const jobStatusData = useMemo(
    () => groupCounts(state.jobs, (job) => normalizeBucket(job.status, "Unknown")).filter((entry) => entry.value > 0),
    [state.jobs],
  );

  const proposalStatusData = useMemo(
    () => groupCounts(state.proposals, (proposal) => normalizeBucket(proposal.status, "Unknown")).filter((entry) => entry.value > 0),
    [state.proposals],
  );

  const dailySeries = useMemo(
    () =>
      (state.daily?.dates ?? []).map((date, index) => ({
        label: formatShortDay(date),
        date,
        users: state.daily?.users[index] ?? 0,
        jobs: state.daily?.jobs[index] ?? 0,
        revenue: Number(state.daily?.revenue[index] ?? 0),
      })),
    [state.daily],
  );

  const usersCreatedTrend = dailySeries.map((item) => item.users);
  const jobsCreatedTrend = dailySeries.map((item) => item.jobs);
  const revenueTrend = dailySeries.map((item) => item.revenue);

  const openJobs = state.jobs.filter((job) => (job.status ?? "").toUpperCase() === "OPEN").length;
  const suspendedUsers = state.users.filter((user) => user.suspended).length;
  const verifiedUsers = state.users.filter((user) => user.documentsVerified).length;
  const activeRecently = state.users.filter((user) => {
    if (!user.lastSeenAt) {
      return false;
    }
    const seen = Date.parse(user.lastSeenAt);
    return !Number.isNaN(seen) && Date.now() - seen <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const reviewedProposals = state.proposals.filter((proposal) =>
    ["ACCEPTED", "SHORTLISTED", "REJECTED"].includes((proposal.status ?? "").toUpperCase()),
  ).length;
  const criticalAlerts = (state.overview?.alerts ?? []).filter((alert) => alert.level === "critical").length;
  const pendingTopupAmount = sumPendingTopupAmount(state.pendingTopups);

  const metricCards = useMemo<MetricCard[]>(() => {
    const summaryUsers = state.summary?.users ?? state.users.length;
    const summaryJobs = state.summary?.jobs ?? state.jobs.length;
    const summaryRevenue = state.summary?.revenue ?? revenueTrend.reduce((sum, value) => sum + value, 0);
    const summaryDisputes = state.summary?.disputesOpen ?? 0;
    const operationalDomains = (state.overview?.domains ?? []).filter((domain) => domain.status === "operational").length;

    return [
      {
        label: "Identity Footprint",
        value: formatCompactNumber(summaryUsers),
        helper: `${verifiedUsers} verified • ${suspendedUsers} suspended`,
        gradient: "linear-gradient(135deg, #0b5bd1 0%, #38bdf8 100%)",
      },
      {
        label: "Marketplace Supply",
        value: formatCompactNumber(summaryJobs),
        helper: `${openJobs} open briefs • ${growthDelta(jobsCreatedTrend)}% velocity`,
        gradient: "linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)",
      },
      {
        label: "Gross Revenue",
        value: formatCurrency(summaryRevenue),
        helper: `${formatCurrency(revenueTrend.slice(-7).reduce((sum, value) => sum + value, 0))} in last 7 days`,
        gradient: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
      },
      {
        label: "Dispute Pressure",
        value: formatCompactNumber(summaryDisputes),
        helper: `${criticalAlerts} critical alerts in governance board`,
        gradient: "linear-gradient(135deg, #991b1b 0%, #ef4444 100%)",
      },
      {
        label: "Manual Review Queue",
        value: formatCompactNumber(state.totalPendingTopups),
        helper: `${formatCurrency(pendingTopupAmount)} pending top-up value`,
        gradient: "linear-gradient(135deg, #4338ca 0%, #8b5cf6 100%)",
      },
      {
        label: "Governance Flags",
        value: `${enabledFlags}/${featureFlags.length || 0}`,
        helper: `${operationalDomains} of ${(state.overview?.domains ?? []).length} domains operational`,
        gradient: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
      },
    ];
  }, [
    enabledFlags,
    featureFlags.length,
    jobsCreatedTrend,
    openJobs,
    pendingTopupAmount,
    revenueTrend,
    state.jobs.length,
    state.overview,
    state.summary,
    state.totalPendingTopups,
    state.users.length,
    suspendedUsers,
    verifiedUsers,
    criticalAlerts,
  ]);

  const heroSignals = useMemo<HeroSignal[]>(() => {
    const overviewSignals = (state.overview?.metrics ?? []).slice(0, 4).map((metric) => ({
      label: metric.label,
      value: metric.value,
      trend: metric.trend || "Live admin metric",
      tone: metric.tone || "info",
    }));

    if (overviewSignals.length > 0) {
      return overviewSignals;
    }

    return metricCards.slice(0, 4).map((metric) => ({
      label: metric.label,
      value: metric.value,
      trend: metric.helper,
      tone: "info",
    }));
  }, [metricCards, state.overview]);

  const trustPosture = useMemo(
    () => [
      { subject: "Verified", value: percentOf(verifiedUsers, Math.max(1, state.users.length)) },
      { subject: "Active 7d", value: percentOf(activeRecently, Math.max(1, state.users.length)) },
      { subject: "Safe Accounts", value: percentOf(state.users.length - suspendedUsers, Math.max(1, state.users.length)) },
      { subject: "Open Jobs", value: percentOf(openJobs, Math.max(1, state.jobs.length)) },
      { subject: "Reviewed Proposals", value: percentOf(reviewedProposals, Math.max(1, state.proposals.length)) },
    ],
    [activeRecently, openJobs, reviewedProposals, state.jobs.length, state.proposals.length, state.users.length, suspendedUsers, verifiedUsers],
  );

  const domainReadiness = useMemo(
    () =>
      (state.overview?.domains ?? []).map((domain) => {
        const tone = statusTone[domain.status] ?? statusTone.attention;
        return {
          name: domain.title,
          status: normalizeBucket(domain.status, "Attention"),
          responsibilities: domain.responsibilitiesCount,
          route: domain.route,
          score: tone.score,
          color: tone.color,
          border: tone.border,
          bg: tone.bg,
        };
      }),
    [state.overview],
  );

  const queueData = useMemo(
    () => [
      { label: "Manual topups", value: state.totalPendingTopups, color: "#8b5cf6" },
      { label: "Open disputes", value: state.summary?.disputesOpen ?? 0, color: "#ef4444" },
      { label: "Critical alerts", value: criticalAlerts, color: "#f59e0b" },
      { label: "Suspended users", value: suspendedUsers, color: "#0ea5e9" },
    ],
    [criticalAlerts, state.summary?.disputesOpen, state.totalPendingTopups, suspendedUsers],
  );

  const usersCreatedLast7Days = state.users.filter((user) => {
    if (!user.createdAt) {
      return false;
    }
    const timestamp = Date.parse(user.createdAt);
    return !Number.isNaN(timestamp) && Date.now() - timestamp <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const staleOpenJobs = state.jobs.filter((job) => {
    if ((job.status ?? "").toUpperCase() !== "OPEN" || !job.createdAt) {
      return false;
    }
    const timestamp = Date.parse(job.createdAt);
    return !Number.isNaN(timestamp) && Date.now() - timestamp > 21 * 24 * 60 * 60 * 1000;
  }).length;
  const jobsClosingSoon = state.jobs.filter((job) => {
    if ((job.status ?? "").toUpperCase() !== "OPEN" || !job.closingDate) {
      return false;
    }
    const timestamp = Date.parse(job.closingDate);
    return !Number.isNaN(timestamp) && timestamp >= Date.now() && timestamp - Date.now() <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const degradedDomains = (state.overview?.domains ?? []).filter((domain) => domain.status !== "operational");
  const oldestPendingTopupAgeDays = state.pendingTopups.reduce((oldest, topup) => {
    if (!topup.createdAt) {
      return oldest;
    }
    const timestamp = Date.parse(topup.createdAt);
    if (Number.isNaN(timestamp)) {
      return oldest;
    }
    const ageDays = Math.max(0, Math.round((Date.now() - timestamp) / (24 * 60 * 60 * 1000)));
    return Math.max(oldest, ageDays);
  }, 0);

  const recentJobs = useMemo(() => sortByCreatedAtDesc(state.jobs).slice(0, 5), [state.jobs]);
  const pendingTopupPreview = useMemo(() => sortByCreatedAtDesc(state.pendingTopups).slice(0, 5), [state.pendingTopups]);
  const userOversightItems = useMemo<DrilldownItem[]>(
    () =>
      sortByCreatedAtDesc(state.users)
        .sort((left, right) => {
          const leftScore = left.suspended ? 0 : !left.documentsVerified ? 1 : left.online ? 2 : 3;
          const rightScore = right.suspended ? 0 : !right.documentsVerified ? 1 : right.online ? 2 : 3;
          return leftScore - rightScore;
        })
        .slice(0, 4)
        .map((user) => ({
          title: formatUserLabel(user),
          helper: `${normalizeRole(user.roles)} • ${user.lastSeenAt ? `Seen ${formatRelativeTime(user.lastSeenAt)}` : `Joined ${formatRelativeTime(user.createdAt)}`}`,
          badge: user.suspended ? "Suspended" : !user.documentsVerified ? "Needs KYC" : user.online ? "Live now" : "Verified",
          tone: user.suspended ? "critical" : !user.documentsVerified ? "warning" : user.online ? "success" : "info",
        })),
    [state.users],
  );
  const jobOversightItems = useMemo<DrilldownItem[]>(
    () =>
      [...state.jobs]
        .sort((left, right) => {
          const leftOpen = (left.status ?? "").toUpperCase() === "OPEN" ? 0 : 1;
          const rightOpen = (right.status ?? "").toUpperCase() === "OPEN" ? 0 : 1;
          if (leftOpen !== rightOpen) {
            return leftOpen - rightOpen;
          }
          return (right.budgetMax ?? 0) - (left.budgetMax ?? 0);
        })
        .slice(0, 4)
        .map((job) => {
          const isStale =
            (job.status ?? "").toUpperCase() === "OPEN" &&
            Boolean(job.createdAt) &&
            !Number.isNaN(Date.parse(job.createdAt ?? "")) &&
            Date.now() - Date.parse(job.createdAt ?? "") > 21 * 24 * 60 * 60 * 1000;
          const closingSoon =
            (job.status ?? "").toUpperCase() === "OPEN" &&
            Boolean(job.closingDate) &&
            !Number.isNaN(Date.parse(job.closingDate ?? "")) &&
            Date.parse(job.closingDate ?? "") - Date.now() <= 7 * 24 * 60 * 60 * 1000 &&
            Date.parse(job.closingDate ?? "") >= Date.now();
          return {
            title: job.title || "Untitled job",
            helper: `${formatJobBudget(job)} • ${job.createdAt ? `Created ${formatRelativeTime(job.createdAt)}` : "No creation date"}`,
            badge: isStale ? "Stale open" : closingSoon ? "Closing soon" : normalizeBucket(job.status, "Unknown"),
            tone: isStale ? "warning" : closingSoon ? "attention" : (job.status ?? "").toUpperCase() === "OPEN" ? "info" : "neutral",
          };
        }),
    [state.jobs],
  );
  const paymentOversightItems = useMemo<DrilldownItem[]>(
    () =>
      pendingTopupPreview.map((topup) => ({
        title: topup.providerRef ? `Top-up ${topup.providerRef}` : `Manual review ${topup.id.slice(0, 8)}`,
        helper: `User ${topup.userId.slice(0, 8)} • Requested ${formatRelativeTime(topup.createdAt)}`,
        badge: formatCurrency(topup.amount),
        tone: oldestPendingTopupAgeDays >= 3 ? "warning" : "info",
      })),
    [oldestPendingTopupAgeDays, pendingTopupPreview],
  );
  const disputeOversightItems = useMemo<DrilldownItem[]>(() => {
    const alertItems = (state.overview?.alerts ?? [])
      .filter((alert) => /dispute|fraud|risk|violation|policy|abuse/i.test(`${alert.title} ${alert.detail}`))
      .map((alert) => ({
        title: alert.title,
        helper: alert.detail,
        badge: normalizeBucket(alert.level, "Alert"),
        tone: (alert.level in statusTone ? alert.level : "attention") as keyof typeof statusTone,
      }));
    const domainItems = degradedDomains.map((domain) => ({
      title: domain.title,
      helper: `${domain.responsibilitiesCount} responsibilities require closer review`,
      badge: normalizeBucket(domain.status, "Attention"),
      tone: (domain.status in statusTone ? domain.status : "attention") as keyof typeof statusTone,
    }));
    return [...alertItems, ...domainItems].slice(0, 4);
  }, [degradedDomains, state.overview]);

  const hasDailySeries = dailySeries.length > 0;
  const hasJobStatusData = jobStatusData.length > 0;
  const hasProposalStatusData = proposalStatusData.length > 0;
  const hasTrustPosture = state.users.length > 0 || state.jobs.length > 0 || state.proposals.length > 0;
  const hasQueueSignal = queueData.some((item) => item.value > 0);

  const toggleFlag = async (flag: AdminCommandCenterFeatureFlag) => {
    setUpdatingFlag(flag.key);
    setActionStatus(null);

    try {
      await adminCommandCenterUpdateFeatureFlag(flag.key, { enabled: !flag.enabled });
      setActionStatus(`Feature flag ${flag.key} updated.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to update feature flag.";
      setActionStatus(message);
    } finally {
      setUpdatingFlag(null);
    }
  };

  const exportStamp = (state.overview?.generatedAt || new Date().toISOString()).replace(/[:.]/g, "-");

  const exportSnapshot = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      generatedAt: state.overview?.generatedAt ?? null,
      feedHealth,
      summary: state.summary,
      overview: state.overview,
      daily: state.daily,
      users: state.users,
      jobs: state.jobs,
      proposals: state.proposals,
      pendingTopups: state.pendingTopups,
    };
    downloadFile(
      `admin-command-center-${exportStamp}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    setActionStatus("Admin snapshot exported.");
  }, [exportStamp, feedHealth, state.daily, state.jobs, state.overview, state.pendingTopups, state.proposals, state.summary, state.users]);

  const exportTrendsCsv = useCallback(() => {
    const csv = toCsv(["date", "label", "users", "jobs", "revenue"], dailySeries);
    downloadFile(`admin-daily-trends-${exportStamp}.csv`, csv, "text/csv;charset=utf-8");
    setActionStatus("Daily trends exported.");
  }, [dailySeries, exportStamp]);

  const exportOperationsCsv = useCallback(() => {
    const rows: Array<Record<string, unknown>> = [
      ...state.pendingTopups.map((topup) => ({
        stream: "pending_topup",
        id: topup.id,
        status: topup.status,
        reference: topup.providerRef ?? "",
        amount: topup.amount,
        createdAt: topup.createdAt ?? "",
        note: `User ${topup.userId}`,
      })),
      ...(state.overview?.alerts ?? []).map((alert) => ({
        stream: "alert",
        id: alert.id,
        status: alert.level,
        reference: alert.title,
        amount: "",
        createdAt: state.overview?.generatedAt ?? "",
        note: alert.detail,
      })),
    ];
    const csv = toCsv(["stream", "id", "status", "reference", "amount", "createdAt", "note"], rows);
    downloadFile(`admin-operations-${exportStamp}.csv`, csv, "text/csv;charset=utf-8");
    setActionStatus("Operations queue exported.");
  }, [exportStamp, state.overview, state.pendingTopups]);

  return (
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          ...paperCardSx,
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ py: { xs: 2.4, md: 2.9 } }}>
          <Stack spacing={1.8}>
            <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={1.5}>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.92 }} fontWeight={900}>
                  LIVE ADMIN INTEGRATION
                </Typography>
                <Typography variant={isSmallScreen ? "h4" : "h3"} fontWeight={900} sx={{ letterSpacing: "-0.03em", maxWidth: 760 }}>
                  Enterprise Operations Command Deck
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.6, maxWidth: 840 }}>
                  Real-time control surface for marketplace growth, financial review, governance alerts, identity trust, and domain readiness.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap" alignItems={{ sm: "center" }}>
                <SoftButton component={Link} href="/admin/analytics" variant="outlined" sx={{ minWidth: { sm: 170 }, width: { xs: "100%", sm: "auto" } }}>
                  Open Analytics
                </SoftButton>
                <SoftButton component={Link} href="/admin/transactions" variant="outlined" sx={{ width: { xs: "100%", sm: "auto" } }}>
                  Review Payments
                </SoftButton>
                <SoftButton component={Link} href="/admin/users" variant="outlined" sx={{ width: { xs: "100%", sm: "auto" } }}>
                  Manage Users
                </SoftButton>
                <SoftButton
                  onClick={() => void load()}
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  disabled={loading}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Refresh
                </SoftButton>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip icon={<HubRoundedIcon />} label={`${liveFeedCount}/7 live data feeds`} variant="outlined" />
              <Chip icon={<InsightsRoundedIcon />} label={`Last sync ${generatedAtLabel}`} variant="outlined" />
              <Chip icon={<PendingActionsRoundedIcon />} label={`${state.totalPendingTopups} payments awaiting review`} variant="outlined" />
              <Chip icon={<ShieldRoundedIcon />} label={`${criticalAlerts} critical governance alerts`} variant="outlined" />
            </Stack>

            <Grid container spacing={1.15}>
              {loading
                ? Array.from({ length: 4 }, (_, index) => (
                    <Grid key={`signal-skeleton-${index}`} size={{ xs: 12, sm: 6, xl: 3 }}>
                      <Box
                        sx={{
                          p: 1.35,
                          height: "100%",
                          borderRadius: 2.4,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Stack spacing={0.8}>
                          <Skeleton variant="text" width="46%" sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                          <Skeleton variant="text" width="72%" height={42} sx={{ bgcolor: "rgba(255,255,255,0.24)" }} />
                          <Skeleton variant="text" width="58%" sx={{ bgcolor: "rgba(255,255,255,0.18)" }} />
                        </Stack>
                      </Box>
                    </Grid>
                  ))
                : heroSignals.map((signal) => {
                    const accent = heroSignalColor[signal.tone] ?? heroSignalColor.info;
                    return (
                      <Grid key={signal.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                        <Box
                          sx={{
                            p: 1.35,
                            height: "100%",
                            borderRadius: 2.4,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                          }}
                        >
                          <Stack spacing={0.5}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ opacity: 0.86 }}>
                                {signal.label}
                              </Typography>
                              <Box sx={{ width: 10, height: 10, borderRadius: 999, bgcolor: accent, boxShadow: `0 0 0 4px ${accent}22` }} />
                            </Stack>
                            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-0.03em" }}>
                              {signal.value}
                            </Typography>
                            <Typography variant="caption" sx={{ color: accent }}>
                              {signal.trend}
                            </Typography>
                          </Stack>
                        </Box>
                      </Grid>
                    );
                  })}
            </Grid>

            <Grid container spacing={1}>
              {feedHealth.map((source) => (
                <Grid key={source.key} size={{ xs: 12, sm: 6, xl: 3 }}>
                  <Box
                    sx={{
                      p: 1.05,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: source.ok ? "rgba(34,197,94,0.24)" : "rgba(245,158,11,0.28)",
                      bgcolor: source.ok ? "rgba(240,253,244,0.75)" : "rgba(255,251,235,0.78)",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          {source.title}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.84 }}>
                          {source.helper}
                        </Typography>
                      </Box>
                      <Chip
                        label={source.ok ? "Live" : "Degraded"}
                        size="small"
                        variant="filled"
                        sx={{
                          bgcolor: source.ok ? "rgba(22,163,74,0.12)" : "rgba(245,158,11,0.16)",
                        }}
                      />
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <SoftButton
                variant="outlined"
                startIcon={<FileDownloadRoundedIcon />}
                onClick={exportSnapshot}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Export Snapshot JSON
              </SoftButton>
              <SoftButton
                variant="outlined"
                startIcon={<FileDownloadRoundedIcon />}
                onClick={exportTrendsCsv}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Export Trends CSV
              </SoftButton>
              <SoftButton
                variant="outlined"
                startIcon={<FileDownloadRoundedIcon />}
                onClick={exportOperationsCsv}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Export Operations CSV
              </SoftButton>
            </Stack>
          </Stack>
        </CardContent>
      </SoftCard>

      {loading ? <LinearProgress sx={{ borderRadius: 999, height: 6 }} /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error && state.failedSources.length > 0 ? (
        <Alert severity="warning">
          Partial admin data loaded. Unavailable sources: {state.failedSources.join(", ")}.
        </Alert>
      ) : null}
      {actionStatus ? <Alert severity="info">{actionStatus}</Alert> : null}

      <Grid container spacing={1.25}>
        {metricCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, xl: 2 }}>
            <SoftCard sx={{ ...paperCardSx, height: "100%" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h4" fontWeight={900}>
                  {loading ? "--" : card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.helper}
                </Typography>
              </CardContent>
            </SoftCard>
          </Grid>
        ))}
      </Grid>

      <SoftCard sx={paperCardSx}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ md: "center" }}
            spacing={1.2}
            sx={{ mb: 1.35 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Operational Drilldowns
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Queue-focused views for the areas admins actually need to touch next.
              </Typography>
            </Box>
            <Chip
              icon={<PendingActionsRoundedIcon />}
              label={`${state.totalPendingTopups + (state.summary?.disputesOpen ?? 0) + suspendedUsers} tracked actions`}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6, xl: 3 }}>
              <DrilldownPanel
                title="User Oversight"
                subtitle="Identity trust, access posture, and recently changed accounts."
                icon={<GroupRoundedIcon fontSize="small" />}
                href="/admin/users"
                ctaLabel="Open Users"
                accent="#0b5bd1"
                stats={[
                  { label: "Verified", value: `${percentOf(verifiedUsers, Math.max(1, state.users.length))}%`, tone: "success" },
                  { label: "Suspended", value: formatCompactNumber(suspendedUsers), tone: suspendedUsers > 0 ? "critical" : "neutral" },
                  { label: "New 7d", value: formatCompactNumber(usersCreatedLast7Days), tone: "info" },
                ]}
                items={userOversightItems}
                emptyTitle="No user oversight queue"
                emptyDetail="User review items will appear here once the admin users feed returns data."
              />
            </Grid>

            <Grid size={{ xs: 12, lg: 6, xl: 3 }}>
              <DrilldownPanel
                title="Job Oversight"
                subtitle="Open supply health, aging briefs, and high-value listings."
                icon={<WorkRoundedIcon fontSize="small" />}
                href="/admin/jobs"
                ctaLabel="Open Jobs"
                accent="#0f766e"
                stats={[
                  { label: "Open", value: formatCompactNumber(openJobs), tone: "info" },
                  { label: "Closing 7d", value: formatCompactNumber(jobsClosingSoon), tone: jobsClosingSoon > 0 ? "attention" : "neutral" },
                  { label: "Stale", value: formatCompactNumber(staleOpenJobs), tone: staleOpenJobs > 0 ? "warning" : "neutral" },
                ]}
                items={jobOversightItems}
                emptyTitle="No jobs to review"
                emptyDetail="Job moderation and supply-watch items will appear here as soon as jobs are loaded."
              />
            </Grid>

            <Grid size={{ xs: 12, lg: 6, xl: 3 }}>
              <DrilldownPanel
                title="Payments Queue"
                subtitle="Manual funding reviews, queue age, and pending value under review."
                icon={<ReceiptLongRoundedIcon fontSize="small" />}
                href="/admin/transactions"
                ctaLabel="Open Payments"
                accent="#4338ca"
                stats={[
                  { label: "Queue", value: formatCompactNumber(state.totalPendingTopups), tone: state.totalPendingTopups > 0 ? "warning" : "neutral" },
                  { label: "Pending value", value: formatCurrency(pendingTopupAmount), tone: "info" },
                  { label: "Oldest age", value: oldestPendingTopupAgeDays > 0 ? `${oldestPendingTopupAgeDays}d` : "Fresh", tone: oldestPendingTopupAgeDays >= 3 ? "warning" : "success" },
                ]}
                items={paymentOversightItems}
                emptyTitle="No payment backlog"
                emptyDetail="Pending top-up reviews will appear here when manual funding requests arrive."
              />
            </Grid>

            <Grid size={{ xs: 12, lg: 6, xl: 3 }}>
              <DrilldownPanel
                title="Disputes & Trust"
                subtitle="Policy pressure, critical alerts, and degraded governance surfaces."
                icon={<ReportProblemRoundedIcon fontSize="small" />}
                href="/admin/disputes"
                ctaLabel="Open Disputes"
                accent="#991b1b"
                stats={[
                  { label: "Open disputes", value: formatCompactNumber(state.summary?.disputesOpen ?? 0), tone: (state.summary?.disputesOpen ?? 0) > 0 ? "critical" : "neutral" },
                  { label: "Critical alerts", value: formatCompactNumber(criticalAlerts), tone: criticalAlerts > 0 ? "critical" : "neutral" },
                  { label: "Degraded domains", value: formatCompactNumber(degradedDomains.length), tone: degradedDomains.length > 0 ? "warning" : "success" },
                ]}
                items={disputeOversightItems}
                emptyTitle="No active trust escalations"
                emptyDetail="Dispute and governance escalations will appear here when alerts or degraded domains are reported."
              />
            </Grid>
          </Grid>
        </CardContent>
      </SoftCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SoftCard sx={{ ...paperCardSx, height: "100%" }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
                gap={1}
                sx={{ mb: 1.2 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Marketplace Pulse
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Daily user onboarding and job creation across the last 30 days.
                  </Typography>
                </Box>
                <Chip label={`${formatSignedPercent(growthDelta(usersCreatedTrend))} user momentum`} size="small" color="primary" variant="outlined" />
              </Stack>
              <Box sx={{ height: 320 }}>
                {hasDailySeries ? (
                  <NoSsrResponsiveContainer fallbackHeight={320}>
                    <AreaChart
                      data={dailySeries}
                      syncId="admin-timeseries"
                      margin={{ top: 8, right: isSmallScreen ? 6 : 18, left: 0, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient id="usersArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0b5bd1" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#0b5bd1" stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id="jobsArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: chartTickFont }} minTickGap={isSmallScreen ? 18 : 8} />
                      {!isSmallScreen ? <YAxis tick={{ fontSize: chartTickFont }} width={38} /> : null}
                      <Tooltip
                        contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1", boxShadow: "0 18px 32px rgba(15,23,42,0.12)" }}
                        cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
                      />
                      <Area type="monotone" dataKey="users" stroke="#0b5bd1" fill="url(#usersArea)" strokeWidth={2.6} activeDot={{ r: 4 }} />
                      <Area type="monotone" dataKey="jobs" stroke="#14b8a6" fill="url(#jobsArea)" strokeWidth={2.4} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <EmptyVisualization
                    title="No daily marketplace trend yet"
                    detail="This chart will appear once the analytics service returns time-series data."
                    height={320}
                  />
                )}
              </Box>
              <Grid container spacing={1} sx={{ mt: 0.4 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(239,246,255,0.9)" }}>
                    <Typography variant="caption" color="text.secondary">
                      New users in 30d
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatCompactNumber(usersCreatedTrend.reduce((sum, value) => sum + value, 0))}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(240,253,250,0.92)" }}>
                    <Typography variant="caption" color="text.secondary">
                      Jobs created in 30d
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatCompactNumber(jobsCreatedTrend.reduce((sum, value) => sum + value, 0))}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <SoftCard sx={{ ...paperCardSx, height: "100%" }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
                gap={1}
                sx={{ mb: 1.2 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Revenue Cadence
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successful inbound transaction flow by day.
                  </Typography>
                </Box>
                <Chip icon={<MonetizationOnRoundedIcon />} label={formatCurrency(revenueTrend.slice(-7).reduce((sum, value) => sum + value, 0))} size="small" variant="outlined" />
              </Stack>
              <Box sx={{ height: 320 }}>
                {hasDailySeries ? (
                  <NoSsrResponsiveContainer fallbackHeight={320}>
                    <BarChart
                      data={dailySeries}
                      syncId="admin-timeseries"
                      margin={{ top: 8, right: isSmallScreen ? 4 : 10, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: chartTickFont }} minTickGap={isSmallScreen ? 18 : 8} />
                      {!isSmallScreen ? (
                        <YAxis tick={{ fontSize: chartTickFont }} width={42} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                      ) : null}
                      <Tooltip
                        contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1", boxShadow: "0 18px 32px rgba(15,23,42,0.12)" }}
                        cursor={{ fill: "rgba(14,165,233,0.08)" }}
                        formatter={(value) =>
                          formatCurrency(
                            Number(Array.isArray(value) ? value[0] : value) || 0,
                          )
                        }
                      />
                      <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#0ea5e9" />
                    </BarChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <EmptyVisualization
                    title="No revenue cadence available"
                    detail="Daily revenue bars will render here after transaction analytics are available."
                    height={320}
                  />
                )}
              </Box>
              <Grid container spacing={1} sx={{ mt: 0.4 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(239,246,255,0.9)" }}>
                    <Typography variant="caption" color="text.secondary">
                      30-day revenue
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatCurrency(revenueTrend.reduce((sum, value) => sum + value, 0))}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(248,250,252,0.96)" }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg daily revenue
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatCurrency(
                        revenueTrend.length > 0
                          ? revenueTrend.reduce((sum, value) => sum + value, 0) / revenueTrend.length
                          : 0,
                      )}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SoftCard sx={{ ...paperCardSx, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
                Job Status Mix
              </Typography>
              <Box sx={{ height: 280 }}>
                {hasJobStatusData ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <PieChart>
                      <Pie
                        data={jobStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={pieInnerRadius}
                        outerRadius={pieOuterRadius}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {jobStatusData.map((entry, index) => (
                          <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1", boxShadow: "0 18px 32px rgba(15,23,42,0.12)" }} />
                    </PieChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <EmptyVisualization
                    title="No job mix available"
                    detail="Open, closed, and paused job distribution will render here once jobs are indexed."
                    height={280}
                  />
                )}
              </Box>
              <Stack spacing={0.7}>
                {jobStatusData.slice(0, 4).map((entry, index) => (
                  <Stack key={entry.name} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: 999, bgcolor: chartPalette[index % chartPalette.length] }} />
                      <Typography variant="body2">{entry.name}</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight={700}>{entry.value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SoftCard sx={{ ...paperCardSx, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
                Proposal Funnel
              </Typography>
              <Box sx={{ height: 280 }}>
                {hasProposalStatusData ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <BarChart
                      data={proposalStatusData}
                      layout="vertical"
                      margin={{ top: 8, right: 12, left: isSmallScreen ? 8 : 28, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: chartTickFont }} />
                      <YAxis dataKey="name" type="category" width={isMediumScreen ? 86 : 110} tick={{ fontSize: chartTickFont }} />
                      <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1", boxShadow: "0 18px 32px rgba(15,23,42,0.12)" }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {proposalStatusData.map((entry, index) => (
                          <Cell key={entry.name} fill={chartPalette[(index + 2) % chartPalette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <EmptyVisualization
                    title="No proposal funnel yet"
                    detail="Proposal pipeline stages will render here when proposal data is returned."
                    height={280}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatCompactNumber(reviewedProposals)} reviewed out of {formatCompactNumber(state.proposals.length)} total proposals.
              </Typography>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SoftCard sx={{ ...paperCardSx, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
                Trust Posture
              </Typography>
              <Box sx={{ height: 280 }}>
                {hasTrustPosture ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <RadarChart data={trustPosture} outerRadius={radarOuterRadius}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: chartTickFont }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: isSmallScreen ? 10 : 11 }} />
                      <Radar dataKey="value" stroke="#0b5bd1" fill="#0b5bd1" fillOpacity={0.32} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1", boxShadow: "0 18px 32px rgba(15,23,42,0.12)" }}
                        formatter={(value) =>
                          `${Math.round(Number(Array.isArray(value) ? value[0] : value) || 0)}%`
                        }
                      />
                    </RadarChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <EmptyVisualization
                    title="Trust posture is waiting for data"
                    detail="Verification, activity, and moderation coverage will appear after user and proposal feeds load."
                    height={280}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {verifiedUsers} verified accounts, {activeRecently} active in the last 7 days, and {suspendedUsers} suspended.
              </Typography>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.4 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Domain Readiness Board
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Operational posture and routing across the enterprise admin domains.
                  </Typography>
                </Box>
                <Chip icon={<HubRoundedIcon />} label={`${domainReadiness.length} live domains`} size="small" variant="outlined" />
              </Stack>
              {domainReadiness.length > 0 ? (
                <Grid container spacing={1.1}>
                  {domainReadiness.map((domain) => (
                    <Grid key={domain.name} size={{ xs: 12, md: 6 }}>
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          border: `1px solid ${domain.border}`,
                          bgcolor: domain.bg,
                          height: "100%",
                        }}
                      >
                        <Stack spacing={0.9} sx={{ height: "100%" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                            <Typography variant="subtitle2" fontWeight={800}>
                              {domain.name}
                            </Typography>
                            <Chip size="small" label={domain.status} sx={{ color: domain.color, borderColor: domain.border }} variant="outlined" />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {domain.responsibilities} responsibilities
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={domain.score}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "rgba(148,163,184,0.22)",
                              "& .MuiLinearProgress-bar": { bgcolor: domain.color },
                            }}
                          />
                          <Box sx={{ mt: "auto", pt: 0.4 }}>
                            <SoftButton component={Link} href={domain.route} variant="text" size="small" endIcon={<ArrowForwardRoundedIcon />} sx={{ px: 0 }}>
                              Open domain
                            </SoftButton>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyVisualization
                  title="No admin domains returned"
                  detail="Domain readiness cards will render here as soon as the command-center overview provides domain summaries."
                  height={232}
                />
              )}
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
                gap={1}
                sx={{ mb: 1.1 }}
              >
                <Typography variant="h6" fontWeight={800}>
                  Operations Queue
                </Typography>
                <Chip icon={<WarningAmberRoundedIcon />} label={`${criticalAlerts} urgent`} size="small" variant="outlined" />
              </Stack>
              <Box sx={{ height: 220 }}>
                {hasQueueSignal ? (
                  <NoSsrResponsiveContainer fallbackHeight={220}>
                    <BarChart
                      data={queueData}
                      layout="vertical"
                      margin={{ top: 8, right: 8, left: isSmallScreen ? 6 : 18, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: chartTickFont }} />
                      <YAxis dataKey="label" type="category" width={isMediumScreen ? 92 : 120} tick={{ fontSize: chartTickFont }} />
                      <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1", boxShadow: "0 18px 32px rgba(15,23,42,0.12)" }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {queueData.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <EmptyVisualization
                    title="Operations queue is clear"
                    detail="Review backlog, disputes, and moderation pressure will surface here when items require action."
                    height={220}
                  />
                )}
              </Box>
              <Divider sx={{ my: 1.2 }} />
              <Stack spacing={1}>
                {pendingTopupPreview.length > 0 ? (
                  pendingTopupPreview.map((topup) => (
                    <Box key={topup.id} sx={{ p: 1.05, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            Manual top-up {topup.providerRef ? `• ${topup.providerRef}` : ""}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            User {topup.userId.slice(0, 8)} • {formatDateLabel(topup.createdAt)}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight={900}>
                          {formatCurrency(topup.amount)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">No manual top-up reviews pending.</Typography>
                )}
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SoftCard sx={paperCardSx}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
                gap={1}
                sx={{ mb: 1.2 }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Governance Flags
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Live feature controls wired to the admin command-center service.
                  </Typography>
                </Box>
                <Chip icon={<ManageAccountsRoundedIcon />} label={`${enabledFlags} enabled`} size="small" variant="outlined" />
              </Stack>
              {featureFlags.length > 0 ? (
                <Grid container spacing={1}>
                  {featureFlags.map((flag) => (
                    <Grid key={flag.key} size={{ xs: 12, md: 6 }}>
                      <Box
                        sx={{
                          p: 1.1,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: flag.enabled ? "rgba(239,246,255,0.9)" : "background.paper",
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={800} sx={{ wordBreak: "break-word" }}>
                              {flag.key}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {flag.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.4 }}>
                              {flag.owner} • updated {formatDateLabel(flag.updatedAt)}
                            </Typography>
                          </Box>
                          <Switch checked={flag.enabled} disabled={updatingFlag === flag.key} onChange={() => void toggleFlag(flag)} />
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyVisualization
                  title="No governance flags published"
                  detail="Feature controls will appear here when the command-center service exposes runtime flags."
                  height={250}
                />
              )}
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SoftCard sx={{ ...paperCardSx, height: "100%" }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
                gap={1}
                sx={{ mb: 1.1 }}
              >
                <Typography variant="h6" fontWeight={800}>
                  Signals & Activity
                </Typography>
                <Chip icon={<CampaignRoundedIcon />} label={`${(state.overview?.alerts ?? []).length} alerts`} size="small" variant="outlined" />
              </Stack>
              <Stack spacing={1}>
                {(state.overview?.alerts ?? []).slice(0, 3).map((alert) => {
                  const tone = statusTone[alert.level] ?? statusTone.attention;
                  return (
                    <Box
                      key={alert.id}
                      sx={{
                        p: 1.05,
                        borderRadius: 2,
                        border: `1px solid ${tone.border}`,
                        bgcolor: tone.bg,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: tone.color }}>
                        {alert.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {alert.detail}
                      </Typography>
                    </Box>
                  );
                })}
                {(state.overview?.alerts ?? []).length > 0 ? <Divider sx={{ my: 0.4 }} /> : null}
                {recentJobs.length > 0 ? (
                  recentJobs.map((job) => (
                    <Box key={job.id} sx={{ p: 1.05, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {job.title || "Untitled job"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {normalizeBucket(job.status, "Unknown")} • {formatDateLabel(job.createdAt)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(job.currency || "USD")} {formatCompactNumber(job.budgetMin || 0)} - {formatCompactNumber(job.budgetMax || 0)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <EmptyVisualization
                    title="No recent activity"
                    detail="Alerts and recent job posts will surface here as soon as the admin feeds return new activity."
                    height={220}
                  />
                )}
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>

      <SoftCard sx={paperCardSx}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.2} sx={{ mb: 1.2 }}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Identity Mix
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live user-role composition drawn from the admin users feed.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <SoftButton component={Link} href="/admin/users" variant="outlined" size="small">
                Open Users
              </SoftButton>
              <SoftButton component={Link} href="/admin/transactions" variant="outlined" size="small">
                Payments Queue
              </SoftButton>
            </Stack>
          </Stack>
          {roleMix.length > 0 ? (
            <Grid container spacing={1.1}>
              {roleMix.map((entry, index) => (
                <Grid key={entry.name} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 12, height: 12, borderRadius: 999, bgcolor: chartPalette[index % chartPalette.length] }} />
                        <Typography variant="subtitle2" fontWeight={800}>
                          {entry.name}
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={900}>
                        {entry.value}
                      </Typography>
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <EmptyVisualization
              title="No role mix available"
              detail="Identity distribution cards will appear here when admin users are returned from the backend."
              height={220}
            />
          )}
        </CardContent>
      </SoftCard>
    </Stack>
  );
}
