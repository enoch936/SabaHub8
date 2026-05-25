/**
 * Modern Analytics Cards for Admin Dashboard
 * KPI cards with mini graphs and trend indicators
 */

"use client";

import { ReactNode, useEffect, useState, memo } from "react";
import { Box, Card, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { motion, animate } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { designSystem } from "@/lib/admin/theme-design-system";

import { GlassCard } from "./GlassCard";

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
  loading?: boolean;
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

export const MetricCard = memo(function MetricCard({
  icon,
  label,
  value,
  helper,
  trend,
  sparkData = [],
  color = "primary",
  size = "medium",
  onClick,
  loading = false,
}: MetricCardProps) {
  const theme = useTheme();
  const accentColor = colorMap[color];
  
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = (trend ?? 0) >= 0;
  const trendColor = hasTrend ? (isPositive ? trendColors.up : trendColors.down) : trendColors.neutral;

  const isPadSmall = size === "small";

  // Animated Counter Logic
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  const isCurrency = typeof value === 'string' && value.includes('$');
  const isPercent = typeof value === 'string' && value.includes('%');
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (typeof numericValue !== 'number' || isNaN(numericValue)) {
        setDisplayValue(value);
        return;
    }

    const controls = animate(0, numericValue, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(v) {
        let formatted = v.toLocaleString(undefined, { 
            minimumFractionDigits: numericValue % 1 === 0 ? 0 : 1,
            maximumFractionDigits: 1 
        });
        if (isCurrency) formatted = `$${formatted}`;
        if (isPercent) formatted = `${formatted}%`;
        setDisplayValue(formatted);
      },
    });
    return () => controls.stop();
  }, [numericValue, isCurrency, isPercent, value]);

  if (loading) {
    return <MetricCardSkeleton />;
  }

  return (
    <GlassCard
      accentColor={accentColor}
      onClick={onClick}
      hover={!!onClick}
      component={motion.div}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      sx={{
        p: isPadSmall ? 2 : 2.5,
        minHeight: isPadSmall ? "auto" : "150px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <Box>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
          <Box
            sx={{
              width: isPadSmall ? 32 : 42,
              height: isPadSmall ? 32 : 42,
              borderRadius: "12px",
              background: alpha(accentColor, 0.1),
              border: `1px solid ${alpha(accentColor, 0.2)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentColor,
            }}
          >
            {icon}
          </Box>
          
          {hasTrend && (
            <Box
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: "8px",
                bgcolor: alpha(trendColor, 0.08),
                display: "flex",
                alignItems: "center",
                gap: 0.5
              }}
            >
              {isPositive ? (
                <TrendingUpIcon sx={{ fontSize: 14, color: trendColor }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 14, color: trendColor }} />
              )}
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: trendColor,
                }}
              >
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Stack>

        <Box flex={1}>
          <Typography
            sx={{
              fontSize: isPadSmall ? "20px" : "32px",
              fontWeight: 800,
              color: theme.palette.text.primary,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              mb: 0.5,
            }}
          >
            {displayValue}
          </Typography>
          <Typography
            sx={{
              fontSize: isPadSmall ? "12px" : "14px",
              color: theme.palette.text.secondary,
              fontWeight: 600,
              opacity: 0.7,
              letterSpacing: "-0.01em"
            }}
          >
            {label}
          </Typography>
        </Box>
      </Box>

      {sparkData.length > 1 && !isPadSmall && (
        <Box sx={{ mt: 1.5, height: 40, opacity: 0.8, mx: -2.5, mb: -1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={accentColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      {helper && !isPadSmall && (
        <Typography
          sx={{
            fontSize: "11px",
            color: alpha(theme.palette.text.secondary, 0.5),
            mt: 2,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}
        >
          {helper}
        </Typography>
      )}
    </GlassCard>
  );
});

export function MetricCardSkeleton() {
  return (
    <GlassCard sx={{ p: 2.5, minHeight: 150 }}>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: "var(--border)", opacity: 0.2 }} />
        <Box sx={{ width: 60, height: 24, borderRadius: "8px", bgcolor: "var(--border)", opacity: 0.2 }} />
      </Stack>
      <Box sx={{ width: "60%", height: 32, borderRadius: "8px", bgcolor: "var(--border)", opacity: 0.2, mb: 1 }} />
      <Box sx={{ width: "40%", height: 16, borderRadius: "4px", bgcolor: "var(--border)", opacity: 0.1 }} />
    </GlassCard>
  );
}

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap={2}>
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </Box>
  );
}
