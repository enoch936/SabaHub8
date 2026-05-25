"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  useTheme,
  alpha,
  Alert,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";

import { GlassCard, GlassCardHeader } from "./GlassCard";
import { DataTable, type TableColumn } from "./DataTable";
import SoftButton from "@/components/mui/SoftButton";
import SoftTextField from "@/components/mui/SoftTextField";
import { MetricCard } from "./MetricCard";

// Mock data and types for Workspace Management
type Workspace = {
  id: string;
  name: string;
  ownerName: string;
  memberCount: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  tier: "FREE" | "PRO" | "ENTERPRISE";
  createdAt: string;
  lastActivity: string;
};

const MOCK_WORKSPACES: Workspace[] = [
  { id: "ws-1", name: "SabaHub Design", ownerName: "Enoch", memberCount: 12, status: "ACTIVE", tier: "ENTERPRISE", createdAt: "2024-01-15T10:00:00Z", lastActivity: "2024-05-22T15:30:00Z" },
  { id: "ws-2", name: "TechFlow Solutions", ownerName: "Alice", memberCount: 5, status: "ACTIVE", tier: "PRO", createdAt: "2024-02-10T09:00:00Z", lastActivity: "2024-05-23T08:45:00Z" },
  { id: "ws-3", name: "Creative Minds", ownerName: "Bob", memberCount: 8, status: "ACTIVE", tier: "PRO", createdAt: "2024-03-05T14:20:00Z", lastActivity: "2024-05-21T11:15:00Z" },
  { id: "ws-4", name: "Starter Group", ownerName: "Charlie", memberCount: 2, status: "INACTIVE", tier: "FREE", createdAt: "2024-04-20T11:00:00Z", lastActivity: "2024-04-25T16:00:00Z" },
  { id: "ws-5", name: "Global Enterprise", ownerName: "David", memberCount: 45, status: "ACTIVE", tier: "ENTERPRISE", createdAt: "2023-12-01T08:00:00Z", lastActivity: "2024-05-23T10:00:00Z" },
];

export default function AdminWorkspaceManagementWorkspace() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(MOCK_WORKSPACES);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(ws => 
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workspaces, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: workspaces.length,
      active: workspaces.filter(w => w.status === "ACTIVE").length,
      enterprise: workspaces.filter(w => w.tier === "ENTERPRISE").length,
      totalMembers: workspaces.reduce((acc, w) => acc + w.memberCount, 0),
    };
  }, [workspaces]);

  const columns: TableColumn<Workspace>[] = [
    {
      key: "name",
      label: "Workspace Name",
      sortable: true,
      render: (val, row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ 
            width: 32, height: 32, borderRadius: 1, 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            color: theme.palette.primary.main,
            display: "grid", placeItems: "center" 
          }}>
            <HubRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>{String(val)}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {row.id}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      key: "ownerName",
      label: "Owner",
      sortable: true,
    },
    {
      key: "tier",
      label: "Tier",
      sortable: true,
      render: (val) => {
        const tier = String(val);
        let color: any = "default";
        if (tier === "ENTERPRISE") color = "primary";
        if (tier === "PRO") color = "info";
        return <Chip label={tier} size="small" color={color} variant="outlined" sx={{ fontWeight: 800, borderRadius: '6px' }} />;
      }
    },
    {
      key: "memberCount",
      label: "Members",
      sortable: true,
      align: "right",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (val) => {
        const status = String(val);
        let color: any = "success";
        if (status === "INACTIVE") color = "warning";
        if (status === "SUSPENDED") color = "error";
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: `${color}.main` }} />
            <Typography variant="caption" fontWeight={700}>{status}</Typography>
          </Stack>
        );
      }
    },
    {
      key: "lastActivity",
      label: "Last Activity",
      sortable: true,
      render: (val) => new Date(String(val)).toLocaleDateString()
    }
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontSize: '12px', fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.15em', mb: 1 }}>
          Operations HQ
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.04em' }}>
            Workspace Management
          </Typography>
          <SoftButton
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh Data
          </SoftButton>
        </Stack>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            icon={<BusinessCenterRoundedIcon />}
            label="Total Workspaces"
            value={stats.total.toString()}
            helper="Cumulative growth +12%"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            icon={<TrendingUpRoundedIcon />}
            label="Active Teams"
            value={stats.active.toString()}
            helper="84% Engagement rate"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            icon={<GroupsRoundedIcon />}
            label="Total Contributors"
            value={stats.totalMembers.toString()}
            helper="Avg 8.4 per workspace"
            color="secondary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            icon={<HubRoundedIcon />}
            label="Enterprise Nodes"
            value={stats.enterprise.toString()}
            helper="High-value accounts"
            color="warning"
          />
        </Grid>
      </Grid>

      <GlassCard>
        <GlassCardHeader 
          title="Organization Directory" 
          subtitle="Audit and manage user-level workspaces and permissions" 
        />
        <Box p={2}>
          <Stack direction="row" spacing={2} mb={3}>
            <SoftTextField
              placeholder="Search workspaces or owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchRoundedIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              sx={{ flex: 1 }}
            />
            <SoftButton variant="outlined" startIcon={<FilterListRoundedIcon />}>
              Filters
            </SoftButton>
          </Stack>

          <DataTable
            columns={columns}
            data={filteredWorkspaces}
            rowKey="id"
            loading={loading}
            pageSize={10}
            selectable
          />
        </Box>
      </GlassCard>

      <Alert severity="info" variant="outlined" sx={{ borderRadius: 3, borderColor: alpha(theme.palette.info.main, 0.2) }}>
        Workspace Management focuses on the <strong>logical organization</strong> of users and teams, while Tenant Management handles the underlying <strong>infrastructure isolation</strong>.
      </Alert>
    </Stack>
  );
}
