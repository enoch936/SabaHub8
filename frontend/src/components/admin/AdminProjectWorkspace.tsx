"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CardContent,
  Chip,
  Stack,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { Button } from "../ui";
import { GlassCard } from "./GlassCard";
import { DataTable, type TableColumn, type BulkAction } from "./DataTable";
import { adminListJobs as adminListProjects, type Project } from "@/lib/api";

export default function AdminProjectWorkspace() {
  const theme = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming adminListProjects is available in api.ts
      const result = await adminListProjects();
      setProjects(result);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Failed to load projects.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === "ACTIVE").length,
      pending: projects.filter(p => p.status === "PENDING").length,
      completed: projects.filter(p => p.status === "COMPLETED").length,
    };
  }, [projects]);

  const columns: TableColumn<Project>[] = [
    {
      key: "title",
      label: "Project",
      sortable: true,
      filterable: true,
      render: (val, row) => (
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" fontWeight={800}>{String(val)}</Typography>
          <Typography variant="caption" color="text.secondary">ID: {row.id}</Typography>
        </Stack>
      )
    },
    {
      key: "employerId",
      label: "Employer",
      sortable: true,
      filterable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      render: (val) => {
        const status = String(val).toUpperCase();
        let color: any = "default";
        if (status === "ACTIVE") color = "success";
        if (status === "PENDING") color = "warning";
        if (status === "COMPLETED") color = "info";
        if (status === "CANCELLED") color = "error";
        
        return <Chip label={status} size="small" color={color} variant="outlined" sx={{ fontWeight: 800, borderRadius: '6px' }} />;
      }
    },
    {
      key: "budget",
      label: "Budget",
      sortable: true,
      render: (val, row) => `${row.currency || "USD"} ${val || 0}`
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (val) => new Date(val as string).toLocaleDateString()
    }
  ];

  const bulkActions: BulkAction<Project>[] = [
    { label: "Approve Selected", value: "approve", color: "success", icon: <CheckCircleRoundedIcon sx={{ fontSize: 16 }} /> },
    { label: "Cancel Selected", value: "cancel", color: "danger", icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} /> }
  ];

  const handleBulkAction = (action: string, selected: Project[]) => {
    console.log(`Executing ${action} on`, selected);
    // Implementation for bulk actions
  };

  return (
    <Stack spacing={2.5}>
      <GlassCard
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.7)} 100%)`,
          color: "common.white",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={900}>Project Registry</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Manage all marketplace projects and their lifecycle.</Typography>
          </Box>
          <Button variant="outline" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={load} leftIcon={<RefreshRoundedIcon />}>
            Refresh
          </Button>
        </Stack>
      </GlassCard>

      <Stack direction="row" spacing={2}>
        <MetricCard label="Total Projects" value={metrics.total} icon={<AssignmentRoundedIcon />} />
        <MetricCard label="Active" value={metrics.active} icon={<CheckCircleRoundedIcon />} color="success.main" />
        <MetricCard label="Pending" value={metrics.pending} icon={<PendingActionsRoundedIcon />} color="warning.main" />
        <MetricCard label="Completed" value={metrics.completed} icon={<AssignmentRoundedIcon />} color="info.main" />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <DataTable
        title="Project Management"
        columns={columns}
        data={projects}
        rowKey="id"
        loading={loading}
        selectable
        bulkActions={bulkActions}
        onBulkAction={handleBulkAction}
        expandableContent={(row) => (
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>Project Description</Typography>
            <Typography variant="body2" color="text.secondary">{row.description || "No description provided."}</Typography>
          </Box>
        )}
      />
    </Stack>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: number, icon: any, color?: string }) {
  return (
    <GlassCard sx={{ flex: 1, p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(color || 'primary.main', 0.1), color: color || 'primary.main' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
          <Typography variant="h5" fontWeight={900}>{value}</Typography>
        </Box>
      </Stack>
    </GlassCard>
  );
}
