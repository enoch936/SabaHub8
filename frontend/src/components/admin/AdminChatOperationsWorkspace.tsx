"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import MarkChatUnreadRoundedIcon from "@mui/icons-material/MarkChatUnreadRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SoftButton from "@/components/mui/SoftButton";
import SoftCard from "@/components/mui/SoftCard";
import { ConversationList } from "@/components/chat/ConversationList";
import { useChatStore } from "@/lib/chatStore";

function formatDateTime(value?: string) {
  if (!value) return "Not recorded";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

export default function AdminChatOperationsWorkspace() {
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
    <Stack spacing={2.2}>
      <SoftCard
        sx={{
          border: "1px solid",
          borderColor: "rgba(24,40,59,0.16)",
          background: "linear-gradient(135deg, #1b2230 0%, #27384f 55%, #4c516a 100%)",
          color: "common.white",
        }}
      >
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.82 }}>
                CHAT OPERATIONS
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.02 }}>
                Admin conversation oversight
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.9, maxWidth: 820 }}>
                Review active conversations, unread pressure, recent messages, and escalation context across direct, group,
                and channel threads.
              </Typography>
            </Box>
            <SoftButton
              variant="outlined"
              onClick={() => void fetchConversations()}
              disabled={isLoading}
              startIcon={<RefreshRoundedIcon />}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
            >
              Refresh
            </SoftButton>
          </Stack>
        </CardContent>
      </SoftCard>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        {[
          { label: "Threads", value: metrics.total, icon: <ChatRoundedIcon fontSize="small" /> },
          { label: "Unread", value: metrics.unread, icon: <MarkChatUnreadRoundedIcon fontSize="small" /> },
          { label: "Group/Channel", value: metrics.groupCount, icon: <GroupsRoundedIcon fontSize="small" /> },
        ].map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, xl: 4 }}>
            <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
              <CardContent>
                <Stack spacing={0.8}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                    {metric.icon}
                  </Stack>
                  <Typography variant="h4" fontWeight={900}>
                    {metric.value}
                  </Typography>
                </Stack>
              </CardContent>
            </SoftCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="h6" fontWeight={800}>
                  Thread Queue
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a conversation to inspect recent activity.
                </Typography>
              </Box>
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
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <SoftCard sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent>
              {activeConversation ? (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      {getConversationTitle(activeConversation)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getConversationSubtitle(activeConversation)} • Last message {formatDateTime(activeConversation.lastMessageAt)}
                    </Typography>
                  </Box>

                  <Stack spacing={1}>
                    {activeMessages.length === 0 ? (
                      <Alert severity="info">No messages loaded for this thread yet.</Alert>
                    ) : (
                      activeMessages.map((message) => (
                        <Box
                          key={message.id}
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            px: 2,
                            py: 1.5,
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800}>
                                {message.senderId}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {message.type === "ASSET" ? "[Attachment]" : (message.text ?? "")}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(message.createdAt)}
                            </Typography>
                          </Stack>
                        </Box>
                      ))
                    )}
                  </Stack>
                </Stack>
              ) : (
                <Alert severity="info">No conversation selected.</Alert>
              )}
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
