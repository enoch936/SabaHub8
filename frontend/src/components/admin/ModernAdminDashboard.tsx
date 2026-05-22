/**
 * Modern Admin Dashboard
 * Main dashboard with analytics, charts, activity feed, and data tables
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { Box, Stack, Container, Typography, useTheme, alpha, Grid, Skeleton, Alert, Button } from "@mui/material";
import { motion } from "framer-motion";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { designSystem } from "@/lib/admin/theme-design-system";
import { MetricCard, MetricCardsSkeleton } from "./MetricCard";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { ActivityFeed, ActivityFeedSkeleton, ActivityEvent } from "./ActivityFeed";
import { SystemStatus, SystemMetric } from "./SystemStatus";
import {
  ModernLineChart,
  ModernBarChart,
  ModernAreaChart,
  ModernDonutChart,
  ModernRadarChart,
} from "./ModernCharts";
import { ChartContainer, ChartGrid } from "./ChartContainer";
import { DataTable, TableColumn } from "./DataTable";
import { adminAnalyticsWorkspace, AdminAnalyticsWorkspaceResponse, AdminAnalyticsMetricCard } from "@/lib/api";

// Dashboard Data Types
interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  joinDate: string;
}

export function ModernAdminDashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminAnalyticsWorkspaceResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch real analytics data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    async function loadDashboard() {
      try {
        const response = await adminAnalyticsWorkspace(30);
        if (mounted) {
          setData(response);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load dashboard metrics");
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => { mounted = false; };
  }, [refreshKey]);

  const revenueTrendData = useMemo(() => {
    if (!data?.trend) return [];
    return data.trend.map(point => ({
      name: point.period,
      revenue: point.revenue,
      proposals: point.proposals
    }));
  }, [data]);

  const userGrowthData = useMemo(() => {
    if (!data?.trend) return [];
    return data.trend.map(point => ({
      name: point.period,
      value: point.users
    }));
  }, [data]);

  const subscriptionData = useMemo(() => {
    if (!data?.roleDistribution) return [];
    return data.roleDistribution.map(item => ({
      name: item.label,
      value: item.value
    }));
  }, [data]);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <MetricCardsSkeleton count={4} />
        <Box mt={4}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
        </Box>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh} startIcon={<RefreshRoundedIcon />}>
              Retry
            </Button>
          }
        >
          {error || "An unexpected error occurred while loading dashboard data."}
        </Alert>
      </Container>
    );
  }

  // Map headline metrics to MetricCard props
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
    <Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.mode === "dark"
          ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 100%)`
          : theme.palette.background.default,
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: "24px", sm: "32px", md: "40px" },
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  mb: 0.5,
                }}
              >
                Dashboard
              </Typography>
              <Typography sx={{ fontSize: "14px", color: theme.palette.text.secondary }}>
                Real-time operational visibility as of {new Date(data.generatedAt).toLocaleString()}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              startIcon={<RefreshRoundedIcon />}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Stack>
        </motion.div>

        {/* Hero Metrics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Grid container spacing={2} mb={4}>
            {data.headlineMetrics.map((metric) => (
              <Grid item xs={12} sm={6} md={3} key={metric.id}>
                <MetricCard
                  icon={getMetricIcon(metric.id)}
                  label={metric.label}
                  value={metric.value}
                  helper={metric.helper}
                  color={getMetricColor(metric.tone)}
                  sparkData={[]} // Sparklines could be derived from data.trend if needed
                />
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* AI & Platform Insights */}
        {data.insights.length > 0 && (
          <Grid container spacing={3} mb={4}>
            {data.insights.map((insight, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <GlassCard sx={{ height: '100%', borderLeft: `4px solid ${insight.tone === 'positive' ? '#10B981' : insight.tone === 'negative' ? '#EF4444' : '#6366F1'}` }}>
                  <Box p={2.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{insight.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{insight.detail}</Typography>
                  </Box>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <ChartGrid columns={2} gap={3} sx={{ mb: 4 }}>
            <ChartContainer title="Revenue & Activity Trends" subtitle={`Last ${data.windowDays} days`}>
              <ModernLineChart
                data={revenueTrendData}
                lines={[
                  { key: "revenue", name: "Revenue", color: "#6366F1" },
                  { key: "proposals", name: "Proposals", color: "#10B981" },
                ]}
                height={300}
              />
            </ChartContainer>

            <ChartContainer title="User Registrations" subtitle="Growth over time">
              <ModernBarChart
                data={userGrowthData}
                bars={[{ key: "value", name: "New Users", color: "#8B5CF6" }]}
                height={300}
              />
            </ChartContainer>
          </ChartGrid>

          <ChartGrid columns={3} gap={3} sx={{ mb: 4 }}>
            <ChartContainer title="Role Distribution" subtitle="Account mix">
              <ModernDonutChart
                data={subscriptionData}
                height={280}
              />
            </ChartContainer>

            <ChartContainer title="AI Engine Status" subtitle={data.aiStatus.engine}>
              <ModernRadarChart
                data={[
                  {
                    name: "Capabilities",
                    jobs: data.aiStatus.pythonJobsEnabled ? 100 : 0,
                    freelancers: data.aiStatus.pythonFreelancersEnabled ? 100 : 0,
                    fraud: data.aiStatus.pythonFraudEnabled ? 100 : 0,
                    chat: data.aiStatus.pythonChatEnabled ? 100 : 0,
                  },
                ]}
                axes={[
                  { key: "jobs", name: "Job Analysis" },
                  { key: "freelancers", name: "Freelancer Match" },
                  { key: "fraud", name: "Fraud Detect" },
                  { key: "chat", name: "AI Chat" },
                ]}
                height={280}
              />
            </ChartContainer>

            <ChartContainer title="Marketplace Health" subtitle="Hiring Funnel">
              <ModernAreaChart
                data={data.hiringFunnel.map(item => ({ name: item.label, value: item.value }))}
                areas={[
                  { key: "value", name: "Volume", color: "#10B981" },
                ]}
                height={280}
              />
            </ChartContainer>
          </ChartGrid>
        </motion.div>

        {/* Activity Feed & Detailed Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={5}>
              <ActivityFeed maxItems={8} />
            </Grid>
            <Grid item xs={12} md={7}>
              <GlassCard>
                <GlassCardHeader
                  title="Operational Metrics"
                  subtitle="System & Marketplace performance"
                />
                <Box p={2}>
                   <Grid container spacing={2}>
                      {data.operationsMetrics.map(metric => (
                        <Grid item xs={6} key={metric.id}>
                           <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>{metric.label}</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>{metric.value}</Typography>
                              <Typography variant="caption" color={metric.tone === 'positive' ? 'success.main' : 'text.secondary'}>{metric.helper}</Typography>
                           </Box>
                        </Grid>
                      ))}
                   </Grid>
                </Box>
              </GlassCard>
            </Grid>
          </Grid>
        </motion.div>

        {/* Bottom Spacer */}
        <Box sx={{ height: 40 }} />
      </Container>
    </Box>
  );
}
