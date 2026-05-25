"use client";

import { Box, Skeleton, Stack, alpha, useTheme } from "@mui/material";
import { memo } from "react";

interface LoadingSkeletonProps {
  rows?: number;
  variant?: "list" | "card" | "table";
}

const LoadingSkeleton = memo(function LoadingSkeleton({
  rows = 3,
  variant = "list",
}: LoadingSkeletonProps) {
  const theme = useTheme();

  if (variant === "card") {
    return (
      <Box sx={{ p: 3, borderRadius: "24px", border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: alpha(theme.palette.background.paper, 0.4), backdropFilter: "blur(10px)" }}>
        <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="90%" height={20} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: "8px" }} />
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: "8px" }} />
        </Stack>
      </Box>
    );
  }

  if (variant === "table") {
    return (
      <Stack spacing={0}>
        {Array.from({ length: rows }).map((_, i) => (
          <Box key={i} sx={{ py: 2, px: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`, display: "flex", gap: 3 }}>
            <Skeleton variant="rectangular" width={24} height={24} sx={{ borderRadius: "4px" }} />
            <Skeleton variant="text" width="20%" height={24} />
            <Skeleton variant="text" width="40%" height={24} />
            <Skeleton variant="text" width="15%" height={24} />
            <Skeleton variant="text" width="10%" height={24} />
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      {Array.from({ length: rows }).map((_, i) => (
        <Stack key={i} spacing={1}>
          <Skeleton
            variant="text"
            width="40%"
            height={28}
            sx={{ borderRadius: "4px" }}
          />
          <Skeleton
            variant="text"
            width="85%"
            height={20}
            sx={{ borderRadius: "4px" }}
          />
        </Stack>
      ))}
    </Stack>
  );
});

export default LoadingSkeleton;
