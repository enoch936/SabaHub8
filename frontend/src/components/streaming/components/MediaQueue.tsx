import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Chip, Divider } from '@mui/material';
import { PlayArrow, Delete, Edit, ChevronDown, Volume2, MusicNote, FavoriteBorder } from '@mui/icons-material';
import { colors, glassEffect, glassEffectHover, transitions, spacing, shadows } from '../theme';
import { MediaQueueItem } from '../types';

const MediaQueue: React.FC = () => {
  const [queue, setQueue] = useState<MediaQueueItem[]>([
    {
      id: '1',
      type: 'music',
      title: 'Stream Intro Theme',
      duration: 45,
      thumbnail: '🎵',
      queued_by: 'System',
    },
    {
      id: '2',
      type: 'clip',
      title: 'Epic Moment #1',
      duration: 30,
      thumbnail: '✨',
      queued_by: 'Maya',
    },
    {
      id: '3',
      type: 'video',
      title: 'Community Highlights',
      duration: 180,
      thumbnail: '🎬',
      queued_by: 'Alex',
    },
    {
      id: '4',
      type: 'music',
      title: 'Background Ambient Mix',
      duration: 600,
      thumbnail: '🎶',
      queued_by: 'Jordan',
    },
  ]);

  const [nowPlaying] = useState<MediaQueueItem>(queue[0]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMediaIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      music: '🎵',
      clip: '✂️',
      video: '🎬',
    };
    return iconMap[type] || '📁';
  };

  return (
    <Box sx={{ padding: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Header */}
      <Box sx={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Media Queue
      </Box>

      {/* Now Playing */}
      {nowPlaying && (
        <Box>
          <Box sx={{ fontSize: '10px', fontWeight: 600, color: colors.textMuted, mb: spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            NOW PLAYING
          </Box>
          <Box
            sx={{
              ...glassEffect,
              padding: spacing.lg,
              borderRadius: spacing.lg,
              background: `linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.1))`,
              border: `2px solid rgba(139, 92, 246, 0.3)`,
              display: 'flex',
              gap: spacing.lg,
              alignItems: 'center',
            }}
          >
            {/* Thumbnail */}
            <Box
              sx={{
                width: '60px',
                height: '60px',
                borderRadius: spacing.md,
                background: gradients.purpleToBlue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                flexShrink: 0,
              }}
            >
              {getMediaIcon(nowPlaying.type)}
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm, mb: spacing.xs }}>
                <Box sx={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                  {nowPlaying.title}
                </Box>
                <Chip
                  label={nowPlaying.type}
                  size="small"
                  sx={{
                    height: '18px',
                    fontSize: '10px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: colors.accentLight,
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box sx={{ fontSize: '11px', color: colors.textMuted, mb: spacing.sm }}>
                Queued by {nowPlaying.queued_by}
              </Box>
              <Box
                sx={{
                  height: '4px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: '40%',
                    background: colors.accent,
                    boxShadow: `0 0 8px ${colors.accent}`,
                  }}
                />
              </Box>
            </Box>

            {/* Duration */}
            <Box sx={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted, flexShrink: 0 }}>
              {formatDuration(nowPlaying.duration)}
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(203, 213, 225, 0.1)' }} />

      {/* Queue Items */}
      <Box>
        <Box sx={{ fontSize: '10px', fontWeight: 600, color: colors.textMuted, mb: spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          UPCOMING ({queue.length - 1})
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {queue.slice(1).map((item, index) => (
            <Box
              key={item.id}
              sx={{
                ...glassEffect,
                padding: spacing.md,
                borderRadius: spacing.lg,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                transition: transitions.fast,
                '&:hover': {
                  ...glassEffectHover,
                  '& .queue-actions': {
                    opacity: 1,
                  },
                },
              }}
            >
              {/* Index */}
              <Box
                sx={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.accentLight,
                  flexShrink: 0,
                }}
              >
                {index + 2}
              </Box>

              {/* Thumbnail */}
              <Box
                sx={{
                  width: '44px',
                  height: '44px',
                  borderRadius: spacing.md,
                  background: glassEffect.background,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                {getMediaIcon(item.type)}
              </Box>

              {/* Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, mb: spacing.xs }}>
                  {item.title}
                </Box>
                <Box sx={{ fontSize: '11px', color: colors.textMuted }}>
                  by {item.queued_by} • {formatDuration(item.duration)}
                </Box>
              </Box>

              {/* Actions */}
              <Box
                className="queue-actions"
                sx={{
                  display: 'flex',
                  gap: '2px',
                  opacity: 0,
                  transition: transitions.fast,
                  flexShrink: 0,
                }}
              >
                <Tooltip title="Play Now">
                  <IconButton
                    size="small"
                    sx={{
                      color: colors.neonGreen,
                      background: 'rgba(16, 185, 129, 0.1)',
                      '&:hover': { background: 'rgba(16, 185, 129, 0.2)' },
                    }}
                  >
                    <PlayArrow fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={() => setQueue(queue.filter(q => q.id !== item.id))}
                    sx={{
                      color: colors.error,
                      background: 'rgba(239, 68, 68, 0.1)',
                      '&:hover': { background: 'rgba(239, 68, 68, 0.2)' },
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Add Media Button */}
      <Box
        sx={{
          ...glassEffect,
          padding: spacing.lg,
          borderRadius: spacing.lg,
          textAlign: 'center',
          cursor: 'pointer',
          transition: transitions.fast,
          '&:hover': glassEffectHover,
        }}
      >
        <Box sx={{ fontSize: '11px', fontWeight: 600, color: colors.accentLight }}>
          + Add Media
        </Box>
      </Box>
    </Box>
  );
};

// Helper - this should be imported from theme but adding it here for completeness
const gradients = {
  purpleToBlue: `linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)`,
  purpleToNeon: `linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)`,
  darkToPurple: `linear-gradient(180deg, #0a0e27 0%, #8b5cf6 100%)`,
  neonGradient: `linear-gradient(90deg, #06b6d4 0%, #d946ef 50%, #ec4899 100%)`,
  streamActive: `linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)`,
};

export default MediaQueue;
