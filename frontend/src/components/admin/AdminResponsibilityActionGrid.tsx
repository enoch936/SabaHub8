"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import SettingsBackupRestoreRoundedIcon from "@mui/icons-material/SettingsBackupRestoreRounded";
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import {
  type AdminCommandCenterFeatureFlag,
  type AdminCommandCenterOperation,
} from "@/lib/api";
import { buildResponsibilityActionModels } from "@/lib/admin/responsibility-actions";

type AdminResponsibilityActionGridProps = {
  domainId: string;
  responsibilities: string[];
  operations: AdminCommandCenterOperation[];
  featureFlags?: AdminCommandCenterFeatureFlag[];
  activeSection?: string | null;
  runningOperationId?: string | null;
  flagUpdating?: string | null;
  title: string;
  subtitle: string;
  emptyDetail: string;
  onRunOperation?: (operation: AdminCommandCenterOperation, dryRun: boolean) => void | Promise<void>;
  onToggleFlag?: (flag: AdminCommandCenterFeatureFlag) => void | Promise<void>;
};

export default function AdminResponsibilityActionGrid({
  domainId,
  responsibilities,
  operations,
  featureFlags = [],
  activeSection,
  runningOperationId,
  flagUpdating,
  title,
  subtitle,
  emptyDetail,
  onRunOperation,
  onToggleFlag,
}: AdminResponsibilityActionGridProps) {
  const pathname = usePathname();

  const actions = useMemo(
    () =>
      buildResponsibilityActionModels({
        domainId,
        responsibilities,
        operations,
        featureFlags,
      }),
    [domainId, featureFlags, operations, responsibilities],
  );

  return (
    <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
      <Box sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} sx={{ mb: 1.4 }} gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Chip label={`${actions.length} live actions`} size="small" color="primary" variant="outlined" />
        </Stack>

        {!actions.length ? (
          <Typography variant="body2" color="text.secondary">
            {emptyDetail}
          </Typography>
        ) : (
          <Grid container spacing={1.25}>
            {actions.map((action) => {
              const focusHref = `${pathname}?section=${encodeURIComponent(action.key)}`;
              const isActive = action.key === activeSection;
              const dryId = action.operation ? `${action.operation.id}:dry` : "";
              const runId = action.operation ? `${action.operation.id}:run` : "";

              return (
                <Grid key={action.key} size={{ xs: 12, md: 6, xl: 4 }}>
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: isActive ? "primary.main" : "divider",
                      bgcolor: isActive ? "rgba(15,76,129,0.05)" : "background.paper",
                      height: "100%",
                    }}
                  >
                    <Stack spacing={1} sx={{ height: "100%" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {action.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {action.summary}
                          </Typography>
                        </Box>
                        {isActive ? <Chip label="Active" size="small" color="primary" /> : null}
                      </Stack>

                      <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap">
                        <Chip icon={<LaunchRoundedIcon />} label="Live Focus" size="small" variant="outlined" />
                        {action.operation ? <Chip icon={<BoltRoundedIcon />} label={action.operation.title} size="small" color="warning" variant="outlined" /> : null}
                        {action.flag ? (
                          <Chip
                            label={action.flag.enabled ? `${action.flag.key} on` : `${action.flag.key} off`}
                            size="small"
                            color={action.flag.enabled ? "success" : "default"}
                            variant="outlined"
                          />
                        ) : null}
                      </Stack>

                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: "auto" }}>
                        <SoftButton
                          component={Link}
                          href={focusHref}
                          variant={isActive ? "contained" : "outlined"}
                          size="small"
                          startIcon={<LaunchRoundedIcon />}
                        >
                          {isActive ? "Focus Open" : "Open Focus"}
                        </SoftButton>

                        {action.operation ? (
                          <SoftButton
                            variant="outlined"
                            size="small"
                            onClick={() => void onRunOperation?.(action.operation as AdminCommandCenterOperation, true)}
                            disabled={!!runningOperationId}
                            startIcon={<SettingsBackupRestoreRoundedIcon />}
                          >
                            {runningOperationId === dryId ? "Dry Run..." : "Dry Run"}
                          </SoftButton>
                        ) : null}

                        {action.operation ? (
                          <SoftButton
                            variant="contained"
                            size="small"
                            onClick={() => void onRunOperation?.(action.operation as AdminCommandCenterOperation, false)}
                            disabled={!!runningOperationId}
                            startIcon={<PlayCircleRoundedIcon />}
                          >
                            {runningOperationId === runId ? "Executing..." : "Execute"}
                          </SoftButton>
                        ) : null}

                        {action.flag ? (
                          <SoftButton
                            variant={action.flag.enabled ? "outlined" : "contained"}
                            size="small"
                            color={action.flag.enabled ? "inherit" : "success"}
                            onClick={() => void onToggleFlag?.(action.flag as AdminCommandCenterFeatureFlag)}
                            disabled={flagUpdating === action.flag.key}
                            startIcon={action.flag.enabled ? <ToggleOffRoundedIcon /> : <ToggleOnRoundedIcon />}
                          >
                            {flagUpdating === action.flag.key ? "Updating..." : action.flag.enabled ? "Disable Flag" : "Enable Flag"}
                          </SoftButton>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </SoftCard>
  );
}
