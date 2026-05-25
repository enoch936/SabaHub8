"use client";

import { Box, Typography, alpha, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import SoftButton from "./mui/SoftButton";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 12,
        px: 4,
        textAlign: "center",
        borderRadius: "24px",
        bgcolor: alpha(theme.palette.error.main, 0.02),
        border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
      }}
    >
      <Box
        sx={{
          mb: 3,
          p: 2.5,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.error.main, 0.08),
          color: "error.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WarningAmberRoundedIcon sx={{ fontSize: "3.5rem" }} />
      </Box>
      <Typography variant="h5" fontWeight={800} color="error.main" gutterBottom>
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: "text.secondary",
          maxWidth: 420,
          mb: 4,
          fontWeight: 500,
          opacity: 0.8,
        }}
      >
        {description}
      </Typography>
      {onRetry && (
        <SoftButton
          variant="contained"
          color="error"
          onClick={onRetry}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: "14px",
            fontWeight: 700,
          }}
        >
          Try Again
        </SoftButton>
      )}
    </Box>
  );
}
