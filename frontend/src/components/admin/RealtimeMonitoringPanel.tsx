"use client";

import { Box, Grid as MuiGrid, Typography, useTheme, alpha, Stack, Chip, Alert } from "@mui/material";
const Grid = MuiGrid as any;
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useEffect, useState, useMemo, useRef } from "react";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { RadialGauge } from "./RadialGauge";
import { LogsViewer } from "./LogsViewer";

interface MonitoringMetric {
  id: string;
  label: string;
  value: string;
  trend: string;
  tone: string;
}

interface DomainResponse {
  generatedAt: string;
  domain: any;
  metrics: MonitoringMetric[];
}

function parseNumericValue(val: string): number {
  return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
}

export function RealtimeMonitoringPanel() {
  const theme = useTheme();
  const [data, setData] = useState<DomainResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const lastUpdateRef = useRef<number>(0);
  const throttleMs = 1000; // Throttle to 1fps max for re-renders

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
        setStatus('error');
        return;
    }

    const eventSource = new EventSource(`/api/admin/monitoring/stream-metrics?token=${token}`);

    eventSource.addEventListener("metrics", (event) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < throttleMs) return;
      lastUpdateRef.current = now;

      const payload = JSON.parse(event.data) as DomainResponse;
      setData(payload);
      setStatus('connected');

      const cpu = parseNumericValue(payload.metrics.find(m => m.id === 'cpu')?.value || '0');
      const memory = parseNumericValue(payload.metrics.find(m => m.id === 'memory')?.value || '0');
      const latency = parseNumericValue(payload.metrics.find(m => m.id === 'latency')?.value || '0');

      setHistory(prev => {
        const next = [...prev, {
          time: new Date().toLocaleTimeString(),
          cpu,
          memory,
          latency
        }];
        if (next.length > 30) return next.slice(next.length - 30);
        return next;
      });
    });

    eventSource.onerror = (err) => {
      console.error("SSE Metrics Error:", err);
      setStatus('error');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const metrics = useMemo(() => {
    if (!data) return {};
    const map: Record<string, MonitoringMetric> = {};
    data.metrics.forEach(m => {
      map[m.id] = m;
    });
    return map;
  }, [data]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Real-time System Vitals</Typography>
        <Chip 
            label={status.toUpperCase()} 
            color={status === 'connected' ? 'success' : status === 'connecting' ? 'warning' : 'error'} 
            size="small" 
            variant="outlined"
        />
      </Stack>

      {status === 'error' && <Alert severity="error">Connection to monitoring stream failed. Ensure you have admin privileges.</Alert>}

      <Grid container spacing={3}>
        <Grid xs={12} md={3}>
          <GlassCard>
            <RadialGauge 
                label="CPU Usage" 
                value={parseNumericValue(metrics['cpu']?.value || '0')} 
                unit="%" 
                color="#06B6D4" 
            />
          </GlassCard>
        </Grid>
        <Grid xs={12} md={3}>
          <GlassCard>
            <RadialGauge 
                label="RAM Usage" 
                value={parseNumericValue(metrics['memory']?.value || '0')} 
                unit="%" 
                color="#8B5CF6" 
            />
          </GlassCard>
        </Grid>
        <Grid xs={12} md={3}>
          <GlassCard>
            <RadialGauge 
                label="Disk Usage" 
                value={parseNumericValue(metrics['disk']?.value || '0')} 
                unit="%" 
                color="#EC4899" 
            />
          </GlassCard>
        </Grid>
        <Grid xs={12} md={3}>
          <GlassCard>
            <Box sx={{ textAlign: 'center', p: 2, height: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#10B981' }}>{metrics['containers']?.value || '0'}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Containers</Typography>
                <Typography variant="body2" sx={{ opacity: 0.6, mt: 1 }}>{metrics['uptime']?.value || '--'} Uptime</Typography>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
            <GlassCard>
                <GlassCardHeader title="Streaming System Metrics" subtitle="Live CPU and Memory (%)" />
                <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                    <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
                    <XAxis dataKey="time" hide />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }} />
                    <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#06B6D4" fillOpacity={1} fill="url(#colorCpu)" />
                    <Area type="monotone" dataKey="memory" name="Memory %" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorMem)" />
                    </AreaChart>
                </ResponsiveContainer>
                </Box>
            </GlassCard>
        </Grid>
        <Grid xs={12} md={6}>
            <GlassCard>
                <GlassCardHeader title="Performance Latency" subtitle="API & DB response times (ms)" />
                <Box sx={{ height: 300, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
                            <XAxis dataKey="time" hide />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }} />
                            <Area type="monotone" dataKey="latency" name="API Latency (ms)" stroke="#F59E0B" fill="none" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
            <LogsViewer streamUrl={`/api/admin/monitoring/stream-logs?token=${token}`} />
        </Grid>
        <Grid xs={12} md={4}>
            <GlassCard sx={{ height: '100%' }}>
                <GlassCardHeader title="Network & Queue" subtitle="Real-time traffic overview" />
                <Stack spacing={3} sx={{ p: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#3B82F6' }}>{metrics['websockets']?.value || '0'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>WebSocket Connections</Typography>
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#F59E0B' }}>{metrics['db']?.value || '0'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>DB Performance (Latency)</Typography>
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#10B981' }}>Healthy</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>Queue Status</Typography>
                    </Box>
                </Stack>
            </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}
