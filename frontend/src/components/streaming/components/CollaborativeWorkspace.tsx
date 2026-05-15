import React, { useState } from 'react';
import { Box, Button, Dialog, Avatar, AvatarGroup, Chip, Badge, IconButton } from '@mui/material';
import { Close, Videocam, Hand, Mic, Settings } from '@mui/icons-material';
import { colors, glassEffect, transitions, spacing, shadows } from '../theme';

const CollaborativeWorkspace: React.FC = () => {
  const [open, setOpen] = useState(false);

  const collaborators = [
    { id: '1', name: 'Maya', role: 'guest', avatar: '👩‍💻', isMuted: false },
    { id: '2', name: 'Alex', role: 'moderator', avatar: '👨‍🎓', isMuted: true },
    { id: '3', name: 'Jordan', role: 'guest', avatar: '🎮', isMuted: false },
  ];

  const pendingRequests = [
    { id: '1', name: 'Sarah', avatar: '👩‍🎨' },
    { id: '2', name: 'Chris', avatar: '👨‍💼' },
  ];

  return (
    <>
      {/* Floating Collaboration Widget */}
      <Box
        sx={{
          position: 'fixed',
          bottom: spacing.xl,
          left: spacing.xl,
          zIndex: 500,
          ...glassEffect,
          padding: spacing.lg,
          borderRadius: spacing.xl,
          cursor: 'pointer',
          transition: transitions.fast,
          '&:hover': {
            ...glassEffect,
            boxShadow: shadows.lg,
          },
        }}
        onClick={() => setOpen(true)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <Box>
            <Box sx={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, mb: spacing.xs }}>
              Collaborators
            </Box>
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '12px' } }}>
              {collaborators.map(c => (
                <Badge
                  key={c.id}
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: c.isMuted ? colors.error : colors.neonGreen,
                      boxShadow: `0 0 0 2px ${colors.primary}`,
                    },
                  }}
                >
                  <Avatar sx={{ bgcolor: colors.accent, fontSize: '12px' }}>
                    {c.avatar}
                  </Avatar>
                </Badge>
              ))}
            </AvatarGroup>
          </Box>
          {pendingRequests.length > 0 && (
            <Chip
              label={`+${pendingRequests.length}`}
              size="small"
              sx={{
                background: colors.accent,
                color: colors.primary,
                fontWeight: 700,
                height: '24px',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Workspace Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            ...glassEffect,
            borderRadius: spacing.xl,
          },
        }}
      >
        <Box sx={{ padding: spacing.xl, display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
              Collaborative Workspace
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <Close sx={{ color: colors.textMuted }} />
            </IconButton>
          </Box>

          {/* Active Collaborators */}
          <Box>
            <Box sx={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, mb: spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active ({collaborators.length})
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {collaborators.map(collab => (
                <Box
                  key={collab.id}
                  sx={{
                    ...glassEffect,
                    padding: spacing.md,
                    borderRadius: spacing.lg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                    <Box sx={{ fontSize: '24px' }}>{collab.avatar}</Box>
                    <Box>
                      <Box sx={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                        {collab.name}
                      </Box>
                      <Box sx={{ fontSize: '11px', color: colors.textMuted, textTransform: 'capitalize' }}>
                        {collab.role}
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: spacing.sm }}>
                    <IconButton
                      size="small"
                      sx={{
                        color: collab.isMuted ? colors.error : colors.neonGreen,
                        background: 'rgba(139, 92, 246, 0.1)',
                        '&:hover': { background: 'rgba(139, 92, 246, 0.2)' },
                      }}
                    >
                      {collab.isMuted ? <Mic /> : <Mic />}
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        color: colors.textMuted,
                        '&:hover': { color: colors.accent },
                      }}
                    >
                      <Settings fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <Box>
              <Box sx={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, mb: spacing.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Requests ({pendingRequests.length})
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {pendingRequests.map(req => (
                  <Box
                    key={req.id}
                    sx={{
                      ...glassEffect,
                      padding: spacing.md,
                      borderRadius: spacing.lg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                      <Box sx={{ fontSize: '24px' }}>{req.avatar}</Box>
                      <Box sx={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                        {req.name}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: spacing.sm }}>
                      <Button
                        size="small"
                        sx={{
                          color: colors.primary,
                          background: colors.neonGreen,
                          fontSize: '11px',
                          fontWeight: 700,
                          '&:hover': { opacity: 0.9 },
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        sx={{
                          color: colors.textMuted,
                          border: `1px solid rgba(203, 213, 225, 0.2)`,
                          fontSize: '11px',
                          fontWeight: 700,
                          '&:hover': { borderColor: colors.textMuted },
                        }}
                      >
                        Decline
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: spacing.md, pt: spacing.lg, borderTop: `1px solid rgba(203, 213, 225, 0.1)` }}>
            <Button
              fullWidth
              sx={{
                color: colors.primary,
                background: colors.accent,
                fontWeight: 700,
                '&:hover': { background: colors.accentLight },
              }}
            >
              Invite Collaborator
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default CollaborativeWorkspace;
