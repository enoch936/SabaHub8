"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CardContent,
  Chip,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import AdminSectionFocus from "@/components/admin/AdminSectionFocus";
import { buildResponsibilityActionModels } from "@/lib/admin/responsibility-actions";
import {
  type AdminCommandCenterDomainResponse,
  type AdminCommandCenterFeatureFlag,
  type AdminCommandCenterOperation,
  adminCommandCenterDomain,
  adminCommandCenterExecuteOperation,
  adminCommandCenterUpdateFeatureFlag,
} from "@/lib/api";

type AdminOperationalDomainConsoleProps = {
  domainId: string;
  eyebrow: string;
  gradient: string;
  subtitle?: string;
  focusSection?: string | null;
};

const statusTone: Record<string, "success" | "warning" | "default" | "info"> = {
  operational: "success",
  attention: "warning",
  degraded: "warning",
};

export default function AdminOperationalDomainConsole({
  domainId,
  eyebrow,
  gradient,
  subtitle,
  focusSection,
}: AdminOperationalDomainConsoleProps) {
  const [payload, setPayload] = useState<AdminCommandCenterDomainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [runningOperationId, setRunningOperationId] = useState<string | null>(null);
  const [flagUpdating, setFlagUpdating] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(focusSection ?? null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminCommandCenterDomain(domainId);
      setPayload(data);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load operational domain.";
      setError(message);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setActiveSection(focusSection ?? null);
  }, [focusSection]);

  const actionModels = useMemo(
    () =>
      buildResponsibilityActionModels({
        domainId,
        responsibilities: payload?.domain.responsibilities ?? [],
        operations: payload?.domain.operations ?? [],
        featureFlags: payload?.featureFlags ?? [],
      }),
    [domainId, payload],
  );

  useEffect(() => {
    if (!activeSection && actionModels.length > 0) {
      setActiveSection(actionModels[0].key);
    }
  }, [actionModels, activeSection]);

  const heading = payload?.domain.title ?? domainId;
  const subheading = subtitle ?? payload?.domain.description ?? "Operational domain console";
  const enabledFlags = (payload?.featureFlags ?? []).filter((flag) => flag.enabled).length;

  const runOperation = async (operation: AdminCommandCenterOperation, dryRun: boolean) => {
    const opKey = `${operation.id}:${dryRun ? "dry" : "run"}`;
    setRunningOperationId(opKey);
    setActionStatus(null);
    try {
      const result = await adminCommandCenterExecuteOperation(domainId, operation.id, {
        dryRun,
        note: dryRun ? "Dry run from operational domain console" : "Execution from operational domain console",
      });
      setActionStatus(`${result.title} finished with status ${result.status}.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Runbook execution failed.";
      setActionStatus(message);
    } finally {
      setRunningOperationId(null);
    }
  };

  const toggleFlag = async (flag: AdminCommandCenterFeatureFlag) => {
    setFlagUpdating(flag.key);
    setActionStatus(null);
    try {
      await adminCommandCenterUpdateFeatureFlag(flag.key, { enabled: !flag.enabled });
      setActionStatus(`Feature flag ${flag.key} updated.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to update feature flag.";
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
          borderColor: "rgba(24,40,59,0.16)",
          background: gradient,
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.82 }}>
                  {eyebrow}
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                  {heading}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.92, maxWidth: 820 }}>
                  {subheading}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={`Status: ${payload?.domain.status ?? "loading"}`}
                  size="small"
                  color={statusTone[payload?.domain.status ?? ""] || "info"}
                  variant="outlined"
                  sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.45)" }}
                />
                <Chip
                  icon={<VerifiedRoundedIcon />}
                  label={payload?.domain.owner ?? "Operations"}
                  size="small"
                  variant="outlined"
                  sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#fff", borderColor: "rgba(255,255,255,0.35)" }}
                />
                <SoftButton
                  variant="outlined"
                  onClick={() => void load()}
                  sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
                >
                  Refresh
                </SoftButton>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </SoftCard>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionStatus ? <Alert severity="info">{actionStatus}</Alert> : null}

      <Grid container spacing={2}>
        {[
          { label: "Responsibilities", value: payload?.domain.responsibilities.length ?? 0 },
          { label: "Runbooks", value: payload?.domain.operations.length ?? 0 },
          { label: "Enabled Flags", value: enabledFlags },
          { label: "Alerts", value: payload?.alerts.length ?? 0 },
        ].map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h4" fontWeight={900}>
                  {loading ? "--" : metric.value}
                </Typography>
              </CardContent>
            </SoftCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {(loading ? Array.from({ length: 3 }).map((_, idx) => ({ id: String(idx), label: "Loading", value: "--", trend: "" })) : payload?.metrics ?? []).map((metric) => (
          <Grid key={metric.id} size={{ xs: 12, md: 4 }}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
              <CardContent>
                {loading ? (
                  <Stack spacing={1}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="32%" height={34} />
                  </Stack>
                ) : (
                  <Stack spacing={0.6}>
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800}>
                      {metric.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {metric.trend}
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </SoftCard>
          </Grid>
        ))}
      </Grid>

      <AdminSectionFocus parentKey={domainId} parentLabel={heading} sectionKey={activeSection} />

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={1.2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Operational Tracks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Each track opens live section insight and, where available, attaches a runbook or runtime control.
              </Typography>
            </Box>

            <Grid container spacing={1.3}>
              {loading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <Grid key={idx} size={{ xs: 12, md: 6 }}>
                      <Skeleton variant="rounded" height={170} />
                    </Grid>
                  ))
                : actionModels.map((item) => {
                    const isDryRunning = runningOperationId === `${item.operation?.id}:dry`;
                    const isRunning = runningOperationId === `${item.operation?.id}:run`;
                    return (
                      <Grid key={item.key} size={{ xs: 12, md: 6 }}>
                        <Box
                          sx={{
                            p: 1.3,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: activeSection === item.key ? "primary.main" : "divider",
                            bgcolor: activeSection === item.key ? "rgba(59,130,246,0.06)" : "background.paper",
                            height: "100%",
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={800}>
                                  {item.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {item.summary}
                                </Typography>
                              </Box>
                              <Stack spacing={0.7} alignItems="flex-end">
                                {item.operation ? <Chip label={item.operation.impact} size="small" variant="outlined" /> : null}
                                {item.flag ? (
                                  <Chip
                                    label={item.flag.enabled ? `${item.flag.key} on` : `${item.flag.key} off`}
                                    size="small"
                                    color={item.flag.enabled ? "success" : "default"}
                                    variant="outlined"
                                  />
                                ) : null}
                              </Stack>
                            </Stack>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                              <SoftButton
                                variant={activeSection === item.key ? "contained" : "outlined"}
                                size="small"
                                startIcon={<BoltRoundedIcon />}
                                onClick={() => setActiveSection(item.key)}
                              >
                                {activeSection === item.key ? "Focused" : "Open Focus"}
                              </SoftButton>
                              {item.operation ? (
                                <SoftButton
                                  variant="outlined"
                                  size="small"
                                  startIcon={<PreviewRoundedIcon />}
                                  onClick={() => void runOperation(item.operation as AdminCommandCenterOperation, true)}
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
                                  onClick={() => void runOperation(item.operation as AdminCommandCenterOperation, false)}
                                  disabled={!!runningOperationId}
                                >
                                  {isRunning ? "Executing..." : "Execute"}
                                </SoftButton>
                              ) : null}
                              {item.flag ? (
                                <SoftButton
                                  variant={item.flag.enabled ? "outlined" : "contained"}
                                  size="small"
                                  color={item.flag.enabled ? "inherit" : "success"}
                                  startIcon={<TuneRoundedIcon />}
                                  onClick={() => void toggleFlag(item.flag as AdminCommandCenterFeatureFlag)}
                                  disabled={flagUpdating === item.flag.key}
                                >
                                  {flagUpdating === item.flag.key ? "Updating..." : item.flag.enabled ? "Disable Flag" : "Enable Flag"}
                                </SoftButton>
                              ) : null}
                            </Stack>
                          </Stack>
                        </Box>
                      </Grid>
                    );
                  })}
            </Grid>
          </Stack>
        </CardContent>
      </SoftCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                Runtime Controls
              </Typography>
              <Stack spacing={0.9}>
                {(payload?.featureFlags ?? []).map((flag) => (
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
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                          {flag.key}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {flag.description}
                        </Typography>
                      </Box>
                      <Switch
                        checked={flag.enabled}
                        disabled={flagUpdating === flag.key}
                        onChange={() => void toggleFlag(flag)}
                        inputProps={{ "aria-label": `toggle ${flag.key}` }}
                      />
                    </Stack>
                  </Box>
                ))}
                {!loading && !(payload?.featureFlags.length ?? 0) ? (
                  <Typography variant="body2" color="text.secondary">
                    No feature flags are published for this domain yet.
                  </Typography>
                ) : null}
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
                  <Alert key={alert.id} severity={alert.level === "critical" ? "error" : alert.level === "warning" ? "warning" : "success"}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {alert.title}
                    </Typography>
                    <Typography variant="body2">{alert.detail}</Typography>
                  </Alert>
                ))}
                {!loading && !(payload?.alerts.length ?? 0) ? (
                  <Alert severity="success">No active alerts for this domain right now.</Alert>
                ) : null}
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
