"use client";

import { Box, Grid as MuiGrid, Typography, useTheme, alpha } from "@mui/material";
const Grid = MuiGrid as any;
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { GlassCard, GlassCardHeader } from "./GlassCard";

// Mock data representing streaming metrics
const streamingData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  cpu: Math.random() * 40 + 20,
  memory: Math.random() * 30 + 40,
  latency: Math.random() * 50 + 10,
}));

function MetricGauge({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color }}>{value}{unit}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</Typography>
    </Box>
  );
}

export function RealtimeMonitoringPanel() {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Grid container spacing={3}>
        <Grid xs={12} md={3}>
          <GlassCard><MetricGauge label="CPU Usage" value={42} unit="%" color="#06B6D4" /></GlassCard>
        </Grid>
        <Grid xs={12} md={3}>
          <GlassCard><MetricGauge label="RAM Usage" value={68} unit="%" color="#8B5CF6" /></GlassCard>
        </Grid>
        <Grid xs={12} md={3}>
          <GlassCard><MetricGauge label="API Latency" value={124} unit="ms" color="#F59E0B" /></GlassCard>
        </Grid>
        <Grid xs={12} md={3}>
          <GlassCard><MetricGauge label="Containers" value={12} unit="" color="#10B981" /></GlassCard>
        </Grid>
      </Grid>

      <GlassCard>
        <GlassCardHeader title="Streaming System Metrics" subtitle="Live CPU, Memory, and Latency updates" />
        <Box sx={{ height: 300, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={streamingData}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
              <XAxis dataKey="time" hide />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'var(--surface)' }} />
              <Area type="monotone" dataKey="cpu" stroke="#06B6D4" fillOpacity={1} fill="url(#colorCpu)" />
              <Area type="monotone" dataKey="latency" stroke="#F59E0B" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </GlassCard>
    </Box>
  );
}
