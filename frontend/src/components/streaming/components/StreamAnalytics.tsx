import React, { useState, useEffect } from 'react';
import { Box, Grid, LinearProgress, Chip, IconButton, Tooltip } from '@mui/material';
import { TrendingUp, Visibility, Bolt, AccessTime, AttachMoney, Favorite, Share, X, MoreVert } from '@mui/icons-material';
import { colors, glassEffect, transitions, spacing, shadows } from '../theme';
import { StreamAnalytics } from '../types';

interface StreamAnalyticsComponentProps {
  toggleAnalytics: () => void;
}

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: number | null;
  color?: string;
};

function StatCard({
  icon,
  label,
  value,
  unit = '',
  trend = null,
  color = colors.accent,
}: StatCardProps) {
  return (
    <Box
      sx={{
        ...glassEffect,
        padding: spacing.lg,
        borderRadius: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        cursor: 'pointer',
        '&:hover': {
          ...glassEffect,
          transform: 'translateY(-2px)',
          boxShadow: shadows.lg,
        },
        transition: transitions.fast,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ fontSize: '20px', opacity: 0.7, color }}>
          {icon}
        </Box>
        {trend && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '12px',
              fontWeight: 600,
              color: trend > 0 ? colors.neonGreen : colors.error,
            }}
          >
            <TrendingUp fontSize="small" />
            {trend > 0 ? '+' : ''}{trend}%
          </Box>
        )}
      </Box>
      <Box>
        <Box sx={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', mb: spacing.xs }}>
          {label}
        </Box>
        <Box sx={{ fontSize: '24px', fontWeight: 700, color: colors.textPrimary }}>
          {typeof value === 'number' ? Math.round(value).toLocaleString() : value}
          {unit && <Box sx={{ fontSize: '14px', color: colors.textMuted, display: 'inline', ml: '4px' }}>{unit}</Box>}
        </Box>
      </Box>
    </Box>
  );
}

