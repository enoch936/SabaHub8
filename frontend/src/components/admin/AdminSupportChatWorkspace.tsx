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
  Divider,
} from "@mui/material";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Button } from "../ui";
import { GlassCard } from "./GlassCard";
import { DataTable, type TableColumn } from "./DataTable";
import { ChatConversation } from "../chat/ChatConversation";
import { useChatStore } from "@/lib/chatStore";

export default function AdminSupportChatWorkspace() {
  const theme = useTheme();
  const {
    conversations,
    messages,
    typingUsers,
    currentUserId,
    fetchConversations,
    fetchMessages,
    sendMessage,
    sendAssetMessage,
    setActiveConversation,
    activeConversationId,
    getConversationTitle,
    getDisplayName,
    announceTyping,
  } = useChatStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchConversations().finally(() => setLoading(false));
  }, [fetchConversations]);

  const supportThreads = useMemo(() => {
    // In a real system, support threads might be tagged or in a specific channel
    // Here we filter for threads that involve 'admin-support' or are marked as support
    return conversations.filter(c => 
      c.participantIds?.includes('admin-support') || 
      c.groupName?.toLowerCase().includes('support')
    );
  }, [conversations]);

  const activeThread = useMemo(() => 
    conversations.find(c => c.id === activeConversationId),
  [conversations, activeConversationId]);

  const activeMessages = activeConversationId ? messages[activeConversationId] ?? [] : [];

  const columns: TableColumn<any>[] = [
    {
      key: "groupName",
      label: "Support Ticket",
      sortable: true,
      render: (val, row) => (
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" fontWeight={800}>{getConversationTitle(row)}</Typography>
          <Typography variant="caption" color="text.secondary">ID: {row.id}</Typography>
        </Stack>
      )
    },
    {
      key: "lastMessageAt",
      label: "Last Activity",
      sortable: true,
      render: (val) => val ? new Date(val as string).toLocaleString() : "No activity"
    },
    {
      key: "unreadCount",
      label: "Status",
      render: (val) => (
        <Chip 
          label={Number(val) > 0 ? "NEW MESSAGE" : "RESOLVED"} 
          size="small" 
          color={Number(val) > 0 ? "error" : "success"}
          variant="outlined"
          sx={{ fontWeight: 800, borderRadius: '6px' }}
        />
      )
    }
  ];

  const handleTyping = () => {
    if (!activeConversationId) return;
    void announceTyping(activeConversationId, true);
  };

  return (
    <Stack spacing={3} sx={{ height: 'calc(100dvh - 200px)' }}>
      <GlassCard sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={900}>Support & Moderation</Typography>
            <Typography variant="body2" color="text.secondary">Manage system-wide support tickets and moderate user communications.</Typography>
          </Box>
          <Button variant="primary" leftIcon={<RefreshRoundedIcon />} onClick={() => fetchConversations()}>
            Sync Queues
          </Button>
        </Stack>
      </GlassCard>

      <Box sx={{ flex: 1, display: 'flex', gap: 3, minHeight: 0 }}>
        <Box sx={{ width: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <DataTable
            title="Active Tickets"
            columns={columns}
            data={supportThreads}
            rowKey="id"
            loading={loading}
            onRowClick={(row) => setActiveConversation(row.id)}
            pageSize={5}
          />
          
          <GlassCard sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>Moderation Tools</Typography>
            <Stack spacing={1}>
              <Button size="sm" variant="outline" fullWidth sx={{ justifyContent: 'flex-start' }}>Flag Conversation</Button>
              <Button size="sm" variant="outline" fullWidth sx={{ justifyContent: 'flex-start' }}>Export Transcript</Button>
              <Button size="sm" variant="danger" fullWidth sx={{ justifyContent: 'flex-start' }}>Suspend Users</Button>
            </Stack>
          </GlassCard>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {activeConversationId ? (
            <GlassCard sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 0 }}>
              <ChatConversation
                conversationId={activeConversationId}
                title={getConversationTitle(activeThread)}
                subtitle="Support Thread"
                currentUserId={currentUserId}
                messages={activeMessages}
                onSend={(content) => sendMessage(activeConversationId, content)}
                onSendAsset={(assetId) => sendAssetMessage(activeConversationId, assetId)}
                onTyping={handleTyping}
                getDisplayName={getDisplayName}
                typingUsers={Array.from(typingUsers[activeConversationId] ?? []).map(getDisplayName)}
              />
            </GlassCard>
          ) : (
            <GlassCard sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stack spacing={2} alignItems="center" sx={{ opacity: 0.5 }}>
                <SupportAgentRoundedIcon sx={{ fontSize: 64 }} />
                <Typography variant="h6" fontWeight={700}>Select a ticket to start moderating</Typography>
              </Stack>
            </GlassCard>
          )}
        </Box>
      </Box>
    </Stack>
  );
}
