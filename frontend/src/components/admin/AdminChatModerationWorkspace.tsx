"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Chip,
  alpha,
  useTheme,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { DataTable } from "./DataTable";
import { Button } from "../ui";
import SoftTextField from "@/components/mui/SoftTextField";
import { ChatConversation } from "../chat/ChatConversation";
import { useChatStore } from "@/lib/chatStore";
import {
  listThreads,
  listMessages,
  deleteChatMessage,
  adminListUsers,
  type ChatThread,
  type ChatMessage,
  type AppUser,
} from "@/lib/api";

export default function AdminChatModerationWorkspace() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  
  const {
    messages,
    typingUsers,
    currentUserId,
    fetchMessages,
    sendMessage,
    sendAssetMessage,
    activeConversationId,
    setActiveConversation,
    getConversationTitle,
    getDisplayName,
    announceTyping,
  } = useChatStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [threadsResult, usersResult] = await Promise.all([
        listThreads(),
        adminListUsers(),
      ]);
      setThreads(threadsResult);
      setUsers(usersResult);
    } catch (err) {
      console.error("Dataset sync failure", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const getUserDisplay = (userId?: string | null) => {
    if (!userId) return "Orchestration Engine";
    const found = users.find(u => u.id === userId);
    if (!found) return `Unknown Principal (#${userId.slice(-6).toUpperCase()})`;
    return `${found.fullName} (#USR-${userId.slice(-6).toUpperCase()})`;
  };

  const filteredThreads = useMemo(() => {
    const type = activeTab === 0 ? "DIRECT" : activeTab === 1 ? "GROUP" : activeTab === 2 ? "CHANNEL" : null;
    const normalized = query.toLowerCase();
    
    return threads.filter(t => {
      const matchesType = type ? (t.threadType || "DIRECT") === type : t.groupName?.toLowerCase().includes("support");
      const matchesQuery = (t.groupName?.toLowerCase().includes(normalized) || t.id.includes(normalized));
      return matchesType && matchesQuery;
    });
  }, [threads, activeTab, query]);

  const activeThread = useMemo(() => 
    threads.find(t => t.id === activeConversationId),
  [threads, activeConversationId]);

  const activeMessages = activeConversationId ? messages[activeConversationId] ?? [] : [];

  const handleInspect = async (threadId: string) => {
    setActiveConversation(threadId);
    if (!messages[threadId]) await fetchMessages(threadId);
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeConversationId) return;
    try {
      await deleteChatMessage(activeConversationId, msgId, true);
    } catch (err) {
      console.error("Redaction failed", err);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 3, height: "calc(100vh - 280px)", minHeight: 700 }}>
      {/* Sidebar Control Plane */}
      <Stack spacing={3} sx={{ width: 440, shrink: 0 }}>
        <GlassCard sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 3, pb: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight={900}>Chat HQ</Typography>
              <IconButton size="small" onClick={() => void load()}><RefreshRoundedIcon fontSize="small" /></IconButton>
            </Stack>
            
            <Tabs 
              value={activeTab} 
              onChange={(_, v) => setActiveTab(v)}
              variant="fullWidth"
              sx={{ 
                minHeight: 40,
                "& .MuiTab-root": { fontSize: 11, fontWeight: 900, py: 1.5, minHeight: 40 } 
              }}
            >
              <Tab label="DMs" />
              <Tab label="Groups" />
              <Tab label="Channels" />
              <Tab label="Tickets" />
            </Tabs>

            <Box sx={{ mt: 2, mb: 1 }}>
              <SoftTextField
                fullWidth
                size="small"
                placeholder="Locate container..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                InputProps={{ startAdornment: <SearchRoundedIcon sx={{ mr: 1, opacity: 0.5, fontSize: 18 }} /> }}
              />
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 2 }}>
            <Stack spacing={0.5}>
              {filteredThreads.map(t => (
                <Box
                  key={t.id}
                  onClick={() => void handleInspect(t.id)}
                  sx={{
                    p: 2, borderRadius: "14px",
                    cursor: "pointer",
                    bgcolor: activeConversationId === t.id ? "var(--glass-gray-hover)" : "transparent",
                    border: "1px solid",
                    borderColor: activeConversationId === t.id ? "var(--border)" : "transparent",
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: "var(--glass-gray)" }
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ 
                      width: 40, height: 40, borderRadius: "10px", 
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main
                    }}>
                      {t.threadType === 'GROUP' ? <GroupsRoundedIcon sx={{ fontSize: 20 }} /> : 
                       t.threadType === 'CHANNEL' ? <TagRoundedIcon sx={{ fontSize: 20 }} /> : 
                       <ChatBubbleRoundedIcon sx={{ fontSize: 20 }} />}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={800} noWrap>{t.groupName || "System DM Container"}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.5 }}>
                        #{t.id.slice(-8).toUpperCase()} · {t.participantIds?.length} Principals
                      </Typography>
                    </Box>
                    {Number(t.unreadCount) > 0 && (
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "error.main" }} />
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </GlassCard>

        <GlassCard sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={900} gutterBottom>GOVERNANCE TOOLS</Typography>
          <Stack spacing={1}>
            <Button variant="danger" size="sm" fullWidth leftIcon={<ShieldRoundedIcon />}>Ban Participants</Button>
            <Button variant="outline" size="sm" fullWidth leftIcon={<TerminalRoundedIcon />}>Export Trace Logs</Button>
            <Button variant="primary" size="sm" fullWidth leftIcon={<SupportAgentRoundedIcon />}>Join as Support</Button>
          </Stack>
        </GlassCard>
      </Stack>

      {/* Main Orchestration Terminal */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {activeConversationId ? (
          <GlassCard sx={{ height: "100%", p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 2.5, bgcolor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight={900}>{activeThread?.groupName || "DM Container"}</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.6 }}>
                    Direct Oversight Terminal · {getUserDisplay(activeThread?.ownerUserId)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label="ENCRYPTED" size="small" variant="outlined" sx={{ fontWeight: 900, fontSize: 9, borderRadius: "4px" }} />
                  <Chip label="LIVE" size="small" color="success" sx={{ fontWeight: 900, fontSize: 9, borderRadius: "4px" }} />
                </Stack>
              </Stack>
            </Box>
            
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ChatConversation
                conversationId={activeConversationId}
                title={getConversationTitle(activeThread)}
                subtitle="High-Fidelity Oversight"
                currentUserId={currentUserId}
                messages={activeMessages}
                onSend={(content) => void sendMessage(activeConversationId, content)}
                onSendAsset={(assetId) => void sendAssetMessage(activeConversationId, assetId)}
                onTyping={() => void announceTyping(activeConversationId, true)}
                onDeleteMessage={mid => void handleDeleteMessage(mid)}
                getDisplayName={getDisplayName}
                typingUsers={Array.from(typingUsers[activeConversationId] ?? []).map(getDisplayName)}
              />
            </Box>
          </GlassCard>
        ) : (
          <GlassCard sx={{ height: "100%", display: "grid", placeItems: "center", opacity: 0.5 }}>
            <Stack alignItems="center" spacing={2}>
              <TerminalRoundedIcon sx={{ fontSize: 64 }} />
              <Typography variant="h6" fontWeight={800}>Select a communication container to initiate oversight</Typography>
            </Stack>
          </GlassCard>
        )}
      </Box>
    </Box>
  );
}
