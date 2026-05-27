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
import { MediaManager } from "./MediaManager";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import BackupRoundedIcon from "@mui/icons-material/BackupRounded";
import DataObjectRoundedIcon from "@mui/icons-material/DataObjectRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RuleFolderRoundedIcon from "@mui/icons-material/RuleFolderRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
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

type DataLane = "all" | "maintenance" | "migration" | "backup";

type QuickActionBlueprint = {
  key: string;
  title: string;
  summary: string;
  lane: Exclude<DataLane, "all">;
  sectionKey: string;
  operationId: string;
  controlKey: string;
  icon: typeof StorageRoundedIcon;
};

type ControlBlueprint = {
  key: string;
  title: string;
  summary: string;
  lane: Exclude<DataLane, "all">;
  sectionKey: string;
  defaultEnabled: boolean;
  owner: string;
  description: string;
};

const actionBlueprints: QuickActionBlueprint[] = [
  {
    key: "database-maintenance",
    title: "Database Maintenance",
    summary: "Run optimization, consistency, and routine maintenance checks.",
    lane: "maintenance",
    sectionKey: "perform-database-maintenance",
    operationId: "perform-database-maintenance",
    controlKey: "data.integrity-guardrails",
    icon: StorageRoundedIcon,
  },
  {
    key: "data-migration",
    title: "Data Migration",
    summary: "Run migration workflow and verify checkpoints before rollout.",
    lane: "migration",
    sectionKey: "execute-data-migration",
    operationId: "execute-data-migration",
    controlKey: "data.migration-change-freeze",
    icon: PublishedWithChangesRoundedIcon,
  },
  {
    key: "backup-verification",
    title: "Backup Verification",
    summary: "Validate backup readiness, restore checkpoints, and retention coverage.",
    lane: "backup",
    sectionKey: "manage-platform-backups",
    operationId: "verify-platform-backups",
    controlKey: "data.backup-enforcement",
    icon: BackupRoundedIcon,
  },
];

const controlBlueprints: ControlBlueprint[] = [
  {
    key: "data.integrity-guardrails",
    title: "Integrity Guardrails",
    summary: "Protect data operations with stronger integrity checks and verification gates.",
    lane: "maintenance",
    sectionKey: "maintain-database-integrity",
    defaultEnabled: true,
    owner: "Data Operations",
    description: "Enable stronger integrity guardrails and verification checks for data operations.",
  },
  {
    key: "data.retention-enforcement",
    title: "Retention Enforcement",
    summary: "Enforce retention policy before archival and deletion workflows run.",
    lane: "maintenance",
    sectionKey: "enforce-data-retention-policies",
    defaultEnabled: true,
    owner: "Data Operations",
    description: "Enforce retention policy and review gates before archival or deletion.",
  },
  {
    key: "data.migration-change-freeze",
    title: "Migration Change Freeze",
    summary: "Pause non-essential writes during sensitive migration windows.",
    lane: "migration",
    sectionKey: "execute-data-migration",
    defaultEnabled: false,
    owner: "Data Operations",
    description: "Pause non-essential writes during critical migration windows.",
  },
  {
    key: "data.backup-enforcement",
    title: "Backup Enforcement",
    summary: "Require verified backup posture before high-risk changes proceed.",
    lane: "backup",
    sectionKey: "manage-platform-backups",
    defaultEnabled: true,
    owner: "Data Operations",
    description: "Require verified backup posture before high-risk data changes proceed.",
  },
  {
    key: "data.restore-readiness",
    title: "Restore Readiness",
    summary: "Track restore drill readiness and recovery checkpoints.",
    lane: "backup",
    sectionKey: "manage-platform-backups",
    defaultEnabled: true,
    owner: "Data Operations",
    description: "Track restore drill readiness and checkpoint validation for recovery.",
  },
];

const operationLaneMap: Record<string, Exclude<DataLane, "all">> = {
  "perform-database-maintenance": "maintenance",
  "execute-data-migration": "migration",
  "verify-platform-backups": "backup",
};

