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
import DataObjectRoundedIcon from "@mui/icons-material/DataObjectRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import SyncProblemRoundedIcon from "@mui/icons-material/SyncProblemRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";
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
import NoSsrResponsiveContainer from "@/components/charts/NoSsrResponsiveContainer";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type AdminCommandCenterFeatureFlag,
  type AdminCommandCenterOperation,
  type AdminPlatformControlResponse,
  adminCommandCenterExecuteOperation,
  adminCommandCenterUpdateFeatureFlag,
  adminPlatformControl,
} from "@/lib/api";

type ControlLane = "all" | "governance" | "delivery" | "runtime" | "edge" | "resilience";

type PlaybookActionBlueprint = {
  key: string;
  title: string;
  summary: string;
  lane: Exclude<ControlLane, "all">;
  operationId: string;
  flagKey?: string;
  icon: typeof SettingsSuggestRoundedIcon;
};

type PlatformFlagBlueprint = {
  key: string;
  title: string;
  summary: string;
  lane: Exclude<ControlLane, "all">;
  defaultEnabled: boolean;
  owner: string;
  description: string;
};

const laneDefinitions: Array<{ key: Exclude<ControlLane, "all">; label: string; fill: string }> = [
  { key: "governance", label: "Governance", fill: "#2563eb" },
  { key: "delivery", label: "Delivery", fill: "#7c3aed" },
  { key: "runtime", label: "Runtime", fill: "#0f766e" },
  { key: "edge", label: "Edge", fill: "#0891b2" },
  { key: "resilience", label: "Resilience", fill: "#d97706" },
];

const laneFill = Object.fromEntries(laneDefinitions.map((lane) => [lane.key, lane.fill])) as Record<Exclude<ControlLane, "all">, string>;
const chartPalette = ["#2563eb", "#7c3aed", "#0f766e", "#0891b2", "#d97706", "#dc2626", "#14b8a6"];

const platformFlagBlueprints: PlatformFlagBlueprint[] = [
  {
    key: "platform.rbac-enforcement",
    title: "RBAC Enforcement",
    summary: "Protect privileged administration with enforced RBAC and IAM policy.",
    lane: "governance",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Enforce RBAC and IAM protections for platform administration.",
  },
  {
    key: "platform.infrastructure.guardrails",
    title: "Infrastructure Guardrails",
    summary: "Protect production infrastructure changes with platform guardrails.",
    lane: "governance",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Infrastructure guardrails for production resources.",
  },
  {
    key: "platform.config-live-reload",
    title: "Config Live Reload",
    summary: "Allow centralized configuration changes without redeployment.",
    lane: "governance",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Allow centralized configuration updates to reload without redeployment.",
  },
  {
    key: "platform.feature-targeting",
    title: "Feature Targeting",
    summary: "Support staged rollout, segmentation, and kill-switch control.",
    lane: "governance",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Enable gradual rollout and feature targeting controls.",
  },
  {
    key: "devops.safe-deployments",
    title: "Safe Deployments",
    summary: "Protect delivery with staged deployment guardrails.",
    lane: "delivery",
    defaultEnabled: true,
    owner: "DevOps",
    description: "Enable staged canary deployment guardrails.",
  },
  {
    key: "platform.environment-sync",
    title: "Environment Sync",
    summary: "Protect secure environment synchronization across stages.",
    lane: "delivery",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Enforce secure environment synchronization across delivery stages.",
  },
  {
    key: "platform.ha-failover",
    title: "HA Failover",
    summary: "Protect uptime with failover and autoscaling readiness controls.",
    lane: "runtime",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Protect uptime with failover and high-availability guardrails.",
  },
  {
    key: "platform.service-discovery",
    title: "Service Discovery",
    summary: "Protect dependency routing and service-discovery behavior.",
    lane: "runtime",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Protect service discovery and dependency resolution controls.",
  },
  {
    key: "platform.global-thresholds",
    title: "Global Thresholds",
    summary: "Apply centralized timeout, retry, and limit policies.",
    lane: "runtime",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Apply centralized timeout, retry, and threshold policy controls.",
  },
  {
    key: "platform.endpoint-security",
    title: "Endpoint Security",
    summary: "Protect service endpoints and edge exposure policies.",
    lane: "edge",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Protect service endpoints and gateway edge policies.",
  },
  {
    key: "platform.backup-encryption",
    title: "Backup Encryption",
    summary: "Require encrypted backup posture before high-risk operations.",
    lane: "resilience",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Require encrypted backup and restore-readiness controls.",
  },
  {
    key: "platform.dr-drills",
    title: "DR Drills",
    summary: "Track disaster-recovery drill, failover, and readiness posture.",
    lane: "resilience",
    defaultEnabled: true,
    owner: "Platform Administration",
    description: "Track disaster-recovery drill and failover readiness controls.",
  },
];

