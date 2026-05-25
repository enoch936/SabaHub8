"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import ApiRoundedIcon from "@mui/icons-material/ApiRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RuleFolderRoundedIcon from "@mui/icons-material/RuleFolderRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminSectionFocus from "@/components/admin/AdminSectionFocus";
import NoSsrResponsiveContainer from "@/components/charts/NoSsrResponsiveContainer";
import { Button } from "@mui/material";
import { GlassCard } from "./GlassCard";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type AdminCommandCenterDomainResponse,
  type AdminCommandCenterFeatureFlag,
  type AdminCommandCenterOperation,
  adminCommandCenterDomain,
  adminCommandCenterExecuteOperation,
  adminCommandCenterUpdateFeatureFlag,
} from "@/lib/api";

type IntegrationLane = "all" | "identity" | "traffic" | "webhooks";

type QuickActionBlueprint = {
  key: string;
  title: string;
  summary: string;
  lane: Exclude<IntegrationLane, "all">;
  sectionKey: string;
  operationId: string;
  controlKey: string;
  icon: typeof ApiRoundedIcon;
};

type ControlBlueprint = {
  key: string;
  title: string;
  summary: string;
  lane: Exclude<IntegrationLane, "all">;
  sectionKey: string;
  defaultEnabled: boolean;
  owner: string;
  description: string;
};

const actionBlueprints: QuickActionBlueprint[] = [
  {
    key: "api-token-management",
    title: "API Token Management",
    summary: "Generate and revoke system API tokens for integration access.",
    lane: "identity",
    sectionKey: "generate-system-api-tokens",
    operationId: "generate-api-token",
    controlKey: "integration.partner-auth-enforcement",
    icon: ApiRoundedIcon,
  },
  {
    key: "oauth-rotation",
    title: "OAuth Rotation",
    summary: "Rotate provider credentials and enforce integration auth guardrails.",
    lane: "identity",
    sectionKey: "manage-oauth-integrations",
    operationId: "rotate-oauth-secrets",
    controlKey: "integration.partner-auth-enforcement",
    icon: PublishedWithChangesRoundedIcon,
  },
  {
    key: "rate-limit-policy",
    title: "Rate Limit Policy",
    summary: "Apply API gateway throttling policy and traffic guardrails.",
    lane: "traffic",
    sectionKey: "enforce-api-rate-limits",
    operationId: "apply-rate-limit-policy",
    controlKey: "integration.rate-limit-guardrails",
    icon: ApiRoundedIcon,
  },
  {
    key: "webhook-reliability",
    title: "Webhook Reliability",
    summary: "Validate webhook integrity, retries, and delivery reliability.",
    lane: "webhooks",
    sectionKey: "manage-webhook-services",
    operationId: "validate-webhook-integrity",
    controlKey: "integration.webhook-retries",
    icon: SyncRoundedIcon,
  },
];

const controlBlueprints: ControlBlueprint[] = [
  {
    key: "integration.partner-auth-enforcement",
    title: "Partner Auth Enforcement",
    summary: "Enforce stricter auth policy for third-party identity connections.",
    lane: "identity",
    sectionKey: "manage-oauth-integrations",
    defaultEnabled: true,
    owner: "Integration Engineering",
    description: "Enforce stricter provider authentication and credential handling rules.",
  },
  {
    key: "integration.oauth-rotation-window",
    title: "Credential Rotation Window",
    summary: "Restrict credential rotations to controlled maintenance windows.",
    lane: "identity",
    sectionKey: "manage-oauth-integrations",
    defaultEnabled: false,
    owner: "Integration Engineering",
    description: "Restrict OAuth credential rotation to approved maintenance windows.",
  },
  {
    key: "integration.rate-limit-guardrails",
    title: "Rate Limit Guardrails",
    summary: "Protect gateway traffic with stricter throttling limits and response policy.",
    lane: "traffic",
    sectionKey: "enforce-api-rate-limits",
    defaultEnabled: true,
    owner: "Integration Engineering",
    description: "Apply gateway traffic guardrails and stricter API throttling protection.",
  },
  {
    key: "integration.signature-validation",
    title: "Signature Validation",
    summary: "Require webhook signatures and payload verification before processing.",
    lane: "webhooks",
    sectionKey: "manage-webhook-services",
    defaultEnabled: true,
    owner: "Integration Engineering",
    description: "Require webhook signature verification before processing partner payloads.",
  },
  {
    key: "integration.webhook-retries",
    title: "Webhook Retries",
    summary: "Allow managed retry policy for failed webhook deliveries.",
    lane: "webhooks",
    sectionKey: "manage-webhook-services",
    defaultEnabled: true,
    owner: "Integration Engineering",
    description: "Allow controlled retry policy and recovery for failed webhook deliveries.",
  },
];

