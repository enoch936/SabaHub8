/**
 * Real-Time Activity Feed Component
 * Shows live events: registrations, payments, uploads, deployments, etc.
 */

"use client";

import { ReactNode, useEffect, useState } from "react";
import { Box, Stack, Typography, Avatar, AvatarGroup, Chip, useTheme, alpha } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { subscribeLiveActivities } from "@/lib/ws";

export type ActivityEventType =
  | "user_registered"
  | "payment"
  | "upload"
  | "moderation"
  | "login"
  | "deployment"
  | "report"
  | "error"
  | "success";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  description?: string;
  icon?: ReactNode;
  avatar?: string;
  timestamp: Date;
  badge?: string;
  badgeColor?: "success" | "warning" | "error" | "info" | "default";
  category?: string;
  actionUrl?: string;
}

interface ActivityFeedProps {
  events?: ActivityEvent[]; // Optional: passed from parent for initial/history
  loading?: boolean;
  maxItems?: number;
}

const typeConfig: Record<ActivityEventType, { color: string; bgColor: string; emoji: string }> = {
  user_registered: { color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", emoji: "👤" },
  payment: { color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)", emoji: "💰" },
  upload: { color: "#06B6D4", bgColor: "rgba(6, 182, 212, 0.1)", emoji: "📤" },
  moderation: { color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)", emoji: "⚠️" },
  login: { color: "#6366F1", bgColor: "rgba(99, 102, 241, 0.1)", emoji: "🔐" },
  deployment: { color: "#8B5CF6", bgColor: "rgba(139, 92, 246, 0.1)", emoji: "🚀" },
  report: { color: "#14B8A6", bgColor: "rgba(20, 184, 166, 0.1)", emoji: "📋" },
  error: { color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)", emoji: "❌" },
  success: { color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", emoji: "✅" },
};

const badgeColorMap: Record<string, string> = {
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  default: "#94A3B8",
};

const mapBackendTypeToFrontend = (type: string): ActivityEventType => {
  switch (type) {
    case 'USER_REGISTRATION': return 'user_registered';
    case 'PAYMENT': return 'payment';
    case 'UPLOAD': return 'upload';
    case 'MODERATION': return 'moderation';
    case 'LOGIN': return 'login';
    case 'DEPLOYMENT': return 'deployment';
    case 'REPORT': return 'report';
    default: return 'success';
  }
};

function ActivityEventItem({ event, index }: { event: ActivityEvent; index: number }) {
  const theme = useTheme();
  const config = typeConfig[event.type] || typeConfig['success'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
    >
      <Box 
        sx={{ 
          position: 'relative',
          p: 2,
          mb: 1,
          borderRadius: "16px",
          bgcolor: alpha(theme.palette.text.primary, 0.02),
          border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            bgcolor: alpha(theme.palette.text.primary, 0.04),
            transform: "translateX(4px)",
            borderColor: alpha(config.color, 0.2),
          }
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {/* Status Indicator with Pulse if very recent */}
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: alpha(config.color, 0.1),
                border: `1px solid ${alpha(config.color, 0.2)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: config.color,
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              {event.avatar ? (
                <Avatar src={event.avatar} sx={{ width: '100%', height: '100%', borderRadius: "10px" }} />
              ) : (
                event.icon || config.emoji
              )}
            </Box>
            {new Date().getTime() - event.timestamp.getTime() < 60000 && (
              <Box
                component={motion.div}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: config.color,
                }}
              />
            )}
          </Box>

          {/* Event content */}
          <Box flex={1} minWidth={0}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" mb={0.5}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  letterSpacing: "-0.01em"
                }}
              >
                {event.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: alpha(theme.palette.text.secondary, 0.5),
                  textTransform: "uppercase"
                }}
              >
                {formatTimeAgo(event.timestamp)}
              </Typography>
            </Stack>

            {event.description && (
              <Typography
                sx={{
                  fontSize: "13px",
                  color: theme.palette.text.secondary,
                  mb: 1,
                  lineHeight: 1.4,
                  opacity: 0.8
                }}
              >
                {event.description}
              </Typography>
            )}

            <Stack direction="row" spacing={1} alignItems="center">
              {event.badge && (
                <Chip
                  label={event.badge}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "10px",
                    backgroundColor: alpha(badgeColorMap[event.badgeColor || "default"], 0.1),
                    color: badgeColorMap[event.badgeColor || "default"],
                    fontWeight: 800,
                    borderRadius: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em"
                  }}
                />
              )}
              {event.category && (
                <Typography variant="caption" sx={{ opacity: 0.4, fontWeight: 600 }}>
                  # {event.category}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </motion.div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 5) return "just now";

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min ago";

  return Math.floor(seconds) + "s ago";
}

export function ActivityFeed({
  events: initialEvents = [],
  loading = false,
  maxItems = 8,
}: ActivityFeedProps) {
  const theme = useTheme();
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    // Initial events can come from props if available
    if (initialEvents.length > 0) {
      setLiveEvents(initialEvents);
    }

    const sub = subscribeLiveActivities((data: any) => {
      const frontendEvent: ActivityEvent = {
        id: data.id || Math.random().toString(36).substr(2, 9),
        type: mapBackendTypeToFrontend(data.type),
        title: data.metadata?.title || data.type.replace(/_/g, ' '),
        description: data.message,
        timestamp: new Date(data.timestamp || new Date()),
        avatar: data.avatarUrl,
        badge: data.badge,
        badgeColor: data.badge === 'success' ? 'success' : 
                   data.badge === 'warning' ? 'warning' : 
                   data.badge === 'danger' ? 'error' : 
                   data.badge === 'info' ? 'info' : 'default',
        category: data.metadata?.category || undefined
      };

      setLiveEvents(prev => [frontendEvent, ...prev].slice(0, 50));
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [initialEvents]);

  const displayedEvents = liveEvents.slice(0, maxItems);

  return (
    <GlassCard>
      <GlassCardHeader
        title="Activity Stream"
        subtitle={liveEvents.length > 0 ? `${liveEvents.length} events received live` : "Waiting for live events..."}
      />
      <Box
        sx={{
          maxHeight: 500,
          minHeight: 300,
          overflowY: "auto",
          pr: 1,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(theme.palette.text.secondary, 0.2),
            borderRadius: "3px",
            "&:hover": {
              background: alpha(theme.palette.text.secondary, 0.3),
            },
          },
        }}
      >
        {displayedEvents.length > 0 ? (
          <Stack spacing={0}>
            <AnimatePresence initial={false}>
              {displayedEvents.map((event, index) => (
                <ActivityEventItem key={event.id} event={event} index={index} />
              ))}
            </AnimatePresence>
          </Stack>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 300,
              color: theme.palette.text.secondary,
              textAlign: "center",
              gap: 2
            }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Typography sx={{ fontSize: '40px' }}>📡</Typography>
            </motion.div>
            <Typography variant="body2">Waiting for real-time events...</Typography>
          </Box>
        )}
      </Box>
    </GlassCard>
  );
}

export function ActivityFeedSkeleton() {
  const theme = useTheme();

  return (
    <GlassCard>
      <GlassCardHeader title="Activity Stream" subtitle="Loading..." />
      <Stack spacing={2}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              height: 60,
              background: alpha(theme.palette.text.secondary, 0.05),
              borderRadius: 1,
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        ))}
      </Stack>
    </GlassCard>
  );
}
