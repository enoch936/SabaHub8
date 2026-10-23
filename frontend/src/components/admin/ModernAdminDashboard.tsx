/**
 * Modern Admin Dashboard
 * Main dashboard with analytics, charts, activity feed, and data tables
 * Production-grade with real-time operational visibility
 */

"use client";

import { useMemo } from "react";
import { 
  Box, 
  Stack, 
  Container, 
  Typography, 
  useTheme, 
  alpha, 
  Grid as MuiGrid, 
  Skeleton, 
  Alert,
  CardContent,
  Chip
} from "@mui/material";
const Grid = MuiGrid as any;
import { motion } from "framer-motion";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";

import dynamic from "next/dynamic";
import { MetricCard, MetricCardsSkeleton } from "./MetricCard";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { Button } from "../ui";

const ActivityFeed = dynamic(() => import("./ActivityFeed").then(mod => mod.ActivityFeed), {
  loading: () => <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 6 }} />,
  ssr: false
});

const ModernAreaChart = dynamic(() => import("./ModernCharts").then(mod => mod.ModernAreaChart), { ssr: false });
const ModernDonutChart = dynamic(() => import("./ModernCharts").then(mod => mod.ModernDonutChart), { ssr: false });
const ModernRadarChart = dynamic(() => import("./ModernCharts").then(mod => mod.ModernRadarChart), { ssr: false });
const ModernStreamChart = dynamic(() => import("./ModernCharts").then(mod => mod.ModernStreamChart), { ssr: false });
const ModernHeatmap = dynamic(() => import("./ModernCharts").then(mod => mod.ModernHeatmap), { ssr: false });
const ModernGeoChart = dynamic(() => import("./ModernCharts").then(mod => mod.ModernGeoChart), { ssr: false });

import { SystemStatus } from "./SystemStatus";
import { ChartContainer, ChartGrid } from "./ChartContainer";
import { DataTable } from "./DataTable";
import { useAdminDashboard } from "@/lib/hooks/useAdminDashboard";

