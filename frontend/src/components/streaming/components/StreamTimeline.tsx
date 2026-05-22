import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Chip } from '@mui/material';
import { ChevronLeft, ChevronRight, BookmarkAdded, FavoriteBorder, Share } from '@mui/icons-material';
import { colors, glassEffect, glassEffectHover, transitions, spacing, shadows } from '../theme';
import { TimelineEvent } from '../types';

const StreamTimeline: React.FC = () => {
  const [events] = useState<TimelineEvent[]>([
    { id: '1', timestamp: 0, type: 'scene_change', title: 'Intro Scene', icon: '🎬' },
    { id: '2', timestamp: 300, type: 'guest_join', title: 'Maya joined', icon: '👋' },
    { id: '3', timestamp: 600, type: 'donation', title: '$50 Donation', icon: '💰' },
    { id: '4', timestamp: 900, type: 'scene_change', title: 'Main Studio', icon: '🎬' },
    { id: '5', timestamp: 1200, type: 'milestone', title: '10K Viewers', icon: '🎉' },
    { id: '6', timestamp: 1500, type: 'clip', title: 'Clip Created', icon: '✨' },
  ]);

  const [scrollPos, setScrollPos] = useState(0);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ padding: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {/* Timeline Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Stream Timeline
        </Box>
        <Box sx={{ display: 'flex', gap: spacing.sm }}>
          <Tooltip title="Previous">
            <IconButton
              size="small"
              onClick={() => setScrollPos(Math.max(0, scrollPos - 200))}
              sx={{
                color: colors.textMuted,
                '&:hover': { color: colors.accent },
              }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next">
            <IconButton
              size="small"
              onClick={() => setScrollPos(scrollPos + 200)}
              sx={{
                color: colors.textMuted,
                '&:hover': { color: colors.accent },
              }}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Timeline Events */}
      <Box
        sx={{
          display: 'flex',
          gap: spacing.md,
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: spacing.sm,
          '&::-webkit-scrollbar': {
            height: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(139, 92, 246, 0.05)',
            borderRadius: '2px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: colors.accent,
            borderRadius: '2px',
          },
        }}
      >
        {events.map((event, index) => (
          <Box
            key={event.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.sm,
              flexShrink: 0,
              cursor: 'pointer',
              transition: transitions.fast,
              '&:hover .event-card': {
                transform: 'translateY(-4px)',
                boxShadow: shadows.lg,
              },
            }}
          >
            {/* Timeline Connector */}
            {index < events.length - 1 && (
              <Box
                sx={{
                  width: '40px',
                  height: '2px',
                  background: `linear-gradient(90deg, ${colors.accent}, transparent)`,
                  position: 'absolute',
                  left: 'calc(100% + ${spacing.md})',
                  marginLeft: spacing.sm,
                }}
              />
            )}

            {/* Event Card */}
            <Box
              className="event-card"
              sx={{
                ...glassEffect,
                padding: `${spacing.md} ${spacing.lg}`,
                borderRadius: spacing.lg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing.sm,
                minWidth: '120px',
                textAlign: 'center',
                transition: transitions.fast,
              }}
            >
              {/* Event Icon */}
              <Box sx={{ fontSize: '24px' }}>
                {event.icon}
              </Box>

              {/* Event Title */}
              <Box sx={{ fontSize: '11px', fontWeight: 600, color: colors.textPrimary }}>
                {event.title}
              </Box>

              {/* Event Time */}
              <Box sx={{ fontSize: '10px', color: colors.textMuted }}>
                {formatTime(event.timestamp)}
              </Box>

              {/* Event Actions */}
              <Box sx={{ display: 'flex', gap: '2px', mt: spacing.xs }}>
                <Tooltip title="Bookmark">
                  <IconButton
                    size="small"
                    sx={{
                      width: '20px',
                      height: '20px',
                      color: colors.textMuted,
                      '&:hover': { color: colors.accent },
                    }}
                  >
                    <BookmarkAdded sx={{ fontSize: '12px' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Timeline Dot */}
            <Box
              sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: colors.accent,
                boxShadow: `0 0 12px ${colors.accent}`,
                border: `2px solid ${colors.primary}`,
              }}
            />
          </Box>
        ))}
      </Box>

      {/* Stream Duration */}
      <Box sx={{ display: 'flex', gap: spacing.md, alignItems: 'center', justifyContent: 'space-between', mt: spacing.md }}>
        <Box sx={{ fontSize: '12px', color: colors.textMuted }}>
          <span style={{ fontWeight: 700, color: colors.accent }}>01:24:35</span> / 04:00:00 total
        </Box>
        <Box sx={{ display: 'flex', gap: spacing.sm }}>
          <Chip
            icon={<FavoriteBorder sx={{ fontSize: '14px' }} />}
            label="8.9K"
            size="small"
            sx={{
              background: 'rgba(236, 72, 153, 0.15)',
              border: `1px solid rgba(236, 72, 153, 0.3)`,
              color: colors.neonPink,
              fontWeight: 600,
            }}
          />
          <Chip
            icon={<Share sx={{ fontSize: '14px' }} />}
            label="342"
            size="small"
            sx={{
              background: 'rgba(6, 182, 212, 0.15)',
              border: `1px solid rgba(6, 182, 212, 0.3)`,
              color: colors.neonCyan,
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default StreamTimeline;
