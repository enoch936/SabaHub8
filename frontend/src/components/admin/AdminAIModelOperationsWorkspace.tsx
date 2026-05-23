"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
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
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import DatasetRoundedIcon from "@mui/icons-material/DatasetRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import ModelTrainingRoundedIcon from "@mui/icons-material/ModelTrainingRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import SoftButton from "@/components/mui/SoftButton";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { DataTable, type TableColumn } from "./DataTable";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type AIDatasetImportResponse,
  type AIDatasetStats,
  type AIEngineStatus,
  type AITaxonomyLearningSummary,
  type AIModelOperationResponse,
  type AIModelVersionsResponse,
  aiActivateModel,
  aiDatasetStats,
  aiEngineStatus,
  aiImportDataset,
  aiListModelVersions,
  aiReloadModels,
  aiRollbackModel,
  aiTaxonomyLearningSummary,
  aiTrainModel,
} from "@/lib/api";

type DatasetFormState = {
  datasetType: string;
  path: string;
  format: string;
  delimiter: string;
  maxRows: string;
};

const emptyDatasetForm: DatasetFormState = {
  datasetType: "jobs",
  path: "",
  format: "CSV",
  delimiter: ",",
  maxRows: "500",
};

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

function summarizeOperation(result: AIModelOperationResponse | AIDatasetImportResponse | null) {
  if (!result) {
    return null;
  }
  if (result.message) {
    return result.message;
  }
  if ("importedRows" in result && typeof result.importedRows === "number") {
    return `Imported ${result.importedRows} rows.`;
  }
  if ("activeVersion" in result && result.activeVersion) {
    return `Active version ${result.activeVersion}.`;
  }
  return "Operation completed.";
}

