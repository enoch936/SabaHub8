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
  LinearProgress,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
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
  type AdminComplianceGauge,
  type AdminSecurityGovernanceResponse,
  type AdminThreatDistribution,
  adminCommandCenterExecuteOperation,
  adminCommandCenterUpdateFeatureFlag,
  adminSecurityGovernance,
} from "@/lib/api";

type SecurityLane = "all" | "monitoring" | "enforcement";

type SecurityQuickActionBlueprint = {
  key: string;
  title: string;
  summary: string;
  lane: Exclude<SecurityLane, "all">;
  operationId: string;
  flagKey?: string;
  icon: typeof ShieldRoundedIcon;
};

const quickActionBlueprints: SecurityQuickActionBlueprint[] = [
  {
    key: "threat-investigation",
    title: "Investigate Alerts",
    summary: "Triage suspicious activity and work active alert evidence immediately.",
    lane: "monitoring",
    operationId: "investigate-security-alerts",
    icon: ReportProblemRoundedIcon,
  },
  {
    key: "security-telemetry",
    title: "Monitor Security Events",
    summary: "Refresh platform telemetry and inspect the active threat surface.",
    lane: "monitoring",
    operationId: "monitor-security-events",
    icon: ManageSearchRoundedIcon,
  },
  {
    key: "audit-review",
    title: "Review Audit Logs",
    summary: "Inspect control-plane audit trails and access activity.",
    lane: "monitoring",
    operationId: "review-audit-logs",
    icon: PolicyRoundedIcon,
  },
  {
    key: "mfa-enforcement",
    title: "Enforce MFA",
    summary: "Apply privileged MFA policy through live security controls.",
    lane: "enforcement",
    operationId: "enforce-mfa-policy",
    flagKey: "security.enforce-mfa",
    icon: VerifiedUserRoundedIcon,
  },
  {
    key: "fraud-controls",
    title: "Fraud Detection",
    summary: "Tune fraud detection policy response and activate runtime protection.",
    lane: "enforcement",
    operationId: "configure-fraud-detection",
    flagKey: "payments.fraud-detection",
    icon: ShieldRoundedIcon,
  },
  {
    key: "privacy-baseline",
    title: "Privacy Compliance",
    summary: "Run privacy checks and apply access security policy baselines.",
    lane: "enforcement",
    operationId: "run-privacy-compliance-check",
    icon: GppGoodRoundedIcon,
  },
];

const operationLaneMap: Record<string, Exclude<SecurityLane, "all">> = {
  "monitor-security-events": "monitoring",
  "investigate-security-alerts": "monitoring",
  "review-audit-logs": "monitoring",
  "enforce-mfa-policy": "enforcement",
  "run-privacy-compliance-check": "enforcement",
  "configure-fraud-detection": "enforcement",
  "apply-access-security-policy": "enforcement",
};

const operationFlagKeyMap: Record<string, string | undefined> = {
  "enforce-mfa-policy": "security.enforce-mfa",
  "configure-fraud-detection": "payments.fraud-detection",
  "apply-access-security-policy": "security.enforce-mfa",
};

const toneColor: Record<string, string> = {
  critical: "#dc2626",
  warning: "#d97706",
  success: "#16a34a",
  info: "#0284c7",
  neutral: "#64748b",
};