export function ModernAdminDashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { data: dashboardData, isLoading, error, refetch } = useAdminDashboard(30);
  
  const data = dashboardData?.analytics;
  const platformData = dashboardData?.platform;

  const revenueTrendData = useMemo(() => {
    if (!data?.trend) return [];
    return data.trend.map(point => ({
      name: point.period,
      revenue: point.revenue,
      proposals: point.proposals,
      users: point.users
    }));
  }, [data]);

  const roleDistribution = useMemo(() => {
    if (!data?.roleDistribution) return [];
    return data.roleDistribution.map(item => ({
      name: item.label,
      value: item.value
    }));
  }, [data]);

  const handleRefresh = () => refetch();

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 6 } }}>
        <MetricCardsSkeleton count={4} />
        <Box sx={{ mt: 6, display: 'grid', gridTemplateColumns: { md: '2fr 1fr' }, gap: 4 }}>
           <Skeleton variant="rectangular" height={440} sx={{ borderRadius: "24px" }} />
           <Skeleton variant="rectangular" height={440} sx={{ borderRadius: "24px" }} />
        </Box>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="xl" sx={{ py: 12 }}>
        <Alert 
          severity="error" 
          variant="filled"
          action={<Button variant="outline" size="sm" onClick={handleRefresh} leftIcon={<RefreshRoundedIcon />} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>Retry</Button>}
          sx={{ borderRadius: "16px" }}
        >
          Operational Telemetry Failure: {error instanceof Error ? error.message : "Dataset sync failed."}
        </Alert>
      </Container>
    );
  }

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'total-users': return <GroupsRoundedIcon />;
      case 'active-users': return <TrendingUpRoundedIcon />;
      case 'revenue': return <MonetizationOnRoundedIcon />;
      case 'total-jobs': return <StorageRoundedIcon />;
      default: return <GroupsRoundedIcon />;
    }
  };

  const getMetricColor = (tone: string): any => {
    switch (tone) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'neutral': return 'primary';
      default: return 'primary';
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 } }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ lg: 'center' }} mb={6} gap={3}>
            <Box>
              <Typography variant="overline" sx={{ fontSize: '11px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.2em', mb: 1, display: "block" }}>
                MISSION CONTROL · LIVE
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: '-0.05em', color: 'text.primary', lineHeight: 1 }}>
                Command Center
              </Typography>
              <Typography sx={{ fontSize: '18px', color: 'text.secondary', fontWeight: 600, opacity: 0.7, mt: 2, maxWidth: 800 }}>
                High-fidelity orchestration terminal monitoring global performance, 
                regional engagement, and autonomous AI infrastructure.
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', opacity: 0.5, letterSpacing: "0.1em" }}>Telemetry Stream</Typography>
                <Typography sx={{ fontSize: '16px', fontWeight: 900, color: isDark ? "#34d399" : "var(--success)" }}>LIVE SYNC</Typography>
              </Box>
              <Button
                variant="primary"
                onClick={handleRefresh}
                leftIcon={<RefreshRoundedIcon />}
                sx={{ height: 52, px: 4, borderRadius: "16px", fontWeight: 900, boxShadow: isDark ? "0 10px 25px rgba(129, 140, 248, 0.15)" : "0 10px 25px var(--primary-glow)" }}
              >
                Sync Operations
              </Button>
            </Stack>
          </Stack>
        </motion.div>

        <Grid container spacing={3} mb={6}>
          {data.headlineMetrics.map((metric, idx) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={metric.id}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: idx * 0.1 }}>
                <MetricCard
                  icon={getMetricIcon(metric.id)}
                  label={metric.label}
                  value={metric.value}
                  helper={metric.helper}
                  color={getMetricColor(metric.tone)}
                  trend={idx === 0 ? 12.8 : idx === 2 ? -1.2 : undefined} 
                  sparkData={revenueTrendData.slice(-12).map(d => ({ value: Number(d.revenue) || Number(d.users) || 0 }))}
                />
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4} mb={6}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <ChartContainer 
              title="Global Flow & Interoperability" 
              subtitle="Real-time stream of platform engagement and financial velocity"
              height={460}
            >
              <ModernStreamChart
                data={revenueTrendData}
                areas={[
                  { key: "revenue", name: "Gross Value", color: "var(--primary)" },
                  { key: "users", name: "Principals", color: "var(--secondary)" },
                  { key: "proposals", name: "Transactions", color: "var(--success)" },
                ]}
                height={380}
              />
            </ChartContainer>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <GlassCard sx={{ height: '100%', border: "1px solid var(--border)" }}>
              <GlassCardHeader title="AI Intelligence Stream" subtitle="Neural operational insights" />
              <Stack spacing={2.5} p={3}>
                {data.insights.map((insight, idx) => (
                  <Box 
                    key={idx}
                    sx={{ 
                      p: 2.5, borderRadius: "20px", 
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.06)" : "var(--glass-gray)",
                      border: `1px solid ${alpha(insight.tone === 'positive' ? '#10B981' : '#6366F1', 0.15)}`,
                      borderLeft: `5px solid ${insight.tone === 'positive' ? '#10B981' : insight.tone === 'negative' ? '#EF4444' : '#6366F1'}`,
                      transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                      "&:hover": { transform: "translateX(6px)", bgcolor: isDark ? "rgba(255, 255, 255, 0.1)" : "var(--glass-gray-hover)" }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, letterSpacing: "-0.01em", color: isDark ? "#e2e8f0" : undefined }}>{insight.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px', lineHeight: 1.6, fontWeight: 500 }}>{insight.detail}</Typography>
                  </Box>
                ))}
              </Stack>
            </GlassCard>
          </Grid>
        </Grid>

        <Box mb={6}>
          <SystemStatus
            overallStatus={platformData?.alerts?.some(a => a.level === 'CRITICAL') ? 'critical' : 'operational'}
            metrics={platformData?.metrics?.map(m => ({
              label: m.label,
              value: parseFloat(m.value.replace(/[^0-9.]/g, '')),
              unit: m.value.includes('%') ? '%' : m.value.includes('ms') ? 'ms' : '',
              status: m.tone === 'success' ? 'operational' : m.tone === 'warning' ? 'degraded' : 'operational',
              trend: m.trend ? parseFloat(m.trend.replace(/[^0-9.-]/g, '')) : undefined
            })) || []}
            updatedAt={new Date(platformData?.generatedAt || new Date())}
          />
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <ActivityFeed maxItems={12} />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={4}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ChartContainer title="Principal Distribution" height={320}>
                     <ModernDonutChart data={roleDistribution} height={240} innerRadius={70} outerRadius={100} />
                  </ChartContainer>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ChartContainer title="Neural Performance" height={320}>
                     <ModernRadarChart
                       data={[{ name: "Logic", logic: 92, speed: 88, accuracy: 96, security: 98, ux: 94 }]}
                       axes={[
                         { key: "logic", name: "Reasoning" },
                         { key: "speed", name: "Latency" },
                         { key: "accuracy", name: "Precision" },
                         { key: "security", name: "Integrity" },
                         { key: "ux", name: "Experience" },
                       ]}
                       height={240}
                     />
                  </ChartContainer>
                </Grid>
              </Grid>

              <GlassCard>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={900} sx={{ mb: 3 }}>Regional Market Intelligence</Typography>
                  <DataTable
                    columns={[
                      { key: "label", label: "Global Region", sortable: true, render: (v) => <Typography variant="body2" fontWeight={800}>{String(v)}</Typography> },
                      { key: "value", label: "Session Volume", sortable: true, align: "right", render: (v) => <Typography variant="body2" fontWeight={900} color="var(--primary)">{String(v)}</Typography> },
                      { key: "helper", label: "Market Dominance", align: "right", render: (v) => <Chip label={String(v)} size="small" sx={{ fontWeight: 800, fontSize: 10, borderRadius: "6px" }} /> }
                    ]}
                    data={data.topCategories as any[]}
                    rowKey="label"
                    pageSize={5}
                  />
                </CardContent>
              </GlassCard>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
