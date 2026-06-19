"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CardContent,
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
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import SoftButton from "@/components/mui/SoftButton";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { DataTable, type TableColumn } from "./DataTable";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type AuditLogEntry,
  adminListAuditLogs,
} from "@/lib/api";

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

export default function AdminAuditLogWorkspace() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminListAuditLogs({ limit: 400 });
      setLogs(result);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load audit logs.";
      setError(message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const entityTypes = useMemo(
    () => Array.from(new Set(logs.map((item) => item.entityType).filter(Boolean))).sort(),
    [logs],
  );

  const filteredLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return logs.filter((item) => {
      if (entityTypeFilter !== "all" && (item.entityType ?? "") !== entityTypeFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [
        item.action ?? "",
        item.entityType ?? "",
        item.entityId ?? "",
        item.actorUserId ?? "",
        item.ip ?? "",
        JSON.stringify(item.metadata ?? {}),
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [entityTypeFilter, logs, query]);

  const metrics = useMemo(() => {
    const actorCount = new Set(filteredLogs.map((item) => item.actorUserId).filter(Boolean)).size;
    const entityCount = new Set(filteredLogs.map((item) => item.entityType).filter(Boolean)).size;
    const securityEvents = filteredLogs.filter((item) =>
      /security|auth|login|fraud|flag|permission|role/i.test(`${item.action} ${item.entityType}`),
    ).length;
    return {
      total: filteredLogs.length,
      actors: actorCount,
      entityTypes: entityCount,
      securityEvents,
    };
  }, [filteredLogs]);

  return (
    <Stack spacing={2.2}>
      <GlassCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(24,40,59,0.16)",
          background: "linear-gradient(135deg, #19202b 0%, #2b3745 55%, #5a6666 100%)",
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.82 }}>
                  AUDIT & COMPLIANCE
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                  Audit log review is now a real workspace
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.9, maxWidth: 780 }}>
                  Search live audit events, inspect actor and entity activity, and review action metadata from a dedicated compliance console.
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

      <Grid container spacing={2}>
        {[
          { label: "Visible Events", value: metrics.total, icon: <HistoryRoundedIcon fontSize="small" /> },
          { label: "Actors", value: metrics.actors, icon: <ManageSearchRoundedIcon fontSize="small" /> },
          { label: "Entity Types", value: metrics.entityTypes, icon: <GppGoodRoundedIcon fontSize="small" /> },
          { label: "Security Events", value: metrics.securityEvents, icon: <SecurityRoundedIcon fontSize="small" /> },
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
                  <Typography variant="h4" fontWeight={900}>
                    {metric.value}
                  </Typography>
                </Stack>
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Grid container spacing={1.2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <SoftTextField
                fullWidth
                label="Search audit logs"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Action, entity, actor, IP, metadata"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="audit-entity-type-filter">Entity Type</InputLabel>
                <Select
                  labelId="audit-entity-type-filter"
                  value={entityTypeFilter}
                  label="Entity Type"
                  onChange={(event) => setEntityTypeFilter(event.target.value)}
                >
                  <MenuItem value="all">All entities</MenuItem>
                  {entityTypes.map((entityType) => (
                    <MenuItem key={entityType} value={entityType}>
                      {entityType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </GlassCard>

      <GlassCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" fontWeight={800}>
              Audit Event Stream
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review the latest admin and system events, then open any record to inspect full metadata.
            </Typography>
          </Box>
          <DataTable
            columns={[
              {
                key: "createdAt",
                label: "Time",
                sortable: true,
                render: (val) => formatDateTime(val as string),
              },
              {
                key: "action",
                label: "Action",
                sortable: true,
                render: (val, item) => (
                  <Stack spacing={0.25}>
                    <Typography variant="subtitle2" fontWeight={800}>
                      {String(val) || "UNKNOWN_ACTION"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.entityType || "Unknown"} / {item.entityId || "n/a"}
                    </Typography>
                  </Stack>
                ),
              },
              { key: "entityType", label: "Entity", sortable: true },
              { key: "actorUserId", label: "Actor", sortable: true },
              { key: "ip", label: "IP", sortable: true },
              {
                key: "id",
                label: "Actions",
                align: "right",
                render: (_, item) => (
                  <SoftButton
                    variant="outlined"
                    size="small"
                    leftIcon={<VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setSelectedLog(item)}
                  >
                    View
                  </SoftButton>
                ),
              },
            ]}
            data={filteredLogs}
            rowKey="id"
            loading={loading}
            searchable={false}
            expandableContent={(log) => (
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  User agent: {log.userAgent || "Not recorded"}
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "rgba(15, 23, 42, 0.6)",
                    color: "#dbeafe",
                    fontSize: 12,
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(log.metadata ?? {}, null, 2)}
                </Box>
              </Stack>
            )}
          />
        </CardContent>
      </GlassCard>

      <Dialog open={!!selectedLog} onClose={() => setSelectedLog(null)} fullWidth maxWidth="md">
        <DialogTitle>Audit Event Detail</DialogTitle>
        <DialogContent dividers>
          {selectedLog ? (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Time: {formatDateTime(selectedLog.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Action: {selectedLog.action || "UNKNOWN_ACTION"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Entity: {selectedLog.entityType || "Unknown"} / {selectedLog.entityId || "n/a"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Actor: {selectedLog.actorUserId || "System"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                User agent: {selectedLog.userAgent || "Not recorded"}
              </Typography>
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
                {JSON.stringify(selectedLog.metadata ?? {}, null, 2)}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" onClick={() => setSelectedLog(null)}>
            Close
          </SoftButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
