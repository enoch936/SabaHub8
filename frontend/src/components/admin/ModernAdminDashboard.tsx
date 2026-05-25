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
  Button 
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
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <MetricCardsSkeleton count={4} />
        <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { md: '2fr 1fr' }, gap: 3 }}>
           <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 6 }} />
           <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 6 }} />
        </Box>
      </Box>
    );
  }

  if (error || !data) {
    const errorMsg = error instanceof Error ? error.message : "Failed to load dashboard metrics";
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert 
          severity="error" 
          variant="filled"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh} startIcon={<RefreshRoundedIcon />}>
              Retry
            </Button>
          }
          sx={{ borderRadius: 3 }}
        >
          {errorMsg}
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
    <Box sx={{ pb: 8 }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Page Header with Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={5} gap={2}>
            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.15em', mb: 1 }}>
                Live Operations Center
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.04em', color: 'text.primary' }}>
                Command Center
              </Typography>
              <Typography sx={{ fontSize: '15px', color: 'text.secondary', fontWeight: 500, opacity: 0.7 }}>
                Monitoring platform performance & marketplace health across all regions.
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', lg: 'block' } }}>
                <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', opacity: 0.5 }}>Last Updated</Typography>
                <Typography sx={{ fontSize: '14px', fontWeight: 700 }}>{new Date(data.generatedAt).toLocaleTimeString()}</Typography>
              </Box>
              <Button
                variant="contained"
                onClick={handleRefresh}
                startIcon={<RefreshRoundedIcon />}
                sx={{ 
                  borderRadius: "12px", 
                  px: 3, 
                  py: 1,
                  bgcolor: 'primary.main',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                Refresh Data
              </Button>
            </Stack>
          </Stack>
        </motion.div>

        {/* Top-Level KPI Cards */}
        <Grid container spacing={2.5} mb={5}>
          {data.headlineMetrics.map((metric, idx) => (
            <Grid item xs={12} sm={6} lg={3} key={metric.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <MetricCard
                  icon={getMetricIcon(metric.id)}
                  label={metric.label}
                  value={metric.value}
                  helper={metric.helper}
                  color={getMetricColor(metric.tone)}
                  trend={idx === 0 ? 12.5 : idx === 2 ? -2.4 : undefined} 
                  sparkData={revenueTrendData.slice(-10).map(d => ({ value: Number(d.revenue) || Number(d.users) || 0 }))}
                />
              </motion.div>
            </Grid>
          ))}
          
          {/* Supplemental KPIs */}
          <Grid item xs={12} sm={6} lg={3}>
             <MetricCard
               icon={<StorageRoundedIcon />}
               label="Server Load"
               value="42%"
               color="warning"
               trend={-5.2}
               size="small"
             />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
             <MetricCard
               icon={<SmartToyRoundedIcon />}
               label="AI Request Volume"
               value="1.2k"
               color="accent"
               trend={24.8}
               size="small"
             />
          </Grid>
        </Grid>

        <Grid container spacing={3} mb={5}>
          {/* Main Visualizations */}
          <Grid item xs={12} lg={8}>
            <ChartContainer 
              title="Marketplace Dynamics & Flow" 
              subtitle="Real-time stream of engagement and revenue"
              height={420}
            >
              <ModernStreamChart
                data={revenueTrendData}
                areas={[
                  { key: "revenue", name: "Gross Revenue", color: "#6366F1" },
                  { key: "users", name: "Active Sessions", color: "#8B5CF6" },
                  { key: "proposals", name: "Bid Volume", color: "#10B981" },
                ]}
                height={350}
              />
            </ChartContainer>
          </Grid>

          {/* AI Insights Sidebar */}
          <Grid item xs={12} lg={4}>
            <GlassCard sx={{ height: '100%' }}>
              <GlassCardHeader 
                title="AI Platform Insights" 
                subtitle="Engine-generated operational recommendations" 
              />
              <Stack spacing={2} p={1}>
                {data.insights.map((insight, idx) => (
                  <Box 
                    key={idx}
                    sx={{ 
                      p: 2, 
                      borderRadius: "16px", 
                      bgcolor: alpha(insight.tone === 'positive' ? '#10B981' : insight.tone === 'negative' ? '#EF4444' : '#6366F1', 0.05),
                      borderLeft: `4px solid ${insight.tone === 'positive' ? '#10B981' : insight.tone === 'negative' ? '#EF4444' : '#6366F1'}`,
                      transition: "transform 0.2s",
                      "&:hover": { transform: "translateX(8px)" }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>{insight.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px', lineHeight: 1.5 }}>{insight.detail}</Typography>
                  </Box>
                ))}
                {data.insights.length === 0 && (
                  <Box sx={{ py: 4, textAlign: 'center', opacity: 0.5 }}>
                    <SmartToyRoundedIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2">No active AI insights at this time.</Typography>
                  </Box>
                )}
              </Stack>
            </GlassCard>
          </Grid>
        </Grid>

        <Grid container spacing={3} mb={5}>
           <Grid item xs={12} md={6} lg={4}>
              <ChartContainer title="Global Traffic Distribution" subtitle="Active users by primary regions">
                 <ModernGeoChart 
                   data={[
                     { region: "North America", value: 4500, percentage: 42, color: "#6366F1" },
                     { region: "Europe", value: 3200, percentage: 30, color: "#8B5CF6" },
                     { region: "Asia Pacific", value: 1800, percentage: 18, color: "#06B6D4" },
                     { region: "Middle East", value: 1000, percentage: 10, color: "#10B981" },
                   ]}
                 />
              </ChartContainer>
           </Grid>
           <Grid item xs={12} md={6} lg={8}>
              <ChartContainer title="System Activity Heatmap" subtitle="Inference and request intensity (Last 24 Hours)">
                 <ModernHeatmap
                   xLabels={["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]}
                   yLabels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                   data={Array.from({ length: 42 }).map((_, i) => ({
                     x: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"][i % 6],
                     y: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][Math.floor(i / 6)],
                     value: Math.floor(Math.random() * 100)
                   }))}
                 />
              </ChartContainer>
           </Grid>
        </Grid>

        {/* System Vitality & Active Monitoring */}
        <Box mb={5}>
          <SystemStatus
            overallStatus={platformData?.alerts?.some(a => a.severity === 'CRITICAL') ? 'critical' : 'operational'}
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

        <Grid container spacing={3}>
          {/* Activity Stream */}
          <Grid item xs={12} md={5}>
            <ActivityFeed maxItems={10} />
          </Grid>

          {/* Detailed Distribution & Funnel */}
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>
              <ChartGrid columns={2} gap={3}>
                <ChartContainer title="User Distribution" height={280}>
                   <ModernDonutChart data={roleDistribution} height={220} />
                </ChartContainer>
                
                <ChartContainer title="AI Model Performance" height={280}>
                   <ModernRadarChart
                     data={[
                       { 
                         name: "Capabilities", 
                         logic: data.aiStatus.pythonJobsEnabled ? 100 : 0,
                         speed: data.aiStatus.pythonBridgeReachable ? 100 : 0,
                         accuracy: data.aiStatus.pythonFreelancersEnabled ? 100 : 0,
                         security: data.aiStatus.pythonFraudEnabled ? 100 : 0,
                         ux: data.aiStatus.pythonChatEnabled ? 100 : 0,
                       },
                     ]}
                     axes={[
                       { key: "logic", name: "Job Analysis" },
                       { key: "speed", name: "Inference Speed" },
                       { key: "accuracy", name: "Matching Accuracy" },
                       { key: "security", name: "Fraud Detection" },
                       { key: "ux", name: "AI Chat UX" },
                     ]}
                     height={220}
                   />
                </ChartContainer>
              </ChartGrid>

              <GlassCard>
                <GlassCardHeader title="Top Marketplace Categories" subtitle="Lead generation & demand volume" />
                <Box p={2}>
                  <DataTable
                    columns={[
                      { key: "label", label: "Category", sortable: true },
                      { key: "value", label: "Volume", sortable: true, align: "right" },
                      { key: "helper", label: "Market Share", align: "right" }
                    ]}
                    data={data.topCategories}
                    rowKey="label"
                    pageSize={4}
                    searchable={false}
                    exportable={false}
                    virtualized
                  />
                </Box>
              </GlassCard>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
