"use client";

import { useState } from "react";
import {
  Box,
  CardContent,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import SoftCard from "@/components/mui/SoftCard";
import AdminJobModerationWorkspace from "@/components/admin/AdminJobModerationWorkspace";
import AdminContentGovernanceWorkspace from "@/components/admin/AdminContentGovernanceWorkspace";
import AdminSupportOperationsWorkspace from "@/components/admin/AdminSupportOperationsWorkspace";

type ModerationView = "jobs" | "content" | "disputes";

export default function AdminContentModerationWorkspace() {
  const [view, setView] = useState<ModerationView>("jobs");

  return (
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(24,40,59,0.16)",
          background: "linear-gradient(135deg, #20273a 0%, #2f4356 52%, #4a5d4d 100%)",
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.82 }}>
                TRUST & SAFETY OPERATIONS
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                Full Content Moderation Workspace
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.92, maxWidth: 860 }}>
                Unified moderation cockpit for suspicious jobs, policy and guideline content, and dispute investigation actions.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip icon={<GavelRoundedIcon />} label="Enforcement" size="small" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }} />
              <Chip icon={<ArticleRoundedIcon />} label="Governance Content" size="small" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }} />
              <Chip icon={<FactCheckRoundedIcon />} label="Case Investigation" size="small" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }} />
            </Stack>
          </Stack>
        </CardContent>
      </SoftCard>

      <SoftCard sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Tabs
            value={view}
            onChange={(_, next) => setView(next as ModerationView)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab value="jobs" icon={<ReportProblemRoundedIcon fontSize="small" />} iconPosition="start" label="Job Moderation" />
            <Tab value="content" icon={<ArticleRoundedIcon fontSize="small" />} iconPosition="start" label="Policy Content" />
            <Tab value="disputes" icon={<GavelRoundedIcon fontSize="small" />} iconPosition="start" label="Dispute Operations" />
          </Tabs>
        </CardContent>
      </SoftCard>

      {view === "jobs" ? <AdminJobModerationWorkspace /> : null}
      {view === "content" ? <AdminContentGovernanceWorkspace /> : null}
      {view === "disputes" ? <AdminSupportOperationsWorkspace /> : null}
    </Stack>
  );
}
