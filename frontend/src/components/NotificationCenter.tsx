/**
 * Modern Notification Center
 * Categorized alerts with filtering and management
 */

"use client";

import { ReactNode, useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Chip,
  useTheme,
  alpha,
  Divider,
  Button,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./admin/GlassCard";
import { type AppNotification } from "@/lib/api";

export type NotificationCategory = "payment" | "security" | "system" | "user" | "deployment" | "ai";
export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface MappedNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon?: ReactNode;
}

interface NotificationCenterProps {
  notifications: AppNotification[];
  onDismiss?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
  onMarkAllRead?: () => void;
  maxVisible?: number;
}

const categoryConfig: Record<NotificationCategory, { color: string; bg: string; emoji: string; label: string }> = {
  payment: { color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", emoji: "💳", label: "Payments" },
  security: { color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", emoji: "🔒", label: "Security" },
  system: { color: "#6366F1", bg: "rgba(99, 102, 241, 0.1)", emoji: "⚙️", label: "System" },
  user: { color: "#06B6D4", bg: "rgba(6, 182, 212, 0.1)", emoji: "👤", label: "Users" },
  deployment: { color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.1)", emoji: "🚀", label: "Deployment" },
  ai: { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", emoji: "🤖", label: "AI" },
};

const priorityConfig: Record<NotificationPriority, { color: string; label: string }> = {
  low: { color: "#94A3B8", label: "Low" },
  medium: { color: "#F59E0B", label: "Medium" },
  high: { color: "#F97316", label: "High" },
  critical: { color: "#EF4444", label: "Critical" },
};

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: MappedNotification;
  onMarkAsRead?: (id: string) => void;
}) {
  const theme = useTheme();
  const category = categoryConfig[notification.category] || categoryConfig.system;
  const priority = priorityConfig[notification.priority] || priorityConfig.medium;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ x: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <Box
        onClick={() => onMarkAsRead?.(notification.id)}
        sx={{
          p: 2,
          borderRadius: "16px",
          backgroundColor: notification.read
            ? alpha(theme.palette.background.paper, 0.4)
            : alpha(theme.palette.primary.main, 0.08),
          border: `1px solid ${notification.read ? "var(--border)" : alpha(category.color, 0.3)}`,
          transition: "all 200ms ease",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          "&:hover": {
            backgroundColor: notification.read 
              ? alpha(theme.palette.background.paper, 0.6) 
              : alpha(theme.palette.primary.main, 0.12),
            borderColor: alpha(category.color, 0.5),
            boxShadow: `0 8px 24px ${alpha(category.color, 0.1)}`,
          },
          "&::before": !notification.read ? {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "4px",
            backgroundColor: category.color,
          } : {},
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              fontSize: "22px",
              mt: 0.25,
              flexShrink: 0,
              filter: notification.read ? "grayscale(1) opacity(0.5)" : "none",
            }}
          >
            {notification.icon || category.emoji}
          </Box>

          <Box flex={1} minWidth={0}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: notification.read ? "text.secondary" : "text.primary",
                  lineHeight: 1.2,
                }}
              >
                {notification.title}
              </Typography>
              {notification.priority === "critical" && (
                <Chip
                  size="small"
                  label="CRITICAL"
                  sx={{
                    height: 16,
                    fontSize: "8px",
                    backgroundColor: alpha(priority.color, 0.2),
                    color: priority.color,
                    fontWeight: 900,
                    borderRadius: "4px",
                  }}
                />
              )}
            </Stack>

            <Typography
              sx={{
                fontSize: "12px",
                color: theme.palette.text.secondary,
                opacity: notification.read ? 0.6 : 0.9,
                mb: 1,
                lineHeight: 1.4,
              }}
            >
              {notification.message}
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography
                sx={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: alpha(theme.palette.text.secondary, 0.5),
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {formatTimeAgo(notification.timestamp)}
              </Typography>

              {!notification.read && (
                <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: category.color }} />
              )}

              {notification.category && (
                <Typography
                  sx={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: category.color,
                    textTransform: "uppercase",
                  }}
                >
                  {notification.category}
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
  if (seconds < 60) return "Just now";

  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";

  return Math.floor(seconds) + "s ago";
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onClearAll,
  onMarkAllRead,
  maxVisible = 10,
}: NotificationCenterProps) {
  const theme = useTheme();
  const [now] = useState(() => Date.now());
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | null>(null);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const mappedNotifications = useMemo(() => {
    return notifications.map(n => ({
      id: n.id,
      title: (n.payload?.title as string) || n.type.replace(/_/g, " "),
      message: (n.payload?.message as string) || "",
      category: (n.payload?.category as NotificationCategory) || "system",
      priority: (n.payload?.priority as NotificationPriority) || "medium",
      timestamp: new Date(n.createdAt || now),
      read: n.read,
      actionUrl: n.payload?.route as string,
    } as MappedNotification));
  }, [notifications, now]);

  const filteredNotifications = useMemo(() => {
    let result = mappedNotifications;
    if (filterCategory) {
      result = result.filter((n) => n.category === filterCategory);
    }
    if (showOnlyUnread) {
      result = result.filter((n) => !n.read);
    }
    return result;
  }, [mappedNotifications, filterCategory, showOnlyUnread]);

  const displayedNotifications = filteredNotifications.slice(0, maxVisible);
  const unreadCount = mappedNotifications.filter((n) => !n.read).length;

  return (
    <Box sx={{ p: 0, width: "100%", bgcolor: "transparent" }}>
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: `1px solid var(--border)`, bgcolor: alpha(theme.palette.background.paper, 0.8), backdropFilter: "blur(10px)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography sx={{ fontSize: "18px", fontWeight: 900, letterSpacing: "-0.02em" }}>
                Alert Center
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  size="small"
                  label={`${unreadCount} New`}
                  sx={{ 
                    height: 20, 
                    fontSize: "10px", 
                    fontWeight: 900,
                    bgcolor: theme.palette.error.main,
                    color: "white",
                    boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.4)}`,
                  }}
                />
              )}
            </Stack>
          </Box>

          <Stack direction="row" spacing={0.5}>
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={onMarkAllRead} sx={{ color: "primary.main" }}>
                  <DoneAllRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Clear history">
              <IconButton size="small" onClick={onClearAll}>
                <ClearRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid var(--border)`, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { display: "none" } }}>
          <Chip
            size="small"
            label="All"
            variant={filterCategory === null && !showOnlyUnread ? "filled" : "outlined"}
            onClick={() => { setFilterCategory(null); setShowOnlyUnread(false); }}
            sx={{ fontWeight: 700, borderRadius: "8px" }}
          />
          <Chip
            size="small"
            label="Unread"
            variant={showOnlyUnread ? "filled" : "outlined"}
            onClick={() => setShowOnlyUnread(!showOnlyUnread)}
            color={showOnlyUnread ? "primary" : "default"}
            sx={{ fontWeight: 700, borderRadius: "8px" }}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, alignSelf: "center" }} />
          {Object.entries(categoryConfig).map(([cat, config]) => (
            <Chip
              key={cat}
              size="small"
              label={config.label}
              variant={filterCategory === cat ? "filled" : "outlined"}
              onClick={() => setFilterCategory(cat as NotificationCategory)}
              sx={{
                fontWeight: 700,
                borderRadius: "8px",
                whiteSpace: "nowrap",
                ...(filterCategory === cat && {
                  backgroundColor: alpha(config.color, 0.2),
                  color: config.color,
                  borderColor: alpha(config.color, 0.5),
                }),
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Notifications List */}
      <Box
        sx={{
          maxHeight: 480,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          bgcolor: alpha(theme.palette.background.default, 0.2),
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { background: "var(--border)", borderRadius: "2px" },
        }}
      >
        <AnimatePresence mode="popLayout">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: "40px 0" }}
            >
              <Box sx={{ fontSize: "40px", mb: 1, opacity: 0.3 }}>🔔</Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                No notifications found
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5 }}>
                We'll let you know when something important happens.
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 1.5,
          textAlign: "center",
          borderTop: `1px solid var(--border)`,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
        }}
      >
        <Button 
          fullWidth 
          size="small" 
          sx={{ 
            textTransform: "none", 
            fontWeight: 800, 
            fontSize: "11px",
            color: "text.secondary",
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05), color: "primary.main" }
          }}
        >
          View All Notifications
        </Button>
      </Box>
    </Box>
  );
}
