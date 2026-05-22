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
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import SoftTextField from "@/components/mui/SoftTextField";
import { useDisputeStore } from "@/lib/disputeStore";
import {
  type AdminPaymentTransaction,
  type AdminPendingInternalTransfer,
  type AppUser,
  type AdminWithdrawal,
  type AdminCommandCenterOperation,
  type PendingLocalTopup,
  adminListPaymentTransactions,
  adminListPendingInternalTransfers,
  adminCommandCenterDomain,
  adminCommandCenterExecuteOperation,
  adminListWithdrawals,
  adminListUsers,
  adminWalletAdjust,
  adminReviewInternalTransfer,
  adminReviewLocal,
  adminUpdateWithdrawal,
  listPendingLocalTopups,
} from "@/lib/api";

const allWithdrawalStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"] as const;
const financeDomainId = "payment-financial-oversight";

type FinanceRunbookForm = {
  note: string;
  limit: string;
  highValueThreshold: string;
  nextStatus: string;
  lookbackDays: string;
};

const defaultRunbookForm: FinanceRunbookForm = {
  note: "",
  limit: "",
  highValueThreshold: "",
  nextStatus: "PROCESSING",
  lookbackDays: "30",
};

// Map of common invalid codes to valid ISO 4217 codes
const currencyCodeMap: Record<string, string> = {
  BIRR: "ETB", // Ethiopian Birr
};

function currencyFormatter(currency = "USD") {
  // Normalize currency code (handle old/invalid codes)
  const validCurrency = currencyCodeMap[currency] || currency;
  
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: validCurrency,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    // Fallback to USD if currency code is invalid
    console.warn(`Invalid currency code: ${currency}, falling back to USD`);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  }
}

function formatMoney(amount: number, currency = "USD") {
  return currencyFormatter(currency).format(amount);
}

function toNumber(value?: string | number | null) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
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

function toneForStatus(status?: string): "default" | "success" | "warning" | "error" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "SUCCESS":
    case "COMPLETED":
      return "success";
    case "FAILED":
    case "CANCELLED":
      return "error";
    case "PROCESSING":
      return "info";
    case "PENDING":
      return "warning";
    default:
      return "default";
  }
}

