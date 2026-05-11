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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type AdminCommandCenterOperation,
  type Job,
  adminCommandCenterDomain,
  adminCommandCenterExecuteOperation,
  adminListJobs,
  adminPatchJob,
} from "@/lib/api";

const moderationStatuses = ["DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CLOSED"] as const;
const moderationDomainId = "content-moderation-marketplace-governance";

type ModerationRunbookForm = {
  note: string;
  limit: string;
  jobIds: string;
  disputeIds: string;
  title: string;
  body: string;
};

const defaultRunbookForm: ModerationRunbookForm = {
  note: "",
  limit: "",
  jobIds: "",
  disputeIds: "",
  title: "",
  body: "",
};

function statusTone(status?: string): "default" | "success" | "warning" | "error" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "OPEN":
      return "success";
    case "IN_PROGRESS":
      return "info";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "error";
    case "CLOSED":
      return "warning";
    default:
      return "default";
  }
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Not recorded";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleString();
}

function formatBudget(job: Job) {
  const min = job.budgetMin ?? job.budget?.min;
  const max = job.budgetMax ?? job.budget?.max;
  const currency = job.currency ?? job.budget?.currency ?? "USD";
  if (typeof min !== "number" && typeof max !== "number") {
    return "Budget not set";
  }
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (typeof min === "number" && typeof max === "number") {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  return formatter.format((min ?? max) as number);
}

function getMediaSummary(job: Job) {
  const imageCount = job.sampleImageUrls?.length ?? 0;
  const videoCount = job.sampleVideoUrls?.length ?? 0;
  return { imageCount, videoCount };
}

function firstNonEmptyUrl(values?: string[]) {
  if (!Array.isArray(values)) {
    return null;
  }
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return null;
}

function deriveCloudinaryVideoPosterUrl(videoUrl: string, options?: { width?: number; height?: number }) {
  try {
    const url = new URL(videoUrl);
    if (!url.hostname.includes("cloudinary.com")) {
      return null;
    }

    const marker = "/video/upload/";
    const path = url.pathname;
    const markerIndex = path.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    const prefix = path.slice(0, markerIndex + marker.length);
    const suffix = path.slice(markerIndex + marker.length).replace(/^\/+/, "");
    const width = options?.width ?? 240;
    const height = options?.height ?? 160;
    const transform = `so_0,f_jpg,q_auto,w_${width},h_${height},c_fill`;

    let posterPath = `${prefix}${transform}/${suffix}`;

    const lastSlash = posterPath.lastIndexOf("/");
    const fileName = lastSlash >= 0 ? posterPath.slice(lastSlash + 1) : posterPath;
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex > 0) {
      const baseName = fileName.slice(0, dotIndex);
      posterPath = `${posterPath.slice(0, lastSlash + 1)}${baseName}.jpg`;
    } else {
      posterPath = `${posterPath}.jpg`;
    }

    return `${url.origin}${posterPath}`;
  } catch {
    return null;
  }
}

