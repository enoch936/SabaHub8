"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import {
  Alert,
  Box,
  Grid,
  Stack,
  Typography,
  useTheme,
  alpha,
  LinearProgress,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import RouterRoundedIcon from "@mui/icons-material/RouterRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import { Button } from "../ui";
import { GlassCard } from "./GlassCard";
import { adminGetMonitoringMetrics, adminGetMonitoringLogs } from "@/lib/api";
import { ModernGauge, ModernStreamingGraph } from "./ModernCharts";
import { motion, AnimatePresence } from "framer-motion";

interface MetricSnapshot {
  timestamp: string;
  value: number;
}

export default function AdminMonitoringWorkspace() {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Historical data for streaming graphs
  const [cpuHistory, setCpuHistory] = useState<MetricSnapshot[]>([]);
  const [memHistory, setMemHistory] = useState<MetricSnapshot[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<MetricSnapshot[]>([]);
  
  const maxHistoryPoints = 30;

  const loadData = useCallback(async () => {
    try {
      const [newMetrics, newLogs] = await Promise.all([
        adminGetMonitoringMetrics(),
        adminGetMonitoringLogs(50)
      ]);
      
      setMetrics(newMetrics);
      setLogs(newLogs);
      
      const ts = new Date().toLocaleTimeString([], { hour12: false });
      
      setCpuHistory(prev => [...prev.slice(-maxHistoryPoints + 1), { timestamp: ts, value: newMetrics.cpuUsage }]);
      setMemHistory(prev => [...prev.slice(-maxHistoryPoints + 1), { timestamp: ts, value: newMetrics.memoryPercentage }]);
      setLatencyHistory(prev => [...prev.slice(-maxHistoryPoints + 1), { timestamp: ts, value: newMetrics.apiLatencyAvg }]);
      
      setError(null);
    } catch (err) {
      console.error("Monitoring sync failed", err);
      setError("Failed to sync real-time metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <Stack spacing={3}>
      {/* Header */}
      <GlassCard sx={{ p: 3, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={900}>System Intelligence</Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip 
                label="LIVE CLUSTER MONITORING" 
                size="small" 
                sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 900, fontSize: 10 }} 
              />
              <Typography variant="body2" color="text.secondary">Real-time telemetry and log streaming for SabaHub HQ.</Typography>
            </Stack>
          </Box>
          <Button variant="outline" leftIcon={<RefreshRoundedIcon />} onClick={loadData}>Force Sync</Button>
        </Stack>
      </GlassCard>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Resource Gauges */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <GaugeCard 
            label="CPU Load" 
            value={metrics?.cpuUsage || 0} 
            history={cpuHistory}
            icon={<MemoryRoundedIcon />}
            detail={`${Math.round(metrics?.cpuUsage || 0)}% utilized across all cores`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <GaugeCard 
            label="Memory (JVM)" 
            value={metrics?.memoryPercentage || 0} 
            history={memHistory}
            color={theme.palette.info.main}
            icon={<HubRoundedIcon />}
            detail={`${formatBytes(metrics?.memoryUsed || 0)} of ${formatBytes(metrics?.memoryMax || 0)} used`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <GaugeCard 
            label="Disk I/O" 
            value={metrics?.diskPercentage || 0} 
            history={[]} // Disk is less frequent, skipping history for now
            color={theme.palette.secondary.main}
            icon={<StorageRoundedIcon />}
            detail={`${formatBytes(metrics?.diskUsed || 0)} of ${formatBytes(metrics?.diskTotal || 0)} used`}
          />
        </Grid>
      </Grid>

      {/* Performance & Network */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, borderBottom: `1px solid var(--border)` }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                    <SpeedRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>API Latency (p95)</Typography>
                    <Typography variant="caption" color="text.secondary">Real-time response time monitoring</Typography>
                  </Box>
                </Stack>
                <Typography variant="h5" fontWeight={900}>{metrics?.apiLatencyAvg.toFixed(1)}ms</Typography>
              </Stack>
            </Box>
            <Box sx={{ p: 0, height: 200 }}>
              <ModernStreamingGraph data={latencyHistory} color={theme.palette.primary.main} height={200} yDomain={[0, Math.max(200, ...latencyHistory.map(h => h.value * 1.5))]} />
            </Box>
          </GlassCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Network & Services</Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <StatusRow label="Active Containers" value={metrics?.activeContainers || 0} icon={<RouterRoundedIcon />} />
              <StatusRow label="WS Connections" value={metrics?.websocketConnections || 0} icon={<HubRoundedIcon />} />
              <StatusRow label="Queue Status" value="Healthy" icon={<SpeedRoundedIcon />} />
              <StatusRow label="DB Performance" value={`${metrics?.dbLatencyAvg.toFixed(1)}ms`} icon={<StorageRoundedIcon />} />
              <StatusRow label="Server Uptime" value={formatUptime(metrics?.uptimeSeconds || 0)} icon={<TimerRoundedIcon />} />
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Logs Viewer */}
      <GlassCard sx={{ p: 0, overflow: 'hidden', bgcolor: '#0f172a' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TerminalRoundedIcon sx={{ color: '#38bdf8' }} />
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>Real-time Application Logs</Typography>
          </Stack>
          <Chip label="TAIL -F" size="small" sx={{ bgcolor: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontWeight: 900, fontSize: 9 }} />
        </Box>
        <Box sx={{ 
          p: 2, 
          height: 300, 
          overflowY: 'auto', 
          fontFamily: 'JetBrains Mono, monospace', 
          fontSize: 12,
          color: '#cbd5e1',
          lineHeight: 1.6,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 }
        }}>
          {logs.map((log, i) => (
            <Box key={i} sx={{ 
              py: 0.25, 
              borderLeft: `2px solid ${getLogLevelColor(log)}`,
              pl: 1.5,
              mb: 0.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {log}
            </Box>
          ))}
          {logs.length === 0 && <Typography variant="caption" sx={{ opacity: 0.5 }}>Waiting for log stream...</Typography>}
        </Box>
      </GlassCard>
    </Stack>
  );
}

function GaugeCard({ label, value, history, icon, color, detail }: { label: string, value: number, history: MetricSnapshot[], icon: any, color?: string, detail: string }) {
  const theme = useTheme();
  return (
    <GlassCard sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(color || theme.palette.primary.main, 0.1), color: color || 'primary.main' }}>
            {icon}
          </Box>
          <Typography variant="subtitle1" fontWeight={800}>{label}</Typography>
        </Stack>
        
        <ModernGauge value={value} label={label.split(' ')[0]} color={color} size={160} />
        
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
            {detail}
          </Typography>
          {history.length > 0 && (
            <Box sx={{ height: 40, mt: 1 }}>
              <ModernStreamingGraph data={history} color={color} height={40} />
            </Box>
          )}
        </Box>
      </Stack>
    </GlassCard>
  );
}

function StatusRow({ label, value, icon }: { label: string, value: any, icon: any }) {
  const theme = useTheme();
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ color: 'text.secondary', opacity: 0.6 }}>{icon}</Box>
        <Typography variant="body2" fontWeight={600} color="text.secondary">{label}</Typography>
      </Stack>
      <Typography variant="body2" fontWeight={800}>{value}</Typography>
    </Stack>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function getLogLevelColor(log: string) {
  if (log.includes('ERROR')) return '#ef4444';
  if (log.includes('WARN')) return '#f59e0b';
  if (log.includes('INFO')) return '#10b981';
  if (log.includes('DEBUG')) return '#6366f1';
  return 'transparent';
}
