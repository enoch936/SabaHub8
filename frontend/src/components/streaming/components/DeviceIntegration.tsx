import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Switch, Chip, LinearProgress, Badge } from '@mui/material';
import {
  Close, Circle, Settings, MoreVert, Videocam, Headphones, 
  Devices, WifiProtectedSetup, CheckCircle, Error, Refresh
} from '@mui/icons-material';
import { colors, glassEffect, glassEffectHover, transitions, spacing, shadows } from '../theme';
import { DeviceConfig } from '../types';

interface DeviceIntegrationProps {
  onClose: () => void;
}

const DeviceIntegration: React.FC<DeviceIntegrationProps> = ({ onClose }) => {
  const [devices, setDevices] = useState<DeviceConfig[]>([
    {
      type: 'webcam',
      name: 'Logitech C922',
      status: 'connected',
      resolution: '1080p',
      framerate: 60,
    },
    {
      type: 'dslr',
      name: 'Canon EOS R6',
      status: 'connected',
      resolution: '4K',
      framerate: 60,
    },
    {
      type: 'obs',
      name: 'OBS Studio',
      status: 'connected',
      resolution: '1080p',
      framerate: 30,
    },
    {
      type: 'mixer',
      name: 'Rode Wireless GO II',
      status: 'connected',
    },
    {
      type: 'capture_card',
      name: 'Elgato HD60 S+',
      status: 'disconnected',
    },
    {
      type: 'vlc',
      name: 'VLC Media Player',
      status: 'error',
    },
  ]);

  const getDeviceIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      webcam: '📷',
      dslr: '📹',
      obs: '🎬',
      vlc: '🎥',
      mixer: '🎙️',
      capture_card: '🔗',
    };
    return iconMap[type] || '⚙️';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return colors.neonGreen;
      case 'disconnected':
        return colors.textMuted;
      case 'error':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle sx={{ fontSize: '14px' }} />;
      case 'disconnected':
        return <Circle sx={{ fontSize: '14px' }} />;
      case 'error':
        return <Error sx={{ fontSize: '14px' }} />;
      default:
        return null;
    }
  };

  const DeviceCard = ({ device }: { device: DeviceConfig }) => (
    <Box
      sx={{
        ...glassEffect,
        padding: spacing.lg,
        borderRadius: spacing.lg,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.lg,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: getStatusColor(device.status),
          boxShadow: device.status === 'connected' ? `0 0 10px ${getStatusColor(device.status)}` : 'none',
        },
        '&:hover': {
          ...glassEffectHover,
          '& .device-controls': {
            opacity: 1,
          },
        },
        transition: transitions.fast,
      }}
    >
      {/* Device Icon */}
      <Box sx={{ fontSize: '28px', flexShrink: 0 }}>
        {getDeviceIcon(device.type)}
      </Box>

      {/* Device Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm, mb: spacing.xs }}>
          <Box sx={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
            {device.name}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: getStatusColor(device.status),
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            {getStatusIcon(device.status)}
            {device.status}
          </Box>
        </Box>
        {device.resolution && (
          <Box sx={{ fontSize: '12px', color: colors.textMuted }}>
            {device.resolution} @ {device.framerate}fps
          </Box>
        )}
      </Box>

      {/* Controls */}
      <Box
        className="device-controls"
        sx={{
          display: 'flex',
          gap: spacing.sm,
          opacity: 0,
          transition: transitions.fast,
          flexShrink: 0,
        }}
      >
        {device.status === 'connected' && (
          <Tooltip title="Primary Source">
            <IconButton
              size="small"
              sx={{
                color: colors.accentLight,
                background: 'rgba(139, 92, 246, 0.15)',
                '&:hover': {
                  background: 'rgba(139, 92, 246, 0.25)',
                },
                transition: transitions.fast,
              }}
            >
              <Videocam fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Settings">
          <IconButton
            size="small"
            sx={{
              color: colors.textMuted,
              '&:hover': { color: colors.accent },
              transition: transitions.fast,
            }}
          >
            <Settings fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="More">
          <IconButton
            size="small"
            sx={{
              color: colors.textMuted,
              '&:hover': { color: colors.accent },
              transition: transitions.fast,
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.glassDark,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.lg,
          borderBottom: `1px solid rgba(203, 213, 225, 0.1)`,
          flexShrink: 0,
        }}
      >
        <Box>
          <Box sx={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
            Connected Devices
          </Box>
          <Box sx={{ fontSize: '11px', color: colors.textMuted, mt: spacing.xs }}>
            {devices.filter(d => d.status === 'connected').length} of {devices.length} active
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: colors.textMuted,
            '&:hover': { color: colors.textPrimary },
            transition: transitions.fast,
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          padding: spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
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
        {/* Connected Devices Section */}
        {devices.filter(d => d.status === 'connected').length > 0 && (
          <Box>
            <Box
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.textPrimary,
                mb: spacing.md,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              ✓ Connected
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {devices.filter(d => d.status === 'connected').map((device, index) => (
                <DeviceCard key={index} device={device} />
              ))}
            </Box>
          </Box>
        )}

        {/* Disconnected Devices Section */}
        {devices.filter(d => d.status === 'disconnected').length > 0 && (
          <Box>
            <Box
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.textMuted,
                mb: spacing.md,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              ⊘ Disconnected
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {devices.filter(d => d.status === 'disconnected').map((device, index) => (
                <DeviceCard key={index} device={device} />
              ))}
            </Box>
          </Box>
        )}

        {/* Error Devices Section */}
        {devices.filter(d => d.status === 'error').length > 0 && (
          <Box>
            <Box
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.error,
                mb: spacing.md,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              ✕ Errors
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {devices.filter(d => d.status === 'error').map((device, index) => (
                <DeviceCard key={index} device={device} />
              ))}
            </Box>
          </Box>
        )}

        {/* Add New Device */}
        <Box
          sx={{
            mt: spacing.lg,
            pt: spacing.lg,
            borderTop: `1px solid rgba(203, 213, 225, 0.1)`,
            ...glassEffect,
            padding: spacing.lg,
            borderRadius: spacing.lg,
            textAlign: 'center',
            cursor: 'pointer',
            transition: transitions.fast,
            '&:hover': glassEffectHover,
          }}
        >
          <Box sx={{ fontSize: '20px', mb: spacing.sm }}>+</Box>
          <Box sx={{ fontSize: '13px', fontWeight: 600, color: colors.accentLight, mb: spacing.xs }}>
            Add Device
          </Box>
          <Box sx={{ fontSize: '11px', color: colors.textMuted }}>
            Connect camera, mixer, or media player
          </Box>
        </Box>

        {/* Device Health */}
        <Box
          sx={{
            ...glassEffect,
            padding: spacing.lg,
            borderRadius: spacing.lg,
          }}
        >
          <Box sx={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, mb: spacing.md }}>
            System Health
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <Box>
              <Box sx={{ fontSize: '11px', color: colors.textMuted, mb: spacing.sm }}>
                USB Bandwidth
              </Box>
              <LinearProgress
                variant="determinate"
                value={65}
                sx={{
                  height: '4px',
                  borderRadius: '2px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: colors.accent,
                  },
                }}
              />
            </Box>
            <Box>
              <Box sx={{ fontSize: '11px', color: colors.textMuted, mb: spacing.sm }}>
                Network
              </Box>
              <LinearProgress
                variant="determinate"
                value={45}
                sx={{
                  height: '4px',
                  borderRadius: '2px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: colors.neonGreen,
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DeviceIntegration;