export default function AdminJobModerationWorkspace() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [operations, setOperations] = useState<AdminCommandCenterOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>("DRAFT");
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [selectedOperationId, setSelectedOperationId] = useState<string>("review-flagged-content");
  const [runbookBusyId, setRunbookBusyId] = useState<string | null>(null);
  const [runbookForm, setRunbookForm] = useState<ModerationRunbookForm>(defaultRunbookForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsResult, domainResult] = await Promise.all([
        adminListJobs(),
        adminCommandCenterDomain(moderationDomainId),
      ]);
      setJobs(jobsResult);
      setOperations(domainResult.domain.operations ?? []);

      if (domainResult.domain.operations.length > 0) {
        setSelectedOperationId((current) => {
          const hasCurrent = domainResult.domain.operations.some((operation) => operation.id === current);
          return hasCurrent ? current : domainResult.domain.operations[0].id;
        });
      }
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load admin jobs.";
      setError(message);
      setJobs([]);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const total = jobs.length;
    const open = jobs.filter((job) => (job.status ?? "").toUpperCase() === "OPEN").length;
    const draft = jobs.filter((job) => (job.status ?? "").toUpperCase() === "DRAFT").length;
    const closed = jobs.filter((job) => ["CLOSED", "CANCELLED"].includes((job.status ?? "").toUpperCase())).length;
    return { total, open, draft, closed };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const jobStatus = (job.status ?? "").toUpperCase();
      if (statusFilter !== "all" && jobStatus !== statusFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [
        job.title ?? "",
        job.companyName ?? "",
        job.employerId ?? "",
        job.id ?? "",
        job.categoryId ?? "",
        ...(job.skills ?? []),
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [jobs, query, statusFilter]);

  const patchLocalJob = (updated: Job) => {
    setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
    setSelectedJob((current) => (current?.id === updated.id ? updated : current));
  };

  const selectedOperation = useMemo(
    () => operations.find((operation) => operation.id === selectedOperationId) ?? null,
    [operations, selectedOperationId],
  );

  const parseIds = (value: string) =>
    Array.from(
      new Set(
        value
          .split(/[\s,]+/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      ),
    );

  const buildRunbookParameters = (operationId: string) => {
    const parameters: Record<string, unknown> = {};
    const trimmedLimit = runbookForm.limit.trim();
    if (trimmedLimit) {
      const parsed = Number.parseInt(trimmedLimit, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        parameters.limit = parsed;
      }
    }

    if (operationId === "remove-fraudulent-listings") {
      const jobIds = parseIds(runbookForm.jobIds);
      if (jobIds.length > 0) {
        parameters.jobIds = jobIds;
      }
    }

    if (operationId === "review-flagged-content") {
      const disputeIds = parseIds(runbookForm.disputeIds);
      if (disputeIds.length > 0) {
        parameters.disputeIds = disputeIds;
      }
    }

    if (operationId === "publish-guideline-update") {
      const title = runbookForm.title.trim();
      const body = runbookForm.body.trim();
      if (title) {
        parameters.title = title;
      }
      if (body) {
        parameters.body = body;
      }
    }

    return Object.keys(parameters).length ? parameters : undefined;
  };

  const executeRunbook = async (dryRun: boolean) => {
    if (!selectedOperation) {
      return;
    }

    const busyKey = `${selectedOperation.id}:${dryRun ? "dry" : "run"}`;
    setRunbookBusyId(busyKey);
    setActionStatus(null);

    try {
      const parameters = buildRunbookParameters(selectedOperation.id);
      const note = runbookForm.note.trim();
      const result = await adminCommandCenterExecuteOperation(moderationDomainId, selectedOperation.id, {
        dryRun,
        note: note || (dryRun ? "Dry run from moderation workspace" : "Execution from moderation workspace"),
        parameters,
      });
      setActionStatus(`${result.title} finished with status ${result.status}. ${result.description}`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to execute moderation runbook.";
      setActionStatus(message);
    } finally {
      setRunbookBusyId(null);
    }
  };

  const changeStatus = async (job: Job, status: string) => {
    setBusyJobId(job.id);
    setActionStatus(null);
    try {
      const updated = await adminPatchJob(job.id, { status });
      patchLocalJob(updated);
      setActionStatus(`${updated.title} moved to ${status}.`);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to update job status.";
      setActionStatus(message);
    } finally {
      setBusyJobId(null);
    }
  };

  const openReview = (job: Job) => {
    setSelectedJob(job);
    setReviewStatus((job.status ?? "DRAFT").toUpperCase());
  };

  const applyReviewStatus = async () => {
    if (!selectedJob) {
      return;
    }
    await changeStatus(selectedJob, reviewStatus);
  };

  return (
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(24,40,59,0.16)",
          background: "linear-gradient(135deg, #1c2431 0%, #3a3d63 56%, #5c4f6f 100%)",
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.8 }}>
                  MARKETPLACE GOVERNANCE
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                  Jobs moderation is now a real workspace
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.9, maxWidth: 780 }}>
                  Review live job records, inspect marketplace posts, and change moderation state with direct admin controls instead of placeholder responsibilities.
                </Typography>
              </Box>
              <SoftButton
                variant="outlined"
                onClick={() => void load()}
                disabled={loading}
                startIcon={<RefreshRoundedIcon />}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
              >
                Refresh
              </SoftButton>
            </Stack>
          </Stack>
        </CardContent>
      </SoftCard>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionStatus ? <Alert severity="info">{actionStatus}</Alert> : null}

      <Grid container spacing={2}>
        {[
          { label: "Total Jobs", value: metrics.total, icon: <Inventory2RoundedIcon fontSize="small" /> },
          { label: "Open Jobs", value: metrics.open, icon: <CheckCircleRoundedIcon fontSize="small" /> },
          { label: "Draft Review", value: metrics.draft, icon: <FactCheckRoundedIcon fontSize="small" /> },
          { label: "Closed / Cancelled", value: metrics.closed, icon: <GavelRoundedIcon fontSize="small" /> },
        ].map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
              <CardContent>
                <Stack spacing={0.8}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                    {metric.icon}
                  </Stack>
                  <Typography variant="h4" fontWeight={900}>
                    {metric.value}
                  </Typography>
                </Stack>
              </CardContent>
            </SoftCard>
          </Grid>
        ))}
      </Grid>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Grid container spacing={1.2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <SoftTextField
                fullWidth
                label="Search jobs"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title, company, employer ID, category, skill"
                InputProps={{ startAdornment: <SearchRoundedIcon sx={{ fontSize: 18, mr: 1, color: "text.secondary" }} /> }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="job-status-filter">Status</InputLabel>
                <Select
                  labelId="job-status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  {moderationStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </SoftCard>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={1.2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Trust &amp; Safety Runbooks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Execute moderation runbooks with operator-provided parameters for targeted enforcement actions.
              </Typography>
            </Box>

            <Grid container spacing={1.2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="moderation-runbook">Runbook</InputLabel>
                  <Select
                    labelId="moderation-runbook"
                    value={selectedOperationId}
                    label="Runbook"
                    onChange={(event) => setSelectedOperationId(event.target.value)}
                    disabled={loading || operations.length === 0}
                  >
                    {operations.map((operation) => (
                      <MenuItem key={operation.id} value={operation.id}>
                        {operation.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <SoftTextField
                  fullWidth
                  label="Limit"
                  value={runbookForm.limit}
                  onChange={(event) => setRunbookForm((current) => ({ ...current, limit: event.target.value }))}
                  placeholder="e.g. 10"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <SoftButton
                  variant="outlined"
                  fullWidth
                  onClick={() => setRunbookForm(defaultRunbookForm)}
                  sx={{ height: "100%" }}
                >
                  Clear Parameters
                </SoftButton>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <SoftTextField
                  fullWidth
                  label="Operator Note"
                  value={runbookForm.note}
                  onChange={(event) => setRunbookForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Optional reason or investigation context"
                />
              </Grid>

              {selectedOperationId === "remove-fraudulent-listings" ? (
                <Grid size={{ xs: 12 }}>
                  <SoftTextField
                    fullWidth
                    label="Job IDs"
                    value={runbookForm.jobIds}
                    onChange={(event) => setRunbookForm((current) => ({ ...current, jobIds: event.target.value }))}
                    placeholder="Comma or space separated job IDs"
                  />
                </Grid>
              ) : null}

              {selectedOperationId === "review-flagged-content" ? (
                <Grid size={{ xs: 12 }}>
                  <SoftTextField
                    fullWidth
                    label="Dispute IDs"
                    value={runbookForm.disputeIds}
                    onChange={(event) => setRunbookForm((current) => ({ ...current, disputeIds: event.target.value }))}
                    placeholder="Comma or space separated dispute IDs"
                  />
                </Grid>
              ) : null}

              {selectedOperationId === "publish-guideline-update" ? (
                <>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <SoftTextField
                      fullWidth
                      label="Guideline Title"
                      value={runbookForm.title}
                      onChange={(event) => setRunbookForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Policy bulletin title"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <SoftTextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Guideline Body"
                      value={runbookForm.body}
                      onChange={(event) => setRunbookForm((current) => ({ ...current, body: event.target.value }))}
                      placeholder="Announcement body"
                    />
                  </Grid>
                </>
              ) : null}

              <Grid size={{ xs: 12 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <SoftButton
                    variant="outlined"
                    onClick={() => void executeRunbook(true)}
                    disabled={loading || !selectedOperation || !!runbookBusyId}
                  >
                    {runbookBusyId === `${selectedOperationId}:dry` ? "Dry Run..." : "Dry Run"}
                  </SoftButton>
                  <SoftButton
                    variant="contained"
                    onClick={() => void executeRunbook(false)}
                    disabled={loading || !selectedOperation || !!runbookBusyId}
                  >
                    {runbookBusyId === `${selectedOperationId}:run` ? "Executing..." : "Execute Runbook"}
                  </SoftButton>
                  {selectedOperation ? (
                    <Chip
                      label={`${selectedOperation.impact} impact`}
                      size="small"
                      variant="outlined"
                      sx={{ alignSelf: "center" }}
                    />
                  ) : null}
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </SoftCard>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Job</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Media</TableCell>
                  <TableCell>Signals</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Moderation Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredJobs.map((job) => {
                  const busy = busyJobId === job.id;
                  const normalizedStatus = (job.status ?? "DRAFT").toUpperCase();
                  const mediaSummary = getMediaSummary(job);

                  return (
                    <TableRow key={job.id} hover>
                      <TableCell sx={{ minWidth: 280 }}>
                        <Stack spacing={0.35}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {job.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {job.companyName || "Marketplace posting"} · {job.employerId || "No employer ID"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {job.categoryId || "No category"} · {job.workLocation || "Location not set"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={normalizedStatus} size="small" color={statusTone(normalizedStatus)} variant="outlined" />
                      </TableCell>
                      <TableCell>{formatBudget(job)}</TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        {(() => {
                          const firstImageUrl = firstNonEmptyUrl(job.sampleImageUrls);
                          const firstVideoUrl = firstNonEmptyUrl(job.sampleVideoUrls);
                          const videoPosterUrl = firstVideoUrl
                            ? deriveCloudinaryVideoPosterUrl(firstVideoUrl, { width: 240, height: 160 })
                            : null;

                          const thumbSx = {
                            width: 76,
                            height: 52,
                            objectFit: "cover" as const,
                            borderRadius: 1.2,
                            border: "1px solid",
                            borderColor: "divider",
                          };

                          return (
                            <Stack spacing={0.7}>
                              <Stack direction="row" spacing={0.7} alignItems="center">
                                {firstImageUrl ? (
                                  <Box
                                    component="img"
                                    src={firstImageUrl}
                                    alt={`Thumbnail for ${job.title}`}
                                    loading="lazy"
                                    sx={thumbSx}
                                  />
                                ) : null}

                                {firstVideoUrl ? (
                                  videoPosterUrl ? (
                                    <Box
                                      component="img"
                                      src={videoPosterUrl}
                                      alt={`Video thumbnail for ${job.title}`}
                                      loading="lazy"
                                      sx={{ ...thumbSx, bgcolor: "grey.900" }}
                                    />
                                  ) : (
                                    <Box
                                      component="video"
                                      src={firstVideoUrl}
                                      muted
                                      preload="metadata"
                                      playsInline
                                      sx={{ ...thumbSx, bgcolor: "grey.900" }}
                                    />
                                  )
                                ) : null}

                                {!firstImageUrl && !firstVideoUrl ? (
                                  <Typography variant="caption" color="text.secondary">
                                    No media
                                  </Typography>
                                ) : null}
                              </Stack>

                              <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap">
                                <Chip label={`Images: ${mediaSummary.imageCount}`} size="small" variant="outlined" />
                                <Chip label={`Videos: ${mediaSummary.videoCount}`} size="small" variant="outlined" />
                              </Stack>
                            </Stack>
                          );
                        })()}
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap">
                          {job.isEnterpriseOnly ? <Chip label="Enterprise" size="small" color="secondary" variant="outlined" /> : null}
                          {job.requiresNDA ? <Chip label="NDA" size="small" variant="outlined" /> : null}
                          {job.requiresBGCheck ? <Chip label="BG Check" size="small" variant="outlined" /> : null}
                          {(job.skills ?? []).slice(0, 2).map((skill) => (
                            <Chip key={`${job.id}-${skill}`} label={skill} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>{formatDateTime(job.createdAt)}</TableCell>
                      <TableCell align="right" sx={{ minWidth: 330 }}>
                        <Stack direction="row" spacing={0.8} justifyContent="flex-end" useFlexGap flexWrap="wrap">
                          <SoftButton
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityRoundedIcon />}
                            onClick={() => openReview(job)}
                            disabled={busy}
                          >
                            Review
                          </SoftButton>
                          <SoftButton
                            variant="outlined"
                            size="small"
                            color="success"
                            onClick={() => void changeStatus(job, "OPEN")}
                            disabled={busy || normalizedStatus === "OPEN"}
                          >
                            Open
                          </SoftButton>
                          <SoftButton
                            variant="outlined"
                            size="small"
                            onClick={() => void changeStatus(job, "DRAFT")}
                            disabled={busy || normalizedStatus === "DRAFT"}
                          >
                            Draft
                          </SoftButton>
                          <SoftButton
                            variant="outlined"
                            size="small"
                            color="warning"
                            onClick={() => void changeStatus(job, "CLOSED")}
                            disabled={busy || normalizedStatus === "CLOSED"}
                          >
                            Close
                          </SoftButton>
                          <SoftButton
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<CloseRoundedIcon />}
                            onClick={() => void changeStatus(job, "CANCELLED")}
                            disabled={busy || normalizedStatus === "CANCELLED"}
                          >
                            Cancel
                          </SoftButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No jobs match the current moderation filters.
                    </TableCell>
                  </TableRow>
                ) : null}
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      Loading jobs...
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </SoftCard>

      <Dialog open={!!selectedJob} onClose={() => setSelectedJob(null)} fullWidth maxWidth="md">
        <DialogTitle>Moderation Review</DialogTitle>
        <DialogContent dividers>
          {selectedJob ? (
            <Stack spacing={1.4}>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {selectedJob.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedJob.companyName || "Marketplace posting"} · {selectedJob.id}
                </Typography>
              </Box>

              <Grid container spacing={1.2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
                    <CardContent>
                      <Stack spacing={0.8}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          Posting Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedJob.description || "No description available."}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </SoftCard>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
                    <CardContent>
                      <Stack spacing={0.8}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          Moderation Metadata
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Employer: {selectedJob.employerId || "Not set"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Budget: {formatBudget(selectedJob)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Created: {formatDateTime(selectedJob.createdAt)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Updated: {formatDateTime(selectedJob.updatedAt)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Skills: {(selectedJob.skills ?? []).length ? selectedJob.skills?.join(", ") : "None"}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </SoftCard>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
                    <CardContent>
                      <Stack spacing={0.8}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          Attached Media
                        </Typography>
                        {(selectedJob.sampleImageUrls?.length || 0) === 0 && (selectedJob.sampleVideoUrls?.length || 0) === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No media attached to this posting.
                          </Typography>
                        ) : (
                          <Grid container spacing={1}>
                            {(selectedJob.sampleImageUrls ?? []).map((url, index) => (
                              <Grid key={`img-${url}-${index}`} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Box
                                  component="img"
                                  src={url}
                                  alt={`Job image ${index + 1}`}
                                  sx={{
                                    width: "100%",
                                    height: 140,
                                    objectFit: "cover",
                                    borderRadius: 1,
                                    border: "1px solid",
                                    borderColor: "divider",
                                  }}
                                />
                              </Grid>
                            ))}
                            {(selectedJob.sampleVideoUrls ?? []).map((url, index) => (
                              <Grid key={`vid-${url}-${index}`} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Box
                                  component="video"
                                  src={url}
                                  controls
                                  preload="metadata"
                                  sx={{
                                    width: "100%",
                                    height: 140,
                                    objectFit: "cover",
                                    borderRadius: 1,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    backgroundColor: "#000",
                                  }}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        )}
                      </Stack>
                    </CardContent>
                  </SoftCard>
                </Grid>
              </Grid>

              <FormControl fullWidth size="small">
                <InputLabel id="review-status">Moderation Status</InputLabel>
                <Select
                  labelId="review-status"
                  value={reviewStatus}
                  label="Moderation Status"
                  onChange={(event) => setReviewStatus(event.target.value)}
                >
                  {moderationStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" onClick={() => setSelectedJob(null)}>
            Close
          </SoftButton>
          <SoftButton
            variant="contained"
            onClick={() => void applyReviewStatus()}
            disabled={!selectedJob || busyJobId === selectedJob.id}
            startIcon={<WorkOutlineRoundedIcon />}
          >
            {selectedJob && busyJobId === selectedJob.id ? "Applying..." : "Apply Status"}
          </SoftButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