export default function AdminFinanceWorkspace() {
  const disputes = useDisputeStore((state) => state.disputes);
  const fetchDisputes = useDisputeStore((state) => state.fetchDisputes);
  const [pendingTopups, setPendingTopups] = useState<PendingLocalTopup[]>([]);
  const [pendingInternalTransfers, setPendingInternalTransfers] = useState<AdminPendingInternalTransfer[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<AdminPaymentTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState("PENDING,PROCESSING");
  const [selectedTopup, setSelectedTopup] = useState<PendingLocalTopup | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [withdrawalNote, setWithdrawalNote] = useState("");
  const [withdrawalNextStatus, setWithdrawalNextStatus] = useState("PROCESSING");
  const [busyTopupId, setBusyTopupId] = useState<string | null>(null);
  const [busyInternalTransferId, setBusyInternalTransferId] = useState<string | null>(null);
  const [busyWithdrawalId, setBusyWithdrawalId] = useState<string | null>(null);
  const [operations, setOperations] = useState<AdminCommandCenterOperation[]>([]);
  const [selectedOperationId, setSelectedOperationId] = useState("audit-financial-transactions");
  const [runbookBusyId, setRunbookBusyId] = useState<string | null>(null);
  const [runbookForm, setRunbookForm] = useState<FinanceRunbookForm>(defaultRunbookForm);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedRechargeUserId, setSelectedRechargeUserId] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeCurrency, setRechargeCurrency] = useState("USD");
  const [rechargeAction, setRechargeAction] = useState<"COMMIT" | "ROLLBACK">("COMMIT");
  const [rechargeNote, setRechargeNote] = useState("");
  const [rechargeBusy, setRechargeBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [topupsPage, internalTransfersPage, transactionsPage, withdrawalsPage, financeDomain, usersList] = await Promise.all([
        listPendingLocalTopups({ page: 0, size: 100 }),
        adminListPendingInternalTransfers({ page: 0, size: 100 }),
        adminListPaymentTransactions({ page: 0, size: 100 }),
        adminListWithdrawals({ status: allWithdrawalStatuses.join(","), page: 0, size: 100 }),
        adminCommandCenterDomain(financeDomainId),
        adminListUsers(),
      ]);
      setPendingTopups(topupsPage.content ?? []);
      setPendingInternalTransfers(internalTransfersPage.content ?? []);
      setPaymentTransactions(transactionsPage.content ?? []);
      setWithdrawals(withdrawalsPage.content ?? []);
      setUsers(usersList ?? []);
      setOperations(financeDomain.domain.operations ?? []);
      if ((financeDomain.domain.operations ?? []).length > 0) {
        setSelectedOperationId((current) => {
          const hasCurrent = financeDomain.domain.operations.some((operation) => operation.id === current);
          return hasCurrent ? current : financeDomain.domain.operations[0].id;
        });
      }
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load finance operations.";
      setError(message);
      setPendingTopups([]);
      setPendingInternalTransfers([]);
      setPaymentTransactions([]);
      setWithdrawals([]);
      setUsers([]);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void fetchDisputes();
  }, [fetchDisputes, load]);

  const visibleWithdrawalStatuses = useMemo(
    () => new Set(withdrawalStatusFilter.split(",").map((item) => item.trim()).filter(Boolean)),
    [withdrawalStatusFilter],
  );

  const filteredTopups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return pendingTopups;
    }
    return pendingTopups.filter((item) =>
      [item.id, item.userId, item.providerRef ?? "", item.currency ?? ""].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [pendingTopups, query]);

  const filteredPendingInternalTransfers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return pendingInternalTransfers;
    }
    return pendingInternalTransfers.filter((item) =>
      [
        item.id,
        item.userId,
        item.providerRef ?? "",
        (item.metadata?.counterpartyUserId as string | undefined) ?? "",
        (item.metadata?.counterpartyEmail as string | undefined) ?? "",
      ].some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [pendingInternalTransfers, query]);

  const filteredPaymentTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return paymentTransactions;
    }
    return paymentTransactions.filter((item) =>
      [
        item.id,
        item.userId,
        item.senderUserId ?? "",
        item.senderLabel ?? "",
        item.receiverUserId ?? "",
        item.receiverLabel ?? "",
        item.providerRef ?? "",
        item.provider ?? "",
        item.status ?? "",
      ].some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [paymentTransactions, query]);

  const filteredWithdrawals = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return withdrawals.filter((item) => {
      const status = (item.statusEnum || item.status || "").toUpperCase();
      if (visibleWithdrawalStatuses.size && !visibleWithdrawalStatuses.has(status)) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [
        item.id ?? "",
        item.userId ?? "",
        item.freelancerId ?? "",
        item.paymentMethod ?? "",
        item.referenceNumber ?? "",
        item.transactionId ?? "",
        item.bankName ?? "",
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [query, visibleWithdrawalStatuses, withdrawals]);

  const metrics = useMemo(() => {
    const pendingTopupAmount = pendingTopups.reduce((sum, item) => sum + (item.amount || 0), 0);
    const pendingWithdrawals = withdrawals.filter((item) => (item.statusEnum || item.status || "").toUpperCase() === "PENDING");
    const processingWithdrawals = withdrawals.filter((item) => (item.statusEnum || item.status || "").toUpperCase() === "PROCESSING");
    const pendingWithdrawalAmount = pendingWithdrawals.reduce(
      (sum, item) => sum + (item.amountDecimal ?? toNumber(item.amount)),
      0,
    );
    return {
      pendingTopupsCount: pendingTopups.length,
      pendingTopupAmount,
      pendingInternalTransfersCount: pendingInternalTransfers.length,
      pendingWithdrawalsCount: pendingWithdrawals.length,
      processingWithdrawalsCount: processingWithdrawals.length,
      pendingWithdrawalAmount,
      disputedEscrowCount: disputes.filter((item) => item.heldAmount > 0).length,
      disputedEscrowAmount: disputes.reduce((sum, item) => sum + item.heldAmount, 0),
    };
  }, [disputes, paymentTransactions.length, pendingInternalTransfers.length, pendingTopups, withdrawals]);

  const selectedOperation = useMemo(
    () => operations.find((operation) => operation.id === selectedOperationId) ?? null,
    [operations, selectedOperationId],
  );

  const buildRunbookParameters = (operationId: string) => {
    const parameters: Record<string, unknown> = {};
    const limit = Number.parseInt(runbookForm.limit.trim(), 10);
    if (!Number.isNaN(limit) && limit > 0) {
      parameters.limit = limit;
    }

    if (operationId === "audit-financial-transactions") {
      const threshold = Number.parseFloat(runbookForm.highValueThreshold.trim());
      if (!Number.isNaN(threshold) && threshold > 0) {
        parameters.highValueThreshold = threshold;
      }
    }

    if (operationId === "review-withdrawal-queue") {
      parameters.nextStatus = runbookForm.nextStatus;
    }

    if (operationId === "generate-financial-report") {
      const lookback = Number.parseInt(runbookForm.lookbackDays.trim(), 10);
      if (!Number.isNaN(lookback) && lookback > 0) {
        parameters.lookbackDays = lookback;
      }
    }

    return Object.keys(parameters).length > 0 ? parameters : undefined;
  };

  const executeRunbook = async (dryRun: boolean) => {
    if (!selectedOperation) {
      return;
    }
    const busyKey = `${selectedOperation.id}:${dryRun ? "dry" : "run"}`;
    setRunbookBusyId(busyKey);
    setActionStatus(null);
    try {
      const note = runbookForm.note.trim();
      const parameters = buildRunbookParameters(selectedOperation.id);
      const result = await adminCommandCenterExecuteOperation(financeDomainId, selectedOperation.id, {
        dryRun,
        note: note || (dryRun ? "Dry run from finance workspace" : "Execution from finance workspace"),
        parameters,
      });
      setActionStatus(`${result.title} finished with status ${result.status}. ${result.description}`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to execute financial runbook.";
      setActionStatus(message);
    } finally {
      setRunbookBusyId(null);
    }
  };

  const submitRecharge = async () => {
    const amount = Number.parseFloat(rechargeAmount);
    if (!selectedRechargeUserId) {
      setActionStatus("Please select a user.");
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      setActionStatus("Amount must be greater than 0.");
      return;
    }

    setRechargeBusy(true);
    setActionStatus(null);
    try {
      const result = await adminWalletAdjust({
        userId: selectedRechargeUserId,
        amount,
        currency: rechargeCurrency,
        action: rechargeAction,
        note: rechargeNote.trim() || undefined,
      });

      const selectedUser = users.find((user) => user.id === selectedRechargeUserId);
      const userLabel = selectedUser?.fullName || selectedUser?.email || selectedRechargeUserId;
      setActionStatus(
        `${rechargeAction === "ROLLBACK" ? "Rollback" : "Commit"} completed for ${userLabel}. Amount: ${formatMoney(result.amount, rechargeCurrency)}. New balance: ${formatMoney(result.newBalance, rechargeCurrency)}.`,
      );
      setRechargeAmount("");
      setRechargeNote("");
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to adjust wallet.";
      setActionStatus(message);
    } finally {
      setRechargeBusy(false);
    }
  };

  const approveOrRejectTopup = async (target: PendingLocalTopup, approved: boolean, note?: string) => {
    if (!target) {
      return;
    }
    setBusyTopupId(target.id);
    setActionStatus(null);
    try {
      const result = await adminReviewLocal({
        transactionId: target.id,
        approved,
        note: note?.trim() || undefined,
      });
      setPendingTopups((current) => current.filter((item) => item.id !== target.id));
      setActionStatus(`Local payment ${approved ? "approved" : "rejected"} with status ${result.status ?? "updated"}.`);
      setSelectedTopup(null);
      setReviewNote("");
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to review local payment.";
      setActionStatus(message);
    } finally {
      setBusyTopupId(null);
    }
  };

  const approveOrRejectInternalTransfer = async (target: AdminPendingInternalTransfer, approved: boolean) => {
    if (!target?.id) {
      return;
    }
    setBusyInternalTransferId(target.id);
    setActionStatus(null);
    try {
      const note = approved
        ? "Approved from finance workspace"
        : "Rejected from finance workspace";
      const result = await adminReviewInternalTransfer(target.id, { approved, note });
      setPendingInternalTransfers((current) => current.filter((item) => item.id !== target.id));
      setActionStatus(`Internal transfer ${target.id} reviewed with status ${result.status}.`);
      await load();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to review internal transfer.";
      setActionStatus(message);
    } finally {
      setBusyInternalTransferId(null);
    }
  };

  const applyWithdrawalUpdate = async (target: AdminWithdrawal, status: string, note?: string) => {
    if (!target?.id) {
      return;
    }
    setBusyWithdrawalId(target.id);
    setActionStatus(null);
    try {
      const updated = await adminUpdateWithdrawal(target.id, {
        status,
        note: note?.trim() || undefined,
      });
      setWithdrawals((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setActionStatus(`Withdrawal ${updated.id} moved to ${updated.status || updated.statusEnum}.`);
      setSelectedWithdrawal(updated);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to update withdrawal.";
      setActionStatus(message);
    } finally {
      setBusyWithdrawalId(null);
    }
  };

  return (
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(24,40,59,0.16)",
          background: "linear-gradient(135deg, #16212d 0%, #22425d 56%, #1f6b75 100%)",
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.8 }}>
                  FINANCE OPERATIONS
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                  Payments oversight is now a real workspace
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.9, maxWidth: 780 }}>
                  Review local payment proofs, approve or reject top-ups, and move withdrawal requests through finance processing with direct admin controls.
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
          {
            label: "Pending Local Top-Ups",
            value: metrics.pendingTopupsCount,
            helper: formatMoney(metrics.pendingTopupAmount, "USD"),
            icon: <PendingActionsRoundedIcon fontSize="small" />,
          },
          {
            label: "Pending Wallet Transfers",
            value: metrics.pendingInternalTransfersCount,
            helper: "Awaiting admin review",
            icon: <SyncRoundedIcon fontSize="small" />,
          },
          {
            label: "Pending Withdrawals",
            value: metrics.pendingWithdrawalsCount,
            helper: formatMoney(metrics.pendingWithdrawalAmount, "USD"),
            icon: <AccountBalanceWalletRoundedIcon fontSize="small" />,
          },
          {
            label: "Processing Payouts",
            value: metrics.processingWithdrawalsCount,
            helper: "Active payout review",
            icon: <SyncRoundedIcon fontSize="small" />,
          },
          {
            label: "Queue Health",
            value: metrics.pendingTopupsCount + metrics.pendingInternalTransfersCount + metrics.pendingWithdrawalsCount,
            helper: "Open finance actions",
            icon: <TaskAltRoundedIcon fontSize="small" />,
          },
          {
            label: "Disputed Escrow",
            value: metrics.disputedEscrowCount,
            helper: formatMoney(metrics.disputedEscrowAmount, "USD"),
            icon: <PendingActionsRoundedIcon fontSize="small" />,
          },
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
                  <Typography variant="caption" color="text.secondary">
                    {metric.helper}
                  </Typography>
                </Stack>
              </CardContent>
            </SoftCard>
          </Grid>
        ))}
      </Grid>

      {disputes.length > 0 ? (
        <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={800}>
              Dispute Fund Decisions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Escrow under dispute is visible here so finance can verify settlement impact before or after admin arbitration.
            </Typography>
            <Stack spacing={1}>
              {disputes.slice(0, 5).map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>
                      {item.id} • {item.contractTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.employerName} / {item.freelancerName} • {item.status}
                    </Typography>
                  </Box>
                  <Box textAlign={{ xs: "left", md: "right" }}>
                    <Typography variant="subtitle2" fontWeight={800}>
                      {formatMoney(item.heldAmount, item.currency)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.settlement
                        ? `Settled ${item.settlement.freelancerPercent}% / ${item.settlement.employerPercent}% / ${item.settlement.adminPercent}%`
                        : "Awaiting settlement"}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </SoftCard>
      ) : null}

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Grid container spacing={1.2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <SoftTextField
                fullWidth
                label="Search finance queues"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Transaction ID, user ID, payout reference, bank"
                InputProps={{ startAdornment: <SearchRoundedIcon sx={{ fontSize: 18, mr: 1, color: "text.secondary" }} /> }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="withdrawal-status-filter">Withdrawal Queue</InputLabel>
                <Select
                  labelId="withdrawal-status-filter"
                  value={withdrawalStatusFilter}
                  label="Withdrawal Queue"
                  onChange={(event) => setWithdrawalStatusFilter(event.target.value)}
                >
                  <MenuItem value="PENDING,PROCESSING">Pending + Processing</MenuItem>
                  <MenuItem value="PENDING">Pending only</MenuItem>
                  <MenuItem value="PROCESSING">Processing only</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="FAILED,CANCELLED">Failed + Cancelled</MenuItem>
                  <MenuItem value={allWithdrawalStatuses.join(",")}>All statuses</MenuItem>
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
              Pending Wallet-to-Wallet Transfers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Every wallet transfer remains pending until a finance admin approves or rejects it.
            </Typography>
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sender</TableCell>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPendingInternalTransfers.map((item) => {
                  const busy = busyInternalTransferId === item.id;
                  const recipientLabel =
                    ((item.metadata?.counterpartyEmail as string | undefined) ||
                      (item.metadata?.counterpartyUserId as string | undefined) ||
                      "Unknown");

                  return (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {item.userId}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tx: {item.id}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{recipientLabel}</TableCell>
                      <TableCell>{formatMoney(item.amount ?? 0, item.currency || "USD")}</TableCell>
                      <TableCell>{item.providerRef || "N/A"}</TableCell>
                      <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                      <TableCell align="right" sx={{ minWidth: 220 }}>
                        <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                          <SoftButton
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => void approveOrRejectInternalTransfer(item, false)}
                            disabled={busy}
                          >
                            Reject
                          </SoftButton>
                          <SoftButton
                            variant="contained"
                            size="small"
                            color="success"
                            onClick={() => void approveOrRejectInternalTransfer(item, true)}
                            disabled={busy}
                          >
                            Approve
                          </SoftButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && filteredPendingInternalTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      No pending wallet transfers.
                    </TableCell>
                  </TableRow>
                ) : null}
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      Loading wallet transfer queue...
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </SoftCard>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" fontWeight={800}>
              Admin Payment Transactions Ledger
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Full transaction visibility for finance admins across providers, directions, and statuses.
            </Typography>
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Transaction</TableCell>
                  <TableCell>Sender</TableCell>
                  <TableCell>Receiver</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPaymentTransactions.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          {item.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Updated: {formatDateTime(item.updatedAt)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{item.senderLabel || item.senderUserId || item.userId || "N/A"}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{item.receiverLabel || item.receiverUserId || "N/A"}</TableCell>
                    <TableCell>{item.provider || "N/A"}</TableCell>
                    <TableCell>{item.direction || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={(item.status || "UNKNOWN").toUpperCase()}
                        size="small"
                        color={toneForStatus(item.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatMoney(item.amount ?? 0, item.currency || "USD")}</TableCell>
                    <TableCell>{item.providerRef || "N/A"}</TableCell>
                    <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {!loading && filteredPaymentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      No payment transactions found.
                    </TableCell>
                  </TableRow>
                ) : null}
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      Loading payment transactions...
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </SoftCard>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={1.2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Admin Wallet Commit / Rollback
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a user account, then commit money (credit) or rollback money (debit) with audit note.
              </Typography>
            </Box>

            <Grid container spacing={1.2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="recharge-user-select">User</InputLabel>
                  <Select
                    labelId="recharge-user-select"
                    value={selectedRechargeUserId}
                    label="User"
                    onChange={(event) => setSelectedRechargeUserId(event.target.value)}
                    disabled={loading || rechargeBusy}
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {(user.fullName || user.email) + " - " + user.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="recharge-action">Action</InputLabel>
                  <Select
                    labelId="recharge-action"
                    value={rechargeAction}
                    label="Action"
                    onChange={(event) => setRechargeAction(event.target.value as "COMMIT" | "ROLLBACK")}
                    disabled={rechargeBusy}
                  >
                    <MenuItem value="COMMIT">Commit (Credit)</MenuItem>
                    <MenuItem value="ROLLBACK">Rollback (Debit)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <SoftTextField
                  fullWidth
                  label="Amount"
                  value={rechargeAmount}
                  onChange={(event) => setRechargeAmount(event.target.value)}
                  placeholder="e.g. 100"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="recharge-currency">Currency</InputLabel>
                  <Select
                    labelId="recharge-currency"
                    value={rechargeCurrency}
                    label="Currency"
                    onChange={(event) => setRechargeCurrency(event.target.value)}
                    disabled={rechargeBusy}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="ETB">ETB</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 9 }}>
                <SoftTextField
                  fullWidth
                  label="Adjustment Note"
                  value={rechargeNote}
                  onChange={(event) => setRechargeNote(event.target.value)}
                  placeholder="Reason for commit/rollback"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <SoftButton
                    variant="contained"
                    color={rechargeAction === "ROLLBACK" ? "error" : "success"}
                    onClick={() => void submitRecharge()}
                    disabled={rechargeBusy || loading}
                  >
                    {rechargeBusy ? "Processing..." : rechargeAction === "ROLLBACK" ? "Rollback Money" : "Commit Money"}
                  </SoftButton>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </SoftCard>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Stack spacing={1.2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Financial Runbooks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Execute payment audit, withdrawal queue processing, and financial reporting runbooks with operator parameters.
              </Typography>
            </Box>

            <Grid container spacing={1.2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="finance-runbook">Runbook</InputLabel>
                  <Select
                    labelId="finance-runbook"
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
                  placeholder="e.g. 100"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <SoftButton
                  variant="outlined"
                  fullWidth
                  onClick={() => setRunbookForm(defaultRunbookForm)}
                  sx={{ height: "100%" }}
                >
                  Clear Runbook Parameters
                </SoftButton>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <SoftTextField
                  fullWidth
                  label="Operator Note"
                  value={runbookForm.note}
                  onChange={(event) => setRunbookForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Optional context for this financial operation"
                />
              </Grid>

              {selectedOperationId === "audit-financial-transactions" ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <SoftTextField
                    fullWidth
                    label="High Value Threshold"
                    value={runbookForm.highValueThreshold}
                    onChange={(event) => setRunbookForm((current) => ({ ...current, highValueThreshold: event.target.value }))}
                    placeholder="e.g. 2500"
                  />
                </Grid>
              ) : null}

              {selectedOperationId === "review-withdrawal-queue" ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="finance-runbook-next-status">Queue Next Status</InputLabel>
                    <Select
                      labelId="finance-runbook-next-status"
                      value={runbookForm.nextStatus}
                      label="Queue Next Status"
                      onChange={(event) => setRunbookForm((current) => ({ ...current, nextStatus: event.target.value }))}
                    >
                      {allWithdrawalStatuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ) : null}

              {selectedOperationId === "generate-financial-report" ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <SoftTextField
                    fullWidth
                    label="Lookback Days"
                    value={runbookForm.lookbackDays}
                    onChange={(event) => setRunbookForm((current) => ({ ...current, lookbackDays: event.target.value }))}
                    placeholder="e.g. 30"
                  />
                </Grid>
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
                    <Chip label={`${selectedOperation.impact} impact`} size="small" variant="outlined" sx={{ alignSelf: "center" }} />
                  ) : null}
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </SoftCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="h6" fontWeight={800}>
                  Pending Local Top-Up Review
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approve or reject manual payment submissions waiting for admin confirmation.
                </Typography>
              </Box>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Transaction</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTopups.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ minWidth: 220 }}>
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2" fontWeight={800}>
                              {item.id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              User: {item.userId}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{formatMoney(item.amount || 0, item.currency || "USD")}</TableCell>
                        <TableCell>{item.providerRef || "No reference"}</TableCell>
                        <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                        <TableCell align="right" sx={{ minWidth: 220 }}>
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                            <SoftButton
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setSelectedTopup(item);
                                setReviewNote("");
                              }}
                              disabled={busyTopupId === item.id}
                            >
                              Review
                            </SoftButton>
                            <SoftButton
                              variant="outlined"
                              size="small"
                              color="success"
                              startIcon={<CheckCircleRoundedIcon />}
                              onClick={() => void approveOrRejectTopup(item, true)}
                              disabled={busyTopupId === item.id}
                            >
                              Approve
                            </SoftButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && filteredTopups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          No pending local payments match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          Loading local payment queue...
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="h6" fontWeight={800}>
                  Withdrawal Review Queue
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Move payout requests through pending, processing, completion, failure, or cancellation.
                </Typography>
              </Box>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Withdrawal</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredWithdrawals.map((item) => {
                      const status = (item.statusEnum || item.status || "PENDING").toUpperCase();
                      const amount = item.amountDecimal ?? toNumber(item.amount);
                      const busy = busyWithdrawalId === item.id;
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ minWidth: 220 }}>
                            <Stack spacing={0.25}>
                              <Typography variant="subtitle2" fontWeight={800}>
                                {item.id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                User: {item.userId || item.freelancerId || "Unknown"}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip label={status} size="small" color={toneForStatus(status)} variant="outlined" />
                          </TableCell>
                          <TableCell>{formatMoney(amount, item.currency || "USD")}</TableCell>
                          <TableCell>{item.paymentMethod || "Not set"}</TableCell>
                          <TableCell align="right" sx={{ minWidth: 210 }}>
                            <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                              <SoftButton
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  setSelectedWithdrawal(item);
                                  setWithdrawalNextStatus(status === "PENDING" ? "PROCESSING" : status);
                                  setWithdrawalNote(item.notes || item.failureReason || "");
                                }}
                                disabled={busy}
                              >
                                Review
                              </SoftButton>
                              <SoftButton
                                variant="outlined"
                                size="small"
                                color="info"
                                onClick={() => void applyWithdrawalUpdate(item, "PROCESSING", item.notes || "")}
                                disabled={busy || status === "PROCESSING"}
                              >
                                Process
                              </SoftButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!loading && filteredWithdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          No withdrawals match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          Loading withdrawal queue...
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>

      <Dialog open={!!selectedTopup} onClose={() => setSelectedTopup(null)} fullWidth maxWidth="sm">
        <DialogTitle>Review Local Payment</DialogTitle>
        <DialogContent dividers>
          {selectedTopup ? (
            <Stack spacing={1.2}>
              <Typography variant="body2" color="text.secondary">
                Transaction: {selectedTopup.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                User: {selectedTopup.userId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount: {formatMoney(selectedTopup.amount || 0, selectedTopup.currency || "USD")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reference: {selectedTopup.providerRef || "No reference"}
              </Typography>
              <SoftTextField
                fullWidth
                label="Review note"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                multiline
                minRows={3}
              />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" onClick={() => setSelectedTopup(null)}>
            Close
          </SoftButton>
          <SoftButton
            variant="outlined"
            color="error"
            startIcon={<CloseRoundedIcon />}
            onClick={() => selectedTopup ? void approveOrRejectTopup(selectedTopup, false, reviewNote) : undefined}
            disabled={!selectedTopup || (selectedTopup ? busyTopupId === selectedTopup.id : false)}
          >
            Reject
          </SoftButton>
          <SoftButton
            variant="contained"
            color="success"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={() => selectedTopup ? void approveOrRejectTopup(selectedTopup, true, reviewNote) : undefined}
            disabled={!selectedTopup || (selectedTopup ? busyTopupId === selectedTopup.id : false)}
          >
            Approve
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedWithdrawal} onClose={() => setSelectedWithdrawal(null)} fullWidth maxWidth="sm">
        <DialogTitle>Review Withdrawal</DialogTitle>
        <DialogContent dividers>
          {selectedWithdrawal ? (
            <Stack spacing={1.2}>
              <Typography variant="body2" color="text.secondary">
                Withdrawal: {selectedWithdrawal.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requester: {selectedWithdrawal.userId || selectedWithdrawal.freelancerId || "Unknown"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount: {formatMoney(selectedWithdrawal.amountDecimal ?? toNumber(selectedWithdrawal.amount), selectedWithdrawal.currency || "USD")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Method: {selectedWithdrawal.paymentMethod || "Not set"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requested: {formatDateTime(selectedWithdrawal.requestedAt || selectedWithdrawal.createdAt)}
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="withdrawal-next-status">Next Status</InputLabel>
                <Select
                  labelId="withdrawal-next-status"
                  value={withdrawalNextStatus}
                  label="Next Status"
                  onChange={(event) => setWithdrawalNextStatus(event.target.value)}
                >
                  {allWithdrawalStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <SoftTextField
                fullWidth
                label="Finance note"
                value={withdrawalNote}
                onChange={(event) => setWithdrawalNote(event.target.value)}
                multiline
                minRows={3}
              />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" onClick={() => setSelectedWithdrawal(null)}>
            Close
          </SoftButton>
          <SoftButton
            variant="contained"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={() => selectedWithdrawal ? void applyWithdrawalUpdate(selectedWithdrawal, withdrawalNextStatus, withdrawalNote) : undefined}
            disabled={!selectedWithdrawal || (selectedWithdrawal ? busyWithdrawalId === selectedWithdrawal.id : false)}
          >
            Apply Update
          </SoftButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
