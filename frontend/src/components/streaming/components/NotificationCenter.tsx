import React, { useState } from 'react';
import { Box, Badge, IconButton, Popover, Chip, Divider } from '@mui/material';
import { Notifications, Close, CheckCircle, Info, Warning, ErrorOutline } from '@mui/icons-material';
import { colors, glassEffect, transitions, spacing, shadows } from '../theme';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function createInitialNotifications(now: number): Notification[] {
  return [
    {
      id: '1',
      type: 'success',
      title: 'Stream Quality Optimized',
      message: 'Your bitrate has been automatically optimized for current network conditions.',
      timestamp: now - 60000,
      read: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'New Collaborator Request',
      message: 'Sarah requested to join your stream',
      timestamp: now - 300000,
      read: false,
      action: { label: 'Review', onClick: () => {} },
    },
    {
      id: '3',
      type: 'warning',
      title: 'Low Bandwidth Detected',
      message: 'Your connection speed has dropped. Consider lowering stream quality.',
      timestamp: now - 600000,
      read: true,
    },
    {
      id: '4',
      type: 'success',
      title: 'Cloud Recording Started',
      message: 'Your stream is now being recorded to the cloud.',
      timestamp: now - 900000,
      read: true,
    },
  ];
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [now, setNow] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  React.useEffect(() => {
    const currentTime = Date.now();
    setNow(currentTime);
    setNotifications(createInitialNotifications(currentTime));

    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ fontSize: '16px', color: colors.neonGreen }} />;
      case 'info':
        return <Info sx={{ fontSize: '16px', color: colors.info }} />;
      case 'warning':
        return <Warning sx={{ fontSize: '16px', color: colors.warning }} />;
      case 'error':
        return <ErrorOutline sx={{ fontSize: '16px', color: colors.error }} />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Math.max(0, (now || timestamp) - timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {/* Notification Bell */}
      <Badge
        badgeContent={unreadCount}
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: colors.neonGreen,
            color: colors.primary,
            boxShadow: `0 0 8px ${colors.neonGreen}`,
          },
        }}
      >
        <IconButton
          onClick={handleClick}
          sx={{
            color: colors.textSecondary,
            transition: transitions.fast,
            '&:hover': { color: colors.accent },
          }}
          size="small"
        >
          <Notifications fontSize="small" />
        </IconButton>
      </Badge>

      {/* Notifications Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            ...glassEffect,
            borderRadius: spacing.lg,
            maxWidth: '400px',
            mt: spacing.md,
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing.lg,
              borderBottom: `1px solid rgba(203, 213, 225, 0.1)`,
            }}
          >
            <Box sx={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
              Notifications
            </Box>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{
                color: colors.textMuted,
                '&:hover': { color: colors.textPrimary },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Notifications List */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(139, 92, 246, 0.3)',
                borderRadius: '3px',
              },
            }}
          >
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <Box
                    sx={{
                      padding: spacing.lg,
                      background: notification.read ? 'transparent' : 'rgba(139, 92, 246, 0.08)',
                      display: 'flex',
                      gap: spacing.md,
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      transition: transitions.fast,
                      '&:hover': {
                        background: 'rgba(139, 92, 246, 0.12)',
                        '& .notification-actions': {
                          opacity: 1,
                        },
                      },
                      borderRight: notification.read ? 'none' : `3px solid ${colors.accent}`,
                    }}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* Icon */}
                    <Box sx={{ flexShrink: 0, mt: '2px' }}>
                      {getNotificationIcon(notification.type)}
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary, mb: spacing.xs }}>
                        {notification.title}
                      </Box>
                      <Box sx={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.4, mb: spacing.sm }}>
                        {notification.message}
                      </Box>
                      <Box sx={{ fontSize: '10px', color: colors.textMuted }}>
                        {formatTime(notification.timestamp)}
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box
                      className="notification-actions"
                      sx={{
                        display: 'flex',
                        gap: '2px',
                        opacity: 0,
                        transition: transitions.fast,
                        flexShrink: 0,
                      }}
                    >
                      {notification.action && (
                        <Chip
                          label={notification.action.label}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            notification.action?.onClick();
                          }}
                          sx={{
                            height: '20px',
                            fontSize: '10px',
                            background: colors.accent,
                            color: colors.primary,
                            fontWeight: 700,
                          }}
                        />
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        sx={{
                          color: colors.textMuted,
                          width: '20px',
                          height: '20px',
                          '&:hover': { color: colors.error },
                        }}
                      >
                        <Close sx={{ fontSize: '12px' }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {index < notifications.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(203, 213, 225, 0.05)' }} />
                  )}
                </Box>
              ))
            ) : (
              <Box
                sx={{
                  padding: spacing.xl,
                  textAlign: 'center',
                  color: colors.textMuted,
                  fontSize: '13px',
                }}
              >
                No notifications yet
              </Box>
            )}
          </Box>

          {/* Footer */}
          {notifications.length > 0 && (
            <Box
              sx={{
                padding: spacing.lg,
                borderTop: `1px solid rgba(203, 213, 225, 0.1)`,
                textAlign: 'center',
              }}
            >
              <Box
                onClick={() => setNotifications([])}
                sx={{
                  fontSize: '12px',
                  color: colors.accentLight,
                  cursor: 'pointer',
                  fontWeight: 600,
                  '&:hover': { color: colors.accent },
                  transition: transitions.fast,
                }}
              >
                Clear All
              </Box>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationCenter;
