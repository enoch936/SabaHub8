/**
 * Admin Enterprise Chat Support Workspace
 * High-performance moderation and support communication suite.
 */

"use client";

import { Box, Stack, useTheme, alpha } from "@mui/material";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { ConversationDetailsRail } from "@/components/chat/ConversationDetailsRail";
import { GlassCard } from "./GlassCard";

export function AdminChatSupportWorkspace() {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: "flex", 
      height: "calc(100vh - 120px)",
      bgcolor: "var(--surface)",
      borderRadius: "20px",
      border: `1px solid var(--border)`,
      overflow: "hidden",
    }}>
      {/* Left Panel: Conversations */}
      <Box sx={{ width: 320, borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <ConversationList />
      </Box>

      {/* Center Panel: Stream */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", bgcolor: alpha(theme.palette.background.default, 0.2) }}>
        <ChatConversation />
      </Box>

      {/* Right Panel: Details/Moderation */}
      <Box sx={{ width: 300, borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <ConversationDetailsRail />
      </Box>
    </Box>
  );
}