const laneFill: Record<Exclude<DataLane, "all">, string> = {
  maintenance: "#2563eb",
  migration: "#d97706",
  backup: "#0f766e",
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

function laneFromSection(focusSection?: string | null): DataLane {
  const normalized = (focusSection ?? "").toLowerCase();
  if (normalized.includes("migration")) {
    return "migration";
  }
  if (normalized.includes("backup") || normalized.includes("restore")) {
    return "backup";
  }
  return "maintenance";
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

type AdminDataManagementWorkspaceProps = {
  focusSection?: string | null;
};

export default function AdminDataManagementWorkspace({ focusSection }: AdminDataManagementWorkspaceProps) {
  const [payload, setPayload] = useState<AdminCommandCenterDomainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [runningOperationId, setRunningOperationId] = useState<string | null>(null);
  const [flagUpdating, setFlagUpdating] = useState<string | null>(null);
  const [activeLane, setActiveLane] = useState<DataLane>(() => laneFromSection(focusSection));
  const [activeSection, setActiveSection] = useState<string | null>(focusSection ?? "perform-database-maintenance");
  const [editingFlag, setEditingFlag] = useState<AdminCommandCenterFeatureFlag | null>(null);
  const [flagDraft, setFlagDraft] = useState({ enabled: false, owner: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminCommandCenterDomain("data-management");
      setPayload(data);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load data workspace.";
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
      const leftLane = operationLaneMap[left.id] ?? "maintenance";
      const rightLane = operationLaneMap[right.id] ?? "maintenance";
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

  const maintenanceOperation = operationMap.get("perform-database-maintenance") ?? null;
  const migrationOperation = operationMap.get("execute-data-migration") ?? null;
  const backupOperation = operationMap.get("verify-platform-backups") ?? null;

  const executeOperation = async (operation: AdminCommandCenterOperation, dryRun: boolean, note?: string) => {
    const opKey = `${operation.id}:${dryRun ? "dry" : "run"}`;
    setRunningOperationId(opKey);
    setActionStatus(null);
    try {
      const result = await adminCommandCenterExecuteOperation("data-management", operation.id, {
        dryRun,
        note:
          note ??
          (dryRun
            ? `Dry run from data operations workspace for ${operation.title}`
            : `Execution from data operations workspace for ${operation.title}`),
      });
      setActionStatus(`${result.title} completed with status ${result.status}.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Data operation failed.";
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
      const message = err instanceof Error && err.message ? err.message : "Failed to update data control.";
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
      const message = err instanceof Error && err.message ? err.message : "Failed to save data control.";
      setActionStatus(message);
    } finally {
      setFlagUpdating(null);
    }
  };

  return (
    <Stack spacing={3}>
      <GlassCard
        sx={{
          border: "1px solid var(--border)",
          background: "linear-gradient(135deg, #171c28 0%, #284056 54%, #4a6778 100%)",
          color: "common.white",
          p: 0
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ lg: "center" }} gap={3}>
            <Box>
              <Typography variant="overline" fontWeight={900} sx={{ letterSpacing: "0.15em", opacity: 0.8 }}>
                ENTERPRISE DATA ORCHESTRATION & TELEMETRY
              </Typography>
              <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1, mt: 1 }}>
                {payload?.domain.title || "Data Control Plane"}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1.5, opacity: 0.9, maxWidth: 880, fontWeight: 600 }}>
                Orchestrate maintenance, migration, and backup pipelines with real-time integrity guardrails. 
                Execute runbooks directly against the live environment with full telemetry oversight.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Chip
                label={`Status: ${payload?.domain.status?.toUpperCase() ?? "SYNCING"}`}
                color={statusTone[payload?.domain.status ?? ""] || "info"}
                variant="outlined"
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.08)", fontWeight: 900, px: 1 }}
              />
              <SoftButton
                onClick={() => void load()}
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
              >
                Sync
              </SoftButton>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1.5} mt={4} flexWrap="wrap">
            {[
              { key: "all", label: "All Data Lanes" },
              { key: "maintenance", label: "Integrity & Maintenance" },
              { key: "migration", label: "State Migration" },
              { key: "backup", label: "Resilience & Backups" },
            ].map((lane) => (
              <Chip
                key={lane.key}
                label={lane.label}
                color={activeLane === lane.key ? "primary" : "default"}
                variant={activeLane === lane.key ? "filled" : "outlined"}
                onClick={() => setActiveLane(lane.key as DataLane)}
                sx={{
                  bgcolor: activeLane === lane.key ? "white" : "rgba(255,255,255,0.06)",
                  color: activeLane === lane.key ? "#171c28" : "#fff",
                  borderColor: "rgba(255,255,255,0.3)",
                  fontWeight: 800,
                  "&:hover": { bgcolor: activeLane === lane.key ? "white" : "rgba(255,255,255,0.12)" }
                }}
              />
            ))}
          </Stack>
        </CardContent>
      </GlassCard>

      <MediaManager 
        files={[]}
        onUpload={(f) => console.log(f)}
      />

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
                    Data Signals
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Numeric signals from the current data operations payload.
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
                  <Alert severity="info">No numeric data-operation signals available yet.</Alert>
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
                    Maintenance, migration, and backup runbooks grouped by impact.
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
                    Data Controls
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enabled versus disabled data control coverage.
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
                  <Alert severity="info">No data-control coverage available.</Alert>
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
                    Current alert mix from the data-operations feed.
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
                Data Action Lanes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Each lane exposes a real runbook action, a live data-operations focus, and a persisted runtime control.
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
                                onClick={() => void toggleFlag(item.control!)}
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
        parentKey="data-management"
        parentLabel={payload?.domain.title ?? "Data Management"}
        sectionKey={activeSection}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                Data Controls
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
                          <SoftButton size="small" variant="outlined" onClick={() => setActiveSection(blueprint?.sectionKey ?? "perform-database-maintenance")}>
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
                        <SoftButton
                          size="small"
                          variant="outlined"
                          onClick={() => setActiveSection(alert.level === "success" ? "maintain-database-integrity" : "manage-platform-backups")}
                        >
                          Open Focus
                        </SoftButton>
                        {maintenanceOperation ? (
                          <SoftButton
                            size="small"
                            variant="outlined"
                            startIcon={<PreviewRoundedIcon />}
                            onClick={() => void executeOperation(maintenanceOperation, true, `Maintenance review from alert ${alert.title}`)}
                            disabled={!!runningOperationId}
                          >
                            {runningOperationId === `${maintenanceOperation.id}:dry` ? "Checking..." : "Check Integrity"}
                          </SoftButton>
                        ) : null}
                        {migrationOperation ? (
                          <SoftButton
                            size="small"
                            variant="contained"
                            startIcon={<PlayCircleRoundedIcon />}
                            onClick={() => void executeOperation(migrationOperation, false, `Migration review from alert ${alert.title}`)}
                            disabled={!!runningOperationId}
                          >
                            {runningOperationId === `${migrationOperation.id}:run` ? "Migrating..." : "Review Migration"}
                          </SoftButton>
                        ) : null}
                        {backupOperation ? (
                          <SoftButton
                            size="small"
                            variant="outlined"
                            onClick={() => void executeOperation(backupOperation, false, `Backup validation from alert ${alert.title}`)}
                            disabled={!!runningOperationId}
                          >
                            {runningOperationId === `${backupOperation.id}:run` ? "Verifying..." : "Verify Backups"}
                          </SoftButton>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Box>
                ))}

                {!loading && !(payload?.alerts.length ?? 0) ? <Alert severity="success">No active data-operation alerts right now.</Alert> : null}
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
                Data Runbooks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Execute maintenance, migration, and backup runbooks directly from the data workspace.
              </Typography>
            </Box>

            <Stack spacing={1}>
              {visibleOperations.map((operation) => {
                const lane = operationLaneMap[operation.id] ?? "maintenance";
                const sectionKey =
                  actionBlueprints.find((item) => item.operationId === operation.id)?.sectionKey ??
                  (lane === "migration" ? "execute-data-migration" : lane === "backup" ? "manage-platform-backups" : "perform-database-maintenance");
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
        <DialogTitle>Edit Data Control</DialogTitle>
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
                inputProps={{ "aria-label": "toggle data control" }}
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
