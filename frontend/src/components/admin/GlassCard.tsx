/**
 * Modern Premium Glass Card Component
 * Strictly follows enterprise styling: 18px blur, scale(1.02) hover
 */

"use client";

import { ReactNode } from "react";
import { Box, Card, CardProps, Stack, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";

interface GlassCardProps extends Omit<CardProps, "ref"> {
  children: ReactNode;
  hover?: boolean;
  accentColor?: string;
  glass?: boolean;
  animated?: boolean;
  premium?: boolean;
  gradient?: boolean;
  depth?: boolean;
  whileHover?: Record<string, any>;
  component?: React.ElementType;
}

export function GlassCard({
  children,
  hover = true,
  accentColor,
  glass = true,
  animated = false,
  premium = true,
  gradient = false,
  depth = true,
  sx,
  className = "",
  ...props
}: GlassCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const baseColor = accentColor || "#6366F1";
  
  const combinedClassName = [
    premium ? "glass-card-premium" : "glass-card",
    gradient ? "gradient-highlight" : "",
    depth ? "layered-depth" : "",
    className
  ].filter(Boolean).join(" ");

  const cardSx = {
    position: "relative",
    overflow: "hidden",
    borderRadius: "24px",
    border: `1px solid var(--border)`,
    background: isDark ? "rgba(15, 23, 42, 0.8)" : "var(--surface)",
    backdropFilter: glass ? "blur(var(--glass-blur))" : "none",
    boxShadow: isDark ? "0 20px 50px -12px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.06)" : "var(--glass-shadow)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

    ...(hover && {
      "&:hover": {
        transform: "scale(1.02)",
        borderColor: baseColor,
        boxShadow: `0 0 20px ${alpha(baseColor, 0.2)}`,
        "&::after": {
          borderColor: alpha(baseColor, 0.4),
          boxShadow: `inset 0 0 10px ${alpha(baseColor, 0.1)}`,
        }
      },
    }),
    
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      borderRadius: "inherit",
      border: "1px solid transparent",
      transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    },

    ...sx,
  };

  const Component = (animated ? motion(Card) : Card) as any;
  const animationProps = animated ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  } : {};

  return (
    <Component
      {...(animated ? animationProps : {})}
      className={combinedClassName}
      sx={cardSx as any}
      {...props}
    >
      {children}
    </Component>
  );
}

export function GlassCardHeader({
  title,
  subtitle,
  action,
  icon,
  sx,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  sx?: Record<string, any>;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        mb: 2.5,
        ...sx,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start" flex={1}>
        {icon && (
          <Box sx={{ 
            color: 'primary.main', 
            mt: 0.5,
            opacity: 0.8
          }}>
            {icon}
          </Box>
        )}
        <Box flex={1}>
          <Box
            className="section-title"
            sx={{
              fontSize: "18px",
              color: theme.palette.text.primary,
              letterSpacing: "-0.02em",
              mb: 0.5,
            }}
          >
            {title}
          </Box>
          {subtitle && (
            <Box
              className="body-text"
              sx={{
                fontSize: "13px",
                color: theme.palette.text.secondary,
                opacity: 0.8,
              }}
            >
              {subtitle}
            </Box>
          )}
        </Box>
      </Stack>
      {action && <Box>{action}</Box>}
    </Box>
  );
}
