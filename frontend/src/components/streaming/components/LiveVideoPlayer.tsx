import React, { useState, useEffect } from 'react';
import { Box, Tooltip, IconButton, Chip } from '@mui/material';
import { 
  PictureInPictureAlt, Fullscreen, FullscreenExit, MoreVert,
  Hd, Videocam, People
} from '@mui/icons-material';
import { colors, glassEffect, glassEffectHover, transitions, shadows, spacing, gradients } from '../theme';

interface LiveVideoPlayerProps {
  isStreaming: boolean;
}

const LiveVideoPlayer: React.FC<LiveVideoPlayerProps> = ({ isStreaming }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isFullscreen) {
      const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => setShowControls(false), 3000);
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timeout);
      };
    }
  }, [isFullscreen]);

  return (
    <Box
      ref={videoRef}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: colors.primary,
        overflow: 'hidden',
        cursor: isFullscreen ? 'none' : 'default',
        '&:hover .video-controls': {
          opacity: 1,
        },
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isFullscreen && setShowControls(false)}
    >
      {/* Video Canvas Background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, 
            rgba(139, 92, 246, 0.15) 0%, 
            rgba(15, 23, 42, 0.5) 50%, 
            rgba(236, 72, 153, 0.15) 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          color: colors.textMuted,
          fontWeight: 300,
        }}
      >
        {isStreaming ? (
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ fontSize: '64px', mb: spacing.lg, animation: 'pulse 2s infinite' }}>📹</Box>
            <Box>Live Stream Active</Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
            <Box sx={{ fontSize: '64px', mb: spacing.lg }}>📺</Box>
            <Box>Stream Offline</Box>
          </Box>
        )}
      </Box>

      {/* Stream Status Badge */}
      {isStreaming && (
        <Box
          sx={{
            position: 'absolute',
            top: spacing.lg,
            left: spacing.lg,
            zIndex: 10,
            display: 'flex',
            gap: spacing.sm,
            alignItems: 'center',
          }}
        >
          <Chip
            icon={<Videocam sx={{ fontSize: '14px' }} />}
            label="LIVE"
            size="small"
            sx={{
              background: `linear-gradient(135deg, ${colors.neonGreen} 0%, ${colors.neonGreen}dd 100%)`,
              color: colors.primary,
              fontWeight: 700,
              fontSize: '12px',
              height: '28px',
              letterSpacing: '1px',
              boxShadow: shadows.successGlow,
              animation: 'pulse 2s infinite',
            }}
          />
          <Chip
            icon={<Hd sx={{ fontSize: '14px' }} />}
            label="4K 60FPS"
            size="small"
            sx={{
              background: colors.glassDark,
              border: `1px solid rgba(139, 92, 246, 0.3)`,
              color: colors.accentLight,
              fontWeight: 600,
              fontSize: '11px',
              height: '28px',
              letterSpacing: '0.5px',
            }}
          />
        </Box>
      )}

      {/* Viewer Count */}
      <Box
        sx={{
          position: 'absolute',
          top: spacing.lg,
          right: spacing.lg,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          ...glassEffect,
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: spacing.lg,
        }}
      >
        <People sx={{ fontSize: '16px', color: colors.accentLight }} />
        <Box sx={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
          12,847
        </Box>
        <Box sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: colors.neonGreen,
          boxShadow: `0 0 8px ${colors.neonGreen}`,
        }} />
      </Box>

      {/* Participant Grid Preview */}
      <Box
        sx={{
          position: 'absolute',
          bottom: spacing.xl,
          left: spacing.lg,
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 64px)',
          gap: spacing.sm,
        }}
      >
        {[1, 2, 3, 4, 5].map(i => (
          <Box
            key={i}
            sx={{
              width: '64px',
              height: '64px',
              borderRadius: spacing.md,
              background: gradients.purpleToBlue,
              border: `2px solid ${i === 1 ? colors.accent : 'rgba(203, 213, 225, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              cursor: 'pointer',
              transition: transitions.fast,
              '&:hover': {
                transform: 'scale(1.1)',
                borderColor: colors.accent,
                boxShadow: shadows.accentGlow,
              },
            }}
          >
            👤
          </Box>
        ))}
      </Box>

      {/* Video Controls */}
      <Box
        className="video-controls"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: `linear-gradient(to top, rgba(10, 14, 39, 0.9), transparent)`,
          padding: `${spacing.xl} ${spacing.lg} ${spacing.lg}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          zIndex: 5,
        }}
      >
        <Box sx={{ display: 'flex', gap: spacing.md }}>
          {/* Timeline Scrubber */}
          <Box sx={{ flex: 1, minWidth: '300px' }}>
            <Box
              sx={{
                height: '4px',
                background: 'rgba(203, 213, 225, 0.2)',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'relative',
                '&:hover': {
                  height: '6px',
                },
                transition: 'height 0.2s',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: '35%',
                  background: colors.accent,
                  borderRadius: '2px',
                  boxShadow: `0 0 8px ${colors.accent}`,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: spacing.sm, fontSize: '11px', color: colors.textMuted }}>
              <span>01:24:35</span>
              <span>04:00:00</span>
            </Box>
          </Box>
        </Box>

        {/* Control Buttons */}
        <Box sx={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
          <Tooltip title="Picture in Picture">
            <IconButton
              size="small"
              sx={{
                color: colors.textSecondary,
                '&:hover': { color: colors.accent, transform: 'scale(1.1)' },
                transition: transitions.fast,
              }}
            >
              <PictureInPictureAlt fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton
              size="small"
              onClick={() => setIsFullscreen(!isFullscreen)}
              sx={{
                color: colors.textSecondary,
                '&:hover': { color: colors.accent, transform: 'scale(1.1)' },
                transition: transitions.fast,
              }}
            >
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="More Options">
            <IconButton
              size="small"
              sx={{
                color: colors.textSecondary,
                '&:hover': { color: colors.accent },
                transition: transitions.fast,
              }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Recording Indicator */}
      {isStreaming && (
        <Box
          sx={{
            position: 'absolute',
            bottom: spacing.lg,
            right: spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            ...glassEffect,
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: spacing.lg,
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.neonPink,
              boxShadow: `0 0 10px ${colors.neonPink}`,
              animation: 'pulse 1s infinite',
            }}
          />
          <Box sx={{ fontSize: '12px', color: colors.textPrimary, fontWeight: 600 }}>
            REC
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LiveVideoPlayer;
