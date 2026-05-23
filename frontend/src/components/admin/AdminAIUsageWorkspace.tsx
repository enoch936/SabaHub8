"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { alpha, Box, CardContent, Chip, LinearProgress, Stack, Typography, useTheme } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import DataObjectRoundedIcon from "@mui/icons-material/DataObjectRounded";
import { Button } from "../ui";
import { GlassCard } from "./GlassCard";
import { DataTable, type TableColumn } from "./DataTable";
import { adminListAIUsageLogs, type AIInferenceLog } from "@/lib/api";
import ErrorState from "../ErrorState";

export default function AdminAIUsageWorkspace() {
  const theme = useTheme();
  const [logs, setLogs] = useState<AIInferenceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListAIUsageLogs(50);
      setLogs(data);
    } catch (err) {
      setError("Failed to load real-time AI usage logs from the governance engine.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const total = logs.length;
    const avgLatency = logs.reduce((acc, log) => acc + log.latencyMs, 0) / (total || 1);
    const successRate = (logs.filter(l => l.status === "SUCCESS").length / (total || 1)) * 100;
    const totalTokens = logs.reduce((acc, log) => acc + log.tokensUsed, 0);
    return { total, avgLatency, successRate, totalTokens };
  }, [logs]);

  const columns: TableColumn<AIInferenceLog>[] = [
    {
      key: "timestamp",
      label: "Time",
      sortable: true,
      render: (val) => new Date(val as string).toLocaleTimeString()
    },
    {
      key: "model",
      label: "Model",
      sortable: true,
      filterable: true,
      badge: true,
    },
    {
      key: "promptType",
      label: "Task",
      sortable: true,
      filterable: true,
    },
    {
      key: "latencyMs",
      label: "Latency",
      sortable: true,
      render: (val) => (
        <Stack spacing={0.5} sx={{ minWidth: 100 }}>
          <Typography variant="body2" fontWeight={700}>{Math.round(val as number)}ms</Typography>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(100, ((val as number) / 600) * 100)} 
            color={(val as number) > 400 ? "error" : (val as number) > 200 ? "warning" : "success"}
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Stack>
      )
    },
    {
      key: "tokensUsed",
      label: "Tokens",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      render: (val) => (
        <Chip 
          label={val as string} 
          size="small" 
          color={val === "SUCCESS" ? "success" : "error"} 
          variant="outlined"
          sx={{ fontWeight: 800, borderRadius: '6px' }}
        />
      )
    }
  ];

  return (
    <Stack spacing={2.5}>
      <GlassCard
        sx={{
          p: 3,
          background: `linear-gradient(135deg, #1e293b 0%, #334155 100%)`,
          color: "common.white",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={900}>AI Usage Analytics</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Monitor real-time model inference and performance metrics.</Typography>
          </Box>
          <Button variant="outline" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={load} leftIcon={<RefreshRoundedIcon />}>
            Refresh
          </Button>
        </Stack>
      </GlassCard>

      <Stack direction="row" spacing={2}>
        <MetricCard label="Total Inferences" value={stats.total} icon={<SmartToyRoundedIcon />} />
        <MetricCard label="Avg Latency" value={`${Math.round(stats.avgLatency)}ms`} icon={<SpeedRoundedIcon />} color="info.main" />
        <MetricCard label="Success Rate" value={`${Math.round(stats.successRate)}%`} icon={<QueryStatsRoundedIcon />} color="success.main" />
        <MetricCard label="Tokens Used" value={stats.totalTokens.toLocaleString()} icon={<DataObjectRoundedIcon />} color="warning.main" />
      </Stack>

      {error && <ErrorState title="Governance Engine Error" description={error} onRetry={load} />}

      {!error && (
        <DataTable
          title="Inference History"
          columns={columns}
          data={logs}
          rowKey="id"
          loading={loading}
          searchable
          exportable
          expandableContent={(row) => (
            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02), borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={800} gutterBottom>Payload Analysis</Typography>
              <Box component="pre" sx={{ m: 0, p: 1.5, borderRadius: 1, bgcolor: '#0f172a', color: '#38bdf8', fontSize: 12 }}>
                {JSON.stringify({
                  inferenceId: row.id,
                  userId: row.userId,
                  modelConfig: {
                    temperature: 0.7,
                    maxTokens: 2048,
                    stopSequences: ["\n"]
                  },
                  performance: {
                    ttft: 45,
                    tps: 32.5
                  }
                }, null, 2)}
              </Box>
            </Box>
          )}
        />
      )}
    </Stack>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: string | number, icon: any, color?: string }) {
  return (
    <GlassCard sx={{ flex: 1, p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(color || 'primary.main', 0.1), color: color || 'primary.main' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
          <Typography variant="h5" fontWeight={900}>{value}</Typography>
        </Box>
      </Stack>
    </GlassCard>
  );
}
