/**
 * Modern Chart Wrapper Components
 * Consistent styling for all chart types
 */

"use client";

import { ReactNode } from "react";
import { Box, CircularProgress, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { GlassCard, GlassCardHeader } from "./GlassCard";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
  height?: number | string;
  responsive?: boolean;
}

export function ChartContainer({
  title,
  subtitle,
  action,
  loading = false,
  error = null,
  children,
  height = 320,
  responsive = true,
}: ChartContainerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (error) {
    return (
      <GlassCard>
        <GlassCardHeader title={title} subtitle={subtitle} action={action} />
        <Box
          sx={{
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.error.main,
            fontSize: "14px",
          }}
        >
          Error: {error}
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <GlassCardHeader title={title} subtitle={subtitle} action={action} />
      <Box
        sx={{
          position: "relative",
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.background.default, 0.3),
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <CircularProgress size={32} />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {children}
          </Box>
        )}
      </Box>
    </GlassCard>
  );
}

export function ChartGrid({
  children,
  columns = 2,
  gap = 3,
  sx,
}: {
  children: ReactNode;
  columns?: number;
  gap?: number;
  sx?: Record<string, any>;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: columns >= 2 ? "1fr" : "1fr",
          md: columns >= 2 ? "repeat(2, 1fr)" : "1fr",
          lg: columns >= 3 ? "repeat(3, 1fr)" : columns >= 2 ? "repeat(2, 1fr)" : "1fr",
        },
        gap,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// Chart styling utilities
export const chartConfig = {
  colors: {
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#06B6D4",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    neutral: "#94A3B8",
  },
  
  tooltip: {
    contentStyle: {
      backgroundColor: "rgba(17, 25, 40, 0.95)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "8px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      backdropFilter: "blur(12px)",
    },
    labelStyle: {
      color: "#F8FAFC",
      fontSize: "12px",
      fontWeight: 500,
    },
  },

  grid: {
    strokeDasharray: "3 3",
    stroke: "rgba(255,255,255,0.05)",
  },

  axis: {
    stroke: "rgba(255,255,255,0.1)",
    fontSize: 12,
    fill: "#94A3B8",
  },
} as const;
