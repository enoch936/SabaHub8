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
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import NoSsrResponsiveContainer from "@/components/charts/NoSsrResponsiveContainer";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { MetricCard } from "./MetricCard";
import { ChartContainer, ChartGrid } from "./ChartContainer";
import { Button } from "@mui/material";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type AdminAnalyticsBreakdownItem,
  type AdminAnalyticsExecutiveReportResponse,
  type AdminAnalyticsInsightItem,
  type AdminAnalyticsMetricCard,
  type AdminAnalyticsRevenueSlice,
  type AdminAnalyticsWorkspaceResponse,
  adminAnalyticsExportCsv,
  adminAnalyticsExportJson,
  adminAnalyticsWorkspace,
  adminGenerateExecutiveReport,
} from "@/lib/api";

const chartPalette = ["#0f4c81", "#168aad", "#14b8a6", "#84cc16", "#f59e0b", "#ef4444"];
const dayOptions = [30, 90, 180];

const toneStyles: Record<string, { border: string; bg: string; color: string }> = {
  success: { border: "rgba(34,197,94,0.28)", bg: "rgba(240,253,244,0.96)", color: "#166534" },
  warning: { border: "rgba(245,158,11,0.3)", bg: "rgba(255,251,235,0.96)", color: "#92400e" },
  info: { border: "rgba(59,130,246,0.26)", bg: "rgba(239,246,255,0.96)", color: "#1d4ed8" },
  primary: { border: "rgba(8,47,73,0.18)", bg: "rgba(240,249,255,0.96)", color: "#0f4c81" },
  default: { border: "rgba(148,163,184,0.26)", bg: "rgba(248,250,252,0.96)", color: "#334155" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);
}

function formatShortDate(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not generated";
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Date(timestamp).toLocaleString();
}

function toneStyle(tone?: string) {
  return toneStyles[tone || ""] || toneStyles.default;
}