const StreamAnalyticsComponent: React.FC<StreamAnalyticsComponentProps> = ({ toggleAnalytics }) => {
  const [analytics, setAnalytics] = useState<StreamAnalytics>({
    viewers: 12847,
    peakViewers: 18500,
    avgEngagement: 78,
    bitrate: '6.2 Mbps',
    latency: 0.8,
    fps: 60,
    resolution: '3840x2160',
    donations: 2450,
    likes: 8934,
    shares: 342,
  });

  const [isLive, setIsLive] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(prev => ({
        ...prev,
        viewers: Math.max(prev.viewers + Math.random() * 100 - 40, 100),
        peakViewers: Math.max(prev.peakViewers, prev.viewers),
        bitrate: `${(6 + Math.random() * 2).toFixed(1)} Mbps`,
        latency: 0.5 + Math.random() * 1,
        avgEngagement: Math.min(Math.max(prev.avgEngagement + Math.random() * 4 - 2, 0), 100),
        donations: prev.donations + Math.floor(Math.random() * 50),
        likes: prev.likes + Math.floor(Math.random() * 80),
        shares: prev.shares + Math.floor(Math.random() * 10),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.glassDark,
        overflow: 'hidden',
      }}
    >
      {/* Analytics Header */}
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
        <Box sx={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
          Live Analytics
        </Box>
        <Box sx={{ display: 'flex', gap: spacing.sm }}>
          <Tooltip title="Refresh">
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
          <Tooltip title="Close">
            <IconButton
              size="small"
              onClick={toggleAnalytics}
              sx={{
                color: colors.textMuted,
                '&:hover': { color: colors.textPrimary },
                transition: transitions.fast,
              }}
            >
              <X fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Analytics Content */}
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
        {/* Viewers Section */}
        <Box>
          <Box sx={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, mb: spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Viewers
          </Box>
          <Grid container spacing={spacing.md}>
            <Grid size={6}>
              <StatCard
                icon={<Visibility />}
                label="Current"
                value={analytics.viewers}
                trend={8}
              />
            </Grid>
            <Grid size={6}>
              <StatCard
                icon={<TrendingUp />}
                label="Peak"
                value={analytics.peakViewers}
                trend={12}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Performance Section */}
        <Box>
          <Box sx={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, mb: spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Performance
          </Box>
          <Grid container spacing={spacing.md}>
            <Grid size={6}>
              <StatCard
                icon={<Bolt />}
                label="Bitrate"
                value={analytics.bitrate}
              />
            </Grid>
            <Grid size={6}>
              <StatCard
                icon={<AccessTime />}
                label="Latency"
                value={analytics.latency.toFixed(1)}
                unit="s"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: spacing.lg, ...glassEffect, padding: spacing.lg, borderRadius: spacing.lg }}>
            <Box sx={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, mb: spacing.sm }}>
              FPS: {analytics.fps}
            </Box>
            <LinearProgress
              variant="determinate"
              value={100}
              sx={{
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(139, 92, 246, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${colors.accent}, ${colors.neonPink})`,
                  boxShadow: `0 0 10px ${colors.accent}`,
                },
              }}
            />
            <Box sx={{ fontSize: '11px', color: colors.textMuted, mt: spacing.sm }}>
              Resolution: {analytics.resolution}
            </Box>
          </Box>
        </Box>

        {/* Engagement Section */}
        <Box>
          <Box sx={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, mb: spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Engagement
          </Box>
          <Grid container spacing={spacing.md}>
            <Grid size={6}>
              <StatCard
                icon={<Favorite />}
                label="Likes"
                value={analytics.likes}
                color={colors.neonPink}
              />
            </Grid>
            <Grid size={6}>
              <StatCard
                icon={<Share />}
                label="Shares"
                value={analytics.shares}
                color={colors.neonCyan}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: spacing.md, ...glassEffect, padding: spacing.lg, borderRadius: spacing.lg }}>
            <Box sx={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, mb: spacing.md }}>
              Engagement Rate
            </Box>
            <LinearProgress
              variant="determinate"
              value={analytics.avgEngagement}
              sx={{
                height: '8px',
                borderRadius: '4px',
                background: 'rgba(139, 92, 246, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${colors.neonGreen}, ${colors.accent})`,
                  boxShadow: `0 0 10px ${colors.neonGreen}`,
                },
              }}
            />
            <Box sx={{ fontSize: '11px', color: colors.textMuted, mt: spacing.sm }}>
              {Math.round(analytics.avgEngagement)}% of viewers engaged
            </Box>
          </Box>
        </Box>

        {/* Revenue Section */}
        <Box>
          <Box sx={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, mb: spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Monetization
          </Box>
          <Box
            sx={{
              ...glassEffect,
              padding: spacing.lg,
              borderRadius: spacing.lg,
              textAlign: 'center',
              background: `linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(139, 92, 246, 0.1))`,
              border: `1px solid rgba(16, 185, 129, 0.2)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.md, mb: spacing.md }}>
              <AttachMoney sx={{ color: colors.neonGreen, fontSize: '24px' }} />
            </Box>
            <Box sx={{ fontSize: '28px', fontWeight: 700, color: colors.neonGreen, mb: spacing.sm }}>
              ${analytics.donations}
            </Box>
            <Box sx={{ fontSize: '12px', color: colors.textMuted }}>
              Donations this stream
            </Box>
          </Box>
        </Box>

        {/* Advanced Metrics */}
        <Box>
          <Box sx={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, mb: spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Actions
          </Box>
          <Box sx={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
            {['Generate Clip', 'Export Stats', 'Share Report'].map((action) => (
              <Chip
                key={action}
                label={action}
                sx={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: `1px solid rgba(139, 92, 246, 0.3)`,
                  color: colors.accentLight,
                  cursor: 'pointer',
                  transition: transitions.fast,
                  '&:hover': {
                    background: 'rgba(139, 92, 246, 0.25)',
                    borderColor: colors.accent,
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default StreamAnalyticsComponent;
