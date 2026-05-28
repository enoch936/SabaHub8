"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ModelTrainingRoundedIcon from "@mui/icons-material/ModelTrainingRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import SoftButton from "@/components/mui/SoftButton";
import {
  type AIChatbotResponse,
  type AIEngineStatus,
  type AIFraudRisk,
  type AIFreelancerMatch,
  type AIJobRecommendation,
  type AIModelOperationResponse,
  type AIModelVersionsResponse,
  aiActivateModel,
  aiChatbotAssist,
  aiCheckFraudRisk,
  aiEngineStatus,
  aiListModelVersions,
  aiMatchFreelancers,
  aiRecommendJobs,
  aiReloadModels,
  aiRollbackModel,
  aiTrainModel,
  listEmployerJobs,
  type Job,
} from "@/lib/api";
import { useSession } from "@/lib/session";

type AIServiceMode = "workspace" | "admin";

type AIServiceWorkspaceProps = {
  mode?: AIServiceMode;
  initialTab?: TabKey;
};

type TabKey = "recommendations" | "matching" | "fraud" | "chatbot" | "models";

const scoreColor = (score: number) => {
  if (score >= 75) return "success";
  if (score >= 45) return "warning";
  return "default";
};

const riskColor = (risk?: string) => {
  if (risk === "HIGH") return "error";
  if (risk === "MEDIUM") return "warning";
  if (risk === "LOW") return "success";
  return "default";
};

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {label}
            </Typography>
            <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>{icon}</Box>
          </Stack>
          <Typography variant="h5" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
            {value}
          </Typography>
          {detail ? (
            <Typography variant="caption" color="text.secondary">
              {detail}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function EmptyHint({ title, detail }: { title: string; detail: string }) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "rgba(15,23,42,0.02)",
      }}
    >
      <Typography variant="subtitle1" fontWeight={800}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {detail}
      </Typography>
    </Box>
  );
}

