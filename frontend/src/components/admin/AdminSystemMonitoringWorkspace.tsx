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
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RuleFolderRoundedIcon from "@mui/icons-material/RuleFolderRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
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
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type AdminCommandCenterDomainResponse,
  type AdminCommandCenterFeatureFlag,
  type AdminCommandCenterOperation,
  adminCommandCenterDomain,
  adminCommandCenterExecuteOperation,
  adminCommandCenterUpdateFeatureFlag,
} from "@/lib/api";

type MonitoringLane = "all" | "health" | "alerts" | "incidents";

type QuickActionBlueprint = {
  key: string;
  title: string;
  summary: string;
  lane: Exclude<MonitoringLane, "all">;
  sectionKey: string;
  operationId: string;
  controlKey: string;
  icon: typeof MonitorHeartRoundedIcon;
};

type ControlBlueprint = {
  key: string;
  title: string;
  summary: string;
  lane: Exclude<MonitoringLane, "all">;
  sectionKey: string;
  defaultEnabled: boolean;
  owner: string;
  description: string;
};

const actionBlueprints: QuickActionBlueprint[] = [
  {
    key: "health-diagnostics",
    title: "Health Diagnostics",
    summary: "Run health diagnostics across services, queues, and core dependencies.",
    lane: "health",
    sectionKey: "system-health",
    operationId: "run-health-check",
    controlKey: "monitoring.auto-remediation",
    icon: MonitorHeartRoundedIcon,
  },
  {
    key: "alert-policy",
    title: "Alert Policy",
    summary: "Apply alert thresholds, routing rules, and escalation guardrails.",
    lane: "alerts",
    sectionKey: "system-alerts",
    operationId: "configure-system-alerts",
    controlKey: "monitoring.alert-escalation",
    icon: NotificationsActiveRoundedIcon,
  },
  {
    key: "outage-response",
    title: "Outage Response",
    summary: "Open outage investigation workflows and coordinate degraded-service response.",
    lane: "incidents",
    sectionKey: "service-outages",
    operationId: "investigate-service-outage",
    controlKey: "monitoring.maintenance-mode",
    icon: WarningAmberRoundedIcon,
  },
];

const controlBlueprints: ControlBlueprint[] = [
  {
    key: "monitoring.auto-remediation",
    title: "Auto-Remediation",
    summary: "Allow first-response remediation workflows when health checks detect degraded services.",
    lane: "health",
    sectionKey: "system-health",
    defaultEnabled: true,
    owner: "Reliability Engineering",
    description: "Automatically apply first-response remediation steps for degraded services.",
  },
  {
    key: "monitoring.alert-escalation",
    title: "Alert Escalation",
    summary: "Escalate sustained warning signals into the active incident queue.",
    lane: "alerts",
    sectionKey: "system-alerts",
    defaultEnabled: true,
    owner: "Reliability Engineering",
    description: "Escalate warning alerts into incident handling when thresholds persist.",
  },
  {
    key: "monitoring.maintenance-mode",
    title: "Maintenance Windows",
    summary: "Allow controlled maintenance mode while incidents are stabilized.",
    lane: "incidents",
    sectionKey: "service-outages",
    defaultEnabled: false,
    owner: "Reliability Engineering",
    description: "Permit controlled maintenance windows for affected services during incidents.",
  },
  {
    key: "monitoring.slo-burn-protection",
    title: "SLO Burn Protection",
    summary: "Raise protection when burn-rate risk approaches service-level targets.",
    lane: "health",
    sectionKey: "service-level-agreements",
    defaultEnabled: true,
    owner: "Reliability Engineering",
    description: "Protect service-level objectives when burn rate approaches alert thresholds.",
  },
];

const operationLaneMap: Record<string, Exclude<MonitoringLane, "all">> = {
  "run-health-check": "health",
  "configure-system-alerts": "alerts",
  "investigate-service-outage": "incidents",
};

const laneFill: Record<Exclude<MonitoringLane, "all">, string> = {
  health: "#0f766e",
  alerts: "#2563eb",
  incidents: "#dc2626",
};

