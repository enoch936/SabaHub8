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
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  alpha,
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
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import LocalAtmRoundedIcon from "@mui/icons-material/LocalAtmRounded";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { DataTable, type TableColumn } from "./DataTable";
import { Button } from "../ui";
import SoftTextField from "@/components/mui/SoftTextField";
import {
  type AdminCommandCenterOperation,
  type Job,
  type Proposal,
  type Contract,
  adminCommandCenterDomain,
  adminCommandCenterExecuteOperation,
  adminListJobs,
  adminPatchJob,
  adminListProposals,
  listContracts,
  listDisputes,
} from "@/lib/api";

const moderationStatuses = ["DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CLOSED"] as const;
const moderationDomainId = "content-moderation-marketplace-governance";

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

const CURRENCY_ALIASES: Record<string, string> = {
  BIRR: "ETB",
};

function toValidCurrency(code: string): string {
  const normalized = code.toUpperCase();
  const mapped = CURRENCY_ALIASES[normalized] || normalized;
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: mapped });
    return mapped;
  } catch {
    return "USD";
  }
}

function formatBudget(job: Job) {
  const min = job.budgetMin ?? job.budget?.min;
  const max = job.budgetMax ?? job.budget?.max;
  const currency = toValidCurrency(job.currency ?? job.budget?.currency ?? "USD");
  if (typeof min !== "number" && typeof max !== "number") return "Negotiable";
  
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

export default function AdminMarketplaceOrchestrationWorkspace() {
  const [activeTab, setActiveTab] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [operations, setOperations] = useState<AdminCommandCenterOperation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsResult, proposalsResult, contractsResult, domainResult] = await Promise.all([
        adminListJobs(),
        adminListProposals(),
        listContracts(),
        adminCommandCenterDomain(moderationDomainId),
      ]);
      setJobs(jobsResult);
      setProposals(proposalsResult);
      setContracts(contractsResult);
      setOperations(domainResult.domain.operations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load marketplace dataset.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter !== "all" && (job.status ?? "").toUpperCase() !== statusFilter) return false;
      if (!normalized) return true;
      return [job.title, job.companyName, job.employerName, job.id].some(v => String(v || "").toLowerCase().includes(normalized));
    });
  }, [jobs, query, statusFilter]);

  const changeStatus = async (jobId: string, status: string) => {
    setBusyJobId(jobId);
    try {
      const updated = await adminPatchJob(jobId, { status });
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
      setActionStatus(`Orchestration: Job moved to ${status}`);
    } catch (err) {
      setActionStatus(`Error: ${err instanceof Error ? err.message : "Status update failed"}`);
    } finally {
      setBusyJobId(null);
    }
  };

  return (
    <Stack spacing={4}>
      <GlassCard
        sx={{
          color: "common.white",
          p: 1
        }}
        gradient
      >
        <CardContent>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ lg: "center" }} spacing={3}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.2em", opacity: 0.8, fontWeight: 900, fontSize: 11 }}>
                MARKETPLACE GOVERNANCE
              </Typography>
              <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1, mt: 1, letterSpacing: "-0.04em" }}>
                Opportunity Orchestration
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, opacity: 0.9, maxWidth: 840, fontWeight: 500, lineHeight: 1.6 }}>
                Real-time control plane for the SabaHub marketplace. Monitor job lifecycle stages, 
                moderate proposals, and enforce contract integrity across the global ecosystem.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outline"
                onClick={() => void load()}
                isLoading={loading}
                leftIcon={<RefreshRoundedIcon />}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", backdropFilter: "blur(10px)", height: 48, px: 3 }}
              >
                Sync Ecosystem
              </Button>
            </Stack>
          </Stack>

          <Box sx={{ mt: 4 }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                "& .MuiTab-root": { 
                  fontWeight: 900, fontSize: 13, minHeight: 48, color: "rgba(255,255,255,0.6)",
                  letterSpacing: "0.05em"
                },
                "& .Mui-selected": { color: "#fff !important" },
                "& .MuiTabs-indicator": { bgcolor: "#fff", height: 3, borderRadius: "3px" }
              }}
            >
              <Tab label={`Jobs (${jobs.length})`} />
              <Tab label={`Proposals (${proposals.length})`} />
              <Tab label={`Contracts (${contracts.length})`} />
              <Tab label="Governance Runbooks" />
            </Tabs>
          </Box>
        </CardContent>
      </GlassCard>

      {error && <Alert severity="error" sx={{ borderRadius: "16px" }}>{error}</Alert>}
      {actionStatus && <Alert severity="info" sx={{ borderRadius: "16px", bgcolor: "var(--glass-gray)" }}>{actionStatus}</Alert>}

      {activeTab === 0 && (
        <GlassCard sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <SoftTextField
                  fullWidth
                  placeholder="Filter opportunities by title, organization, or participant ID..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  InputProps={{ 
                    startAdornment: <SearchRoundedIcon sx={{ mr: 1.5, color: "var(--primary)" }} />,
                    sx: { borderRadius: "16px", height: 48, bgcolor: "var(--glass-gray)" }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <Select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    sx={{ borderRadius: "16px", height: 48, bgcolor: "var(--glass-gray)" }}
                  >
                    <MenuItem value="all">All Lifecycle Stages</MenuItem>
                    {moderationStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <DataTable
              columns={[
                {
                  key: "title",
                  label: "Opportunity Orchestration",
                  sortable: true,
                  render: (_, job: Job) => (
                    <Stack direction="row" spacing={2.5} alignItems="center">
                      <Box sx={{ 
                        width: 52, height: 52, borderRadius: "16px", 
                        background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                        color: "#fff", display: "grid", placeItems: "center",
                        boxShadow: "0 8px 16px var(--primary-glow)"
                      }}>
                        <WorkOutlineRoundedIcon />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={900} sx={{ letterSpacing: "-0.01em", fontSize: 15 }}>{job.title}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ opacity: 0.6 }}>
                          #JOB-{job.id.slice(-6).toUpperCase()} · {new Date(job.createdAt || "").toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </Box>
                    </Stack>
                  )
                },
                {
                  key: "employerName",
                  label: "Issuing Entity",
                  render: (_, job: Job) => (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar 
                        src={job.employerAvatar}
                        sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "var(--glass-gray)", color: "var(--primary)", fontWeight: 900, fontSize: 14 }}
                      >
                        {job.employerName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={900}>{job.employerName || "Direct Hire"}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 800 }}>
                          {job.employerName} (#USR-{job.employerId?.slice(-6).toUpperCase() || "PLATFORM"})
                        </Typography>
                      </Box>
                    </Stack>
                  )
                },
                {
                  key: "status",
                  label: "Stage",
                  render: (v) => (
                    <Chip 
                      label={String(v)} 
                      size="small" 
                      sx={{ 
                        fontWeight: 900, borderRadius: "8px", height: 24, fontSize: 10,
                        bgcolor: alpha(statusTone(String(v)) === 'default' ? '#64748b' : (statusTone(String(v)) === 'success' ? '#10b981' : '#ef4444'), 0.1),
                        color: statusTone(String(v)) === 'default' ? '#64748b' : (statusTone(String(v)) === 'success' ? '#10b981' : '#ef4444'),
                        border: `1px solid ${alpha(statusTone(String(v)) === 'default' ? '#64748b' : '#10b981', 0.2)}`
                      }} 
                    />
                  )
                },
                {
                  key: "budget",
                  label: "Financial Val",
                  render: (_, job) => (
                    <Typography variant="body2" fontWeight={900} sx={{ color: "var(--success)", letterSpacing: "-0.01em" }}>
                      {formatBudget(job)}
                    </Typography>
                  )
                },
                {
                  key: "actions",
                  label: "Orchestration",
                  align: "right",
                  render: (_, job: Job) => (
                    <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={() => setSelectedJob(job)}
                        sx={{ bgcolor: "var(--glass-gray)", borderRadius: "10px", "&:hover": { bgcolor: "var(--glass-gray-hover)" } }}
                        title="View details"
                      >
                        <VisibilityRoundedIcon fontSize="small" />
                      </IconButton>
                      {job.status !== 'OPEN' && (
                        <Button
                          variant="primary" size="sm"
                          disabled={busyJobId === job.id}
                          onClick={() => void changeStatus(job.id, 'OPEN')}
                          sx={{ fontWeight: 900, borderRadius: "10px", height: 32 }}
                        >
                          Publish
                        </Button>
                      )}
                      {job.status === 'OPEN' && (
                        <Button
                          variant="outline" size="sm"
                          disabled={busyJobId === job.id}
                          onClick={() => void changeStatus(job.id, 'CLOSED')}
                          sx={{ fontWeight: 900, borderRadius: "10px", height: 32, color: "#f59e0b", borderColor: "#f59e0b" }}
                        >
                          Close
                        </Button>
                      )}
                      {(job.status === 'OPEN' || job.status === 'IN_PROGRESS') && (
                        <IconButton
                          size="small"
                          disabled={busyJobId === job.id}
                          onClick={() => void changeStatus(job.id, 'CANCELLED')}
                          sx={{ bgcolor: "var(--glass-gray)", borderRadius: "10px", "&:hover": { bgcolor: "#ef4444" } }}
                          title="Cancel job"
                        >
                          <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  )
                }
              ]}
              data={filteredJobs}
              rowKey="id"
              loading={loading}
              searchable={false}
            />
          </Stack>
        </GlassCard>
      )}

      {activeTab === 1 && (
        <GlassCard sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" fontWeight={900} mb={2}>
                  Proposals & Applications ({proposals.length})
                </Typography>
              </Grid>
            </Grid>

            <DataTable
              columns={[
                {
                  key: "freelancerName",
                  label: "Freelancer",
                  render: (_, proposal: Proposal) => (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "var(--glass-gray)", color: "var(--primary)", fontWeight: 900, fontSize: 14 }}
                      >
                        {proposal.freelancerName?.charAt(0) || "?"}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={900}>{proposal.freelancerName || "Anonymous"}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 800 }}>
                          #{proposal.freelancerId?.slice(-6).toUpperCase() || "UNKNOWN"}
                        </Typography>
                      </Box>
                    </Stack>
                  )
                },
                {
                  key: "jobTitle",
                  label: "Job Applied",
                  render: (_, proposal: Proposal) => (
                    <Typography variant="body2" fontWeight={600}>{proposal.jobTitle || "N/A"}</Typography>
                  )
                },
                {
                  key: "proposedBudget",
                  label: "Bid Amount",
                  render: (v) => (
                    <Typography variant="body2" fontWeight={900} sx={{ color: "var(--success)" }}>
                      ${v || "N/A"}
                    </Typography>
                  )
                },
                {
                  key: "status",
                  label: "Status",
                  render: (v) => (
                    <Chip
                      label={String(v || "PENDING")}
                      size="small"
                      sx={{
                        fontWeight: 900, borderRadius: "8px", height: 24, fontSize: 10,
                        bgcolor: (v === "ACCEPTED" ? "#10b981" : v === "REJECTED" ? "#ef4444" : "#8b5cf6") + "15",
                        color: v === "ACCEPTED" ? "#10b981" : v === "REJECTED" ? "#ef4444" : "#8b5cf6",
                      }}
                    />
                  )
                },
                {
                  key: "createdAt",
                  label: "Applied",
                  render: (v) => (
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {new Date(v || "").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Typography>
                  )
                }
              ]}
              data={proposals}
              rowKey="id"
              loading={loading}
              searchable={false}
            />
          </Stack>
        </GlassCard>
      )}

      {activeTab === 2 && (
        <GlassCard sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Typography variant="h6" fontWeight={900} mb={2}>
              Contracts & Disputes ({contracts.length})
            </Typography>

            <DataTable
              columns={[
                {
                  key: "jobTitle",
                  label: "Job",
                  render: (_, contract: Contract) => (
                    <Typography variant="body2" fontWeight={700}>{contract.jobTitle || "N/A"}</Typography>
                  )
                },
                {
                  key: "freelancerName",
                  label: "Freelancer",
                  render: (_, contract: Contract) => (
                    <Typography variant="body2" fontWeight={600}>{contract.freelancerName || "N/A"}</Typography>
                  )
                },
                {
                  key: "totalAmount",
                  label: "Contract Value",
                  render: (v) => (
                    <Typography variant="body2" fontWeight={900} sx={{ color: "var(--success)" }}>
                      ${v || "0"}
                    </Typography>
                  )
                },
                {
                  key: "status",
                  label: "Status",
                  render: (v) => (
                    <Chip
                      label={String(v || "ACTIVE")}
                      size="small"
                      sx={{
                        fontWeight: 900, borderRadius: "8px", height: 24, fontSize: 10,
                        bgcolor: (v === "COMPLETED" ? "#10b981" : "#8b5cf6") + "15",
                        color: v === "COMPLETED" ? "#10b981" : "#8b5cf6",
                      }}
                    />
                  )
                }
              ]}
              data={contracts}
              rowKey="id"
              loading={loading}
              searchable={false}
            />
          </Stack>
        </GlassCard>
      )}

      {/* Proposals and Contracts tabs would follow similar premium patterns */}

      {activeTab === 3 && (
        <GlassCard>
          <CardContent>
            <Typography variant="h6" fontWeight={900} mb={2}>Enforcement Runbooks</Typography>
            <Grid container spacing={3}>
              {operations.map(op => (
                <Grid key={op.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <GlassCard sx={{ border: "1px solid var(--border)", p: 2, height: "100%" }} hover>
                    <Typography variant="subtitle1" fontWeight={800}>{op.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>{op.description}</Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip label={`${op.impact} impact`} size="small" sx={{ fontWeight: 800 }} />
                      <Button size="sm" variant="primary">Execute</Button>
                    </Stack>
                  </GlassCard>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </GlassCard>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedJob} onClose={() => setSelectedJob(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Marketplace Governance Review</DialogTitle>
        <DialogContent dividers>
          {selectedJob && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" fontWeight={900}>{selectedJob.title}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Job ID: #JOB-{selectedJob.id.toUpperCase()} · Posted by {selectedJob.employerName} (#USR-{selectedJob.employerId?.slice(-6).toUpperCase()})
                </Typography>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="subtitle2" fontWeight={900} gutterBottom>Description & Scope</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", p: 2, bgcolor: "var(--glass-gray)", borderRadius: "12px" }}>
                  {selectedJob.description}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button variant="outline" onClick={() => setSelectedJob(null)}>Close</Button>
          <Button variant="danger" onClick={() => selectedJob && void changeStatus(selectedJob.id, 'CANCELLED')}>
            De-list Opportunity
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
