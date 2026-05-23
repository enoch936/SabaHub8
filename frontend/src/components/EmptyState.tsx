"use client";

import { ReactNode } from "react";
import { Box, Typography, Stack, alpha, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import SoftButton from "./mui/SoftButton";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 12,
        px: 4,
        textAlign: "center",
        borderRadius: "24px",
        bgcolor: alpha(theme.palette.text.primary, 0.02),
        border: `1px dashed ${alpha(theme.palette.text.primary, 0.1)}`,
      }}
    >
      <Box
        sx={{
          mb: 3,
          p: 2.5,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "3rem",
        }}
      >
        {icon || "📭"}
      </Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            maxWidth: 420,
            mb: 4,
            fontWeight: 500,
            opacity: 0.7,
          }}
        >
          {description}
        </Typography>
      )}
      {action && (
        <SoftButton
          variant="contained"
          onClick={action.onClick}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: "14px",
            fontWeight: 700,
          }}
        >
          {action.label}
        </SoftButton>
      )}
    </Box>
  );
}
