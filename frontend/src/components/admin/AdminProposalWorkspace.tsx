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
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WorkHistoryRoundedIcon from "@mui/icons-material/WorkHistoryRounded";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type Proposal,
  adminListProposals,
  adminPatchProposal,
} from "@/lib/api";

const proposalStatuses = ["SUBMITTED", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const;

function statusTone(status?: string): "default" | "success" | "warning" | "error" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "SUBMITTED":
      return "warning";
    case "SHORTLISTED":
      return "info";
    case "ACCEPTED":
      return "success";
    case "REJECTED":
      return "error";
    default:
      return "default";
  }
}

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
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

export default function AdminProposalWorkspace() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [reviewStatus, setReviewStatus] = useState("SHORTLISTED");
  const [busyProposalId, setBusyProposalId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminListProposals();
      setProposals(result);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load proposal pipeline.";
      setError(message);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const submitted = proposals.filter((item) => (item.status ?? "").toUpperCase() === "SUBMITTED").length;
    const shortlisted = proposals.filter((item) => (item.status ?? "").toUpperCase() === "SHORTLISTED").length;
    const accepted = proposals.filter((item) => (item.status ?? "").toUpperCase() === "ACCEPTED").length;
    const rejected = proposals.filter((item) => (item.status ?? "").toUpperCase() === "REJECTED").length;
    return { total: proposals.length, submitted, shortlisted, accepted, rejected };
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return proposals.filter((item) => {
      const status = (item.status ?? "").toUpperCase();
      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [
        item.id,
        item.jobId ?? "",
        item.freelancerId ?? "",
        item.coverLetter ?? "",
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [proposals, query, statusFilter]);

  const patchLocalProposal = (updated: Proposal) => {
    setProposals((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedProposal((current) => (current?.id === updated.id ? updated : current));
  };

  const changeStatus = async (proposal: Proposal, status: string) => {
    setBusyProposalId(proposal.id);
    setActionStatus(null);
    try {
      const updated = await adminPatchProposal(proposal.id, { status });
      patchLocalProposal(updated);
      setActionStatus(`Proposal ${updated.id} moved to ${updated.status}.`);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to update proposal.";
      setActionStatus(message);
    } finally {
      setBusyProposalId(null);
    }
  };

  const openReview = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setReviewStatus((proposal.status ?? "SUBMITTED").toUpperCase());
  };

  const applyReview = async () => {
    if (!selectedProposal) {
      return;
    }
    await changeStatus(selectedProposal, reviewStatus);
  };

  return (
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(24,40,59,0.16)",
          background: "linear-gradient(135deg, #1b2430 0%, #25445a 55%, #4d6571 100%)",
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.82 }}>
                  PROPOSAL PIPELINE
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                  Proposal review is now a real workspace
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.9, maxWidth: 780 }}>
                  Review live proposal submissions, shortlist strong candidates, accept qualified proposals, and reject
                  weak entries from a real admin moderation queue.
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
          { label: "Total Proposals", value: metrics.total, icon: <WorkHistoryRoundedIcon fontSize="small" /> },
          { label: "Submitted", value: metrics.submitted, icon: <FactCheckRoundedIcon fontSize="small" /> },
          { label: "Shortlisted", value: metrics.shortlisted, icon: <TaskAltRoundedIcon fontSize="small" /> },
          { label: "Accepted", value: metrics.accepted, icon: <CheckCircleRoundedIcon fontSize="small" /> },
          { label: "Rejected", value: metrics.rejected, icon: <FactCheckRoundedIcon fontSize="small" /> },
        ].map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, lg: 4, xl: 2.4 }}>
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
                label="Search proposals"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Proposal ID, job ID, freelancer ID, cover letter"
                InputProps={{ startAdornment: <SearchRoundedIcon sx={{ fontSize: 18, mr: 1, color: "text.secondary" }} /> }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="proposal-status-filter">Proposal Status</InputLabel>
                <Select
                  labelId="proposal-status-filter"
                  value={statusFilter}
                  label="Proposal Status"
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  {proposalStatuses.map((status) => (
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
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" fontWeight={800}>
              Proposal Review Queue
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Move proposals through submitted, shortlisted, accepted, rejected, or withdrawn states from the admin console.
            </Typography>
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Proposal</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Bid</TableCell>
                  <TableCell>Timeline</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProposals.map((item) => {
                  const status = (item.status ?? "SUBMITTED").toUpperCase();
                  const busy = busyProposalId === item.id;
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ minWidth: 260 }}>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {item.id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Job: {item.jobId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Freelancer: {item.freelancerId || "Unknown"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={status} size="small" color={statusTone(status)} variant="outlined" />
                      </TableCell>
                      <TableCell>{formatCurrency(item.bidAmount)}</TableCell>
                      <TableCell>{item.timelineDays ? `${item.timelineDays} days` : "Not set"}</TableCell>
                      <TableCell align="right" sx={{ minWidth: 250 }}>
                        <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                          <SoftButton variant="outlined" size="small" onClick={() => openReview(item)} disabled={busy}>
                            Review
                          </SoftButton>
                          <SoftButton
                            variant="outlined"
                            size="small"
                            color="info"
                            onClick={() => void changeStatus(item, "SHORTLISTED")}
                            disabled={busy || status === "SHORTLISTED" || status === "ACCEPTED"}
                          >
                            Shortlist
                          </SoftButton>
                          <SoftButton
                            variant="outlined"
                            size="small"
                            color="success"
                            onClick={() => void changeStatus(item, "ACCEPTED")}
                            disabled={busy || status === "ACCEPTED"}
                          >
                            Accept
                          </SoftButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && filteredProposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No proposals match the current filters.
                    </TableCell>
                  </TableRow>
                ) : null}
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      Loading proposal pipeline...
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </SoftCard>

      <Dialog open={!!selectedProposal} onClose={() => setSelectedProposal(null)} fullWidth maxWidth="sm">
        <DialogTitle>Review Proposal</DialogTitle>
        <DialogContent dividers>
          {selectedProposal ? (
            <Stack spacing={1.2}>
              <Typography variant="body2" color="text.secondary">
                Proposal: {selectedProposal.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Job: {selectedProposal.jobId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Freelancer: {selectedProposal.freelancerId || "Unknown"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bid: {formatCurrency(selectedProposal.bidAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Timeline: {selectedProposal.timelineDays ? `${selectedProposal.timelineDays} days` : "Not set"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submitted: {formatDateTime(selectedProposal.createdAt)}
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="proposal-review-status">Next Status</InputLabel>
                <Select
                  labelId="proposal-review-status"
                  value={reviewStatus}
                  label="Next Status"
                  onChange={(event) => setReviewStatus(event.target.value)}
                >
                  {proposalStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <SoftTextField
                fullWidth
                label="Cover letter"
                value={selectedProposal.coverLetter || ""}
                multiline
                minRows={6}
                InputProps={{ readOnly: true }}
              />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" onClick={() => setSelectedProposal(null)}>
            Close
          </SoftButton>
          <SoftButton
            variant="contained"
            onClick={() => void applyReview()}
            disabled={!selectedProposal || (selectedProposal ? busyProposalId === selectedProposal.id : false)}
          >
            Apply Status
          </SoftButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
