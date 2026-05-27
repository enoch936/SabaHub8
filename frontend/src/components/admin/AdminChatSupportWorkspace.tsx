"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Stack, useTheme, alpha, TextField, Avatar, Typography, CircularProgress, InputAdornment, IconButton } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { GlassCard } from "./GlassCard";
import type { DirectoryUser, ChatMessage } from "@/lib/api";
import { listDirectoryUsers, createThread, listMessages, listThreads, sendMessage } from "@/lib/api";
import { useSession } from "@/lib/session";

export function AdminChatSupportWorkspace() {
  const theme = useTheme();
  const currentUserId = useSession((s) => s.user?.id) || null;

  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const result = await listDirectoryUsers(100);
        setUsers(result.users || []);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return users;
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.username?.toLowerCase().includes(query)
    );
  }, [searchQuery, users]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [selectedUserId, users]
  );

  const startChat = useCallback(async (userId: string) => {
    setThreadLoading(true);
    try {
      const threads = await listThreads();
      const existing = threads.find(
        (t) => t.threadType === "DIRECT" && t.participantIds?.includes(userId)
      );

      if (existing) {
        setThreadId(existing.id);
      } else {
        const newThread = await createThread({
          participantIds: [userId],
          threadType: "DIRECT",
        });
        setThreadId(newThread.id);
      }

      setSelectedUserId(userId);
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!threadId) return;

    const loadMessages = async () => {
      try {
        const msgs = await listMessages(threadId);
        setMessages(msgs || []);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [threadId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!threadId || !content.trim()) return;

      setSendingMessage(true);
      try {
        await sendMessage(threadId, { content: content.trim() });
        const msgs = await listMessages(threadId);
        setMessages(msgs || []);
      } catch (err) {
        console.error("Failed to send message:", err);
      } finally {
        setSendingMessage(false);
      }
    },
    [threadId]
  );

  return (
    <Box sx={{
      display: "flex",
      height: "calc(100vh - 120px)",
      gap: 2,
      overflow: "hidden",
    }}>
      {/* Left Panel: User Selection */}
      <GlassCard sx={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", p: 0, overflow: "hidden" }}>
        <Box sx={{ p: 3, borderBottom: `1px solid var(--border)` }}>
          <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 2, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 11, opacity: 0.6 }}>
            Select User
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, opacity: 0.5 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")}>
                    <ClearRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: "var(--glass-gray)",
              },
            }}
          />
        </Box>

        <Stack sx={{ flex: 1, overflow: "auto", p: 1 }} spacing={0.5}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
              <CircularProgress size={24} />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center", opacity: 0.5 }}>
              <Typography variant="body2">No users found</Typography>
            </Box>
          ) : (
            filteredUsers.map((user) => (
              <Box
                key={user.id}
                onClick={() => startChat(user.id)}
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: selectedUserId === user.id ? alpha(theme.palette.primary.main, 0.1) : "transparent",
                  border: selectedUserId === user.id ? `1px solid ${theme.palette.primary.main}` : "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={user.avatar}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: "var(--primary)",
                      fontSize: 14,
                      fontWeight: 900,
                    }}
                  >
                    {user.fullName?.charAt(0)}
                  </Avatar>
                  <Stack spacing={0.2} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={900} sx={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.fullName}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.email}
                    </Typography>
                  </Stack>
                  {user.online && (
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
                  )}
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      </GlassCard>

      {/* Right Panel: Chat */}
      <Stack sx={{ flex: 1, gap: 2, overflow: "hidden" }}>
        {selectedUser && threadId ? (
          <GlassCard sx={{ flex: 1, p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Box sx={{ p: 3, borderBottom: `1px solid var(--border)`, display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: "var(--primary)", fontWeight: 900 }}>
                {selectedUser.fullName?.charAt(0)}
              </Avatar>
              <Stack spacing={0.2}>
                <Typography variant="subtitle1" fontWeight={900}>
                  {selectedUser.fullName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  {selectedUser.email}
                </Typography>
              </Stack>
            </Box>

            <ChatConversation
              conversationId={threadId}
              title={selectedUser.fullName || ""}
              subtitle={selectedUser.email || ""}
              currentUserId={currentUserId}
              messages={messages}
              onSend={handleSendMessage}
              isLoading={threadLoading}
              inputDisabled={sendingMessage}
              threadType="DIRECT"
              participantIds={[selectedUser.id]}
            />
          </GlassCard>
        ) : (
          <GlassCard sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 6 }}>
            <Stack spacing={2} alignItems="center" sx={{ textAlign: "center" }}>
              <Typography variant="h6" fontWeight={900} sx={{ opacity: 0.6 }}>
                Select a user to start chatting
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.4, maxWidth: 300 }}>
                Search for a user in the left panel and select them to open a direct message conversation.
              </Typography>
            </Stack>
          </GlassCard>
        )}
      </Stack>
    </Box>
  );
}
