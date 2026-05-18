import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Container, Grid, Paper, IconButton, Tooltip, Badge, Chip, Avatar, AvatarGroup } from '@mui/material';
import { 
  Mic, MicOff, Videocam, VideocamOff, ScreenShare, StopScreenShare,
  Settings, MoreVert, Visibility, TrendingUp, Radio, Circle
} from '@mui/icons-material';
import { colors, glassEffect, glassEffectHover, transitions, shadows, spacing } from './theme';
import LiveVideoPlayer from './components/LiveVideoPlayer';
import StreamChat from './components/StreamChat';
import AudienceReactions from './components/AudienceReactions';
import StreamAnalytics from './components/StreamAnalytics';
import CreatorControls from './components/CreatorControls';
import DeviceIntegration from './components/DeviceIntegration';
import CollaborativeWorkspace from './components/CollaborativeWorkspace';
import StreamTimeline from './components/StreamTimeline';
import MediaQueue from './components/MediaQueue';
import NotificationCenter from './components/NotificationCenter';

interface DashboardState {
  isStreaming: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  chatOpen: boolean;
  analyticsOpen: boolean;
  devicesOpen: boolean;
}

const StreamingDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    isStreaming: true,
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    chatOpen: true,
    analyticsOpen: true,
    devicesOpen: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Mock data for active collaborators
  const activeUsers = [
    { id: '1', name: 'You', avatar: '👤', role: 'host' },
    { id: '2', name: 'Maya', avatar: '👩‍💻', role: 'guest' },
    { id: '3', name: 'Alex', avatar: '👨‍🎓', role: 'moderator' },
  ];

  const toggleStreaming = useCallback(() => {
    setState(prev => ({ ...prev, isStreaming: !prev.isStreaming }));
  }, []);

  const toggleMic = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const toggleCamera = useCallback(() => {
    setState(prev => ({ ...prev, isCameraOff: !prev.isCameraOff }));
  }, []);

  const toggleScreenShare = useCallback(() => {
    setState(prev => ({ ...prev, isScreenSharing: !prev.isScreenSharing }));
  }, []);

  const toggleChat = useCallback(() => {
    setState(prev => ({ ...prev, chatOpen: !prev.chatOpen }));
  }, []);

  const toggleAnalytics = useCallback(() => {
    setState(prev => ({ ...prev, analyticsOpen: !prev.analyticsOpen }));
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.primary} 0%, #0f172a 50%, #1a0033 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)`,
          pointerEvents: 'none',
        },
      }}
    >
      {/* Header with Stream Status */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 100,
          borderBottom: `1px solid rgba(203, 213, 225, 0.1)`,
          background: colors.glassDark,
          backdropFilter: 'blur(10px)',
          padding: spacing.lg,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Branding & Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: state.isStreaming ? colors.neonGreen : colors.error,
                  boxShadow: state.isStreaming 
                    ? `0 0 12px ${colors.neonGreen}` 
                    : `0 0 12px ${colors.error}`,
                  animation: state.isStreaming ? `pulse 2s infinite` : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
              <Box>
                <Box sx={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  letterSpacing: '-0.5px',
                }}>
                  StreamStudio
                </Box>
                <Box sx={{
                  fontSize: '11px',
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  {state.isStreaming ? 'LIVE NOW' : 'OFFLINE'}
                </Box>
              </Box>
            </Box>

            {/* Active Users Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm, ml: spacing.xl }}>
              <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '14px' } }}>
                {activeUsers.map(user => (
                  <Tooltip key={user.id} title={user.name}>
                    <Avatar sx={{ bgcolor: colors.accent, fontSize: '16px' }}>
                      {user.avatar}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
              <Box sx={{ fontSize: '12px', color: colors.textSecondary }}>
                {activeUsers.length} active
              </Box>
            </Box>
          </Box>

          {/* Right Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <Tooltip title="Notifications">
              <IconButton
                size="small"
                sx={{
                  color: colors.textSecondary,
                  '&:hover': { color: colors.accent },
                  transition: transitions.fast,
                }}
              >
                <NotificationCenter />
              </IconButton>
            </Tooltip>

            <Tooltip title="Settings">
              <IconButton
                size="small"
                sx={{
                  color: colors.textSecondary,
                  '&:hover': { color: colors.accent },
                  transition: transitions.fast,
                }}
              >
                <Settings fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Container maxWidth={false} disableGutters sx={{ height: 'calc(100vh - 80px)', position: 'relative' }}>
        <Grid container spacing={0} sx={{ height: '100%' }}>
          {/* Main Content Area - Center */}
          <Grid size={{ xs: 12, sm: 12, md: state.chatOpen && state.analyticsOpen ? 7 : state.chatOpen || state.analyticsOpen ? 8 : 12 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Video Player */}
            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
              <LiveVideoPlayer isStreaming={state.isStreaming} />
            </Box>

            {/* Creator Controls Bar */}
            <CreatorControls
              state={state}
              onToggleStreaming={toggleStreaming}
              onToggleMic={toggleMic}
              onToggleCamera={toggleCamera}
              onToggleScreenShare={toggleScreenShare}
              onToggleChat={toggleChat}
              onToggleAnalytics={toggleAnalytics}
              onToggleDevices={() => setState(prev => ({ ...prev, devicesOpen: !prev.devicesOpen }))}
            />

            {/* Stream Timeline */}
            <Box sx={{ background: colors.glassDark, borderTop: `1px solid rgba(203, 213, 225, 0.1)`, minHeight: '120px' }}>
              <StreamTimeline />
            </Box>
          </Grid>

          {/* Right Sidebar - Chat & Analytics */}
          <Grid size={{ xs: 12, sm: 12, md: state.chatOpen && state.analyticsOpen ? 5 : state.chatOpen || state.analyticsOpen ? 4 : 0 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: `1px solid rgba(203, 213, 225, 0.1)` }}>
            {/* Chat Section */}
            {state.chatOpen && (
              <Box sx={{ flex: 1, minHeight: 0, borderBottom: `1px solid rgba(203, 213, 225, 0.1)` }}>
                <StreamChat toggleChat={toggleChat} />
              </Box>
            )}

            {/* Analytics Section */}
            {state.analyticsOpen && (
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <StreamAnalytics toggleAnalytics={toggleAnalytics} />
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Devices Panel - Modal/Overlay */}
        {state.devicesOpen && (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: { xs: '100%', md: '380px' },
              background: colors.glassDark,
              borderLeft: `1px solid rgba(203, 213, 225, 0.1)`,
              backdropFilter: 'blur(10px)',
              animation: 'slideInRight 0.3s ease-out',
              zIndex: 50,
              overflow: 'auto',
            }}
          >
            <DeviceIntegration onClose={() => setState(prev => ({ ...prev, devicesOpen: false }))} />
          </Box>
        )}

        {/* Audience Reactions */}
        <AudienceReactions />
      </Container>

      {/* Collaborative Workspace Modal */}
      <CollaborativeWorkspace />
    </Box>
  );
};

export default StreamingDashboard;
