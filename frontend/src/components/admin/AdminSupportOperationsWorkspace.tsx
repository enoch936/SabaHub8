"use client";

import { useEffect, useMemo, useState } from "react";
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
import AssignmentLateRoundedIcon from "@mui/icons-material/AssignmentLateRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import SoftTextField from "@/components/mui/SoftTextField";
import { useContractStore } from "@/lib/contractStore";
import { useDisputeStore } from "@/lib/disputeStore";
import type { PlatformDispute, RestrictionAction } from "@/lib/types";

const disputeStatuses = ["OPEN", "UNDER_REVIEW", "EVIDENCE_REQUIRED", "SETTLEMENT_PENDING", "RESOLVED", "CLOSED"] as const;
const restrictionOptions: RestrictionAction[] = ["NONE", "BLOCK", "UNBLOCK", "BAN"];

function statusTone(status?: string): "default" | "success" | "warning" | "error" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "OPEN":
    case "EVIDENCE_REQUIRED":
      return "warning";
    case "UNDER_REVIEW":
    case "SETTLEMENT_PENDING":
      return "info";
    case "RESOLVED":
    case "CLOSED":
      return "success";
    default:
      return "default";
  }
}

export default function AdminSupportOperationsWorkspace() {
  const { contracts, fetchContracts } = useContractStore();
  const disputes = useDisputeStore((state) => state.disputes);
  const fetchDisputes = useDisputeStore((state) => state.fetchDisputes);
  const setStatus = useDisputeStore((state) => state.setStatus);
  const applySettlement = useDisputeStore((state) => state.applySettlement);
  const sendAdminMessage = useDisputeStore((state) => state.sendAdminMessage);
  const setParticipantRestriction = useDisputeStore((state) => state.setParticipantRestriction);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<PlatformDispute | null>(null);
  const [nextStatus, setNextStatus] = useState("UNDER_REVIEW");
  const [reviewNote, setReviewNote] = useState("");
  const [messageTarget, setMessageTarget] = useState<"EMPLOYER" | "FREELANCER" | "BOTH">("BOTH");
  const [messageBody, setMessageBody] = useState("");
  const [employerPercent, setEmployerPercent] = useState("50");
  const [freelancerPercent, setFreelancerPercent] = useState("50");
  const [adminPercent, setAdminPercent] = useState("0");

  useEffect(() => {
    void fetchContracts();
    void fetchDisputes();
  }, [fetchContracts, fetchDisputes]);

  const metrics = useMemo(() => {
    const open = disputes.filter((item) => item.status === "OPEN").length;
    const underReview = disputes.filter((item) => item.status === "UNDER_REVIEW").length;
    const pendingSettlement = disputes.filter((item) => item.status === "SETTLEMENT_PENDING").length;
    const resolved = disputes.filter((item) => item.status === "RESOLVED" || item.status === "CLOSED").length;
    return {
      total: disputes.length,
      open,
      underReview,
      pendingSettlement,
      resolved,
    };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return disputes.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!normalized) return true;
      return [
        item.id,
        item.contractId,
        item.contractTitle,
        item.employerName,
        item.freelancerName,
        item.reason,
        item.details ?? "",
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [disputes, query, statusFilter]);

  const selectedContract = selectedDispute
    ? contracts.find((contract) => contract.id === selectedDispute.contractId)
    : null;

  const refreshReviewState = (dispute: PlatformDispute) => {
    setSelectedDispute(dispute);
    setNextStatus(dispute.status === "OPEN" ? "UNDER_REVIEW" : dispute.status);
    setReviewNote("");
    setMessageBody("");
    setEmployerPercent("50");
    setFreelancerPercent("50");
    setAdminPercent("0");
  };

  const settlementTotal =
    (Number.parseFloat(employerPercent) || 0) +
    (Number.parseFloat(freelancerPercent) || 0) +
    (Number.parseFloat(adminPercent) || 0);

  return (
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(24,40,59,0.16)",
          background: "linear-gradient(135deg, #1b2230 0%, #27384f 55%, #4c516a 100%)",
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.82 }}>
                SUPPORT + DISPUTE CONTROL
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                Admin can arbitrate, message, restrict, and settle funds
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.9, maxWidth: 840 }}>
                Every dispute now carries frozen escrow, party messaging, block or ban controls, and full or partial fund
                allocation to employer, freelancer, or admin reserve.
              </Typography>
            </Box>
            <SoftButton
              variant="outlined"
              onClick={() => void fetchContracts()}
              startIcon={<RefreshRoundedIcon />}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
            >
              Refresh
            </SoftButton>
          </Stack>
        </CardContent>
      </SoftCard>

      <Grid container spacing={2}>
        {[
          { label: "Total Cases", value: metrics.total, icon: <SupportAgentRoundedIcon fontSize="small" /> },
          { label: "Open", value: metrics.open, icon: <AssignmentLateRoundedIcon fontSize="small" /> },
          { label: "Under Review", value: metrics.underReview, icon: <ShieldRoundedIcon fontSize="small" /> },
          { label: "Settlement Pending", value: metrics.pendingSettlement, icon: <GavelRoundedIcon fontSize="small" /> },
          { label: "Resolved", value: metrics.resolved, icon: <TaskAltRoundedIcon fontSize="small" /> },
        ].map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, xl: 2.4 }}>
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
                label="Search dispute queue"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Case ID, contract, employer, freelancer, reason"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="support-status-filter">Case Status</InputLabel>
                <Select
                  labelId="support-status-filter"
                  value={statusFilter}
                  label="Case Status"
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  {disputeStatuses.map((status) => (
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
              Dispute Case Queue
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Open review to move status, message both or one party, apply block or ban actions, and settle escrow.
            </Typography>
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Case</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Escrow</TableCell>
                  <TableCell>Parties</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDisputes.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ minWidth: 260 }}>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          {item.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.contractTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.reason}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.status} size="small" color={statusTone(item.status)} variant="outlined" />
                    </TableCell>
                    <TableCell>{item.currency} {item.heldAmount.toLocaleString()}</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Typography variant="body2" color="text.secondary">
                        {item.employerName} / {item.freelancerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Employer {item.participantControls.employer.toLowerCase()} • Freelancer {item.participantControls.freelancer.toLowerCase()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 180 }}>
                      <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                        <SoftButton variant="outlined" size="small" onClick={() => refreshReviewState(item)}>
                          Review
                        </SoftButton>
                        <SoftButton variant="outlined" size="small" color="info" onClick={() => setStatus(item.id, "UNDER_REVIEW", "Case moved to admin review.")}>
                          Review Queue
                        </SoftButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDisputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No support cases match the current filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </SoftCard>

      <Dialog open={!!selectedDispute} onClose={() => setSelectedDispute(null)} fullWidth maxWidth="md">
        <DialogTitle>Dispute Command Center</DialogTitle>
        <DialogContent dividers>
          {selectedDispute ? (
            <Stack spacing={2}>
              <Alert severity="info">
                Contract {selectedDispute.contractId} • Held escrow {selectedDispute.currency} {selectedDispute.heldAmount.toLocaleString()}
              </Alert>

              <Grid container spacing={1.4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                    <CardContent>
                      <Stack spacing={1.2}>
                        <Typography variant="h6" fontWeight={800}>Case review</Typography>
                        <Typography variant="body2" color="text.secondary">{selectedDispute.reason}</Typography>
                        {selectedDispute.details ? (
                          <Typography variant="body2" color="text.secondary">{selectedDispute.details}</Typography>
                        ) : null}
                        <FormControl fullWidth size="small">
                          <InputLabel id="support-review-status">Next Status</InputLabel>
                          <Select
                            labelId="support-review-status"
                            value={nextStatus}
                            label="Next Status"
                            onChange={(event) => setNextStatus(event.target.value)}
                          >
                            {disputeStatuses.map((status) => (
                              <MenuItem key={status} value={status}>{status}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <SoftTextField
                          fullWidth
                          label="Admin note"
                          value={reviewNote}
                          onChange={(event) => setReviewNote(event.target.value)}
                          multiline
                          minRows={3}
                        />
                        <SoftButton
                          variant="contained"
                          onClick={() => {
                            setStatus(selectedDispute.id, nextStatus as PlatformDispute["status"], reviewNote);
                            refreshReviewState({ ...selectedDispute, status: nextStatus as PlatformDispute["status"] });
                          }}
                        >
                          Apply Status Update
                        </SoftButton>
                      </Stack>
                    </CardContent>
                  </SoftCard>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                    <CardContent>
                      <Stack spacing={1.2}>
                        <Typography variant="h6" fontWeight={800}>Admin messaging</Typography>
                        <FormControl fullWidth size="small">
                          <InputLabel id="support-message-target">Message target</InputLabel>
                          <Select
                            labelId="support-message-target"
                            value={messageTarget}
                            label="Message target"
                            onChange={(event) => setMessageTarget(event.target.value as "EMPLOYER" | "FREELANCER" | "BOTH")}
                          >
                            <MenuItem value="BOTH">Both parties</MenuItem>
                            <MenuItem value="EMPLOYER">Employer only</MenuItem>
                            <MenuItem value="FREELANCER">Freelancer only</MenuItem>
                          </Select>
                        </FormControl>
                        <SoftTextField
                          fullWidth
                          label="Message body"
                          value={messageBody}
                          onChange={(event) => setMessageBody(event.target.value)}
                          multiline
                          minRows={3}
                        />
                        <SoftButton
                          variant="outlined"
                          startIcon={<ForumRoundedIcon />}
                          onClick={() => {
                            sendAdminMessage({
                              disputeId: selectedDispute.id,
                              target: messageTarget,
                              content: messageBody,
                            });
                            setMessageBody("");
                          }}
                        >
                          Send Message
                        </SoftButton>
                        {selectedDispute.messages.length > 0 ? (
                          <Stack spacing={0.8}>
                            {selectedDispute.messages.slice(0, 3).map((message) => (
                              <Alert key={message.id} severity="info">
                                {message.target}: {message.content}
                              </Alert>
                            ))}
                          </Stack>
                        ) : null}
                      </Stack>
                    </CardContent>
                  </SoftCard>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                    <CardContent>
                      <Stack spacing={1.2}>
                        <Typography variant="h6" fontWeight={800}>Account restrictions</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Apply emergency controls while review is active.
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {restrictionOptions.map((action) => (
                            <SoftButton
                              key={`employer-${action}`}
                              variant="outlined"
                              size="small"
                              onClick={() => setParticipantRestriction({ disputeId: selectedDispute.id, subject: "EMPLOYER", action })}
                            >
                              Employer {action.toLowerCase()}
                            </SoftButton>
                          ))}
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {restrictionOptions.map((action) => (
                            <SoftButton
                              key={`freelancer-${action}`}
                              variant="outlined"
                              size="small"
                              onClick={() => setParticipantRestriction({ disputeId: selectedDispute.id, subject: "FREELANCER", action })}
                            >
                              Freelancer {action.toLowerCase()}
                            </SoftButton>
                          ))}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </SoftCard>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                    <CardContent>
                      <Stack spacing={1.2}>
                        <Typography variant="h6" fontWeight={800}>Fund settlement</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Split held escrow by full refund, partial split, or any custom percentage.
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid size={{ xs: 4 }}>
                            <SoftTextField label="Employer %" value={employerPercent} onChange={(event) => setEmployerPercent(event.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <SoftTextField label="Freelancer %" value={freelancerPercent} onChange={(event) => setFreelancerPercent(event.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <SoftTextField label="Admin %" value={adminPercent} onChange={(event) => setAdminPercent(event.target.value)} />
                          </Grid>
                        </Grid>
                        <Alert severity={settlementTotal === 100 ? "success" : "warning"}>
                          Total allocation: {settlementTotal}%
                        </Alert>
                        <SoftButton
                          variant="contained"
                          color="success"
                          startIcon={<GavelRoundedIcon />}
                          disabled={settlementTotal !== 100}
                          onClick={() =>
                            applySettlement({
                              disputeId: selectedDispute.id,
                              employerPercent: Number.parseFloat(employerPercent) || 0,
                              freelancerPercent: Number.parseFloat(freelancerPercent) || 0,
                              adminPercent: Number.parseFloat(adminPercent) || 0,
                              note: reviewNote || "Admin settlement applied.",
                            })
                          }
                        >
                          Apply Settlement
                        </SoftButton>
                      </Stack>
                    </CardContent>
                  </SoftCard>
                </Grid>
              </Grid>

              {selectedContract ? (
                <Alert severity="warning" icon={<WarningAmberRoundedIcon />}>
                  Contract status: {selectedContract.status} • Escrow policy {selectedContract.escrowProtectionLevel || "FULL"} • Auto-release{" "}
                  {selectedContract.autoReleaseDays ?? 5} days
                </Alert>
              ) : null}

              {(selectedDispute.adminNotes?.length ?? 0) > 0 ? (
                <Stack spacing={0.8}>
                  <Typography variant="subtitle2" fontWeight={800}>Audit trail</Typography>
                  {selectedDispute.adminNotes.slice().reverse().slice(0, 6).map((note, index) => (
                    <Alert key={`${selectedDispute.id}-note-${index}`} severity="info">
                      {note}
                    </Alert>
                  ))}
                </Stack>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" onClick={() => setSelectedDispute(null)}>
            Close
          </SoftButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
