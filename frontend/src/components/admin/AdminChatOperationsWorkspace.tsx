"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import MarkChatUnreadRoundedIcon from "@mui/icons-material/MarkChatUnreadRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import { ConversationList } from "@/components/chat/ConversationList";
import { useChatStore } from "@/lib/chatStore";
import { MetricCard } from "./MetricCard";

function formatDateTime(value?: string) {
  if (!value) return "Not recorded";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

import { GlassCard, GlassCardHeader } from "./GlassCard";
import { DataTable } from "./DataTable";

export default function AdminChatOperationsWorkspace() {
  const theme = useTheme();
  const {
    conversations,
    messages,
    activeConversationId,
    isLoading,
    fetchConversations,
    fetchMessages,
    setActiveConversation,
    getConversationTitle,
    getConversationSubtitle,
  } = useChatStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        await fetchConversations();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chat operations.");
      }
    };
    void run();
  }, [fetchConversations]);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      const firstId = conversations[0]?.id ?? null;
      if (firstId) {
        setActiveConversation(firstId);
        void fetchMessages(firstId);
      }
    }
  }, [activeConversationId, conversations, fetchMessages, setActiveConversation]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );
  const activeMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];

  const metrics = useMemo(() => {
    const unread = conversations.reduce((sum, item) => sum + Math.max(0, Number(item.unreadCount ?? 0)), 0);
    const groupCount = conversations.filter((item) => item.threadType === "GROUP" || item.threadType === "CHANNEL").length;
    return {
      total: conversations.length,
      unread,
      groupCount,
    };
  }, [conversations]);

  return (
    <Stack spacing={3}>
      <GlassCard 
        premium 
        sx={{ 
          background: "linear-gradient(135deg, #1b2230 0%, #27384f 55%, #4c516a 100%)",
          color: "#fff"
        }}
      >
        <Box p={3}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.2em", fontWeight: 800, opacity: 0.7 }}>
                OPERATIONAL OVERWATCH
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", mb: 1 }}>
                Chat Intelligence & Support
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 800, fontWeight: 500 }}>
                High-fidelity oversight of platform communications. Monitor direct messaging, group escalations, 
                and automated support threads with real-time sentiment tracking.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => void fetchConversations()}
              disabled={isLoading}
              startIcon={<RefreshRoundedIcon />}
              sx={{ 
                bgcolor: "rgba(255,255,255,0.15)", 
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }
              }}
            >
              Sync Threads
            </Button>
          </Stack>
        </Box>
      </GlassCard>

      {error ? <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert> : null}

      <Grid container spacing={2.5}>
        {[
          { label: "Active Threads", value: metrics.total, icon: <ChatRoundedIcon />, color: "primary" },
          { label: "Unread Pressure", value: metrics.unread, icon: <MarkChatUnreadRoundedIcon />, color: "error" },
          { label: "Enterprise Groups", value: metrics.groupCount, icon: <GroupsRoundedIcon />, color: "accent" },
        ].map((metric) => (
          <Grid 
          key={metric.label} size={{ xs: 12, md: 4 }}>
            <MetricCard
              icon={metric.icon}
              label={metric.label}
              value={metric.value}
              color={metric.color as any}
              size="small"
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <GlassCard sx={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
            <GlassCardHeader 
              title="Conversation Queue" 
              subtitle="Real-time message routing" 
            />
            <Box sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
              <ConversationList
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={(id) => {
                  setActiveConversation(id);
                  void fetchMessages(id);
                }}
                resolveTitle={getConversationTitle}
                resolveSubtitle={getConversationSubtitle}
              />
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <GlassCard sx={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
            {activeConversation ? (
              <>
                <GlassCardHeader 
                  title={getConversationTitle(activeConversation)}
                  subtitle={`${getConversationSubtitle(activeConversation)} • Last activity ${formatDateTime(activeConversation.lastMessageAt)}`}
                  action={
                    <Chip 
                      label={activeConversation.threadType} 
                      size="small" 
                      sx={{ fontWeight: 800, borderRadius: '6px', bgcolor: alpha(theme.palette.primary.main, 0.1) }} 
                    />
                  }
                />
                
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: alpha(theme.palette.text.primary, 0.01), borderRadius: '16px', m: 1 }}>
                  <Stack spacing={2}>
                    {activeMessages.length === 0 ? (
                      <Box sx={{ py: 10, textAlign: 'center', opacity: 0.5 }}>
                        <Typography variant="body2">No message history available for this thread.</Typography>
                      </Box>
                    ) : (
                      activeMessages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: "16px",
                              bgcolor: alpha(theme.palette.text.primary, 0.03),
                              border: `1px solid var(--border)`,
                              maxWidth: '85%',
                              ml: message.senderId === 'system' ? 'auto' : 0,
                              mr: message.senderId === 'system' ? 0 : 'auto',
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography sx={{ fontSize: '12px', fontWeight: 800, color: 'primary.main' }}>
                                {message.senderId}
                              </Typography>
                              <Typography sx={{ fontSize: '10px', opacity: 0.5, fontWeight: 600 }}>
                                {formatDateTime(message.createdAt)}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ lineHeight: 1.5, fontWeight: 500 }}>
                              {message.type === "ASSET" ? "[Encrypted Media Attachment]" : (message.text ?? "")}
                            </Typography>
                          </Box>
                        </motion.div>
                      ))
                    )}
                  </Stack>
                </Box>
              </>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <Stack alignItems="center" spacing={2}>
                  <ChatRoundedIcon sx={{ fontSize: 48 }} />
                  <Typography variant="body1" fontWeight={600}>Select a conversation to begin oversight</Typography>
                </Stack>
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