const operationLaneMap: Record<string, Exclude<IntegrationLane, "all">> = {
  "generate-api-token": "identity",
  "revoke-api-token": "identity",
  "rotate-oauth-secrets": "identity",
  "apply-rate-limit-policy": "traffic",
  "validate-webhook-integrity": "webhooks",
};

const laneFill: Record<Exclude<IntegrationLane, "all">, string> = {
  identity: "#2563eb",
  traffic: "#0f766e",
  webhooks: "#d97706",
};

const chartPalette = ["#2563eb", "#0f766e", "#d97706", "#dc2626", "#7c3aed", "#14b8a6"];

const statusTone: Record<string, "success" | "warning" | "default" | "info" | "error"> = {
  operational: "success",
  degraded: "warning",
  attention: "warning",
  success: "success",
  warning: "warning",
  critical: "error",
};

function laneFromSection(focusSection?: string | null): IntegrationLane {
  const normalized = (focusSection ?? "").toLowerCase();
  if (normalized.includes("rate") || normalized.includes("api")) {
    return "traffic";
  }
  if (normalized.includes("webhook")) {
    return "webhooks";
  }
  return "identity";
}

function formatDateTime(value?: string) {
  if (!value) {
    return "--";
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Date(timestamp).toLocaleString();
}

function parseMetricValue(value?: string) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().toUpperCase();
  const multiplier = trimmed.endsWith("M") ? 1_000_000 : trimmed.endsWith("K") ? 1_000 : trimmed.endsWith("B") ? 1_000_000_000 : 1;
  const normalized = trimmed.replace(/[^0-9.]/g, "");
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed * multiplier : null;
}