export default function AIServiceWorkspace({ mode = "workspace", initialTab }: AIServiceWorkspaceProps) {
  const role = useSession((state) => state.role);
  const isAdmin = mode === "admin";
  const [tab, setTab] = useState<TabKey>(initialTab === "models" && isAdmin ? "models" : "recommendations");
  const [engine, setEngine] = useState<AIEngineStatus | null>(null);
  const [recommendations, setRecommendations] = useState<AIJobRecommendation[]>([]);
  const [matches, setMatches] = useState<AIFreelancerMatch[]>([]);
  const [fraudResult, setFraudResult] = useState<AIFraudRisk | null>(null);
  const [chatResult, setChatResult] = useState<AIChatbotResponse | null>(null);
  const [versions, setVersions] = useState<AIModelVersionsResponse | null>(null);
  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [rollbackSteps, setRollbackSteps] = useState("1");
  const [fraudForm, setFraudForm] = useState({
    amount: "1250",
    currency: "USD",
    paymentMethod: "CARD",
    recipientCountry: "Ethiopia",
  });
  const [chatForm, setChatForm] = useState({
    prompt: "How can I improve my proposal quality?",
    contextType: "GENERAL",
    contextId: "",
  });
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastModelOperation, setLastModelOperation] = useState<AIModelOperationResponse | null>(null);

  const availableTabs = useMemo(
    () =>
      [
        { key: "recommendations" as const, label: "Jobs", icon: <WorkOutlineRoundedIcon fontSize="small" /> },
        { key: "matching" as const, label: "Matching", icon: <GroupsRoundedIcon fontSize="small" /> },
        { key: "fraud" as const, label: "Fraud Risk", icon: <SecurityRoundedIcon fontSize="small" /> },
        { key: "chatbot" as const, label: "Chatbot", icon: <SmartToyRoundedIcon fontSize="small" /> },
        ...(isAdmin
          ? [{ key: "models" as const, label: "Model Ops", icon: <ModelTrainingRoundedIcon fontSize="small" /> }]
          : []),
      ],
    [isAdmin],
  );

  const loadModels = useCallback(async () => {
    if (!isAdmin) return;
    const payload = await aiListModelVersions();
    setVersions(payload);
    setSelectedVersion((current) => current || payload.activeVersion || payload.versions?.[0]?.version || "");
  }, [isAdmin]);

  const loadRecommendations = useCallback(async () => {
    const payload = await aiRecommendJobs(8);
    setRecommendations(Array.isArray(payload) ? payload : []);
  }, []);

  const loadInitialData = useCallback(async () => {
    setBusyAction("load");
    setError(null);
    setNotice(null);
    try {
      const [enginePayload] = await Promise.all([aiEngineStatus(), loadRecommendations()]);
      setEngine(enginePayload);

      if (role === "EMPLOYER") {
        try {
          const jobs = await listEmployerJobs({ page: 0, size: 20 });
          setEmployerJobs(jobs);
          setSelectedJobId((current) => current || jobs[0]?.id || "");
        } catch {
          setEmployerJobs([]);
        }
      }

      if (isAdmin) {
        await loadModels();
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "AI service is unavailable.");
    } finally {
      setBusyAction(null);
    }
  }, [isAdmin, loadModels, loadRecommendations, role]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const runAction = async <T,>(
    key: string,
    action: () => Promise<T>,
    onSuccess: (result: T) => void | Promise<void>,
    successMessage?: string,
  ) => {
    setBusyAction(key);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      await onSuccess(result);
      setNotice(successMessage ?? "AI request completed.");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "AI request failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const runMatch = () => {
    const jobId = selectedJobId.trim();
    if (!jobId) {
      setError("Enter or select a job ID before running freelancer matching.");
      return;
    }
    void runAction(
      "match",
      () => aiMatchFreelancers(jobId, 10),
      (payload) => setMatches(Array.isArray(payload) ? payload : []),
      "Freelancer matching completed.",
    );
  };

  const runFraudCheck = () => {
    const amount = Number.parseFloat(fraudForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    void runAction(
      "fraud",
      () =>
        aiCheckFraudRisk({
          amount,
          currency: fraudForm.currency.trim() || "USD",
          paymentMethod: fraudForm.paymentMethod.trim() || undefined,
          recipientCountry: fraudForm.recipientCountry.trim() || undefined,
        }),
      setFraudResult,
      "Fraud risk score generated.",
    );
  };

  const runChatbot = () => {
    if (!chatForm.prompt.trim()) {
      setError("Enter a question for the AI assistant.");
      return;
    }
    void runAction(
      "chatbot",
      () =>
        aiChatbotAssist({
          prompt: chatForm.prompt.trim(),
          contextType: chatForm.contextType.trim() || undefined,
          contextId: chatForm.contextId.trim() || undefined,
        }),
      setChatResult,
      "Chatbot assistance generated.",
    );
  };

  const runModelOperation = (
    key: string,
    action: () => Promise<AIModelOperationResponse>,
    successMessage: string,
  ) => {
    void runAction(
      key,
      action,
      async (payload) => {
        setLastModelOperation(payload);
        await loadModels();
      },
      successMessage,
    );
  };

  const metrics = [
    {
      label: "Engine",
      value: engine?.engine || "Loading",
      detail: engine?.version ? `Version ${engine.version}` : "Waiting for status",
      icon: <PsychologyRoundedIcon fontSize="small" />,
    },
    {
      label: "Inference",
      value: engine?.mode || engine?.inferenceMode || "Unknown",
      detail: engine?.pythonBridgeReachable ? "Spring + Python bridge online" : engine?.dataSource || "Local service status",
      icon: <BoltRoundedIcon fontSize="small" />,
    },
    {
      label: "Job Signals",
      value: String(recommendations.length),
      detail: "Live recommendations loaded",
      icon: <WorkOutlineRoundedIcon fontSize="small" />,
    },
    {
      label: "Active Model",
      value: versions?.activeVersion || (isAdmin ? "Unavailable" : "Admin only"),
      detail: isAdmin ? `${versions?.count ?? versions?.versions?.length ?? 0} versions` : "Open admin AI service for model ops",
      icon: <ModelTrainingRoundedIcon fontSize="small" />,
    },
  ];

  return (
    <Stack spacing={2.5}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          color: "common.white",
          background: "linear-gradient(135deg, #102033 0%, #174d4a 54%, #6c5b2e 100%)",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <AutoAwesomeRoundedIcon fontSize="small" />
                <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.82 }}>
                  REAL AI SERVICE
                </Typography>
              </Stack>
              <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                AI Service
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, maxWidth: 860, opacity: 0.9 }}>
                Run live job recommendations, freelancer matching, fraud risk scoring, chatbot assistance, and model operations
                against the SabaHub AI backend.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap" useFlexGap>
              <Chip
                label={engine?.pythonBridgeReachable ? "Spring + Python" : engine?.externalAiApiUsed ? "External AI used" : "Spring local"}
                color={engine?.pythonBridgeReachable ? "success" : engine?.externalAiApiUsed ? "warning" : "default"}
                sx={{ fontWeight: 800, bgcolor: "rgba(255,255,255,0.16)", color: "common.white" }}
              />
              <Chip
                label={engine?.pythonChatEnabled ? `Chat blend ${Math.round((engine.blendChat ?? 0) * 100)}%` : "Python chat off"}
                color={engine?.pythonChatEnabled ? "info" : "default"}
                sx={{ fontWeight: 800, bgcolor: "rgba(255,255,255,0.16)", color: "common.white" }}
              />
              <SoftButton
                variant="outlined"
                onClick={() => void loadInitialData()}
                disabled={busyAction !== null}
                startIcon={<RefreshRoundedIcon />}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
              >
                Refresh
              </SoftButton>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {notice ? <Alert severity="success">{notice}</Alert> : null}

      <Grid container spacing={2}>
        {metrics.map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <MetricCard {...metric} />
          </Grid>
        ))}
      </Grid>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, value: TabKey) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1, pt: 1, borderBottom: "1px solid", borderColor: "divider" }}
        >
          {availableTabs.map((item) => (
            <Tab key={item.key} value={item.key} icon={item.icon} iconPosition="start" label={item.label} />
          ))}
        </Tabs>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {tab === "recommendations" ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                <Box>
                  <Typography variant="h6" fontWeight={900}>
                    Job recommendations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ranked from your profile skills, preferences, budget signals, and optional Python reranking.
                  </Typography>
                </Box>
                <SoftButton
                  variant="contained"
                  onClick={() =>
                    void runAction(
                      "recommendations",
                      () => aiRecommendJobs(8),
                      (payload) => setRecommendations(Array.isArray(payload) ? payload : []),
                      "Job recommendations refreshed.",
                    )
                  }
                  disabled={busyAction !== null}
                  startIcon={<AutoAwesomeRoundedIcon />}
                >
                  Recommend Jobs
                </SoftButton>
              </Stack>

              {recommendations.length ? (
                <Grid container spacing={2}>
                  {recommendations.map((job) => (
                    <Grid key={job.jobId} size={{ xs: 12, md: 6 }}>
                      <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                        <CardContent>
                          <Stack spacing={1.2}>
                            <Stack direction="row" justifyContent="space-between" gap={1}>
                              <Typography variant="subtitle1" fontWeight={900}>
                                {job.title || job.jobId}
                              </Typography>
                              <Chip label={`${Math.round(job.score)}%`} color={scoreColor(job.score)} size="small" sx={{ fontWeight: 800 }} />
                            </Stack>
                            <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, job.score))} sx={{ height: 8, borderRadius: 999 }} />
                            <Typography variant="body2" color="text.secondary">
                              {job.currency || "USD"} {job.budgetMin ?? 0} - {job.budgetMax ?? "open"}
                            </Typography>
                            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                              {(job.reasons ?? []).map((reason) => (
                                <Chip key={reason} label={reason} size="small" variant="outlined" />
                              ))}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyHint title="No recommendations yet" detail="Refresh recommendations after your profile has skills and preferences." />
              )}
            </Stack>
          ) : null}

          {tab === "matching" ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Freelancer matching
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Match verified freelancers to a job using required skills, ratings, experience, and hybrid AI scoring.
                </Typography>
              </Box>

              <Grid container spacing={1.5} alignItems="center">
                {employerJobs.length ? (
                  <Grid size={{ xs: 12, md: 7 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="ai-job-select">Employer Job</InputLabel>
                      <Select
                        labelId="ai-job-select"
                        label="Employer Job"
                        value={selectedJobId}
                        onChange={(event) => setSelectedJobId(event.target.value)}
                      >
                        {employerJobs.map((job) => (
                          <MenuItem key={job.id} value={job.id}>
                            {job.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                ) : (
                  <Grid size={{ xs: 12, md: 7 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Job ID"
                      value={selectedJobId}
                      onChange={(event) => setSelectedJobId(event.target.value)}
                      placeholder="Paste a job id"
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 5 }}>
                  <SoftButton variant="contained" onClick={runMatch} disabled={busyAction !== null} startIcon={<GroupsRoundedIcon />}>
                    Match Freelancers
                  </SoftButton>
                </Grid>
              </Grid>

              {matches.length ? (
                <Stack spacing={1.2}>
                  {matches.map((match) => (
                    <Card key={match.freelancerId} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                      <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={900}>
                              {match.professionalTitle || match.freelancerId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Freelancer {match.freelancerId} • Job {match.jobId}
                            </Typography>
                            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                              {(match.reasons ?? []).map((reason) => (
                                <Chip key={reason} label={reason} size="small" variant="outlined" />
                              ))}
                            </Stack>
                          </Box>
                          <Box sx={{ minWidth: 140 }}>
                            <Chip label={`${Math.round(match.score)}% match`} color={scoreColor(match.score)} sx={{ fontWeight: 900 }} />
                            <LinearProgress
                              variant="determinate"
                              value={Math.max(0, Math.min(100, match.score))}
                              sx={{ mt: 1, height: 8, borderRadius: 999 }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <EmptyHint title="No matches loaded" detail="Select a job or paste a job ID, then run the matching engine." />
              )}
            </Stack>
          ) : null}

          {tab === "fraud" ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Fraud risk scoring
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Score a transaction using amount, verification state, account signals, method, and recipient country.
                </Typography>
              </Box>

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth size="small" label="Amount" value={fraudForm.amount} onChange={(event) => setFraudForm((current) => ({ ...current, amount: event.target.value }))} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth size="small" label="Currency" value={fraudForm.currency} onChange={(event) => setFraudForm((current) => ({ ...current, currency: event.target.value }))} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth size="small" label="Payment method" value={fraudForm.paymentMethod} onChange={(event) => setFraudForm((current) => ({ ...current, paymentMethod: event.target.value }))} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth size="small" label="Recipient country" value={fraudForm.recipientCountry} onChange={(event) => setFraudForm((current) => ({ ...current, recipientCountry: event.target.value }))} />
                </Grid>
              </Grid>

              <SoftButton variant="contained" onClick={runFraudCheck} disabled={busyAction !== null} startIcon={<SecurityRoundedIcon />} sx={{ alignSelf: "flex-start" }}>
                Score Fraud Risk
              </SoftButton>

              {fraudResult ? (
                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                  <CardContent>
                    <Stack spacing={1.4}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight={900}>
                          Risk score {fraudResult.riskScore}/100
                        </Typography>
                        <Chip label={fraudResult.riskLevel} color={riskColor(fraudResult.riskLevel)} sx={{ fontWeight: 900 }} />
                      </Stack>
                      <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, fraudResult.riskScore))} sx={{ height: 10, borderRadius: 999 }} />
                      <Typography variant="body2">{fraudResult.recommendedAction}</Typography>
                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                        {(fraudResult.flags ?? []).map((flag) => (
                          <Chip key={flag} label={flag} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ) : (
                <EmptyHint title="No risk score yet" detail="Enter payment details and run the fraud model." />
              )}
            </Stack>
          ) : null}

          {tab === "chatbot" ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Chatbot assistance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ask the local AI assistant about proposals, payments, matching, and SabaHub workflows.
                </Typography>
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Prompt"
                value={chatForm.prompt}
                onChange={(event) => setChatForm((current) => ({ ...current, prompt: event.target.value }))}
              />
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth size="small" label="Context type" value={chatForm.contextType} onChange={(event) => setChatForm((current) => ({ ...current, contextType: event.target.value }))} />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField fullWidth size="small" label="Context ID" value={chatForm.contextId} onChange={(event) => setChatForm((current) => ({ ...current, contextId: event.target.value }))} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <SoftButton fullWidth variant="contained" onClick={runChatbot} disabled={busyAction !== null} startIcon={<SmartToyRoundedIcon />}>
                    Ask AI
                  </SoftButton>
                </Grid>
              </Grid>

              {chatResult ? (
                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                  <CardContent>
                    <Stack spacing={1.2}>
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Typography variant="subtitle1" fontWeight={900}>
                          AI answer
                        </Typography>
                        <Chip label={`${Math.round((chatResult.confidence ?? 0) * 100)}% confidence`} variant="outlined" />
                      </Stack>
                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                        {chatResult.collaborationMode ? (
                          <Chip label={chatResult.collaborationMode.replaceAll("_", " ")} size="small" color="success" variant="outlined" />
                        ) : null}
                        {chatResult.intent ? <Chip label={`Intent: ${chatResult.intent}`} size="small" variant="outlined" /> : null}
                        {typeof chatResult.pythonConfidence === "number" ? (
                          <Chip label={`Python ${Math.round(chatResult.pythonConfidence * 100)}%`} size="small" variant="outlined" />
                        ) : null}
                      </Stack>
                      <Typography variant="body1">{chatResult.answer}</Typography>
                      {chatResult.reasoningSummary?.length ? (
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(15,23,42,0.04)" }}>
                          <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 0.8 }}>
                            Reasoning summary
                          </Typography>
                          <Stack component="ul" spacing={0.6} sx={{ m: 0, pl: 2.4 }}>
                            {chatResult.reasoningSummary.map((item) => (
                              <Typography key={item} component="li" variant="body2" color="text.secondary">
                                {item}
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      ) : null}
                      {chatResult.safeguards?.length ? (
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(202,138,4,0.08)" }}>
                          <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 0.8 }}>
                            Safety checks
                          </Typography>
                          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                            {chatResult.safeguards.map((item) => (
                              <Chip key={item} label={item} size="small" color="warning" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>
                      ) : null}
                      <Divider />
                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                        {(chatResult.suggestedActions ?? []).map((action) => (
                          <Chip key={action} label={action} size="small" color="primary" variant="outlined" />
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ) : (
                <EmptyHint title="No assistant answer yet" detail="Ask a question and the AI chatbot endpoint will respond here." />
              )}
            </Stack>
          ) : null}

          {tab === "models" && isAdmin ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  AI model operations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Train, activate, reload, and roll back local Python model versions from the same AI service console.
                </Typography>
              </Box>

              <Grid container spacing={1.5} alignItems="center">
                <Grid size={{ xs: 12, md: 5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="ai-model-version">Model Version</InputLabel>
                    <Select
                      labelId="ai-model-version"
                      label="Model Version"
                      value={selectedVersion}
                      onChange={(event) => setSelectedVersion(event.target.value)}
                    >
                      {(versions?.versions ?? []).map((release) => (
                        <MenuItem key={release.version} value={release.version}>
                          {release.version}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth size="small" label="Rollback" value={rollbackSteps} onChange={(event) => setRollbackSteps(event.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <SoftButton variant="contained" startIcon={<ModelTrainingRoundedIcon />} disabled={busyAction !== null} onClick={() => runModelOperation("train", () => aiTrainModel(true), "Training started and activation requested.")}>
                      Train
                    </SoftButton>
                    <SoftButton variant="outlined" disabled={busyAction !== null || !selectedVersion} onClick={() => runModelOperation("activate", () => aiActivateModel(selectedVersion), "Model version activated.")}>
                      Activate
                    </SoftButton>
                    <SoftButton variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={busyAction !== null} onClick={() => runModelOperation("reload", () => aiReloadModels(), "Model runtime reloaded.")}>
                      Reload
                    </SoftButton>
                    <SoftButton
                      variant="outlined"
                      color="warning"
                      startIcon={<RestartAltRoundedIcon />}
                      disabled={busyAction !== null}
                      onClick={() => runModelOperation("rollback", () => aiRollbackModel(Math.max(1, Number.parseInt(rollbackSteps || "1", 10) || 1)), "Rollback requested.")}
                    >
                      Rollback
                    </SoftButton>
                  </Stack>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                {(versions?.versions ?? []).map((release) => (
                  <Grid key={release.version} size={{ xs: 12, md: 6, xl: 4 }}>
                    <Card elevation={0} sx={{ border: "1px solid", borderColor: release.version === versions?.activeVersion ? "success.main" : "divider", borderRadius: 3 }}>
                      <CardContent>
                        <Stack spacing={0.8}>
                          <Stack direction="row" justifyContent="space-between" gap={1}>
                            <Typography variant="subtitle2" fontWeight={900}>
                              {release.version}
                            </Typography>
                            {release.version === versions?.activeVersion ? <Chip label="Active" size="small" color="success" /> : null}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Trained: {release.trainedAt ? new Date(release.trainedAt).toLocaleString() : "Not recorded"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                            {release.path || "No path reported"}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {lastModelOperation ? (
                <Box component="pre" sx={{ m: 0, p: 2, borderRadius: 3, bgcolor: "#0f172a", color: "#dbeafe", fontSize: 12, overflowX: "auto" }}>
                  {JSON.stringify(lastModelOperation, null, 2)}
                </Box>
              ) : null}
            </Stack>
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  );
}