const playbookActionBlueprints: PlaybookActionBlueprint[] = [
  {
    key: "administer-platform",
    title: "Administer Platform",
    summary: "Operate architecture, metrics, RBAC, compliance, and audit controls from one command surface.",
    lane: "governance",
    operationId: "administer-platform",
    flagKey: "platform.rbac-enforcement",
    icon: SettingsSuggestRoundedIcon,
  },
  {
    key: "deploy-system-updates",
    title: "Deploy System Updates",
    summary: "Run validated rolling, blue-green, or canary update workflows with deployment guardrails.",
    lane: "delivery",
    operationId: "deploy-system-updates",
    flagKey: "devops.safe-deployments",
    icon: UpdateRoundedIcon,
  },
  {
    key: "perform-system-rollback",
    title: "Perform System Rollback",
    summary: "Revert to the last stable version and validate integrity after rollback.",
    lane: "resilience",
    operationId: "perform-system-rollback",
    flagKey: "platform.infrastructure.guardrails",
    icon: SyncProblemRoundedIcon,
  },
  {
    key: "manage-platform-configurations",
    title: "Manage Platform Configurations",
    summary: "Apply centralized configuration changes and validate live reload across environments.",
    lane: "governance",
    operationId: "manage-platform-configurations",
    flagKey: "platform.config-live-reload",
    icon: DataObjectRoundedIcon,
  },
  {
    key: "control-feature-flags",
    title: "Control Feature Flags",
    summary: "Toggle, segment, and monitor features without redeployment.",
    lane: "governance",
    operationId: "control-feature-flags",
    flagKey: "platform.feature-targeting",
    icon: SettingsSuggestRoundedIcon,
  },
  {
    key: "maintain-system-uptime",
    title: "Maintain System Uptime",
    summary: "Operate HA, failover, autoscaling, and SLA/SLO uptime protection.",
    lane: "runtime",
    operationId: "maintain-system-uptime",
    flagKey: "platform.ha-failover",
    icon: MonitorHeartRoundedIcon,
  },
  {
    key: "manage-service-dependencies",
    title: "Manage Service Dependencies",
    summary: "Track inter-service communication and dependency safety to prevent cascading failures.",
    lane: "runtime",
    operationId: "manage-service-dependencies",
    flagKey: "platform.service-discovery",
    icon: HubRoundedIcon,
  },
  {
    key: "perform-environment-configuration",
    title: "Perform Environment Configuration",
    summary: "Synchronize environment baselines, variables, and provisioning controls across stages.",
    lane: "delivery",
    operationId: "perform-environment-configuration",
    flagKey: "platform.environment-sync",
    icon: PublishedWithChangesRoundedIcon,
  },
  {
    key: "configure-global-platform-settings",
    title: "Configure Global Platform Settings",
    summary: "Apply system-wide timeouts, retries, limits, thresholds, and shared policies.",
    lane: "governance",
    operationId: "configure-global-platform-settings",
    flagKey: "platform.global-thresholds",
    icon: SettingsSuggestRoundedIcon,
  },
  {
    key: "manage-microservices-lifecycle",
    title: "Manage Microservices Lifecycle",
    summary: "Handle service creation, rollout, scaling, restart, and lifecycle compatibility.",
    lane: "runtime",
    operationId: "manage-microservices-lifecycle",
    flagKey: "platform.infrastructure.guardrails",
    icon: HubRoundedIcon,
  },
  {
    key: "manage-application-infrastructure",
    title: "Manage Application Infrastructure",
    summary: "Operate servers, containers, networking, and secure resource utilization.",
    lane: "runtime",
    operationId: "manage-application-infrastructure",
    flagKey: "platform.infrastructure.guardrails",
    icon: StorageRoundedIcon,
  },
  {
    key: "configure-service-endpoints",
    title: "Configure Service Endpoints",
    summary: "Manage internal and external endpoints with auth, versioning, and exposure controls.",
    lane: "edge",
    operationId: "configure-service-endpoints",
    flagKey: "platform.endpoint-security",
    icon: DataObjectRoundedIcon,
  },
  {
    key: "manage-api-gateway-config",
    title: "Manage API Gateway Configuration",
    summary: "Apply routing, caching, rate limiting, and gateway auth policies.",
    lane: "edge",
    operationId: "manage-api-gateway-config",
    flagKey: "platform.endpoint-security",
    icon: ApiRoundedIcon,
  },
  {
    key: "manage-system-backups",
    title: "Manage System Backups",
    summary: "Validate encrypted full and incremental backup posture and restore readiness.",
    lane: "resilience",
    operationId: "manage-system-backups",
    flagKey: "platform.backup-encryption",
    icon: StorageRoundedIcon,
  },
  {
    key: "perform-disaster-recovery",
    title: "Perform Disaster Recovery Operations",
    summary: "Run failover, regional recovery, RTO/RPO, and drill-readiness procedures.",
    lane: "resilience",
    operationId: "perform-disaster-recovery",
    flagKey: "platform.dr-drills",
    icon: WarningAmberRoundedIcon,
  },
];

