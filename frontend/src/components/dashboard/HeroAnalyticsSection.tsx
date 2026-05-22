"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Briefcase,
  Server,
  Zap,
  BarChart3,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Card, Stack, Typography, Grid as MuiGrid } from "@mui/material";
const Grid = MuiGrid as any;

interface SparklineData {
  value: number;
}

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend: number;
  sparkData: SparklineData[];
  color: string;
  helper?: string;
  index: number;
}

const KPICard = ({ label, value, icon: Icon, trend, sparkData, color, helper, index }: KPICardProps) => {
  const theme = useTheme();
  const isPositive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card
        sx={{
          p: 2.5,
          position: "relative",
          overflow: "hidden",
          borderRadius: "24px",
          border: "1px solid",
          borderColor: alpha(color, 0.2),
          background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
          backdropFilter: "blur(12px)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "16px",
                bgcolor: alpha(color, 0.1),
                color: color,
              }}
            >
              <Icon size={24} />
            </Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {isPositive ? (
                <TrendingUp size={16} color={theme.palette.success.main} />
              ) : (
                <TrendingDown size={16} color={theme.palette.error.main} />
              )}
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ color: isPositive ? "success.main" : "error.main" }}
              >
                {isPositive ? "+" : ""}{trend}%
              </Typography>
            </Stack>
          </Stack>

          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, letterSpacing: "-0.02em" }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 2 }}>
            {label}
          </Typography>
        </Box>

        <Box sx={{ height: 40, mt: "auto", opacity: 0.8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {helper && (
          <Typography variant="caption" sx={{ mt: 1, color: "text.secondary", opacity: 0.7 }}>
            {helper}
          </Typography>
        )}
      </Card>
    </motion.div>
  );
};

const ProgressRing = ({ value, label, color }: { value: number; label: string; color: string }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <Box sx={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke={alpha(color, 0.1)}
          strokeWidth="8"
          fill="transparent"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          strokeLinecap="round"
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Typography variant="caption" fontWeight={900}>
          {value}%
        </Typography>
      </Box>
      <Typography variant="caption" fontWeight={700} sx={{ mt: 1, color: "text.secondary", fontSize: '10px' }}>
        {label}
      </Typography>
    </Box>
  );
};

export const HeroAnalyticsSection = () => {
  const [liveCounters, setLiveCounters] = useState({
    revenue: 124500,
    aiRequests: 8420,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCounters((prev) => ({
        revenue: prev.revenue + Math.floor(Math.random() * 10),
        aiRequests: prev.aiRequests + (Math.random() > 0.7 ? 1 : 0),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const kpis = [
    {
      label: "Total Revenue",
      value: `$${liveCounters.revenue.toLocaleString()}`,
      icon: DollarSign,
      trend: 12.5,
      sparkData: [{ value: 30 }, { value: 45 }, { value: 35 }, { value: 55 }, { value: 40 }, { value: 65 }, { value: 50 }],
      color: "#6366F1",
      helper: "vs last month",
    },
    {
      label: "Active Users",
      value: "42,850",
      icon: Users,
      trend: 8.2,
      sparkData: [{ value: 20 }, { value: 30 }, { value: 45 }, { value: 40 }, { value: 55 }, { value: 60 }, { value: 75 }],
      color: "#10B981",
      helper: "Live now: 1,240",
    },
    {
      label: "Platform Growth",
      value: "24.5%",
      icon: BarChart3,
      trend: 4.1,
      sparkData: [{ value: 10 }, { value: 15 }, { value: 12 }, { value: 18 }, { value: 22 }, { value: 25 }, { value: 28 }],
      color: "#F59E0B",
      helper: "Compound monthly",
    },
    {
      label: "Total Orders",
      value: "12,402",
      icon: Briefcase,
      trend: -2.4,
      sparkData: [{ value: 50 }, { value: 45 }, { value: 48 }, { value: 40 }, { value: 35 }, { value: 38 }, { value: 32 }],
      color: "#EC4899",
      helper: "Last 30 days",
    },
    {
      label: "Server Load",
      value: "32%",
      icon: Server,
      trend: -5.0,
      sparkData: [{ value: 60 }, { value: 55 }, { value: 50 }, { value: 45 }, { value: 40 }, { value: 35 }, { value: 32 }],
      color: "#06B6D4",
      helper: "Optimized status",
    },
    {
      label: "AI Requests",
      value: liveCounters.aiRequests.toLocaleString(),
      icon: Zap,
      trend: 18.7,
      sparkData: [{ value: 100 }, { value: 120 }, { value: 150 }, { value: 180 }, { value: 220 }, { value: 280 }, { value: 350 }],
      color: "#8B5CF6",
      helper: "Tokens: 2.4M",
    },
    {
      label: "Conversion Rate",
      value: "3.24%",
      icon: TrendingUp,
      trend: 1.2,
      sparkData: [{ value: 2.1 }, { value: 2.5 }, { value: 2.8 }, { value: 3.0 }, { value: 3.2 }, { value: 3.1 }, { value: 3.24 }],
      color: "#F97316",
      helper: "Top funnel: 8.5%",
    },
    {
      label: "Error Rate",
      value: "0.02%",
      icon: AlertCircle,
      trend: -12.4,
      sparkData: [{ value: 0.08 }, { value: 0.06 }, { value: 0.05 }, { value: 0.04 }, { value: 0.03 }, { value: 0.025 }, { value: 0.02 }],
      color: "#EF4444",
      helper: "SLA: 99.99%",
    },
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="flex-start" gap={4} mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            Hero Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Premium real-time performance indicators and platform health metrics.
          </Typography>
        </Box>
        <Stack direction="row" spacing={3} sx={{ bgcolor: alpha('#fff', 0.05), p: 2, borderRadius: '24px', border: '1px solid', borderColor: alpha('#fff', 0.1) }}>
          <ProgressRing value={82} label="Goal Progress" color="#6366F1" />
          <ProgressRing value={94} label="Uptime" color="#10B981" />
          <ProgressRing value={65} label="Market Saturation" color="#F59E0B" />
        </Stack>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderRadius: "12px",
            bgcolor: alpha("#10B981", 0.1),
            color: "#10B981",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#10B981",
              animation: "pulse 2s infinite",
            }}
          />
          <Typography variant="caption" fontWeight={700}>
            LIVE STATUS
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {kpis.map((kpi, index) => (
          <Grid xs={12} sm={6} md={4} lg={3} key={kpi.label}>
            <KPICard {...kpi} index={index} />
          </Grid>
        ))}
      </Grid>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </Box>
  );
};