const chartPalette = ["#0ea5e9", "#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

function laneFromSection(focusSection?: string | null): SecurityLane {
  if (focusSection === "threat-monitoring") {
    return "monitoring";
  }
  if (focusSection === "policy-enforcement") {
    return "enforcement";
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

function latestThreatDelta(payload: AdminSecurityGovernanceResponse | null) {
  const latest = payload?.monthlyThreats?.[payload.monthlyThreats.length - 1];
  if (!latest) {
    return "--";
  }
  const delta = latest.threats - latest.baseline;
  if (delta === 0) {
    return "On baseline";
  }
  return `${delta > 0 ? "+" : ""}${delta} vs baseline`;
}

type AdminSecurityGovernanceProps = {
  focusSection?: string | null;
};

export default function AdminSecurityGovernance({ focusSection }: AdminSecurityGovernanceProps) {
  const [payload, setPayload] = useState<AdminSecurityGovernanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [runningOperationId, setRunningOperationId] = useState<string | null>(null);
  const [flagUpdating, setFlagUpdating] = useState<string | null>(null);
  const [activeLane, setActiveLane] = useState<SecurityLane>(() => laneFromSection(focusSection));
  const [editingFlag, setEditingFlag] = useState<AdminCommandCenterFeatureFlag | null>(null);
  const [flagDraft, setFlagDraft] = useState({ enabled: false, owner: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminSecurityGovernance();
      setPayload(data);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load security governance.";
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
  const securityFlags = useMemo(
    () =>
      (payload?.featureFlags ?? []).filter((flag) =>
        /security|mfa|fraud|privacy|encryption|access/i.test(flag.key) || /security|compliance/i.test(flag.owner),
      ),
    [payload],
  );
  const flagMap = useMemo(() => new Map(securityFlags.map((flag) => [flag.key, flag])), [securityFlags]);

  const quickActions = useMemo(() => {
    return quickActionBlueprints
      .map((blueprint) => ({
        ...blueprint,
        operation: operationMap.get(blueprint.operationId) ?? null,
        flag: blueprint.flagKey ? flagMap.get(blueprint.flagKey) ?? null : null,
      }))
      .filter((action) => action.operation);
  }, [flagMap, operationMap]);

  const visibleQuickActions = useMemo(
    () => quickActions.filter((action) => activeLane === "all" || action.lane === activeLane),
    [activeLane, quickActions],
  );

  const sortedOperations = useMemo(() => {
    const ranked = [...operations].sort((left, right) => {
      const leftLane = operationLaneMap[left.id] ?? "monitoring";
      const rightLane = operationLaneMap[right.id] ?? "monitoring";
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
    return ranked;
  }, [activeLane, operations]);

  const executeOperation = async (operation: AdminCommandCenterOperation, dryRun: boolean) => {
    const opKey = `${operation.id}:${dryRun ? "dry" : "run"}`;
    setRunningOperationId(opKey);
    setActionStatus(null);
    try {
      const result = await adminCommandCenterExecuteOperation("security-monitoring-compliance", operation.id, {
        dryRun,
        note: dryRun ? "Dry run from security governance console" : "Execution from security governance console",
      });
      setActionStatus(`${result.title} finished with status ${result.status}.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Security operation failed.";
      setActionStatus(message);
    } finally {
      setRunningOperationId(null);
    }
  };

  const toggleFlag = async (flag: AdminCommandCenterFeatureFlag, enabled: boolean) => {
    setFlagUpdating(flag.key);
    setActionStatus(null);
    try {
      await adminCommandCenterUpdateFeatureFlag(flag.key, { enabled });
      setActionStatus(`Security flag ${flag.key} updated.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to update security flag.";
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
      setActionStatus(`Security flag ${editingFlag.key} saved.`);
      closeFlagEditor();
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to save security flag.";
      setActionStatus(message);
    } finally {
      setFlagUpdating(null);
    }
  };

  const topThreats = payload?.topThreats ?? [];
  const complianceGauges = payload?.complianceGauges ?? [];
  const threatChartData = topThreats.slice(0, 6);
  const monthlyThreatsData = payload?.monthlyThreats ?? [];
  const policyCoverageData = [
    {
      label: "Enabled",
      value: securityFlags.filter((flag) => flag.enabled).length,
      fill: "#16a34a",
    },
    {
      label: "Disabled",
      value: securityFlags.filter((flag) => !flag.enabled).length,
      fill: "#94a3b8",
    },
  ].filter((item) => item.value > 0);

  return (
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(7,20,36,0.14)",
          color: "common.white",
          background: "linear-gradient(135deg, #111827 0%, #163b63 52%, #0f766e 100%)",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1.2}>
              <Box>
                <Typography variant="overline" fontWeight={800} sx={{ opacity: 0.86, letterSpacing: "0.14em" }}>
                  SECURITY GOVERNANCE CONSOLE
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.04 }}>
                  {payload?.title ?? "Security Governance"}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.93, maxWidth: 860 }}>
                  Run investigations, audit reviews, MFA enforcement, fraud controls, privacy checks, and access policy
                  updates from real admin actions. Security flags are editable in place and all runbooks execute against
                  the live backend.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<ShieldRoundedIcon />}
                  label={`Status: ${group?.status ?? "loading"}`}
                  color={group?.status === "attention" ? "warning" : "success"}
                  variant="outlined"
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.42)", bgcolor: "rgba(255,255,255,0.08)" }}
                />
                <Chip
                  icon={<AdminPanelSettingsRoundedIcon />}
                  label={`Owner: ${group?.owner ?? "Security Operations"}`}
                  variant="outlined"
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.42)", bgcolor: "rgba(255,255,255,0.08)" }}
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
                { key: "all", label: "All Security Controls" },
                { key: "monitoring", label: "Threat Monitoring" },
                { key: "enforcement", label: "Policy Enforcement" },
              ].map((lane) => (
                <Chip
                  key={lane.key}
                  label={lane.label}
                  color={activeLane === lane.key ? "primary" : "default"}
                  variant={activeLane === lane.key ? "filled" : "outlined"}
                  onClick={() => setActiveLane(lane.key as SecurityLane)}
                  sx={{
                    bgcolor: activeLane === lane.key ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.32)",
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
          <Grid key={metric.id} size={{ xs: 12, sm: 6, xl: 2.4 }}>
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
                    Threat Signals
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Highest-volume threat classes in the current security window.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${threatChartData.length} classes`} />
              </Stack>
              <Box sx={{ height: 280 }}>
                {threatChartData.length > 0 ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <BarChart data={threatChartData} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="label" type="category" width={150} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {threatChartData.map((entry, index) => (
                          <Cell key={entry.label} fill={toneColor[entry.tone] ?? chartPalette[index % chartPalette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <Alert severity="info">No threat distribution data available.</Alert>
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
                    Threat Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly threat movement against the platform baseline.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={latestThreatDelta(payload)} />
              </Stack>
              <Box sx={{ height: 280 }}>
                {monthlyThreatsData.length > 0 ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <LineChart data={monthlyThreatsData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="threats" stroke="#0ea5e9" strokeWidth={2.8} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="baseline" stroke="#64748b" strokeDasharray="6 6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <Alert severity="info">No monthly trend data available.</Alert>
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
                    Compliance Scores
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Governance scorecards for the current control set.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${complianceGauges.length} controls`} />
              </Stack>
              <Box sx={{ height: 280 }}>
                {complianceGauges.length > 0 ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <BarChart data={complianceGauges} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="label" type="category" width={150} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {complianceGauges.map((entry, index) => (
                          <Cell key={entry.id} fill={toneColor[entry.tone] ?? chartPalette[index % chartPalette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <Alert severity="info">No compliance chart data available.</Alert>
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
                    Policy Coverage
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enabled versus disabled security enforcement flags.
                  </Typography>
                </Box>
                <Chip size="small" variant="outlined" label={`${securityFlags.length} policy flags`} />
              </Stack>
              <Box sx={{ height: 280 }}>
                {policyCoverageData.length > 0 ? (
                  <NoSsrResponsiveContainer fallbackHeight={280}>
                    <PieChart>
                      <Pie data={policyCoverageData} dataKey="value" nameKey="label" innerRadius={62} outerRadius={98} paddingAngle={4}>
                        {policyCoverageData.map((entry) => (
                          <Cell key={entry.label} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </NoSsrResponsiveContainer>
                ) : (
                  <Alert severity="info">No policy coverage data available.</Alert>
                )}
              </Box>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1.4}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Quick Security Actions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Investigate, enforce, and remediate directly from the security console.
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {visibleQuickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Grid key={action.key} size={{ xs: 12, md: 6 }}>
                        <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                          <CardContent>
                            <Stack spacing={1.1} sx={{ height: "100%" }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                <Box>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Icon fontSize="small" color={action.lane === "monitoring" ? "primary" : "warning"} />
                                    <Typography variant="subtitle1" fontWeight={800}>
                                      {action.title}
                                    </Typography>
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {action.summary}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={action.lane === "monitoring" ? "Monitoring" : "Enforcement"}
                                  size="small"
                                  color={action.lane === "monitoring" ? "primary" : "warning"}
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

                              {action.flag ? (
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
                                        Policy switch
                                      </Typography>
                                      <Typography variant="subtitle2" fontWeight={800} sx={{ wordBreak: "break-word" }}>
                                        {action.flag.key}
                                      </Typography>
                                    </Box>
                                    <Switch
                                      checked={action.flag.enabled}
                                      disabled={flagUpdating === action.flag.key}
                                      onChange={(event) => void toggleFlag(action.flag as AdminCommandCenterFeatureFlag, event.target.checked)}
                                      inputProps={{ "aria-label": `toggle ${action.flag.key}` }}
                                    />
                                  </Stack>
                                </Box>
                              ) : null}

                              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: "auto" }}>
                                <SoftButton
                                  variant="outlined"
                                  size="small"
                                  startIcon={<RestoreRoundedIcon />}
                                  onClick={() => void executeOperation(action.operation as AdminCommandCenterOperation, true)}
                                  disabled={loading || !!runningOperationId}
                                >
                                  {runningOperationId === `${action.operation?.id}:dry` ? "Running..." : "Dry Run"}
                                </SoftButton>
                                <SoftButton
                                  variant="contained"
                                  size="small"
                                  startIcon={<PlayCircleRoundedIcon />}
                                  onClick={() => void executeOperation(action.operation as AdminCommandCenterOperation, false)}
                                  disabled={loading || !!runningOperationId}
                                >
                                  {runningOperationId === `${action.operation?.id}:run` ? "Executing..." : "Execute"}
                                </SoftButton>
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
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack spacing={1.1}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Threat Watchlist
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Live threat priorities from the backend security feed.
                    </Typography>
                  </Box>

                  <Stack spacing={1}>
                    {topThreats.slice(0, 5).map((threat: AdminThreatDistribution) => (
                      <Box
                        key={threat.label}
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Stack spacing={0.7}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                            <Typography variant="subtitle2" fontWeight={800}>
                              {threat.label}
                            </Typography>
                            <Chip
                              label={`${threat.value} events`}
                              size="small"
                              sx={{
                                bgcolor: `${toneColor[threat.tone] ?? "#64748b"}15`,
                                color: toneColor[threat.tone] ?? "#64748b",
                              }}
                            />
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={Math.max(8, Math.min(100, threat.value))}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "rgba(148,163,184,0.18)",
                              "& .MuiLinearProgress-bar": { bgcolor: toneColor[threat.tone] ?? "#64748b" },
                            }}
                          />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </SoftCard>

            <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6" fontWeight={800}>
                    Compliance Posture
                  </Typography>
                  {complianceGauges.map((gauge: AdminComplianceGauge) => (
                    <Box
                      key={gauge.id}
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Stack spacing={0.7}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {gauge.label}
                          </Typography>
                          <Chip
                            label={`${gauge.value}%`}
                            size="small"
                            sx={{
                              bgcolor: `${toneColor[gauge.tone] ?? "#2563eb"}15`,
                              color: toneColor[gauge.tone] ?? "#2563eb",
                            }}
                          />
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(0, Math.min(100, gauge.value))}
                          sx={{
                            height: 8,
                            borderRadius: 999,
                            bgcolor: "rgba(148,163,184,0.18)",
                            "& .MuiLinearProgress-bar": { bgcolor: toneColor[gauge.tone] ?? "#2563eb" },
                          }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </SoftCard>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Security Runbook Operations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Execute the full security runbook catalog directly from this workspace.
                  </Typography>
                </Box>

                <Stack spacing={1}>
                  {sortedOperations.map((operation) => {
                    const lane = operationLaneMap[operation.id] ?? "monitoring";
                    const linkedFlag = operationFlagKeyMap[operation.id] ? flagMap.get(operationFlagKeyMap[operation.id] as string) ?? null : null;
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
                        <Stack spacing={0.8}>
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
                                label={lane === "monitoring" ? "Monitoring" : "Enforcement"}
                                size="small"
                                color={lane === "monitoring" ? "primary" : "warning"}
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
                                Edit Linked Policy
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
          <Stack spacing={2}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Stack spacing={1.2}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Security Policy Flags
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Live toggles for MFA, fraud, and related enforcement controls.
                    </Typography>
                  </Box>

                  <Stack spacing={0.9}>
                    {securityFlags.map((flag) => (
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
                          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight={800} sx={{ wordBreak: "break-word" }}>
                                {flag.key}
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
                            {flag.description}
                          </Typography>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                            <Typography variant="caption" color="text.secondary">
                              Updated {formatDateTime(flag.updatedAt)}
                            </Typography>
                            <SoftButton variant="outlined" size="small" onClick={() => openFlagEditor(flag)}>
                              Edit Metadata
                            </SoftButton>
                          </Stack>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </SoftCard>

            <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                  Active Security Alerts
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Stack spacing={1}>
                  {(payload?.alerts ?? []).map((alert) => (
                    <Alert key={alert.id} severity={alert.level === "critical" ? "error" : alert.level === "warning" ? "warning" : "success"}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {alert.title}
                      </Typography>
                      <Typography variant="body2">{alert.detail}</Typography>
                    </Alert>
                  ))}
                  {!loading && (payload?.alerts ?? []).length === 0 ? <Alert severity="success">No active security alerts.</Alert> : null}
                </Stack>
              </CardContent>
            </SoftCard>

            <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 0.8 }}>
                  Monitoring Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest monthly variance: {latestThreatDelta(payload)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                  Most recent sync: {formatDateTime(payload?.generatedAt)}
                </Typography>
              </CardContent>
            </SoftCard>
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={!!editingFlag} onClose={closeFlagEditor} fullWidth maxWidth="sm">
        <DialogTitle>Edit Security Policy Flag</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2} sx={{ mt: 0.2 }}>
            <SoftTextField label="Flag key" value={editingFlag?.key ?? ""} fullWidth disabled />
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
                    Save this dialog to persist the security flag state.
                  </Typography>
                </Box>
                <Switch
                  checked={flagDraft.enabled}
                  onChange={(event) => setFlagDraft((current) => ({ ...current, enabled: event.target.checked }))}
                  inputProps={{ "aria-label": "edit security flag enabled state" }}
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
            Save Flag
          </SoftButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