const chartPalette = ["#0f766e", "#2563eb", "#f59e0b", "#dc2626", "#7c3aed", "#14b8a6"];

const statusTone: Record<string, "success" | "warning" | "default" | "info" | "error"> = {
  operational: "success",
  degraded: "warning",
  attention: "warning",
  success: "success",
  warning: "warning",
  critical: "error",
};

function laneFromSection(focusSection?: string | null): MonitoringLane {
  const normalized = (focusSection ?? "").toLowerCase();
  if (normalized.includes("alert")) {
    return "alerts";
  }
  if (normalized.includes("outage") || normalized.includes("incident") || normalized.includes("recovery")) {
    return "incidents";
  }
  return "health";
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
  const normalized = value.replace(/[^0-9.]/g, "");
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function titleFromFlagKey(value: string) {
  return value
    .split(".")
    .slice(-1)[0]
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type AdminSystemMonitoringWorkspaceProps = {
  focusSection?: string | null;
};

export default function AdminSystemMonitoringWorkspace({ focusSection }: AdminSystemMonitoringWorkspaceProps) {
  const [payload, setPayload] = useState<AdminCommandCenterDomainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [runningOperationId, setRunningOperationId] = useState<string | null>(null);
  const [flagUpdating, setFlagUpdating] = useState<string | null>(null);
  const [activeLane, setActiveLane] = useState<MonitoringLane>(() => laneFromSection(focusSection));
  const [activeSection, setActiveSection] = useState<string | null>(focusSection ?? "system-health");
  const [editingFlag, setEditingFlag] = useState<AdminCommandCenterFeatureFlag | null>(null);
  const [flagDraft, setFlagDraft] = useState({ enabled: false, owner: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminCommandCenterDomain("system-monitoring-health-management");
      setPayload(data);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load system monitoring workspace.";
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
      const leftLane = operationLaneMap[left.id] ?? "health";
      const rightLane = operationLaneMap[right.id] ?? "health";
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

  const healthOperation = operationMap.get("run-health-check") ?? null;
  const alertOperation = operationMap.get("configure-system-alerts") ?? null;
  const outageOperation = operationMap.get("investigate-service-outage") ?? null;

  const executeOperation = async (operation: AdminCommandCenterOperation, dryRun: boolean, note?: string) => {
    const opKey = `${operation.id}:${dryRun ? "dry" : "run"}`;
    setRunningOperationId(opKey);
    setActionStatus(null);
    try {
      const result = await adminCommandCenterExecuteOperation("system-monitoring-health-management", operation.id, {
        dryRun,
        note:
          note ??
          (dryRun
            ? `Dry run from system monitoring workspace for ${operation.title}`
            : `Execution from system monitoring workspace for ${operation.title}`),
      });
      setActionStatus(`${result.title} completed with status ${result.status}.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Monitoring operation failed.";
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
      const message = err instanceof Error && err.message ? err.message : "Failed to update monitoring control.";
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
      const message = err instanceof Error && err.message ? err.message : "Failed to save monitoring control.";
      setActionStatus(message);
    } finally {
      setFlagUpdating(null);
    }
  };

  return (
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(15,23,42,0.16)",
          color: "common.white",
          background: "linear-gradient(135deg, #0b1722 0%, #113348 50%, #1f5168 100%)",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1.2}>
              <Box>
                <Typography variant="overline" fontWeight={800} sx={{ opacity: 0.84, letterSpacing: "0.14em" }}>
                  RELIABILITY ENGINEERING
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.04 }}>
                  {payload?.domain.title ?? "System Monitoring & Health Management"}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.92, maxWidth: 860 }}>
                  Run live diagnostics, alerting, and outage-response actions from a monitoring console built on the admin
                  command-center APIs. Monitoring controls persist through feature flags and all runbook execution is audited.
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
                <SoftButton
                  onClick={() => void load()}
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.58)" }}
                >
                  Refresh
                </SoftButton>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[
                { key: "all", label: "All Lanes" },
                { key: "health", label: "Health" },
                { key: "alerts", label: "Alerts" },
                { key: "incidents", label: "Incidents" },
              ].map((lane) => (
                <Chip
                  key={lane.key}
                  label={lane.label}
                  color={activeLane === lane.key ? "primary" : "default"}
                  variant={activeLane === lane.key ? "filled" : "outlined"}
                  onClick={() => setActiveLane(lane.key as MonitoringLane)}
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
      </SoftCard>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionStatus ? <Alert severity="info">{actionStatus}</Alert> : null}

      <Grid container spacing={2}>
        {(payload?.metrics ?? []).map((metric) => (
          <Grid key={metric.id} size={{ xs: 12, sm: 6, xl: 4 }}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
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
            </SoftCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Reliability Signals
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Numeric health signals from the current monitoring payload.
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
                  <Alert severity="info">No numeric monitoring signals available yet.</Alert>
                )}
              </Box>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Runbook Impact Mix
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitoring runbooks grouped by operational impact.
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
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Monitoring Controls
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enabled versus disabled monitoring control coverage.
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
                  <Alert severity="info">No monitoring control data available.</Alert>
                )}
              </Box>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Alert Severity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current alert mix from the monitoring feed.
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
          </SoftCard>
        </Grid>
      </Grid>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={1.4}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Monitoring Action Lanes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Each lane exposes a real runbook action, a live monitoring focus, and a persisted runtime control.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {visibleActionCards.map((item) => {
                const Icon = item.icon;
                const isDryRunning = runningOperationId === `${item.operation?.id}:dry`;
                const isRunning = runningOperationId === `${item.operation?.id}:run`;
                return (
                  <Grid key={item.key} size={{ xs: 12, md: 6, xl: 4 }}>
                    <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
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
                            <SoftButton
                              variant={activeSection === item.sectionKey ? "contained" : "outlined"}
                              size="small"
                              startIcon={<RuleFolderRoundedIcon />}
                              onClick={() => setActiveSection(item.sectionKey)}
                            >
                              {activeSection === item.sectionKey ? "Focused" : "Open Focus"}
                            </SoftButton>
                            {item.operation ? (
                              <SoftButton
                                variant="outlined"
                                size="small"
                                startIcon={<PreviewRoundedIcon />}
                                onClick={() => void executeOperation(item.operation!, true)}
                                disabled={!!runningOperationId}
                              >
                                {isDryRunning ? "Dry Run..." : "Dry Run"}
                              </SoftButton>
                            ) : null}
                            {item.operation ? (
                              <SoftButton
                                variant="contained"
                                size="small"
                                startIcon={<PlayCircleRoundedIcon />}
                                onClick={() => void executeOperation(item.operation!, false)}
                                disabled={!!runningOperationId}
                              >
                                {isRunning ? "Executing..." : "Execute"}
                              </SoftButton>
                            ) : null}
                            {item.control ? (
                              <SoftButton
                                variant={item.control.enabled ? "outlined" : "contained"}
                                size="small"
                                startIcon={<SettingsSuggestRoundedIcon />}
                                onClick={() => void toggleFlag(item.control as AdminCommandCenterFeatureFlag)}
                                disabled={flagUpdating === item.control.key}
                              >
                                {flagUpdating === item.control.key ? "Updating..." : item.control.enabled ? "Disable Control" : "Enable Control"}
                              </SoftButton>
                            ) : null}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </SoftCard>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>
        </CardContent>
      </SoftCard>

      <AdminSectionFocus
        parentKey="system-monitoring-health-management"
        parentLabel={payload?.domain.title ?? "System Monitoring & Health Management"}
        sectionKey={activeSection}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                Monitoring Controls
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
                          <SoftButton size="small" variant="outlined" onClick={() => setActiveSection(blueprint?.sectionKey ?? "system-health")}>
                            Open Focus
                          </SoftButton>
                          <SoftButton size="small" variant="outlined" onClick={() => openFlagEditor(flag)}>
                            Edit Control
                          </SoftButton>
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                Active Alerts
              </Typography>
              <Divider sx={{ mb: 1.1 }} />
              <Stack spacing={1}>
                {(payload?.alerts ?? []).map((alert) => {
                  const investigateEnabled = alert.level !== "success" && outageOperation;
                  return (
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
                          <SoftButton
                            size="small"
                            variant="outlined"
                            onClick={() => setActiveSection(alert.level === "success" ? "system-health" : "service-outages")}
                          >
                            Open Focus
                          </SoftButton>
                          {healthOperation ? (
                            <SoftButton
                              size="small"
                              variant="outlined"
                              startIcon={<PreviewRoundedIcon />}
                              onClick={() =>
                                void executeOperation(healthOperation, true, `Alert review health check for ${alert.title}`)
                              }
                              disabled={!!runningOperationId}
                            >
                              {runningOperationId === `${healthOperation.id}:dry` ? "Checking..." : "Health Check"}
                            </SoftButton>
                          ) : null}
                          {investigateEnabled ? (
                            <SoftButton
                              size="small"
                              variant="contained"
                              startIcon={<PlayCircleRoundedIcon />}
                              onClick={() =>
                                void executeOperation(outageOperation, false, `Outage investigation opened from alert ${alert.title}`)
                              }
                              disabled={!!runningOperationId}
                            >
                              {runningOperationId === `${outageOperation.id}:run` ? "Investigating..." : "Investigate"}
                            </SoftButton>
                          ) : null}
                          {alertOperation ? (
                            <SoftButton
                              size="small"
                              variant="outlined"
                              onClick={() => void executeOperation(alertOperation, false, `Alert policy review from ${alert.title}`)}
                              disabled={!!runningOperationId}
                            >
                              {runningOperationId === `${alertOperation.id}:run` ? "Applying..." : "Tune Alerts"}
                            </SoftButton>
                          ) : null}
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })}

                {!loading && !(payload?.alerts.length ?? 0) ? <Alert severity="success">No active monitoring alerts right now.</Alert> : null}
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={1.2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Monitoring Runbooks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Execute health, alerting, and outage runbooks directly from the monitoring workspace.
              </Typography>
            </Box>

            <Stack spacing={1}>
              {visibleOperations.map((operation) => {
                const lane = operationLaneMap[operation.id] ?? "health";
                const sectionKey =
                  actionBlueprints.find((item) => item.operationId === operation.id)?.sectionKey ??
                  (lane === "alerts" ? "system-alerts" : lane === "incidents" ? "service-outages" : "system-health");
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
                        <SoftButton size="small" variant="outlined" onClick={() => setActiveSection(sectionKey)}>
                          Open Focus
                        </SoftButton>
                        <SoftButton
                          size="small"
                          variant="outlined"
                          startIcon={<PreviewRoundedIcon />}
                          onClick={() => void executeOperation(operation, true)}
                          disabled={!!runningOperationId}
                        >
                          {isDryRunning ? "Dry Run..." : "Dry Run"}
                        </SoftButton>
                        <SoftButton
                          size="small"
                          variant="contained"
                          startIcon={<PlayCircleRoundedIcon />}
                          onClick={() => void executeOperation(operation, false)}
                          disabled={!!runningOperationId}
                        >
                          {isRunning ? "Executing..." : "Execute"}
                        </SoftButton>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </CardContent>
      </SoftCard>

      <Dialog open={!!editingFlag} onClose={closeFlagEditor} fullWidth maxWidth="sm">
        <DialogTitle>Edit Monitoring Control</DialogTitle>
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
                inputProps={{ "aria-label": "toggle monitoring control" }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <SoftButton variant="text" onClick={closeFlagEditor} disabled={!!flagUpdating}>
            Cancel
          </SoftButton>
          <SoftButton variant="contained" onClick={() => void saveFlagEditor()} disabled={!!flagUpdating}>
            {flagUpdating ? "Saving..." : "Save Control"}
          </SoftButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
