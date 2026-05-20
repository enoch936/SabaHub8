/**
 * Modern Notification Center
 * Categorized alerts with filtering and management
 */

"use client";

import { ReactNode, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Chip,
  useTheme,
  alpha,
  Popover,
  Divider,
  Button,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, GlassCardHeader } from "./GlassCard";
import { MOTION_VARIANTS } from "@/lib/motion";

export type NotificationCategory = "payment" | "security" | "system" | "user" | "deployment" | "ai";
export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface Notification {
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
  notifications: Notification[];
  onDismiss?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
  maxVisible?: number;
}

const categoryConfig: Record<NotificationCategory, { color: string; bg: string; emoji: string }> = {
  payment: { color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", emoji: "💳" },
  security: { color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", emoji: "🔒" },
  system: { color: "#6366F1", bg: "rgba(99, 102, 241, 0.1)", emoji: "⚙️" },
  user: { color: "#06B6D4", bg: "rgba(6, 182, 212, 0.1)", emoji: "👤" },
  deployment: { color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.1)", emoji: "🚀" },
  ai: { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", emoji: "🤖" },
};

const priorityConfig: Record<NotificationPriority, { color: string; label: string }> = {
  low: { color: "#94A3B8", label: "Low" },
  medium: { color: "#F59E0B", label: "Medium" },
  high: { color: "#F97316", label: "High" },
  critical: { color: "#EF4444", label: "Critical" },
};

function NotificationItem({
  notification,
  onDismiss,
  onMarkAsRead,
}: {
  notification: Notification;
  onDismiss?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
}) {
  const theme = useTheme();
  const category = categoryConfig[notification.category];
  const priority = priorityConfig[notification.priority];

  return (
    <motion.div
      variants={MOTION_VARIANTS.slideInRight}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <Box
        onClick={() => onMarkAsRead?.(notification.id)}
        sx={{
          p: 2,
          borderRadius: "12px",
          backgroundColor: notification.read
            ? "transparent"
            : alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(category.color, 0.2)}`,
          transition: "all 200ms ease",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: alpha(category.color, 0.08),
            borderColor: alpha(category.color, 0.4),
          },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              fontSize: "20px",
              mt: 0.25,
              flexShrink: 0,
            }}
          >
            {notification.icon || category.emoji}
          </Box>

          <Box flex={1} minWidth={0}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                {notification.title}
              </Typography>
              {notification.priority !== "low" && (
                <Chip
                  size="small"
                  label={priority.label}
                  sx={{
                    height: 18,
                    fontSize: "10px",
                    backgroundColor: alpha(priority.color, 0.15),
                    color: priority.color,
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>

            <Typography
              sx={{
                fontSize: "12px",
                color: theme.palette.text.secondary,
                mb: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {notification.message}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                sx={{
                  fontSize: "11px",
                  color: alpha(theme.palette.text.secondary, 0.7),
                }}
              >
                {formatTimeAgo(notification.timestamp)}
              </Typography>

              {notification.actionUrl && (
                <Button
                  size="small"
                  sx={{
                    fontSize: "11px",
                    textTransform: "none",
                    color: theme.palette.primary.main,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  {notification.actionLabel || "View"}
                </Button>
              )}
            </Stack>
          </Box>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.(notification.id);
            }}
            sx={{ flexShrink: 0 }}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Box>
    </motion.div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";

  return Math.floor(seconds) + "s ago";
}

export function NotificationCenter({
  notifications,
  onDismiss,
  onMarkAsRead,
  onClearAll,
  maxVisible = 8,
}: NotificationCenterProps) {
  const theme = useTheme();
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | null>(null);

  const filteredNotifications = filterCategory
    ? notifications.filter((n) => n.category === filterCategory)
    : notifications;

  const displayedNotifications = filteredNotifications.slice(0, maxVisible);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <GlassCard>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                size="small"
                label={unreadCount}
                color="error"
                sx={{ height: 20, fontSize: "11px" }}
              />
            )}
          </Stack>
          <Typography sx={{ fontSize: "12px", color: theme.palette.text.secondary, mt: 0.5 }}>
            {displayedNotifications.length} items
          </Typography>
        </Box>

        {notifications.length > 0 && (
          <IconButton
            size="small"
            onClick={onClearAll}
            title="Clear all notifications"
          >
            <ClearRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      {/* Category Filter */}
      <Stack direction="row" spacing={1} mb={2} sx={{ overflowX: "auto", pb: 1 }}>
        <Chip
          size="small"
          label="All"
          variant={filterCategory === null ? "filled" : "outlined"}
          onClick={() => setFilterCategory(null)}
          sx={{ whiteSpace: "nowrap" }}
        />
        {Object.entries(categoryConfig).map(([cat, config]) => (
          <Chip
            key={cat}
            size="small"
            label={cat}
            variant={filterCategory === cat ? "filled" : "outlined"}
            onClick={() => setFilterCategory(cat as NotificationCategory)}
            sx={{
              whiteSpace: "nowrap",
              ...(filterCategory === cat && {
                backgroundColor: alpha(config.color, 0.15),
                color: config.color,
              }),
            }}
          />
        ))}
      </Stack>

      <Divider sx={{ my: 2, opacity: 0.3 }} />

      {/* Notifications List */}
      <Box
        sx={{
          maxHeight: 500,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(theme.palette.text.secondary, 0.2),
            borderRadius: "3px",
          },
        }}
      >
        {displayedNotifications.length > 0 ? (
          <AnimatePresence>
            <Stack spacing={1}>
              {displayedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDismiss={onDismiss}
                  onMarkAsRead={onMarkAsRead}
                />
              ))}
            </Stack>
          </AnimatePresence>
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              color: theme.palette.text.secondary,
            }}
          >
            <Typography variant="body2">No notifications</Typography>
          </Box>
        )}
      </Box>

      {filteredNotifications.length > maxVisible && (
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            textAlign: "center",
          }}
        >
          <Button size="small" sx={{ textTransform: "none" }}>
            View all {filteredNotifications.length} notifications
          </Button>
        </Box>
      )}
    </GlassCard>
  );
}
