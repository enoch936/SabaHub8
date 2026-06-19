"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, CardContent, Chip, Divider, Grid, Skeleton, Stack, Typography } from "@mui/material";
import TopicRoundedIcon from "@mui/icons-material/TopicRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SoftCard from "@/components/mui/SoftCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import {
  type AdminSectionInsightResponse,
  adminSectionInsight,
} from "@/lib/api";

type AdminSectionFocusProps = {
  parentKey: string;
  parentLabel: string;
  sectionKey?: string | null;
};

export default function AdminSectionFocus({ parentKey, parentLabel, sectionKey }: AdminSectionFocusProps) {
  const [payload, setPayload] = useState<AdminSectionInsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeSectionKey = sectionKey ?? "";

  const load = useCallback(async () => {
    if (!activeSectionKey) {
      setPayload(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
        const result = await adminSectionInsight(parentKey, activeSectionKey);
        setPayload(result);
    } catch (err) {
        setPayload(null);
        const message = err instanceof Error && err.message ? err.message : "Failed to load operational section insights.";
        setError(message);
    } finally {
        setLoading(false);
    }
  }, [parentKey, activeSectionKey]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!activeSectionKey) {
    return (
      <EmptyState 
        title="No operational focus area selected"
        description="Select a section from the capability map or quick actions to view detailed operational controls and documentation."
        icon={<TopicRoundedIcon sx={{ fontSize: 48, opacity: 0.2 }} />}
      />
    );
  }

  if (loading) {
    return (
      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <LoadingSkeleton variant="card" />
        </CardContent>
      </SoftCard>
    );
  }

  if (error || !payload) {
    return <ErrorState title="Section Data Unavailable" description={error ?? "Live section data is not available right now."} onRetry={load} />;
  }

  const status = payload.status.toLowerCase() === "attention" ? "Attention" : "Healthy";

  return (
    <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
      <CardContent>
        <Stack spacing={1.2}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" gap={1}>
            <Box>
              <Typography variant="overline" fontWeight={800} color="text.secondary">
                Active Subsection
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: "-0.01em" }}>
                {payload.sectionLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Workspace: {parentLabel}
              </Typography>
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.6 }}>
                {status === "Healthy" ? (
                  <CheckCircleRoundedIcon color="success" fontSize="small" />
                ) : (
                  <WarningAmberRoundedIcon color="warning" fontSize="small" />
                )}
                <Typography variant="caption" color="text.secondary">
                  {status}: {payload.statusNote}
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip icon={<TopicRoundedIcon />} label={payload.sectionLabel} color="primary" variant="outlined" />
              <Chip icon={<BoltRoundedIcon />} label="Live Focus" variant="outlined" />
            </Stack>
          </Stack>

          <Grid container spacing={1}>
            {payload.signals.map((signal) => (
              <Grid key={signal.label} size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack spacing={0.4}>
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <InsightsRoundedIcon color="info" fontSize="small" />
                      <Typography variant="caption" color="text.secondary">
                        {signal.label}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={800}>
                      {signal.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {signal.trend}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Divider />

          <Stack spacing={0.8}>
            <Typography variant="subtitle2" fontWeight={800}>
              Priority Actions
            </Typography>
            <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap">
              {payload.actions.map((action) => (
                <Chip key={action} label={action} size="small" variant="outlined" />
              ))}
            </Stack>
          </Stack>

          <Grid container spacing={1}>
            {payload.checklist.map((item) => (
              <Grid key={item} size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <TaskAltRoundedIcon color="success" fontSize="small" sx={{ mt: 0.1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {item}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </CardContent>
    </SoftCard>
  );
}
