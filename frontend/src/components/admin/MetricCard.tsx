/**
 * Modern Analytics Cards for Admin Dashboard
 * KPI cards with mini graphs and trend indicators
 */

"use client";

import { ReactNode } from "react";
import { Box, Card, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { designSystem } from "@/lib/admin/theme-design-system";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper?: string;
  trend?: number; // percentage change
  sparkData?: Array<{ value: number }>;
  color?: "primary" | "secondary" | "accent" | "success" | "warning" | "error";
  size?: "small" | "medium";
  onClick?: () => void;
}

const colorMap: Record<string, string> = {
  primary: "#6366F1",
  secondary: "#8B5CF6",
  accent: "#06B6D4",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

const trendColors = {
  up: "#10B981",
  down: "#EF4444",
  neutral: "#94A3B8",
};

export function MetricCard({
  icon,
  label,
  value,
  helper,
  trend,
  sparkData = [],
  color = "primary",
  size = "medium",
  onClick,
}: MetricCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accentColor = colorMap[color];
  
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = (trend ?? 0) >= 0;
  const trendColor = hasTrend ? (isPositive ? trendColors.up : trendColors.down) : trendColors.neutral;

  const cardSx = {
    position: "relative",
    overflow: "hidden",
    border: `1px solid ${alpha(accentColor, 0.2)}`,
    background: isDark
      ? `linear-gradient(135deg, ${alpha(accentColor, 0.08)} 0%, ${alpha("#000", 0.3)} 100%)`
      : `linear-gradient(135deg, ${alpha(accentColor, 0.06)} 0%, ${alpha("#fff", 0.5)} 100%)`,
    backdropFilter: "blur(12px)",
    cursor: onClick ? "pointer" : "default",
    transition: designSystem.transitions.base,
    
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "1px",
      background: `linear-gradient(90deg, transparent, ${alpha(accentColor, 0.4)}, transparent)`,
    },
    
    "&:hover": onClick ? {
      transform: "translateY(-2px)",
      borderColor: alpha(accentColor, 0.4),
      background: isDark
        ? `linear-gradient(135deg, ${alpha(accentColor, 0.12)} 0%, ${alpha("#000", 0.2)} 100%)`
        : `linear-gradient(135deg, ${alpha(accentColor, 0.1)} 0%, ${alpha("#fff", 0.6)} 100%)`,
      boxShadow: `0 12px 32px ${alpha(accentColor, 0.15)}, inset 0 1px 0 ${alpha("#fff", 0.08)}`,
    } : {},
  };

  const isPadSmall = size === "small";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          ...cardSx,
          p: isPadSmall ? 2 : 2.5,
          minHeight: isPadSmall ? "auto" : "160px",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={onClick}
      >
        {/* Header with icon */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
          <Box
            sx={{
              width: isPadSmall ? 32 : 40,
              height: isPadSmall ? 32 : 40,
              borderRadius: "10px",
              background: alpha(accentColor, 0.15),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentColor,
              fontSize: isPadSmall ? 18 : 24,
            }}
          >
            {icon}
          </Box>
          
          {hasTrend && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
                {isPositive ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: trendColor }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: trendColor }} />
              )}
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: trendColor,
                }}
              >
                {Math.abs(trend)}%
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Main metric */}
        <Box flex={1} display="flex" flexDirection="column" justifyContent="space-between">
          <Box>
            <Typography
              sx={{
                fontSize: isPadSmall ? "20px" : "28px",
                fontWeight: 700,
                color: theme.palette.text.primary,
                lineHeight: 1,
                mb: 0.5,
              }}
            >
              {value}
            </Typography>
            <Typography
              sx={{
                fontSize: isPadSmall ? "12px" : "13px",
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              {label}
            </Typography>
          </Box>

          {/* Sparkline */}
          {sparkData.length > 1 && !isPadSmall && (
            <Box sx={{ mt: 1.5, height: 32, opacity: 0.6 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={accentColor}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>

        {/* Helper text */}
        {helper && (
          <Typography
            sx={{
              fontSize: "11px",
              color: alpha(theme.palette.text.secondary, 0.7),
              mt: 1,
              fontWeight: 400,
            }}
          >
            {helper}
          </Typography>
        )}
      </Card>
    </motion.div>
  );
}

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          sx={{
            p: 2.5,
            minHeight: 160,
            backgroundColor: alpha("#999", 0.1),
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
      ))}
    </Box>
  );
}