export default function AdminAIModelOperationsWorkspace() {
  const [engine, setEngine] = useState<AIEngineStatus | null>(null);
  const [versions, setVersions] = useState<AIModelVersionsResponse | null>(null);
  const [datasetStatsPayload, setDatasetStatsPayload] = useState<AIDatasetStats | null>(null);
  const [taxonomyLearning, setTaxonomyLearning] = useState<AITaxonomyLearningSummary | null>(null);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [datasetForm, setDatasetForm] = useState<DatasetFormState>(emptyDatasetForm);
  const [rollbackSteps, setRollbackSteps] = useState("1");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<AIModelOperationResponse | AIDatasetImportResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [enginePayload, versionsPayload, statsPayload, taxonomyPayload] = await Promise.all([
        aiEngineStatus(),
        aiListModelVersions(),
        aiDatasetStats(),
        aiTaxonomyLearningSummary(),
      ]);
      setEngine(enginePayload);
      setVersions(versionsPayload);
      setDatasetStatsPayload(statsPayload);
      setTaxonomyLearning(taxonomyPayload);
      setSelectedVersion((current) => current || versionsPayload.activeVersion || versionsPayload.versions?.[0]?.version || "");
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load AI operations.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(
    () => ({
      activeVersion: versions?.activeVersion || "Unavailable",
      versionCount: versions?.count ?? versions?.versions?.length ?? 0,
      datasetRecords: datasetStatsPayload?.totalRecords ?? 0,
      engineMode: engine?.inferenceMode || "Unknown",
      trackedTerms: taxonomyLearning?.tracked_terms?.length ?? 0,
    }),
    [datasetStatsPayload, engine, taxonomyLearning, versions],
  );

  const trackedTerms = taxonomyLearning?.tracked_terms ?? [];

  const runOperation = async (
    key: string,
    action: () => Promise<AIModelOperationResponse | AIDatasetImportResponse>,
    options?: { reloadVersions?: boolean; reloadDataset?: boolean },
  ) => {
    setBusyAction(key);
    setActionStatus(null);
    try {
      const result = await action();
      setLastOperation(result);
      setActionStatus(summarizeOperation(result));
      if (options?.reloadVersions || options?.reloadDataset) {
        await load();
      }
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "AI operation failed.";
      setActionStatus(message);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <Stack spacing={2.2}>
      <GlassCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(24,40,59,0.16)",
          background: "linear-gradient(135deg, #171f2c 0%, #23364d 55%, #355b63 100%)",
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.82 }}>
                  AI OPERATIONS
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                  AI model governance is now a real workspace
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.9, maxWidth: 780 }}>
                  Inspect engine status, review model versions, activate or roll back releases, retrain models, reload runtime state,
                  and import training datasets from the admin systems console.
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
      </GlassCard>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionStatus ? <Alert severity="info">{actionStatus}</Alert> : null}

      <Grid container spacing={2}>
        {[
          { label: "Active Model", value: metrics.activeVersion, icon: <SmartToyRoundedIcon fontSize="small" /> },
          { label: "Registered Versions", value: String(metrics.versionCount), icon: <MemoryRoundedIcon fontSize="small" /> },
          { label: "Dataset Records", value: String(metrics.datasetRecords), icon: <DatasetRoundedIcon fontSize="small" /> },
          { label: "Inference Mode", value: metrics.engineMode, icon: <ModelTrainingRoundedIcon fontSize="small" /> },
          { label: "Tracked Terms", value: String(metrics.trackedTerms), icon: <AutorenewRoundedIcon fontSize="small" /> },
        ].map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
              <CardContent>
                <Stack spacing={0.8}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                    {metric.icon}
                  </Stack>
                  <Typography variant="h5" fontWeight={900}>
                    {metric.value}
                  </Typography>
                </Stack>
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="h6" fontWeight={800}>
                  Model Registry
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review the active release and publish another approved version when needed.
                </Typography>
              </Box>
          <DataTable
            columns={[
              {
                key: "version",
                label: "Version",
                sortable: true,
                render: (val, release) => {
                  const active = release.version === versions?.activeVersion;
                  return (
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {String(val)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {active ? "Currently active" : "Available"}
                      </Typography>
                    </Stack>
                  );
                },
              },
              {
                key: "trainedAt",
                label: "Trained",
                sortable: true,
                render: (val) => formatDateTime(val as string),
              },
              { key: "path", label: "Path", render: (val) => String(val) || "Not reported" },
              {
                key: "id",
                label: "Actions",
                align: "right",
                render: (_, release) => {
                  const active = release.version === versions?.activeVersion;
                  return (
                    <SoftButton
                      variant="outline"
                      size="sm"
                      color="success"
                      leftIcon={<PublishedWithChangesRoundedIcon sx={{ fontSize: 16 }} />}
                      onClick={() =>
                        void runOperation(
                          `activate:${release.version}`,
                          () => aiActivateModel(release.version),
                          { reloadVersions: true },
                        )
                      }
                      disabled={busyAction !== null || active}
                    >
                      Activate
                    </SoftButton>
                  );
                },
              },
            ]}
            data={versions?.versions ?? []}
            rowKey="version"
            loading={loading}
            searchable={false}
          />
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1.4}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Model Controls
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Execute training, reload runtime state, activate a version, or roll back a release.
                  </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <SoftButton
                    variant="contained"
                    startIcon={<ModelTrainingRoundedIcon />}
                    onClick={() => void runOperation("train", () => aiTrainModel(true), { reloadVersions: true })}
                    disabled={busyAction !== null}
                  >
                    Train & Activate
                  </SoftButton>
                  <SoftButton
                    variant="outlined"
                    startIcon={<AutorenewRoundedIcon />}
                    onClick={() => void runOperation("reload", () => aiReloadModels(), { reloadVersions: true })}
                    disabled={busyAction !== null}
                  >
                    Reload Models
                  </SoftButton>
                </Stack>

                <FormControl fullWidth size="small">
                  <InputLabel id="ai-version-select">Version</InputLabel>
                  <Select
                    labelId="ai-version-select"
                    value={selectedVersion}
                    label="Version"
                    onChange={(event) => setSelectedVersion(event.target.value)}
                  >
                    {(versions?.versions ?? []).map((release) => (
                      <MenuItem key={release.version} value={release.version}>
                        {release.version}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <SoftButton
                    variant="outlined"
                    color="success"
                    startIcon={<PublishedWithChangesRoundedIcon />}
                    onClick={() => void runOperation("activate:selected", () => aiActivateModel(selectedVersion), { reloadVersions: true })}
                    disabled={busyAction !== null || !selectedVersion}
                  >
                    Activate Selected
                  </SoftButton>
                  <SoftTextField
                    label="Rollback steps"
                    value={rollbackSteps}
                    onChange={(event) => setRollbackSteps(event.target.value)}
                    sx={{ minWidth: 130 }}
                  />
                  <SoftButton
                    variant="outlined"
                    color="warning"
                    startIcon={<RestartAltRoundedIcon />}
                    onClick={() =>
                      void runOperation(
                        "rollback",
                        () => aiRollbackModel(Math.max(1, Number.parseInt(rollbackSteps || "1", 10) || 1)),
                        { reloadVersions: true },
                      )
                    }
                    disabled={busyAction !== null}
                  >
                    Roll Back
                  </SoftButton>
                </Stack>

                <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
                  <CardContent>
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Engine status
                      </Typography>
                      <Typography variant="body2">{engine?.engine || "Unknown engine"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Version {engine?.version || "n/a"} • {engine?.dataSource || "unknown source"}
                      </Typography>
                    </Stack>
                  </CardContent>
                </GlassCard>
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Stack spacing={1.4}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Dataset Operations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Import local CSV or JSONL data for jobs, freelancers, transactions, or generic training records.
                  </Typography>
                </Box>

                <Grid container spacing={1.2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="ai-dataset-type">Dataset Type</InputLabel>
                      <Select
                        labelId="ai-dataset-type"
                        value={datasetForm.datasetType}
                        label="Dataset Type"
                        onChange={(event) => setDatasetForm((current) => ({ ...current, datasetType: event.target.value }))}
                      >
                        {["jobs", "freelancers", "transactions", "generic"].map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="ai-dataset-format">Format</InputLabel>
                      <Select
                        labelId="ai-dataset-format"
                        value={datasetForm.format}
                        label="Format"
                        onChange={(event) => setDatasetForm((current) => ({ ...current, format: event.target.value }))}
                      >
                        <MenuItem value="CSV">CSV</MenuItem>
                        <MenuItem value="JSONL">JSONL</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <SoftTextField
                      fullWidth
                      label="Max rows"
                      value={datasetForm.maxRows}
                      onChange={(event) => setDatasetForm((current) => ({ ...current, maxRows: event.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 9 }}>
                    <SoftTextField
                      fullWidth
                      label="Dataset path"
                      value={datasetForm.path}
                      onChange={(event) => setDatasetForm((current) => ({ ...current, path: event.target.value }))}
                      placeholder="/home/enoch/data/jobs.csv"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <SoftTextField
                      fullWidth
                      label="Delimiter"
                      value={datasetForm.delimiter}
                      onChange={(event) => setDatasetForm((current) => ({ ...current, delimiter: event.target.value }))}
                    />
                  </Grid>
                </Grid>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <SoftButton
                    variant="contained"
                    startIcon={<DatasetRoundedIcon />}
                    onClick={() =>
                      void runOperation(
                        "import-dataset",
                        () =>
                          aiImportDataset({
                            datasetType: datasetForm.datasetType,
                            path: datasetForm.path.trim(),
                            format: datasetForm.format,
                            delimiter: datasetForm.delimiter,
                            maxRows: Math.max(1, Number.parseInt(datasetForm.maxRows || "500", 10) || 500),
                          }),
                        { reloadDataset: true },
                      )
                    }
                    disabled={busyAction !== null || !datasetForm.path.trim()}
                  >
                    Import Dataset
                  </SoftButton>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
                    Current mode: {datasetStatsPayload?.mode || "unknown"}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <GlassCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              <Stack spacing={1.2}>
                <Typography variant="h6" fontWeight={800}>
                  Last Operation Result
                </Typography>
                {lastOperation ? (
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#0f172a",
                      color: "#dbeafe",
                      fontSize: 12,
                      overflowX: "auto",
                    }}
                  >
                    {JSON.stringify(lastOperation, null, 2)}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Run a training, activation, reload, rollback, or dataset import action to inspect the live result here.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={1.4}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Taxonomy Learning Review
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review recurring unmatched terms the classifier is tracking before promoting any new category into the live menu.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Last updated: {formatDateTime(taxonomyLearning?.last_updated ?? undefined)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {trackedTerms.length} tracked term{trackedTerms.length === 1 ? "" : "s"} in review
              </Typography>
            </Stack>

            <DataTable
              columns={[
                {
                  key: "term",
                  label: "Term",
                  sortable: true,
                  render: (val, term) => (
                    <Stack spacing={0.2}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {String(val)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last seen {formatDateTime(term.last_seen)}
                      </Typography>
                    </Stack>
                  ),
                },
                {
                  key: "trend_score",
                  label: "Trend",
                  sortable: true,
                  render: (val) => (
                    <Stack spacing={0.7}>
                      <Typography variant="body2" fontWeight={700}>
                        {Number(val)}/100
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, Number(val)))}
                        sx={{ height: 8, borderRadius: 999, bgcolor: "rgba(15,23,42,0.08)" }}
                      />
                    </Stack>
                  ),
                },
                { key: "suggested_parent", label: "Suggested Parent", render: (val) => String(val) || "Awaiting stable parent fit" },
                {
                  key: "count",
                  label: "Signals",
                  sortable: true,
                  render: (val, term) => (
                    <Stack spacing={0.8}>
                      <Typography variant="body2" color="text.secondary">
                        Seen {Number(val)} time{Number(val) === 1 ? "" : "s"}
                      </Typography>
                      <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
                        {term.types.map((itemType: string) => (
                          <Chip key={`${term.term}-${itemType}`} label={itemType} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Stack>
                  ),
                },
              ]}
              data={trackedTerms}
              rowKey="term"
              loading={loading}
              pageSize={10}
            />
          </Stack>
        </CardContent>
      </GlassCard>
    </Stack>
  );
}
