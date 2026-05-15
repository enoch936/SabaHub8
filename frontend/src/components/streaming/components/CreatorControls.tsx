import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Select, MenuItem, FormControl, Chip, Badge } from '@mui/material';
import {
  Mic, MicOff, Videocam, VideocamOff, ScreenShare, ScreenShareOff,
  Settings, MoreVert, Hd, Palette, PictureInPictureAlt, RecordVoiceOver,
  MoreHoriz, Edit, Save
} from '@mui/icons-material';
import { colors, glassEffect, transitions, spacing, shadows, gradients } from '../theme';
import type { StreamSettings } from '../types';

interface CreatorControlsProps {
  state: any;
  onToggleStreaming: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleAnalytics: () => void;
  onToggleDevices: () => void;
}

const CreatorControls: React.FC<CreatorControlsProps> = ({
  state,
  onToggleStreaming,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onToggleAnalytics,
  onToggleDevices,
}) => {
  const [quality, setQuality] = useState<StreamSettings['quality']>('1080p60');
  const [showMore, setShowMore] = useState(false);
  const [recordingMode, setRecordingMode] = useState('cloud');

  const ControlButton = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    color = colors.accent,
    badge = null,
  }: {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    color?: string;
    badge?: React.ReactNode;
  }) => (
    <Tooltip title={label}>
      <Badge badgeContent={badge}>
        <IconButton
          onClick={onClick}
          sx={{
            color: isActive ? color : colors.textMuted,
            background: isActive ? `rgba(139, 92, 246, 0.15)` : 'transparent',
            border: `1px solid ${isActive ? `rgba(139, 92, 246, 0.3)` : 'rgba(203, 213, 225, 0.1)'}`,
            transition: transitions.fast,
            '&:hover': {
              color: color,
              background: `rgba(139, 92, 246, 0.2)`,
              borderColor: `rgba(139, 92, 246, 0.3)`,
              boxShadow: isActive ? `0 0 12px rgba(139, 92, 246, 0.3)` : 'none',
            },
          }}
        >
          {Icon}
        </IconButton>
      </Badge>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        background: `linear-gradient(180deg, transparent, ${colors.glassDark})`,
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid rgba(203, 213, 225, 0.1)`,
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        flexShrink: 0,
      }}
    >
      {/* Main Control Row */}
      <Box sx={{ display: 'flex', gap: spacing.md, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Stream Status Button */}
        <Tooltip title={state.isStreaming ? 'Stop Stream' : 'Start Stream'}>
          <Box
            onClick={onToggleStreaming}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: state.isStreaming
                ? `linear-gradient(135deg, ${colors.neonGreen}, ${colors.neonGreen}dd)`
                : `linear-gradient(135deg, ${colors.error}, ${colors.error}dd)`,
              border: `2px solid ${state.isStreaming ? colors.neonGreen : colors.error}`,
              cursor: 'pointer',
              boxShadow: state.isStreaming
                ? `0 0 20px ${colors.neonGreen}, inset 0 0 20px rgba(255, 255, 255, 0.1)`
                : `0 0 20px ${colors.error}, inset 0 0 20px rgba(255, 255, 255, 0.1)`,
              transition: transitions.normal,
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: state.isStreaming
                  ? `0 0 30px ${colors.neonGreen}, inset 0 0 20px rgba(255, 255, 255, 0.15)`
                  : `0 0 30px ${colors.error}, inset 0 0 20px rgba(255, 255, 255, 0.15)`,
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <Box sx={{ fontSize: '24px' }}>
              {state.isStreaming ? '🔴' : '⭕'}
            </Box>
          </Box>
        </Tooltip>

        {/* Audio Controls */}
        <ControlButton
          icon={state.isMuted ? <MicOff /> : <Mic />}
          label={state.isMuted ? 'Unmute' : 'Mute Mic'}
          isActive={!state.isMuted}
          onClick={onToggleMic}
          color={colors.neonCyan}
        />

        {/* Video Controls */}
        <ControlButton
          icon={state.isCameraOff ? <VideocamOff /> : <Videocam />}
          label={state.isCameraOff ? 'Enable Camera' : 'Disable Camera'}
          isActive={!state.isCameraOff}
          onClick={onToggleCamera}
          color={colors.accent}
        />

        {/* Screen Share */}
        <ControlButton
          icon={state.isScreenSharing ? <ScreenShareOff /> : <ScreenShare />}
          label={state.isScreenSharing ? 'Stop Screen Share' : 'Start Screen Share'}
          isActive={state.isScreenSharing}
          onClick={onToggleScreenShare}
          color={colors.neonPink}
        />

        {/* Scene Switching */}
        <Tooltip title="Switch Scene">
          <IconButton
            sx={{
              color: colors.textMuted,
              background: 'rgba(139, 92, 246, 0.05)',
              border: `1px solid rgba(203, 213, 225, 0.1)`,
              transition: transitions.fast,
              '&:hover': {
                color: colors.accent,
                background: 'rgba(139, 92, 246, 0.15)',
                borderColor: 'rgba(139, 92, 246, 0.3)',
              },
            }}
          >
            <Palette />
          </IconButton>
        </Tooltip>

        {/* Chat Toggle */}
        <ControlButton
          icon={<RecordVoiceOver />}
          label={state.chatOpen ? 'Hide Chat' : 'Show Chat'}
          isActive={state.chatOpen}
          onClick={onToggleChat}
          color={colors.neonCyan}
          badge={state.chatOpen ? 3 : null}
        />

        {/* Analytics Toggle */}
        <ControlButton
          icon={<Hd />}
          label={state.analyticsOpen ? 'Hide Analytics' : 'Show Analytics'}
          isActive={state.analyticsOpen}
          onClick={onToggleAnalytics}
          color={colors.neonGreen}
        />

        {/* More Options */}
        <Tooltip title="More Options">
          <IconButton
            onClick={() => setShowMore(!showMore)}
            sx={{
              color: colors.textMuted,
              background: showMore ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.05)',
              border: `1px solid ${showMore ? 'rgba(139, 92, 246, 0.3)' : 'rgba(203, 213, 225, 0.1)'}`,
              transition: transitions.fast,
              '&:hover': {
                color: colors.accent,
                background: 'rgba(139, 92, 246, 0.2)',
                borderColor: 'rgba(139, 92, 246, 0.3)',
              },
            }}
          >
            <MoreHoriz />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quality & Advanced Controls */}
      <Box sx={{ display: 'flex', gap: spacing.md, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Quality Selector */}
        <FormControl size="small" variant="outlined">
          <Select
            value={quality}
            onChange={(e) => setQuality(e.target.value as StreamSettings['quality'])}
            sx={{
              fontSize: '12px',
              fontWeight: 600,
              color: colors.textPrimary,
              background: colors.glassDark,
              border: `1px solid rgba(203, 213, 225, 0.1)`,
              borderRadius: spacing.md,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(139, 92, 246, 0.3)',
              },
              '& .MuiSvgIcon-root': {
                color: colors.accentLight,
              },
              minWidth: '110px',
            }}
          >
            <MenuItem value="1080p60">1080p 60fps</MenuItem>
            <MenuItem value="1080p30">1080p 30fps</MenuItem>
            <MenuItem value="720p60">720p 60fps</MenuItem>
            <MenuItem value="720p30">720p 30fps</MenuItem>
            <MenuItem value="480p30">480p 30fps</MenuItem>
            <MenuItem value="auto">Auto</MenuItem>
          </Select>
        </FormControl>

        {/* Recording Mode */}
        <FormControl size="small" variant="outlined">
          <Select
            value={recordingMode}
            onChange={(e) => setRecordingMode(e.target.value)}
            sx={{
              fontSize: '12px',
              fontWeight: 600,
              color: colors.textPrimary,
              background: colors.glassDark,
              border: `1px solid rgba(203, 213, 225, 0.1)`,
              borderRadius: spacing.md,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(139, 92, 246, 0.3)',
              },
              '& .MuiSvgIcon-root': {
                color: colors.accentLight,
              },
              minWidth: '120px',
            }}
          >
            <MenuItem value="cloud">Cloud Rec</MenuItem>
            <MenuItem value="local">Local Rec</MenuItem>
            <MenuItem value="both">Both</MenuItem>
            <MenuItem value="none">None</MenuItem>
          </Select>
        </FormControl>

        {/* Devices Panel */}
        <Tooltip title="Connected Devices">
          <IconButton
            onClick={onToggleDevices}
            sx={{
              color: colors.textMuted,
              background: 'rgba(139, 92, 246, 0.05)',
              border: `1px solid rgba(203, 213, 225, 0.1)`,
              transition: transitions.fast,
              '&:hover': {
                color: colors.accent,
                background: 'rgba(139, 92, 246, 0.15)',
                borderColor: 'rgba(139, 92, 246, 0.3)',
              },
            }}
          >
            <PictureInPictureAlt />
          </IconButton>
        </Tooltip>

        {/* Settings */}
        <Tooltip title="Stream Settings">
          <IconButton
            sx={{
              color: colors.textMuted,
              background: 'rgba(139, 92, 246, 0.05)',
              border: `1px solid rgba(203, 213, 225, 0.1)`,
              transition: transitions.fast,
              '&:hover': {
                color: colors.accent,
                background: 'rgba(139, 92, 246, 0.15)',
                borderColor: 'rgba(139, 92, 246, 0.3)',
              },
            }}
          >
            <Settings />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status Information */}
      <Box sx={{ display: 'flex', gap: spacing.md, justifyContent: 'center', flexWrap: 'wrap', fontSize: '12px', color: colors.textMuted }}>
        <Chip
          label="6.2 Mbps"
          size="small"
          variant="outlined"
          sx={{
            color: colors.accentLight,
            borderColor: 'rgba(139, 92, 246, 0.3)',
            background: 'rgba(139, 92, 246, 0.05)',
          }}
        />
        <Chip
          label="0.8s Latency"
          size="small"
          variant="outlined"
          sx={{
            color: colors.accentLight,
            borderColor: 'rgba(139, 92, 246, 0.3)',
            background: 'rgba(139, 92, 246, 0.05)',
          }}
        />
        <Chip
          label="60 FPS"
          size="small"
          variant="outlined"
          sx={{
            color: colors.accentLight,
            borderColor: 'rgba(139, 92, 246, 0.3)',
            background: 'rgba(139, 92, 246, 0.05)',
          }}
        />
      </Box>
    </Box>
  );
};

export default CreatorControls;
