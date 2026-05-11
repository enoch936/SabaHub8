"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import SettingsBackupRestoreRoundedIcon from "@mui/icons-material/SettingsBackupRestoreRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import AdminResponsibilityActionGrid from "@/components/admin/AdminResponsibilityActionGrid";
import AdminSectionFocus from "@/components/admin/AdminSectionFocus";
import {
  type AdminCommandCenterDomainResponse,
  type AdminCommandCenterFeatureFlag,
  type AdminCommandCenterOperation,
  adminCommandCenterDomain,
  adminCommandCenterUpdateFeatureFlag,
  adminCommandCenterExecuteOperation,
} from "@/lib/api";

type AdminDomainWorkspaceProps = {
  domainId: string;
  title?: string;
  subtitle?: string;
  focusSection?: string | null;
};

const statusTone: Record<string, "success" | "warning" | "default" | "info"> = {
  operational: "success",
  attention: "warning",
  degraded: "warning",
};

export default function AdminDomainWorkspace({ domainId, title, subtitle, focusSection }: AdminDomainWorkspaceProps) {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<AdminCommandCenterDomainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [runningOperationId, setRunningOperationId] = useState<string | null>(null);
  const [flagUpdating, setFlagUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminCommandCenterDomain(domainId);
      setPayload(data);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load admin domain.";
      setError(message);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    void load();
  }, [load]);

  const heading = title || payload?.domain.title || domainId;
  const subheading = subtitle || payload?.domain.description || "Enterprise admin operations workspace";
  const activeSection = focusSection ?? searchParams.get("section");

  const responsibilities = useMemo(() => payload?.domain.responsibilities ?? [], [payload]);
  const featureFlags = useMemo(() => payload?.featureFlags ?? [], [payload]);

  const runOperation = async (operation: AdminCommandCenterOperation, dryRun: boolean) => {
    setRunningOperationId(operation.id + (dryRun ? ":dry" : ":run"));
    setActionStatus(null);
    try {
      const result = await adminCommandCenterExecuteOperation(domainId, operation.id, {
        dryRun,
        note: dryRun ? "Dry run initiated from admin domain workspace" : "Operation executed from admin domain workspace",
      });
      setActionStatus(`Operation ${result.title} finished with status: ${result.status}`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Operation execution failed.";
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
          borderColor: "divider",
          background:
            "linear-gradient(140deg, rgba(4,56,115,0.92) 0%, rgba(0,91,186,0.84) 45%, rgba(14,165,233,0.8) 100%)",
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack spacing={1.1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Box>
                <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: "-0.02em" }}>
                  {heading}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.93 }}>
                  {subheading}
                </Typography>
              </Box>
              <Chip
                icon={<VerifiedUserRoundedIcon />}
                label={`Status: ${payload?.domain.status ?? "loading"}`}
                size="small"
                color={statusTone[payload?.domain.status ?? ""] || "info"}
                variant="outlined"
                sx={{
                  bgcolor: "rgba(255,255,255,0.1)",
                  color: "white",
                  borderColor: "rgba(255,255,255,0.45)",
                }}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <SoftButton component={Link} href="/admin" variant="contained" sx={{ bgcolor: "#ffffff", color: "#043873" }}>
                Back To Overview
              </SoftButton>
              <SoftButton
                onClick={() => void load()}
                variant="outlined"
                sx={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.8)" }}
              >
                Refresh Domain
              </SoftButton>
            </Stack>
          </Stack>
        </CardContent>
      </SoftCard>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionStatus ? <Alert severity="info">{actionStatus}</Alert> : null}
      <AdminSectionFocus parentKey={domainId} parentLabel={heading} sectionKey={activeSection} />

      <Grid container spacing={2}>
        {(loading ? Array.from({ length: 3 }).map((_, idx) => ({ id: String(idx), label: "Loading", value: "--", trend: "" })) : payload?.metrics ?? []).map((metric) => (
          <Grid key={metric.id} size={{ xs: 12, md: 4 }}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
              <CardContent>
                {loading ? (
                  <Stack spacing={1}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="30%" height={36} />
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

      {loading ? (
        <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Stack spacing={1}>
              <Skeleton variant="text" width={220} height={34} />
              <Skeleton variant="text" width={460} />
              <Grid container spacing={1}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Grid key={idx} size={{ xs: 12, md: 6, xl: 4 }}>
                    <Skeleton variant="rounded" height={180} />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </CardContent>
        </SoftCard>
      ) : (
        <AdminResponsibilityActionGrid
          domainId={domainId}
          responsibilities={responsibilities}
          operations={payload?.domain.operations ?? []}
          featureFlags={featureFlags}
          activeSection={activeSection}
          runningOperationId={runningOperationId}
          flagUpdating={flagUpdating}
          title="Responsibility Actions"
          subtitle="Every responsibility now opens live focus data and, when available, direct runbook or control actions."
          emptyDetail="No responsibility actions are available for this domain."
          onRunOperation={runOperation}
          onToggleFlag={toggleFlag}
        />
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.1 }}>
                Runbook Operations
              </Typography>
              <Stack spacing={1.1}>
                {(loading ? [] : payload?.domain.operations ?? []).map((operation) => {
                  const isDryRunning = runningOperationId === operation.id + ":dry";
                  const isRunning = runningOperationId === operation.id + ":run";

                  return (
                    <Box
                      key={operation.id}
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Stack spacing={0.9}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {operation.title}
                          </Typography>
                          <Chip label={`Impact: ${operation.impact}`} size="small" variant="outlined" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {operation.description}
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <SoftButton
                            variant="outlined"
                            size="small"
                            onClick={() => void runOperation(operation, true)}
                            disabled={!!runningOperationId}
                            startIcon={<SettingsBackupRestoreRoundedIcon />}
                          >
                            {isDryRunning ? "Running Dry Run..." : "Dry Run"}
                          </SoftButton>
                          <SoftButton
                            variant="contained"
                            size="small"
                            onClick={() => void runOperation(operation, false)}
                            disabled={!!runningOperationId}
                            startIcon={<PlayCircleRoundedIcon />}
                          >
                            {isRunning ? "Executing..." : "Execute"}
                          </SoftButton>
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })}
                {!loading && !payload?.domain.operations.length ? (
                  <Typography variant="body2" color="text.secondary">
                    No operations defined for this domain.
                  </Typography>
                ) : null}
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.1 }}>
                Feature Flags
              </Typography>
              <Stack spacing={0.9}>
                {(loading ? [] : featureFlags).map((flag) => (
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
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                          {flag.key}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2 }}>
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
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
            Security / Compliance Alerts
          </Typography>
          <Divider sx={{ mb: 1.1 }} />
          <Stack spacing={1}>
            {(loading ? [] : payload?.alerts ?? []).map((alert) => (
              <Alert key={alert.id} severity={alert.level === "critical" ? "error" : alert.level === "warning" ? "warning" : "success"}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {alert.title}
                </Typography>
                <Typography variant="body2">{alert.detail}</Typography>
              </Alert>
            ))}
          </Stack>
        </CardContent>
      </SoftCard>
    </Stack>
  );
}
