/**
 * System Status & Health Indicators
 * Real-time monitoring metrics for platform health
 * Strictly follows enterprise styling: palette, weights, blur
 */

"use client";

import { Box, Stack, Typography, useTheme, alpha, LinearProgress, Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";

export type HealthStatus = "operational" | "degraded" | "critical" | "warning";

export interface SystemMetric {
  label: string;
  value: number;
  unit?: string;
  max?: number;
  status: HealthStatus;
  trend?: number;
}

interface HealthIndicatorProps {
  status: HealthStatus;
  label: string;
  details?: string;
  pulse?: boolean;
}

const statusConfig: Record<HealthStatus, { color: string; bg: string; label: string }> = {
  operational: {
    color: "#10B981", // Success from palette
    bg: "rgba(16, 185, 129, 0.1)",
    label: "Operational",
  },
  degraded: {
    color: "#F59E0B", // Warning from palette
    bg: "rgba(245, 158, 11, 0.1)",
    label: "Degraded",
  },
  warning: {
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.1)",
    label: "Warning",
  },
  critical: {
    color: "#EF4444", // Error from palette
    bg: "rgba(239, 68, 68, 0.1)",
    label: "Critical",
  },
};

export function HealthIndicator({
  status,
  label,
  details,
  pulse = true,
}: HealthIndicatorProps) {
  const config = statusConfig[status] || statusConfig.operational;

  return (
    <Tooltip title={details || config.label}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1.25,
          px: 2,
          py: 0.75,
          borderRadius: "10px",
          backgroundColor: config.bg,
          border: `1px solid ${alpha(config.color, 0.2)}`,
          cursor: "default",
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: config.color,
            boxShadow: `0 0 10px ${config.color}`,
            ...(pulse && status !== "operational" && {
              animation: "pulse-status 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }),
          }}
        />
        <Typography 
          className="body-text"
          sx={{ 
            fontSize: "11px", 
            fontWeight: 700, 
            color: config.color,
            letterSpacing: "0.05em"
          }}
        >
          {label}
        </Typography>

        <style jsx global>{`
          @keyframes pulse-status {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
          }
        `}</style>
      </Box>
    </Tooltip>
  );
}

export function SystemMetricCard({ metric }: { metric: SystemMetric }) {
  const theme = useTheme();
  const config = statusConfig[metric.status] || statusConfig.operational;
  const percentage = metric.max ? (metric.value / metric.max) * 100 : metric.value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          p: 2.5,
          borderRadius: "16px",
          backgroundColor: alpha(config.color, 0.03),
          border: `1px solid ${alpha(config.color, 0.1)}`,
          transition: "all 0.2s",
          "&:hover": {
            backgroundColor: alpha(config.color, 0.05),
            borderColor: alpha(config.color, 0.2),
          }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography className="body-text" sx={{ fontSize: "13px", fontWeight: 600, opacity: 0.7 }}>
            {metric.label}
          </Typography>
          {metric.trend !== undefined && (
            <Typography sx={{ fontSize: "11px", color: config.color, fontWeight: 700 }}>
              {metric.trend > 0 ? "+" : ""}{metric.trend}%
            </Typography>
          )}
        </Stack>
        <Typography className="large-number" sx={{ fontSize: "24px", color: "text.primary", mb: 1.5 }}>
          {metric.value.toLocaleString()}
          {metric.unit && <Typography component="span" sx={{ fontSize: "14px", ml: 0.5, opacity: 0.6 }}>{metric.unit}</Typography>}
        </Typography>
        {metric.max && (
          <LinearProgress
            variant="determinate"
            value={Math.min(percentage, 100)}
            sx={{
              height: 6,
              borderRadius: "3px",
              backgroundColor: alpha(config.color, 0.08),
              "& .MuiLinearProgress-bar": {
                backgroundColor: config.color,
                borderRadius: "3px",
              },
            }}
          />
        )}
      </Box>
    </motion.div>
  );
}

export function SystemStatus({
  overallStatus,
  metrics,
  updatedAt,
}: {
  overallStatus: HealthStatus;
  metrics: SystemMetric[];
  updatedAt?: Date;
}) {
  const config = statusConfig[overallStatus] || statusConfig.operational;

  return (
    <GlassCard premium sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography className="section-title" sx={{ fontSize: "18px", mb: 0.5 }}>
            Platform Vitality
          </Typography>
          <Typography className="body-text" sx={{ fontSize: "13px", color: "text.secondary", opacity: 0.7 }}>
            Real-time infrastructure & service health monitoring
          </Typography>
        </Box>
        <HealthIndicator
          status={overallStatus}
          label={config.label.toUpperCase()}
          pulse={overallStatus !== "operational"}
        />
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2.5,
        }}
      >
        {metrics.map((metric, idx) => (
          <SystemMetricCard key={idx} metric={metric} />
        ))}
      </Box>

      {updatedAt && (
        <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid var(--border)", textAlign: "right" }}>
          <Typography
            className="body-text"
            sx={{ fontSize: "11px", color: "text.secondary", opacity: 0.5 }}
          >
            Last Heartbeat: {updatedAt.toLocaleTimeString()}
          </Typography>
        </Box>
      )}
    </GlassCard>
  );
}