const operationLaneMap = Object.fromEntries(playbookActionBlueprints.map((item) => [item.operationId, item.lane])) as Record<
  string,
  Exclude<ControlLane, "all">
>;
const operationFlagKeyMap = Object.fromEntries(
  playbookActionBlueprints.filter((item) => item.flagKey).map((item) => [item.operationId, item.flagKey as string]),
) as Record<string, string>;
const operationOrderMap = new Map(playbookActionBlueprints.map((item, index) => [item.operationId, index]));

function laneFromSection(focusSection?: string | null): ControlLane {
  if (focusSection === "runtime-controls") {
    return "runtime";
  }
  if (focusSection === "recovery-operations") {
    return "resilience";
  }
  if (focusSection === "delivery-operations") {
    return "delivery";
  }
  if (focusSection === "edge-controls") {
    return "edge";
  }
  if (focusSection === "governance-controls") {
    return "governance";
  }
  return "all";
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

type AdminPlatformControlProps = {
  focusSection?: string | null;
};

export default function AdminPlatformControl({ focusSection }: AdminPlatformControlProps) {
  const [payload, setPayload] = useState<AdminPlatformControlResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [runningOperationId, setRunningOperationId] = useState<string | null>(null);
  const [flagUpdating, setFlagUpdating] = useState<string | null>(null);
  const [activeLane, setActiveLane] = useState<ControlLane>(() => laneFromSection(focusSection));
  const [editingFlag, setEditingFlag] = useState<AdminCommandCenterFeatureFlag | null>(null);
  const [flagDraft, setFlagDraft] = useState({ enabled: false, owner: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminPlatformControl();
      setPayload(data);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load platform control.";
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
  }, [focusSection]);

  const group = useMemo(() => payload?.capabilityGroups[0] ?? null, [payload]);
  const operations = useMemo(() => group?.operations ?? [], [group]);
  const operationMap = useMemo(() => new Map(operations.map((operation) => [operation.id, operation])), [operations]);
  const flagMap = useMemo(() => new Map((payload?.featureFlags ?? []).map((flag) => [flag.key, flag])), [payload?.featureFlags]);

  const platformFlags = useMemo(() => {
    return platformFlagBlueprints.map<AdminCommandCenterFeatureFlag>((blueprint) => {
      const existing = flagMap.get(blueprint.key);
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
  }, [flagMap]);

  const platformFlagMap = useMemo(() => new Map(platformFlags.map((flag) => [flag.key, flag])), [platformFlags]);

  const playbookActions = useMemo(() => {
    return playbookActionBlueprints
      .map((blueprint) => ({
        ...blueprint,
        operation: operationMap.get(blueprint.operationId) ?? null,
        linkedFlag: blueprint.flagKey ? platformFlagMap.get(blueprint.flagKey) ?? null : null,
      }))
      .filter((item) => item.operation);
  }, [operationMap, platformFlagMap]);

  const visiblePlaybookActions = useMemo(
    () => playbookActions.filter((item) => activeLane === "all" || item.lane === activeLane),
    [activeLane, playbookActions],
  );

  const sortedOperations = useMemo(() => {
    return [...operations].sort((left, right) => {
      const leftOrder = operationOrderMap.get(left.id) ?? 999;
      const rightOrder = operationOrderMap.get(right.id) ?? 999;
      if (activeLane !== "all") {
        const leftLane = operationLaneMap[left.id];
        const rightLane = operationLaneMap[right.id];
        if (leftLane === activeLane && rightLane !== activeLane) {
          return -1;
        }
        if (leftLane !== activeLane && rightLane === activeLane) {
          return 1;
        }
      }
      return leftOrder - rightOrder;
    });
  }, [activeLane, operations]);

  const generatedAtLabel = useMemo(() => formatDateTime(payload?.generatedAt), [payload?.generatedAt]);
  const enabledControls = useMemo(() => platformFlags.filter((flag) => flag.enabled).length, [platformFlags]);

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

  const operationMixData = useMemo(
    () =>
      laneDefinitions.map((lane) => ({
        label: lane.label,
        value: operations.filter((operation) => operationLaneMap[operation.id] === lane.key).length,
        fill: lane.fill,
      })),
    [operations],
  );

  const flagCoverageData = useMemo(
    () =>
      [
        { label: "Enabled", value: platformFlags.filter((flag) => flag.enabled).length, fill: "#16a34a" },
        { label: "Disabled", value: platformFlags.filter((flag) => !flag.enabled).length, fill: "#94a3b8" },
      ].filter((item) => item.value > 0),
    [platformFlags],
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

  const executeOperation = async (operation: AdminCommandCenterOperation, dryRun: boolean, note?: string) => {
    const key = `${operation.id}:${dryRun ? "dry" : "run"}`;
    setRunningOperationId(key);
    setActionStatus(null);

    try {
      const result = await adminCommandCenterExecuteOperation("platform-administration", operation.id, {
        dryRun,
        note:
          note ??
          (dryRun
            ? `Dry run from platform control console for ${operation.title}`
            : `Execution from platform control console for ${operation.title}`),
      });
      setActionStatus(`${result.title} completed with status ${result.status}.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to execute platform runbook.";
      setActionStatus(message);
    } finally {
      setRunningOperationId(null);
    }
  };

  const toggleFlag = async (flag: AdminCommandCenterFeatureFlag, enabled: boolean) => {
    setFlagUpdating(flag.key);
    setActionStatus(null);
    try {
      await adminCommandCenterUpdateFeatureFlag(flag.key, {
        enabled,
        owner: flag.owner,
        description: flag.description,
      });
      setActionStatus(`Operational control ${flag.key} updated.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to update operational control.";
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
      setActionStatus(`Operational control ${editingFlag.key} saved.`);
      closeFlagEditor();
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to save operational control.";
      setActionStatus(message);
    } finally {
      setFlagUpdating(null);
    }
  };

  const uptimeOperation = operationMap.get("maintain-system-uptime") ?? null;
  const rollbackOperation = operationMap.get("perform-system-rollback") ?? null;
  const drOperation = operationMap.get("perform-disaster-recovery") ?? null;
  const backupOperation = operationMap.get("manage-system-backups") ?? null;

  return (
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(7,20,36,0.14)",
          color: "common.white",
          background: "linear-gradient(135deg, #081a2e 0%, #12365c 52%, #1c6582 100%)",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1.2}>
              <Box>
                <Typography variant="overline" fontWeight={800} sx={{ opacity: 0.86, letterSpacing: "0.14em" }}>
                  ENTERPRISE PLATFORM ADMINISTRATION
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.04 }}>
                  {payload?.title ?? "Platform Control"}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.93, maxWidth: 860 }}>
                  Every playbook responsibility is exposed here as a real admin action. Run audited platform operations,
                  update persisted controls, validate release safety, and respond to live platform risk without falling
                  back to responsibility-definition text.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={`Status: ${group?.status ?? "loading"}`}
                  color={group?.status === "attention" ? "warning" : "success"}
                  variant="outlined"
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.08)" }}
                />
                <Chip
                  label={`Runbooks: ${operations.length}`}
                  variant="outlined"
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.08)" }}
                />
                <Chip
                  label={`Controls: ${enabledControls}/${platformFlags.length}`}
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
              {[{ key: "all", label: "All Controls" }, ...laneDefinitions].map((lane) => (
                <Chip
                  key={lane.key}
                  label={lane.label}
                  color={activeLane === lane.key ? "primary" : "default"}
                  variant={activeLane === lane.key ? "filled" : "outlined"}
                  onClick={() => setActiveLane(lane.key as ControlLane)}
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
          <Grid key={metric.id} size={{ xs: 12, sm: 6, xl: 3 }}>
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
                    Platform Signals
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Numeric platform metrics from the current control payload.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${metricChartData.length} metrics`} />
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
                  <Alert severity="info">No numeric metric chart data available.</Alert>
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
                    Playbook Mix
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Distribution of platform operations across governance, delivery, runtime, edge, and resilience.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${operations.length} runbooks`} />
              </Stack>
              <Box sx={{ height: 280 }}>
                <NoSsrResponsiveContainer fallbackHeight={280}>
                  <BarChart data={operationMixData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={56} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {operationMixData.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
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
                    Control Coverage
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enabled versus disabled enterprise platform controls.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${platformFlags.length} controls`} />
              </Stack>
              <Box sx={{ height: 280 }}>
                {flagCoverageData.length > 0 ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <PieChart>
                      <Pie data={flagCoverageData} dataKey="value" nameKey="label" innerRadius={62} outerRadius={98} paddingAngle={4}>
                        {flagCoverageData.map((entry) => (
                          <Cell key={entry.label} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <Alert severity="info">No operational control data available.</Alert>
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
                    Current alert distribution from the platform control feed.
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
                  <Alert severity="info">No alert severity chart data available.</Alert>
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
                Operational Playbook
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Every platform-administration responsibility is executable here as a runbook-backed operation.
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {visiblePlaybookActions.map((action) => {
                const Icon = action.icon;
                const laneColor = laneFill[action.lane];
                return (
                  <Grid key={action.key} size={{ xs: 12, md: 6, xl: 4 }}>
                    <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                      <CardContent>
                        <Stack spacing={1.2} sx={{ height: "100%" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 2,
                                  display: "grid",
                                  placeItems: "center",
                                  bgcolor: `${laneColor}14`,
                                  color: laneColor,
                                  flexShrink: 0,
                                }}
                              >
                                <Icon fontSize="small" />
                              </Box>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={800}>
                                  {action.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {action.summary}
                                </Typography>
                              </Box>
                            </Stack>
                            <Chip
                              label={laneDefinitions.find((lane) => lane.key === action.lane)?.label ?? action.lane}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: `${laneColor}66`, color: laneColor }}
                            />
                          </Stack>

                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              Runbook
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={800}>
                              {action.operation?.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {action.operation?.description}
                            </Typography>
                          </Box>

                          {action.linkedFlag ? (
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "background.paper",
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Linked control
                                  </Typography>
                                  <Typography variant="subtitle2" fontWeight={800} sx={{ wordBreak: "break-word" }}>
                                    {action.linkedFlag.key}
                                  </Typography>
                                </Box>
                                <Switch
                                  checked={action.linkedFlag.enabled}
                                  disabled={flagUpdating === action.linkedFlag.key}
                                  onChange={(event) => void toggleFlag(action.linkedFlag!, event.target.checked)}
                                  inputProps={{ "aria-label": `toggle ${action.linkedFlag.key}` }}
                                />
                              </Stack>
                            </Box>
                          ) : null}

                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: "auto" }}>
                            <SoftButton
                              variant="outlined"
                              size="small"
                              startIcon={<RestoreRoundedIcon />}
                              onClick={() => void executeOperation(action.operation!, true)}
                              disabled={loading || !!runningOperationId}
                            >
                              {runningOperationId === `${action.operation?.id}:dry` ? "Running..." : "Dry Run"}
                            </SoftButton>
                            <SoftButton
                              variant="contained"
                              size="small"
                              startIcon={<PlayCircleRoundedIcon />}
                              onClick={() => void executeOperation(action.operation!, false)}
                              disabled={loading || !!runningOperationId}
                            >
                              {runningOperationId === `${action.operation?.id}:run` ? "Executing..." : "Execute"}
                            </SoftButton>
                            {action.linkedFlag ? (
                              <SoftButton variant="outlined" size="small" onClick={() => openFlagEditor(action.linkedFlag!)}>
                                Edit Control
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

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Runbook Operations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Execute the full enterprise platform-administration runbook set directly from the control plane.
                  </Typography>
                </Box>

                <Stack spacing={1}>
                  {sortedOperations.map((operation) => {
                    const linkedFlag = operationFlagKeyMap[operation.id] ? platformFlagMap.get(operationFlagKeyMap[operation.id]) ?? null : null;
                    const lane = operationLaneMap[operation.id] ?? "governance";
                    const laneColor = laneFill[lane];
                    const dryId = `${operation.id}:dry`;
                    const runId = `${operation.id}:run`;

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
                        <Stack spacing={0.9}>
                          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800}>
                                {operation.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {operation.description}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                              <Chip label={`Impact: ${operation.impact}`} size="small" variant="outlined" />
                              <Chip
                                label={laneDefinitions.find((item) => item.key === lane)?.label ?? lane}
                                size="small"
                                variant="outlined"
                                sx={{ borderColor: `${laneColor}66`, color: laneColor }}
                              />
                              {linkedFlag ? (
                                <Chip
                                  label={`${linkedFlag.key}: ${linkedFlag.enabled ? "On" : "Off"}`}
                                  size="small"
                                  color={linkedFlag.enabled ? "success" : "default"}
                                  variant="outlined"
                                />
                              ) : null}
                            </Stack>
                          </Stack>

                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                            <SoftButton
                              variant="outlined"
                              size="small"
                              startIcon={<RestoreRoundedIcon />}
                              onClick={() => void executeOperation(operation, true)}
                              disabled={loading || !!runningOperationId}
                            >
                              {runningOperationId === dryId ? "Running Dry Run..." : "Dry Run"}
                            </SoftButton>
                            <SoftButton
                              variant="contained"
                              size="small"
                              startIcon={<PlayCircleRoundedIcon />}
                              onClick={() => void executeOperation(operation, false)}
                              disabled={loading || !!runningOperationId}
                            >
                              {runningOperationId === runId ? "Executing..." : "Execute"}
                            </SoftButton>
                            {linkedFlag ? (
                              <SoftButton variant="outlined" size="small" onClick={() => openFlagEditor(linkedFlag)}>
                                Edit Linked Control
                              </SoftButton>
                            ) : null}
                          </Stack>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Operational Controls
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Persisted platform-control switches aligned to the operational playbook.
                  </Typography>
                </Box>

                <Stack spacing={0.9}>
                  {platformFlags.map((flag) => {
                    const blueprint = platformFlagBlueprints.find((item) => item.key === flag.key);
                    const lane = blueprint?.lane ?? "governance";
                    const laneColor = laneFill[lane];
                    return (
                      <Box
                        key={flag.key}
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Stack spacing={0.8}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight={800} sx={{ wordBreak: "break-word" }}>
                                {blueprint?.title ?? flag.key}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {flag.owner}
                              </Typography>
                            </Box>
                            <Switch
                              checked={flag.enabled}
                              disabled={flagUpdating === flag.key}
                              onChange={(event) => void toggleFlag(flag, event.target.checked)}
                              inputProps={{ "aria-label": `toggle ${flag.key}` }}
                            />
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            {blueprint?.summary ?? flag.description}
                          </Typography>

                          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                            <Chip
                              label={laneDefinitions.find((item) => item.key === lane)?.label ?? lane}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: `${laneColor}66`, color: laneColor }}
                            />
                            <SoftButton variant="outlined" size="small" onClick={() => openFlagEditor(flag)}>
                              Edit Metadata
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
        </Grid>
      </Grid>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
            Active Alerts
          </Typography>
          <Divider sx={{ mb: 1.2 }} />
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
                      color={alert.level === "critical" ? "error" : alert.level === "warning" ? "warning" : "success"}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                    {uptimeOperation ? (
                      <SoftButton
                        size="small"
                        variant="outlined"
                        startIcon={<PreviewRoundedIcon />}
                        onClick={() => void executeOperation(uptimeOperation, true, `Uptime validation from alert ${alert.title}`)}
                        disabled={!!runningOperationId}
                      >
                        {runningOperationId === `${uptimeOperation.id}:dry` ? "Checking..." : "Validate Uptime"}
                      </SoftButton>
                    ) : null}
                    {rollbackOperation ? (
                      <SoftButton
                        size="small"
                        variant="outlined"
                        onClick={() => void executeOperation(rollbackOperation, true, `Rollback readiness check from alert ${alert.title}`)}
                        disabled={!!runningOperationId}
                      >
                        {runningOperationId === `${rollbackOperation.id}:dry` ? "Reviewing..." : "Check Rollback"}
                      </SoftButton>
                    ) : null}
                    {backupOperation ? (
                      <SoftButton
                        size="small"
                        variant="outlined"
                        onClick={() => void executeOperation(backupOperation, true, `Backup validation from alert ${alert.title}`)}
                        disabled={!!runningOperationId}
                      >
                        {runningOperationId === `${backupOperation.id}:dry` ? "Validating..." : "Validate Backups"}
                      </SoftButton>
                    ) : null}
                    {alert.level !== "success" && drOperation ? (
                      <SoftButton
                        size="small"
                        variant="contained"
                        startIcon={<PlayCircleRoundedIcon />}
                        onClick={() => void executeOperation(drOperation, false, `Disaster recovery response from alert ${alert.title}`)}
                        disabled={!!runningOperationId}
                      >
                        {runningOperationId === `${drOperation.id}:run` ? "Executing..." : "Open DR Response"}
                      </SoftButton>
                    ) : null}
                  </Stack>
                </Stack>
              </Box>
            ))}
            {!loading && (payload?.alerts ?? []).length === 0 ? <Alert severity="success">No active platform alerts.</Alert> : null}
          </Stack>
        </CardContent>
      </SoftCard>

      <Dialog open={!!editingFlag} onClose={closeFlagEditor} fullWidth maxWidth="sm">
        <DialogTitle>Edit Operational Control</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2} sx={{ mt: 0.2 }}>
            <SoftTextField label="Control key" value={editingFlag?.key ?? ""} fullWidth disabled />
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
              fullWidth
              multiline
              minRows={3}
            />
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Enabled
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Save this dialog to persist the operational control state.
                  </Typography>
                </Box>
                <Switch
                  checked={flagDraft.enabled}
                  onChange={(event) => setFlagDraft((current) => ({ ...current, enabled: event.target.checked }))}
                  inputProps={{ "aria-label": "edit operational control enabled state" }}
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="text" onClick={closeFlagEditor} disabled={!!flagUpdating && flagUpdating === editingFlag?.key}>
            Cancel
          </SoftButton>
          <SoftButton
            variant="contained"
            onClick={() => void saveFlagEditor()}
            disabled={!!flagUpdating && flagUpdating === editingFlag?.key}
          >
            Save Control
          </SoftButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
