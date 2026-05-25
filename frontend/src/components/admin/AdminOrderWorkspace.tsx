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
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import ReceiptRoundedIcon from "@mui/icons-material/ReceiptRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import { Button } from "../ui";
import { GlassCard } from "./GlassCard";
import { DataTable, type TableColumn } from "./DataTable";

interface Order {
  id: string;
  type: "GIG" | "PROJECT";
  title: string;
  employerId: string;
  freelancerId: string;
  amount: number;
  currency: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

export default function AdminOrderWorkspace() {
  const theme = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mocking Orders/Gigs as we don't have a direct "adminListOrders" API yet
      // This maps to Gigs and Projects in progress
      const mockOrders: Order[] = Array.from({ length: 30 }, (_, i) => ({
        id: `ord-${5000 + i}`,
        type: i % 2 === 0 ? "GIG" : "PROJECT",
        title: i % 2 === 0 ? `Modern UI/UX Design - Milestone ${i}` : `Backend API Integration - Phase ${i}`,
        employerId: `emp-${100 + (i % 5)}`,
        freelancerId: `free-${200 + (i % 5)}`,
        amount: 250 + Math.random() * 5000,
        currency: "USD",
        status: i % 4 === 0 ? "OPEN" : i % 4 === 1 ? "IN_PROGRESS" : i % 4 === 2 ? "COMPLETED" : "CANCELLED",
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      }));
      setOrders(mockOrders);
    } catch (err) {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    return {
      total: orders.length,
      revenue: orders.filter(o => o.status === "COMPLETED").reduce((acc, o) => acc + o.amount, 0),
      active: orders.filter(o => o.status === "IN_PROGRESS").length,
      pending: orders.filter(o => o.status === "OPEN").length,
    };
  }, [orders]);

  const columns: TableColumn<Order>[] = [
    {
      key: "id",
      label: "Order ID",
      sortable: true,
      filterable: true,
    },
    {
      key: "title",
      label: "Project/Gig",
      sortable: true,
      filterable: true,
      render: (val, row) => (
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" fontWeight={800}>{String(val)}</Typography>
          <Chip label={row.type} size="small" sx={{ width: 'fit-content', fontSize: '10px', height: 18 }} />
        </Stack>
      )
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (val, row) => (
        <Typography variant="body2" fontWeight={700}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currency }).format(val as number)}
        </Typography>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      render: (val) => {
        const status = String(val).toUpperCase();
        let color: any = "default";
        if (status === "COMPLETED") color = "success";
        if (status === "IN_PROGRESS") color = "info";
        if (status === "OPEN") color = "warning";
        if (status === "CANCELLED") color = "error";
        
        return <Chip label={status} size="small" color={color} variant="outlined" sx={{ fontWeight: 800, borderRadius: '6px' }} />;
      }
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (val) => new Date(val as string).toLocaleDateString()
    }
  ];

  return (
    <Stack spacing={2.5}>
      <GlassCard
        sx={{
          p: 3,
          background: `linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)`,
          color: "common.white",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={900}>Orders & Gigs</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Track all commercial activity and service delivery.</Typography>
          </Box>
          <Button variant="outline" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={load} leftIcon={<RefreshRoundedIcon />}>
            Refresh
          </Button>
        </Stack>
      </GlassCard>

      <Stack direction="row" spacing={2}>
        <MetricCard label="Total Orders" value={metrics.total} icon={<ShoppingBagRoundedIcon />} />
        <MetricCard label="Gross Volume" value={`$${Math.round(metrics.revenue).toLocaleString()}`} icon={<ReceiptRoundedIcon />} color="success.main" />
        <MetricCard label="In Progress" value={metrics.active} icon={<LocalShippingRoundedIcon />} color="info.main" />
        <MetricCard label="Awaiting Start" value={metrics.pending} icon={<ShoppingBagRoundedIcon />} color="warning.main" />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <DataTable
        title="Commercial Activity"
        columns={columns}
        data={orders}
        rowKey="id"
        loading={loading}
        selectable
        searchable
        exportable
      />
    </Stack>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: string | number, icon: any, color?: string }) {
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