function titleFromFlagKey(value: string) {
  return value
    .split(".")
    .slice(-1)[0]
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type AdminApiIntegrationWorkspaceProps = {
  focusSection?: string | null;
};

export default function AdminApiIntegrationWorkspace({ focusSection }: AdminApiIntegrationWorkspaceProps) {
  const [payload, setPayload] = useState<AdminCommandCenterDomainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [runningOperationId, setRunningOperationId] = useState<string | null>(null);
  const [flagUpdating, setFlagUpdating] = useState<string | null>(null);
  const [activeLane, setActiveLane] = useState<IntegrationLane>(() => laneFromSection(focusSection));
  const [activeSection, setActiveSection] = useState<string | null>(focusSection ?? "manage-oauth-integrations");
  const [editingFlag, setEditingFlag] = useState<AdminCommandCenterFeatureFlag | null>(null);
  const [flagDraft, setFlagDraft] = useState({ enabled: false, owner: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminCommandCenterDomain("api-integration-management");
      setPayload(data);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load integration workspace.";
      setError(message);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setActiveLane(laneFromSection(focusSection));
    if (focusSection) {
      setActiveSection(focusSection);
    }
  }, [focusSection]);

  const operations = useMemo(() => payload?.domain.operations ?? [], [payload]);
  const operationMap = useMemo(() => new Map(operations.map((operation) => [operation.id, operation])), [operations]);
  const payloadFlags = useMemo(() => payload?.featureFlags ?? [], [payload]);

  const controlFlags = useMemo(() => {
    return controlBlueprints.map<AdminCommandCenterFeatureFlag>((blueprint) => {
      const existing = payloadFlags.find((flag) => flag.key === blueprint.key);
      if (existing) {
        return existing;
      }
      return {
        key: blueprint.key,
        enabled: blueprint.defaultEnabled,
        owner: blueprint.owner,
        description: blueprint.description,
        updatedAt: "",
      };
    });
  }, [payloadFlags]);

  const controlMap = useMemo(() => new Map(controlFlags.map((flag) => [flag.key, flag])), [controlFlags]);

  const actionCards = useMemo(
    () =>
      actionBlueprints
        .map((blueprint) => ({
          ...blueprint,
          operation: operationMap.get(blueprint.operationId) ?? null,
          control: controlMap.get(blueprint.controlKey) ?? null,
        }))
        .filter((item) => item.operation),
    [controlMap, operationMap],
  );

  const visibleActionCards = useMemo(
    () => actionCards.filter((item) => activeLane === "all" || item.lane === activeLane),
    [actionCards, activeLane],
  );

  const visibleOperations = useMemo(() => {
    return [...operations].sort((left, right) => {
      const leftLane = operationLaneMap[left.id] ?? "identity";
      const rightLane = operationLaneMap[right.id] ?? "identity";
      if (activeLane !== "all") {
        if (leftLane === activeLane && rightLane !== activeLane) {
          return -1;
        }
        if (leftLane !== activeLane && rightLane === activeLane) {
          return 1;
        }
      }
      return left.title.localeCompare(right.title);
    });
  }, [activeLane, operations]);

  const generatedAtLabel = useMemo(() => formatDateTime(payload?.generatedAt), [payload?.generatedAt]);
  const enabledControls = useMemo(() => controlFlags.filter((flag) => flag.enabled).length, [controlFlags]);

  const metricChartData = useMemo(
    () =>
      (payload?.metrics ?? [])
        .map((metric) => ({
          label: metric.label,
          value: parseMetricValue(metric.value),
        }))
        .filter((metric): metric is { label: string; value: number } => metric.value !== null),
    [payload?.metrics],
  );

  const operationImpactData = useMemo(() => {
    const order = ["Critical", "High", "Medium", "Low"];
    return order
      .map((impact) => ({
        label: impact,
        value: operations.filter((operation) => operation.impact === impact).length,
      }))
      .filter((item) => item.value > 0);
  }, [operations]);

  const controlCoverageData = useMemo(
    () =>
      [
        { label: "Enabled", value: controlFlags.filter((flag) => flag.enabled).length, fill: "#16a34a" },
        { label: "Disabled", value: controlFlags.filter((flag) => !flag.enabled).length, fill: "#94a3b8" },
      ].filter((item) => item.value > 0),
    [controlFlags],
  );

  const alertSeverityData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const alert of payload?.alerts ?? []) {
      counts.set(alert.level, (counts.get(alert.level) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([level, value]) => ({
      label: level.charAt(0).toUpperCase() + level.slice(1),
      value,
      fill: level === "critical" ? "#dc2626" : level === "warning" ? "#d97706" : "#16a34a",
    }));
  }, [payload?.alerts]);

  const oauthOperation = operationMap.get("rotate-oauth-secrets") ?? null;
  const rateLimitOperation = operationMap.get("apply-rate-limit-policy") ?? null;
  const webhookOperation = operationMap.get("validate-webhook-integrity") ?? null;

  const executeOperation = async (operation: AdminCommandCenterOperation, dryRun: boolean, note?: string) => {
    const opKey = `${operation.id}:${dryRun ? "dry" : "run"}`;
    setRunningOperationId(opKey);
    setActionStatus(null);
    try {
      const result = await adminCommandCenterExecuteOperation("api-integration-management", operation.id, {
        dryRun,
        note:
          note ??
          (dryRun
            ? `Dry run from integration workspace for ${operation.title}`
            : `Execution from integration workspace for ${operation.title}`),
      });
      setActionStatus(`${result.title} completed with status ${result.status}.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Integration operation failed.";
      setActionStatus(message);
    } finally {
      setRunningOperationId(null);
    }
  };

  const toggleFlag = async (flag: AdminCommandCenterFeatureFlag) => {
    setFlagUpdating(flag.key);
    setActionStatus(null);
    try {
      await adminCommandCenterUpdateFeatureFlag(flag.key, {
        enabled: !flag.enabled,
        owner: flag.owner,
        description: flag.description,
      });
      setActionStatus(`${titleFromFlagKey(flag.key)} updated.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to update integration control.";
      setActionStatus(message);
    } finally {
      setFlagUpdating(null);
    }
  };

  const openFlagEditor = (flag: AdminCommandCenterFeatureFlag) => {
    setEditingFlag(flag);
    setFlagDraft({
      enabled: flag.enabled,
      owner: flag.owner,
      description: flag.description,
    });
    setActionStatus(null);
  };

  const closeFlagEditor = () => {
    if (flagUpdating && editingFlag?.key === flagUpdating) {
      return;
    }
    setEditingFlag(null);
    setFlagDraft({ enabled: false, owner: "", description: "" });
  };

  const saveFlagEditor = async () => {
    if (!editingFlag) {
      return;
    }
    setFlagUpdating(editingFlag.key);
    setActionStatus(null);
    try {
      await adminCommandCenterUpdateFeatureFlag(editingFlag.key, {
        enabled: flagDraft.enabled,
        owner: flagDraft.owner.trim() || editingFlag.owner,
        description: flagDraft.description.trim() || editingFlag.description,
      });
      setActionStatus(`${titleFromFlagKey(editingFlag.key)} saved.`);
      setEditingFlag(null);
      setFlagDraft({ enabled: false, owner: "", description: "" });
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to save integration control.";
      setActionStatus(message);
    } finally {
      setFlagUpdating(null);
    }
  };

  return (
    <Stack spacing={2.2}>
      <GlassCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(15,23,42,0.16)",
          color: "common.white",
          background: "linear-gradient(135deg, #11202d 0%, #1f4260 50%, #2b6675 100%)",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1.2}>
              <Box>
                <Typography variant="overline" fontWeight={800} sx={{ opacity: 0.84, letterSpacing: "0.14em" }}>
                  INTEGRATION ENGINEERING
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.04 }}>
                  {payload?.domain.title ?? "API & Integration Management"}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.92, maxWidth: 860 }}>
                  Operate OAuth, rate-limit, and webhook controls from a dedicated integration console. Integration
                  controls are editable in place and every runbook call executes against the live admin API.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={`Status: ${payload?.domain.status ?? "loading"}`}
                  color={statusTone[payload?.domain.status ?? ""] || "info"}
                  variant="outlined"
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.08)" }}
                />
                <Chip
                  label={`Controls: ${enabledControls}/${controlFlags.length}`}
                  variant="outlined"
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.08)" }}
                />
                <Chip
                  label={`Last Sync: ${generatedAtLabel}`}
                  variant="outlined"
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.08)" }}
                />
                <Button
                  onClick={() => void load()}
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.58)" }}
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[
                { key: "all", label: "All Lanes" },
                { key: "identity", label: "Identity" },
                { key: "traffic", label: "Traffic" },
                { key: "webhooks", label: "Webhooks" },
              ].map((lane) => (
                <Chip
                  key={lane.key}
                  label={lane.label}
                  color={activeLane === lane.key ? "primary" : "default"}
                  variant={activeLane === lane.key ? "filled" : "outlined"}
                  onClick={() => setActiveLane(lane.key as IntegrationLane)}
                  sx={{
                    bgcolor: activeLane === lane.key ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </GlassCard>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionStatus ? <Alert severity="info">{actionStatus}</Alert> : null}

      <Grid container spacing={2}>
        {(payload?.metrics ?? []).map((metric) => (
          <Grid key={metric.id} size={{ xs: 12, sm: 6, xl: 4 }}>
            <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h4" fontWeight={900}>
                  {loading ? "--" : metric.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {metric.trend}
                </Typography>
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Integration Signals
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Numeric signals from the current integration payload.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${metricChartData.length} signals`} />
              </Stack>
              <Box sx={{ height: 280 }}>
                {metricChartData.length > 0 ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <BarChart data={metricChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-18} textAnchor="end" height={64} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {metricChartData.map((entry, index) => (
                          <Cell key={entry.label} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <Alert severity="info">No numeric integration signals available yet.</Alert>
                )}
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Runbook Impact Mix
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Identity, traffic, and webhook runbooks grouped by impact.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${operations.length} runbooks`} />
              </Stack>
              <Box sx={{ height: 280 }}>
                <NoSsrResponsiveContainer fallbackHeight={280}>
                  <BarChart data={operationImpactData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {operationImpactData.map((entry, index) => (
                        <Cell key={entry.label} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </NoSsrResponsiveContainer>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Integration Controls
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enabled versus disabled integration control coverage.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${controlFlags.length} controls`} />
              </Stack>
              <Box sx={{ height: 280 }}>
                {controlCoverageData.length > 0 ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <PieChart>
                      <Pie data={controlCoverageData} dataKey="value" nameKey="label" innerRadius={62} outerRadius={98} paddingAngle={4}>
                        {controlCoverageData.map((entry) => (
                          <Cell key={entry.label} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <Alert severity="info">No integration control data available.</Alert>
                )}
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Alert Severity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current alert mix from the integration feed.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${(payload?.alerts ?? []).length} alerts`} />
              </Stack>
              <Box sx={{ height: 280 }}>
                {alertSeverityData.length > 0 ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <BarChart data={alertSeverityData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {alertSeverityData.map((entry) => (
                          <Cell key={entry.label} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <Alert severity="info">No alert severity data available.</Alert>
                )}
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={1.4}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Integration Action Lanes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Each lane exposes a real runbook action, a live integration focus, and a persisted runtime control.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {visibleActionCards.map((item) => {
                const Icon = item.icon;
                const isDryRunning = runningOperationId === `${item.operation?.id}:dry`;
                const isRunning = runningOperationId === `${item.operation?.id}:run`;
                return (
                  <Grid key={item.key} size={{ xs: 12, md: 6, xl: 4 }}>
                    <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                      <CardContent>
                        <Stack spacing={1.2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                            <Stack direction="row" spacing={1.1} alignItems="flex-start">
                              <Box
                                sx={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: 2,
                                  display: "grid",
                                  placeItems: "center",
                                  bgcolor: `${laneFill[item.lane]}14`,
                                  color: laneFill[item.lane],
                                  flexShrink: 0,
                                }}
                              >
                                <Icon fontSize="small" />
                              </Box>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={800}>
                                  {item.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {item.summary}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack spacing={0.7} alignItems="flex-end">
                              <Chip label={item.operation?.impact ?? "Runbook"} size="small" variant="outlined" />
                              {item.control ? (
                                <Chip
                                  label={item.control.enabled ? "Control On" : "Control Off"}
                                  size="small"
                                  color={item.control.enabled ? "success" : "default"}
                                  variant="outlined"
                                />
                              ) : null}
                            </Stack>
                          </Stack>

                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                            <Button
                              variant={activeSection === item.sectionKey ? "contained" : "outlined"}
                              size="small"
                              startIcon={<RuleFolderRoundedIcon />}
                              onClick={() => setActiveSection(item.sectionKey)}
                            >
                              {activeSection === item.sectionKey ? "Focused" : "Open Focus"}
                            </Button>
                            {item.operation ? (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PreviewRoundedIcon />}
                                onClick={() => void executeOperation(item.operation!, true)}
                                disabled={!!runningOperationId}
                              >
                                {isDryRunning ? "Dry Run..." : "Dry Run"}
                              </Button>
                            ) : null}
                            {item.operation ? (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<PlayCircleRoundedIcon />}
                                onClick={() => void executeOperation(item.operation!, false)}
                                disabled={!!runningOperationId}
                              >
                                {isRunning ? "Executing..." : "Execute"}
                              </Button>
                            ) : null}
                            {item.control ? (
                              <Button
                                variant={item.control.enabled ? "outlined" : "contained"}
                                size="small"
                                startIcon={<SettingsSuggestRoundedIcon />}
                                onClick={() => void toggleFlag(item.control!)}
                                disabled={flagUpdating === item.control.key}
                              >
                                {flagUpdating === item.control.key ? "Updating..." : item.control.enabled ? "Disable Control" : "Enable Control"}
                              </Button>
                            ) : null}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </GlassCard>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>
        </CardContent>
      </GlassCard>

      <AdminSectionFocus
        parentKey="api-integration-management"
        parentLabel={payload?.domain.title ?? "API & Integration Management"}
        sectionKey={activeSection}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                Integration Controls
              </Typography>
              <Stack spacing={1}>
                {controlFlags.map((flag) => {
                  const blueprint = controlBlueprints.find((item) => item.key === flag.key);
                  const title = blueprint?.title ?? titleFromFlagKey(flag.key);
                  return (
                    <Box
                      key={flag.key}
                      sx={{
                        p: 1.1,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={800}>
                              {title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {blueprint?.summary ?? flag.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              Owner: {flag.owner} {flag.updatedAt ? `• Updated ${formatDateTime(flag.updatedAt)}` : "• Not yet saved"}
                            </Typography>
                          </Box>
                          <Switch
                            checked={flag.enabled}
                            disabled={flagUpdating === flag.key}
                            onChange={() => void toggleFlag(flag)}
                            inputProps={{ "aria-label": `toggle ${flag.key}` }}
                          />
                        </Stack>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                          <Button size="small" variant="outlined" onClick={() => setActiveSection(blueprint?.sectionKey ?? "manage-oauth-integrations")}>
                            Open Focus
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => openFlagEditor(flag)}>
                            Edit Control
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                Active Alerts
              </Typography>
              <Divider sx={{ mb: 1.1 }} />
              <Stack spacing={1}>
                {(payload?.alerts ?? []).map((alert) => (
                  <Box
                    key={alert.id}
                    sx={{
                      p: 1.1,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-start" }} gap={1}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {alert.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {alert.detail}
                          </Typography>
                        </Box>
                        <Chip
                          label={alert.level.toUpperCase()}
                          color={statusTone[alert.level] || "default"}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setActiveSection(alert.level === "success" ? "manage-third-party-integrations" : "manage-oauth-integrations")}
                        >
                          Open Focus
                        </Button>
                        {oauthOperation ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PreviewRoundedIcon />}
                            onClick={() => void executeOperation(oauthOperation, true, `OAuth review from alert ${alert.title}`)}
                            disabled={!!runningOperationId}
                          >
                            {runningOperationId === `${oauthOperation.id}:dry` ? "Checking..." : "Check OAuth"}
                          </Button>
                        ) : null}
                        {rateLimitOperation ? (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PlayCircleRoundedIcon />}
                            onClick={() => void executeOperation(rateLimitOperation, false, `Rate limit review from alert ${alert.title}`)}
                            disabled={!!runningOperationId}
                          >
                            {runningOperationId === `${rateLimitOperation.id}:run` ? "Applying..." : "Tune Traffic"}
                          </Button>
                        ) : null}
                        {webhookOperation ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => void executeOperation(webhookOperation, false, `Webhook validation from alert ${alert.title}`)}
                            disabled={!!runningOperationId}
                          >
                            {runningOperationId === `${webhookOperation.id}:run` ? "Validating..." : "Validate Webhooks"}
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Box>
                ))}

                {!loading && !(payload?.alerts.length ?? 0) ? <Alert severity="success">No active integration alerts right now.</Alert> : null}
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={1.2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Integration Runbooks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Execute OAuth, traffic, and webhook runbooks directly from the integration workspace.
              </Typography>
            </Box>

            <Stack spacing={1}>
              {visibleOperations.map((operation) => {
                const lane = operationLaneMap[operation.id] ?? "identity";
                const sectionKey =
                  actionBlueprints.find((item) => item.operationId === operation.id)?.sectionKey ??
                  (lane === "traffic" ? "enforce-api-rate-limits" : lane === "webhooks" ? "manage-webhook-services" : "manage-oauth-integrations");
                const isDryRunning = runningOperationId === `${operation.id}:dry`;
                const isRunning = runningOperationId === `${operation.id}:run`;
                return (
                  <Box
                    key={operation.id}
                    sx={{
                      p: 1.15,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {operation.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {operation.description}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip label={operation.impact} size="small" variant="outlined" />
                          <Chip
                            label={lane.charAt(0).toUpperCase() + lane.slice(1)}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: `${laneFill[lane]}66`, color: laneFill[lane] }}
                          />
                        </Stack>
                      </Stack>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                        <Button size="small" variant="outlined" onClick={() => setActiveSection(sectionKey)}>
                          Open Focus
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PreviewRoundedIcon />}
                          onClick={() => void executeOperation(operation, true)}
                          disabled={!!runningOperationId}
                        >
                          {isDryRunning ? "Dry Run..." : "Dry Run"}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayCircleRoundedIcon />}
                          onClick={() => void executeOperation(operation, false)}
                          disabled={!!runningOperationId}
                        >
                          {isRunning ? "Executing..." : "Execute"}
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </CardContent>
      </GlassCard>

      <Dialog open={!!editingFlag} onClose={closeFlagEditor} fullWidth maxWidth="sm">
        <DialogTitle>Edit Integration Control</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <SoftTextField
              label="Owner"
              value={flagDraft.owner}
              onChange={(event) => setFlagDraft((current) => ({ ...current, owner: event.target.value }))}
              fullWidth
            />
            <SoftTextField
              label="Description"
              value={flagDraft.description}
              onChange={(event) => setFlagDraft((current) => ({ ...current, description: event.target.value }))}
              multiline
              minRows={3}
              fullWidth
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Enabled
              </Typography>
              <Switch
                checked={flagDraft.enabled}
                onChange={(_, checked) => setFlagDraft((current) => ({ ...current, enabled: checked }))}
                inputProps={{ "aria-label": "toggle integration control" }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="text" onClick={closeFlagEditor} disabled={!!flagUpdating}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void saveFlagEditor()} disabled={!!flagUpdating}>
            {flagUpdating ? "Saving..." : "Save Control"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
