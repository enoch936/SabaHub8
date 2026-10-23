"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  CardContent,
  Grid,
  Stack,
  Typography,
  useTheme,
  alpha,
  Alert,
  Divider,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import { GlassCard, GlassCardHeader } from "./GlassCard";
import { DataTable, type TableColumn } from "./DataTable";
import SoftButton from "@/components/mui/SoftButton";
import SoftTextField from "@/components/mui/SoftTextField";
import { MetricCard } from "./MetricCard";
import { adminBroadcast, adminListAnnouncements, type AdminAnnouncement } from "@/lib/api";

export default function AdminNotificationWorkspace() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<AdminAnnouncement[]>([]);
  const [broadcastStatus, setBroadcastStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setFetchError(null);
      const data = await adminListAnnouncements();
      setHistory(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load announcement history");
    }
  }, []);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  const handleBroadcast = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    setBroadcastStatus(null);
    try {
      await adminBroadcast(message);
      setBroadcastStatus({ type: 'success', message: 'Broadcast sent successfully to all active sessions.' });
      setMessage("");
      void loadHistory();
    } catch (err) {
      setBroadcastStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to send broadcast.' });
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<AdminAnnouncement>[] = [
    {
      key: "message",
      label: "Message Content",
      render: (val) => (
        <Typography variant="body2" sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {String(val)}
        </Typography>
      )
    },
    {
      key: "sentBy",
      label: "Sender",
      sortable: true,
    },
    {
      key: "recipients",
      label: "Target",
    },
    {
      key: "sentAt",
      label: "Sent At",
      sortable: true,
      render: (val) => new Date(String(val)).toLocaleString()
    },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const isSuccess = val === "DELIVERED";
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            {isSuccess ? <CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} /> : <ErrorOutlineRoundedIcon sx={{ fontSize: 16, color: 'error.main' }} />}
            <Typography variant="caption" fontWeight={700} color={isSuccess ? 'success.main' : 'error.main'}>{String(val)}</Typography>
          </Stack>
        );
      }
    }
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontSize: '12px', fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.15em', mb: 1 }}>
          Communications Center
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.04em' }}>
          Notification Center
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <GlassCard sx={{ height: '100%' }}>
            <GlassCardHeader 
              title="Broadcast Announcement" 
              subtitle="Send a real-time message to all active platform users" 
            />
            <Box p={3}>
              <Stack spacing={3}>
                <SoftTextField
                  label="Message Content"
                  multiline
                  rows={6}
                  placeholder="Type your system announcement here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  fullWidth
                />
                
                {broadcastStatus && (
                  <Alert severity={broadcastStatus.type} sx={{ borderRadius: 2 }}>
                    {broadcastStatus.message}
                  </Alert>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
                    Note: This will trigger a real-time toast notification for all users currently logged into the platform.
                  </Typography>
                  <SoftButton
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<SendRoundedIcon />}
                    onClick={handleBroadcast}
                    disabled={loading || !message.trim()}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? "Sending..." : "Send Global Broadcast"}
                  </SoftButton>
                </Box>
              </Stack>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <MetricCard
                  icon={<CampaignRoundedIcon />}
                  label="Broadcasts Sent"
                  value={history.length.toString()}
                  color="secondary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <MetricCard
                  icon={<HistoryRoundedIcon />}
                  label="Engagement"
                  value="92%"
                  color="success"
                />
              </Grid>
            </Grid>

            <GlassCard>
              <GlassCardHeader 
                title="Broadcast History" 
                subtitle="Recent system-wide communications and their delivery status" 
              />
              <Box p={2}>
                <DataTable
                  columns={columns}
                  data={history}
                  rowKey="id"
                  loading={loading}
                  pageSize={5}
                />
              </Box>
            </GlassCard>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