function downloadBlob(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function metricToneChip(tone?: string): "success" | "warning" | "info" {
  if (tone === "success") return "success";
  if (tone === "warning") return "warning";
  return "info";
}

function renderMetricCard(metric: AdminAnalyticsMetricCard) {
  const style = toneStyle(metric.tone);
  return (
    <GlassCard
      key={metric.id}
      sx={{
        border: "1px solid",
        borderColor: style.border,
        bgcolor: style.bg,
        height: "100%",
      }}
    >
      <CardContent>
        <Stack spacing={0.8}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Typography variant="body2" color="text.secondary">
              {metric.label}
            </Typography>
            <Chip label={metric.tone} size="small" color={metricToneChip(metric.tone)} variant="outlined" />
          </Stack>
          <Typography variant="h4" fontWeight={900} sx={{ color: style.color, letterSpacing: "-0.03em" }}>
            {metric.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {metric.helper}
          </Typography>
        </Stack>
      </CardContent>
    </GlassCard>
  );
}

function BreakdownList({
  title,
  items,
  icon,
}: {
  title: string;
  items: AdminAnalyticsBreakdownItem[];
  icon?: ReactNode;
}) {
  return (
    <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {icon}
            <Typography variant="h6" fontWeight={800}>
              {title}
            </Typography>
          </Stack>
          <Chip label={`${items.length} rows`} size="small" variant="outlined" />
        </Stack>
        <Stack spacing={0.9}>
          {items.map((item) => (
            <Box
              key={`${title}-${item.label}`}
              sx={{
                p: 1.1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.helper}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={900}>
                  {formatCompactNumber(item.value)}
                </Typography>
              </Stack>
            </Box>
          ))}
          {!items.length ? (
            <Typography variant="body2" color="text.secondary">
              No data available for this section.
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </GlassCard>
  );
}

export default function AdminAnalyticsWorkspace() {
  const [days, setDays] = useState(30);
  const [workspace, setWorkspace] = useState<AdminAnalyticsWorkspaceResponse | null>(null);
  const [report, setReport] = useState<AdminAnalyticsExecutiveReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"json" | "csv" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const loadWorkspace = useCallback(async (windowDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAnalyticsWorkspace(windowDays);
      setWorkspace(data);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load admin analytics.";
      setError(message);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (windowDays: number) => {
    setReportLoading(true);
    setActionStatus(null);
    try {
      const data = await adminGenerateExecutiveReport(windowDays);
      setReport(data);
      setActionStatus(`Executive report refreshed for the last ${windowDays} days.`);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to generate executive report.";
      setActionStatus(message);
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace(days);
    void generateReport(days);
  }, [days, generateReport, loadWorkspace]);

  const trendData = useMemo(
    () =>
      (workspace?.trend ?? []).map((point) => ({
        ...point,
        label: formatShortDate(point.period),
      })),
    [workspace]
  );

  const revenueProviderData = useMemo(
    () =>
      (workspace?.revenueByProvider ?? []).map((slice, index) => ({
        ...slice,
        fill: chartPalette[index % chartPalette.length],
      })),
    [workspace]
  );

  const roleDistributionData = useMemo(
    () =>
      (workspace?.roleDistribution ?? []).map((item, index) => ({
        ...item,
        fill: chartPalette[index % chartPalette.length],
      })),
    [workspace]
  );

  const topRevenueProvider = revenueProviderData[0] as (AdminAnalyticsRevenueSlice & { fill: string }) | undefined;

  const exportJson = async () => {
    setActionLoading("json");
    setActionStatus(null);
    try {
      const data = await adminAnalyticsExportJson(days);
      downloadBlob(JSON.stringify(data, null, 2), `admin-analytics-${days}d.json`, "application/json;charset=utf-8;");
      setActionStatus(`JSON export created for the last ${days} days.`);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "JSON export failed.";
      setActionStatus(message);
    } finally {
      setActionLoading(null);
    }
  };

  const exportCsv = async () => {
    setActionLoading("csv");
    setActionStatus(null);
    try {
      const data = await adminAnalyticsExportCsv(days);
      downloadBlob(data, `admin-analytics-${days}d.csv`, "text/csv;charset=utf-8;");
      setActionStatus(`CSV export created for the last ${days} days.`);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "CSV export failed.";
      setActionStatus(message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        px: { xs: 1.5, md: 2.2 },
        py: { xs: 1.5, md: 2.2 },
        background:
          "radial-gradient(circle at 18% 8%, rgba(34,211,238,0.16) 0, transparent 26%), radial-gradient(circle at 84% 14%, rgba(168,85,247,0.14) 0, transparent 24%), linear-gradient(180deg, #050816 0%, #09101f 42%, #0c1224 100%)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.04) 0%, transparent 18%, transparent 82%, rgba(255,255,255,0.03) 100%)",
          pointerEvents: "none",
        },
      }}
    >
      <Stack spacing={2.2} sx={{ position: "relative", zIndex: 1 }}>
      <GlassCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(15,76,129,0.22)",
          background:
            "radial-gradient(circle at top left, rgba(34,211,238,0.26), transparent 38%), linear-gradient(145deg, #082032 0%, #0f4c81 48%, #06b6d4 100%)",
          color: "common.white",
          overflow: "hidden",
        }}
      >
        <CardContent>
          <Stack spacing={1.4}>
            <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" gap={2}>
              <Box sx={{ maxWidth: 780 }}>
                <Typography variant="overline" sx={{ opacity: 0.84, letterSpacing: "0.18em" }}>
                  ADMIN ANALYTICS
                </Typography>
                <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-0.04em", lineHeight: 1 }}>
                  Analytics & reporting now runs as a real workspace
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.92, mt: 1 }}>
                  Generate executive reports, inspect hiring and marketplace trends, review AI operating status, and export the business dataset directly.
                </Typography>
              </Box>

              <Stack spacing={1} sx={{ minWidth: { xs: "100%", sm: 260, lg: 300 } }}>
                <SoftTextField
                  select
                  label="Reporting Window"
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                  size="small"
                  sx={{
                    "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.94)" },
                    "& .MuiInputLabel-root": { color: "#082032" },
                  }}
                >
                  {dayOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      Last {option} days
                    </MenuItem>
                  ))}
                </SoftTextField>

                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Workspace generated: {formatDateTime(workspace?.generatedAt)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Executive report generated: {formatDateTime(report?.generatedAt)}
                </Typography>
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
              <Button
                component={Link}
                href="/admin"
                variant="contained"
                sx={{ bgcolor: "rgba(255,255,255,0.96)", color: "#082032" }}
              >
                Back To Overview
              </Button>
              <Button
                variant="outlined"
                onClick={() => void loadWorkspace(days)}
                startIcon={<RefreshRoundedIcon />}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.72)" }}
              >
                Refresh Workspace
              </Button>
              <Button
                variant="outlined"
                onClick={() => void generateReport(days)}
                disabled={reportLoading}
                startIcon={<SummarizeRoundedIcon />}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.72)" }}
              >
                {reportLoading ? "Generating Report..." : "Generate Executive Report"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => void exportJson()}
                disabled={actionLoading !== null}
                startIcon={<DownloadRoundedIcon />}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.72)" }}
              >
                {actionLoading === "json" ? "Exporting JSON..." : "Export JSON"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => void exportCsv()}
                disabled={actionLoading !== null}
                startIcon={<FileDownloadRoundedIcon />}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.72)" }}
              >
                {actionLoading === "csv" ? "Exporting CSV..." : "Export CSV"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </GlassCard>

      {loading ? <LinearProgress /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionStatus ? <Alert severity={actionStatus.toLowerCase().includes("failed") ? "error" : "info"}>{actionStatus}</Alert> : null}

      <Grid container spacing={2}>
        {(workspace?.headlineMetrics ?? []).map((metric) => (
          <Grid key={metric.id} size={{ xs: 12, sm: 6, xl: 2 }}>
            {renderMetricCard(metric)}
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <QueryStatsRoundedIcon color="primary" />
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Marketplace Trend
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Daily jobs, proposals, and hires in the selected window
                    </Typography>
                  </Box>
                </Stack>
                <Chip label={`${workspace?.windowDays ?? days}d window`} size="small" variant="outlined" />
              </Stack>
              <Box sx={{ height: 320 }}>
                <NoSsrResponsiveContainer>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f4c81" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0f4c81" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="proposalsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="hiresGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" minTickGap={20} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="jobs" stroke="#0f4c81" fill="url(#jobsGradient)" strokeWidth={2.2} />
                    <Area type="monotone" dataKey="proposals" stroke="#14b8a6" fill="url(#proposalsGradient)" strokeWidth={2.2} />
                    <Area type="monotone" dataKey="hires" stroke="#f59e0b" fill="url(#hiresGradient)" strokeWidth={2.2} />
                  </AreaChart>
                </NoSsrResponsiveContainer>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <InsightsRoundedIcon color="primary" />
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Revenue By Provider
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Successful inbound payment volume
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={topRevenueProvider ? `${topRevenueProvider.label} leads` : "No revenue"}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              <Box sx={{ height: 240 }}>
                <NoSsrResponsiveContainer>
                  <BarChart data={revenueProviderData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {revenueProviderData.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </NoSsrResponsiveContainer>
              </Box>
              <Divider sx={{ my: 1.2 }} />
              <Stack spacing={0.8}>
                {revenueProviderData.map((slice) => (
                  <Stack key={slice.label} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">{slice.label}</Typography>
                    <Typography variant="subtitle2" fontWeight={800}>
                      {formatCurrency(slice.value)} • {slice.transactions} tx
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <BreakdownList
            title="Hiring Funnel"
            icon={<SummarizeRoundedIcon color="primary" />}
            items={workspace?.hiringFunnel ?? []}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <BreakdownList
            title="Top Job Categories"
            icon={<QueryStatsRoundedIcon color="primary" />}
            items={workspace?.topCategories ?? []}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <InsightsRoundedIcon color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Role Distribution
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Account mix across the platform
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ height: 220 }}>
                <NoSsrResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={roleDistributionData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={54}
                      outerRadius={84}
                      paddingAngle={4}
                    >
                      {roleDistributionData.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCompactNumber(Number(value ?? 0))} />
                  </PieChart>
                </NoSsrResponsiveContainer>
              </Box>
              <Stack spacing={0.7}>
                {roleDistributionData.map((entry) => (
                  <Stack key={entry.label} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: entry.fill }} />
                      <Typography variant="body2">{entry.label}</Typography>
                    </Stack>
                    <Typography variant="subtitle2" fontWeight={800}>
                      {formatCompactNumber(entry.value)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
                Engagement Metrics
              </Typography>
              <Grid container spacing={1.2}>
                {(workspace?.engagementMetrics ?? []).map((metric) => (
                  <Grid key={metric.id} size={{ xs: 12, md: 6 }}>
                    {renderMetricCard(metric)}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
                Operations Metrics
              </Typography>
              <Grid container spacing={1.2}>
                {(workspace?.operationsMetrics ?? []).map((metric) => (
                  <Grid key={metric.id} size={{ xs: 12, md: 6 }}>
                    {renderMetricCard(metric)}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.4 }}>
                <MemoryRoundedIcon color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    AI Decision Operations
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current inference mode and python bridge controls
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={1.2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ p: 1.2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                    <Typography variant="body2" color="text.secondary">
                      Engine
                    </Typography>
                    <Typography variant="h6" fontWeight={900}>
                      {workspace?.aiStatus.engine || "Unavailable"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Version {workspace?.aiStatus.version || "n/a"} • {workspace?.aiStatus.inferenceMode || "n/a"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ p: 1.2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                    <Typography variant="body2" color="text.secondary">
                      Runtime Mode
                    </Typography>
                    <Typography variant="h6" fontWeight={900}>
                      {workspace?.aiStatus.mode || "Unavailable"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Python bridge {workspace?.aiStatus.pythonBridgeReachable ? "reachable" : "unreachable"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1.2 }} />
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  label={`Jobs Rerank ${workspace?.aiStatus.pythonJobsEnabled ? "On" : "Off"}`}
                  color={workspace?.aiStatus.pythonJobsEnabled ? "success" : "default"}
                  variant="outlined"
                />
                <Chip
                  label={`Freelancer Match ${workspace?.aiStatus.pythonFreelancersEnabled ? "On" : "Off"}`}
                  color={workspace?.aiStatus.pythonFreelancersEnabled ? "success" : "default"}
                  variant="outlined"
                />
                <Chip
                  label={`Fraud Scoring ${workspace?.aiStatus.pythonFraudEnabled ? "On" : "Off"}`}
                  color={workspace?.aiStatus.pythonFraudEnabled ? "success" : "default"}
                  variant="outlined"
                />
                <Chip
                  label={`Chat Assist ${workspace?.aiStatus.pythonChatEnabled ? "On" : "Off"}`}
                  color={workspace?.aiStatus.pythonChatEnabled ? "success" : "default"}
                  variant="outlined"
                />
              </Stack>

              <Grid container spacing={1.1} sx={{ mt: 0.1 }}>
                {[
                  { label: "Jobs Blend", value: workspace?.aiStatus.blendJobs ?? 0 },
                  { label: "Freelancers Blend", value: workspace?.aiStatus.blendFreelancers ?? 0 },
                  { label: "Fraud Blend", value: workspace?.aiStatus.blendFraud ?? 0 },
                  { label: "Chat Blend", value: workspace?.aiStatus.blendChat ?? 0 },
                ].map((item) => (
                  <Grid key={item.label} size={{ xs: 6, md: 3 }}>
                    <Box sx={{ p: 1.1, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="h6" fontWeight={900}>
                        {(item.value * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
                Operational Insights
              </Typography>
              <Stack spacing={1}>
                {(workspace?.insights ?? []).map((insight: AdminAnalyticsInsightItem) => {
                  const style = toneStyle(insight.tone);
                  return (
                    <Box
                      key={insight.title}
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: style.border,
                        bgcolor: style.bg,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={900} sx={{ color: style.color }}>
                        {insight.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {insight.detail}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.4 }}>
            <Box>
              <Typography variant="h5" fontWeight={900}>
                {report?.title || "Executive Report"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {report?.summary || "Generate the report to compile the latest executive summary."}
              </Typography>
            </Box>
            <Chip label={`Generated ${formatDateTime(report?.generatedAt)}`} size="small" variant="outlined" />
          </Stack>

          <Grid container spacing={1.2} sx={{ mb: 1.4 }}>
            {(report?.headlineMetrics ?? []).map((metric) => (
              <Grid key={`report-${metric.id}`} size={{ xs: 12, sm: 6, xl: 2 }}>
                {renderMetricCard(metric)}
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            {(report?.sections ?? []).map((section) => (
              <Grid key={section.id} size={{ xs: 12, lg: 6 }}>
                <Box
                  sx={{
                    p: 1.3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    height: "100%",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 0.8 }}>
                    {section.title}
                  </Typography>
                  <Stack spacing={0.7}>
                    {section.highlights.map((highlight) => (
                      <Typography key={highlight} variant="body2" color="text.secondary">
                        {highlight}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </GlassCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <BreakdownList title="Job Status Breakdown" items={workspace?.jobStatusBreakdown ?? []} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <BreakdownList title="Proposal Status Breakdown" items={workspace?.proposalStatusBreakdown ?? []} />
        </Grid>
      </Grid>
      </Stack>
    </Box>
  );
}
