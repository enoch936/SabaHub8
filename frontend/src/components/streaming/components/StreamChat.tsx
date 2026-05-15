import React, { useState, useRef, useEffect } from 'react';
import { Box, InputBase, IconButton, Tooltip, Avatar, Popover, Grid } from '@mui/material';
import { SendRounded, EmojiEmotions, Pin, X, SmileOutlined } from '@mui/icons-material';
import { colors, glassEffect, glassEffectHover, transitions, shadows, spacing, floatUp } from '../theme';
import { ChatMessage, ChatReaction, StreamUser } from '../types';

interface StreamChatProps {
  toggleChat: () => void;
}

const StreamChat: React.FC<StreamChatProps> = ({ toggleChat }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'Alex',
      avatar: '👨‍💻',
      content: 'Amazing stream quality today! 🔥',
      timestamp: Date.now() - 120000,
      reactions: [{ type: 'fire', emoji: '🔥', count: 12 }, { type: 'like', emoji: '👍', count: 5 }],
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Maya',
      avatar: '👩‍🎨',
      content: 'Love the new intro music',
      timestamp: Date.now() - 60000,
      reactions: [{ type: 'heart', emoji: '❤️', count: 8 }],
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Jordan',
      avatar: '🎮',
      content: 'Can you show us the rendering process?',
      timestamp: Date.now() - 30000,
      reactions: [],
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>(['Sarah', 'Chris']);
  const [emojiAnchor, setEmojiAnchor] = useState<null | HTMLElement>(null);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(messages[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: ChatMessage = {
        id: String(messages.length + 1),
        userId: 'currentUser',
        userName: 'You',
        avatar: '👤',
        content: inputValue,
        timestamp: Date.now(),
        reactions: [],
      };
      setMessages([...messages, newMessage]);
      setInputValue('');
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleEmojiClick = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setEmojiAnchor(null);
  };

  const emojis = ['😂', '🔥', '❤️', '👍', '🎉', '😍', '🚀', '💯', '🎊', '✨', '😎', '🤔'];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.glassDark,
      }}
    >
      {/* Chat Header */}
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
          Live Chat
        </Box>
        <IconButton
          size="small"
          onClick={toggleChat}
          sx={{
            color: colors.textMuted,
            '&:hover': { color: colors.textPrimary },
            transition: transitions.fast,
          }}
        >
          <X fontSize="small" />
        </IconButton>
      </Box>

      {/* Pinned Message */}
      {pinnedMessage && (
        <Box
          sx={{
            background: `linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1))`,
            border: `1px solid rgba(139, 92, 246, 0.3)`,
            borderRadius: spacing.md,
            padding: spacing.md,
            margin: spacing.md,
            marginBottom: spacing.sm,
            fontSize: '12px',
            color: colors.textSecondary,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm, mb: spacing.sm }}>
            <Pin sx={{ fontSize: '14px', color: colors.accent }} />
            <Box sx={{ fontWeight: 600, color: colors.accent }}>Pinned Message</Box>
          </Box>
          <Box sx={{ display: 'flex', gap: spacing.md }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: '14px', bgcolor: colors.accent }}>
              {pinnedMessage.avatar}
            </Avatar>
            <Box>
              <Box sx={{ fontWeight: 600, color: colors.textPrimary, mb: spacing.xs }}>
                {pinnedMessage.userName}
              </Box>
              <Box sx={{ color: colors.textMuted, lineHeight: 1.4 }}>
                {pinnedMessage.content}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          padding: spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(139, 92, 246, 0.3)',
            borderRadius: '3px',
            '&:hover': {
              background: 'rgba(139, 92, 246, 0.5)',
            },
          },
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              gap: spacing.sm,
              animation: `slideInLeft 0.3s ease-out`,
              '@keyframes slideInLeft': {
                from: { transform: 'translateX(-20px)', opacity: 0 },
                to: { transform: 'translateX(0)', opacity: 1 },
              },
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `rgba(139, 92, 246, 0.05)`;
              e.currentTarget.style.borderRadius = spacing.md;
              e.currentTarget.style.padding = spacing.sm;
              e.currentTarget.style.marginLeft = `-${spacing.sm}`;
              e.currentTarget.style.marginRight = `-${spacing.sm}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.padding = '0';
              e.currentTarget.style.marginLeft = '0';
              e.currentTarget.style.marginRight = '0';
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '16px',
                bgcolor: colors.accent,
                flexShrink: 0,
              }}
            >
              {message.avatar}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: spacing.sm, mb: spacing.xs }}>
                <Box sx={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                  {message.userName}
                </Box>
                <Box sx={{ fontSize: '11px', color: colors.textMuted }}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Box>
              </Box>
              <Box sx={{ fontSize: '13px', color: colors.textSecondary, lineHeight: 1.4, wordBreak: 'break-word' }}>
                {message.content}
              </Box>
              {message.reactions.length > 0 && (
                <Box sx={{ display: 'flex', gap: spacing.xs, mt: spacing.sm, flexWrap: 'wrap' }}>
                  {message.reactions.map((reaction, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        padding: `2px ${spacing.sm}`,
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: `1px solid rgba(139, 92, 246, 0.3)`,
                        borderRadius: '12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: transitions.fast,
                        '&:hover': {
                          background: 'rgba(139, 92, 246, 0.3)',
                          borderColor: colors.accent,
                        },
                      }}
                    >
                      <Box>{reaction.emoji}</Box>
                      <Box sx={{ fontSize: '11px', fontWeight: 600, color: colors.accentLight }}>
                        {reaction.count}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ))}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <Box sx={{ display: 'flex', gap: spacing.sm, alignItems: 'center', mt: spacing.md }}>
            <Box sx={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map(i => (
                <Box
                  key={i}
                  sx={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: colors.accent,
                    animation: `${floatUp} 1.4s infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </Box>
            <Box sx={{ fontSize: '12px', color: colors.textMuted }}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Chat Input Area */}
      <Box
        sx={{
          padding: spacing.lg,
          borderTop: `1px solid rgba(203, 213, 225, 0.1)`,
          display: 'flex',
          gap: spacing.sm,
        }}
      >
        <Box
          sx={{
            flex: 1,
            ...glassEffect,
            display: 'flex',
            alignItems: 'center',
            paddingX: spacing.md,
            paddingY: spacing.sm,
            '&:hover': glassEffectHover,
            '&:focus-within': {
              borderColor: `rgba(139, 92, 246, 0.5)`,
              boxShadow: `0 0 15px rgba(139, 92, 246, 0.3)`,
            },
          }}
        >
          <InputBase
            ref={inputRef}
            fullWidth
            placeholder="Type a message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            sx={{
              fontSize: '13px',
              color: colors.textPrimary,
              '& .MuiInputBase-input': {
                '&::placeholder': {
                  color: colors.textMuted,
                  opacity: 1,
                },
              },
            }}
          />

          <Tooltip title="Emojis">
            <IconButton
              size="small"
              onClick={(e) => setEmojiAnchor(e.currentTarget)}
              sx={{
                color: colors.textMuted,
                '&:hover': { color: colors.accent },
                transition: transitions.fast,
              }}
            >
              <SmileOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Tooltip title="Send">
          <IconButton
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            sx={{
              color: inputValue.trim() ? colors.accent : colors.textMuted,
              background: inputValue.trim() ? `rgba(139, 92, 246, 0.15)` : 'transparent',
              '&:hover': {
                background: inputValue.trim() ? `rgba(139, 92, 246, 0.25)` : 'transparent',
              },
              transition: transitions.fast,
            }}
          >
            <SendRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        PaperProps={{
          sx: {
            ...glassEffect,
            background: colors.glassDark,
            border: `1px solid rgba(203, 213, 225, 0.1)`,
          },
        }}
      >
        <Grid container spacing={1} sx={{ padding: spacing.md, width: '240px' }}>
          {emojis.map((emoji) => (
            <Grid item xs={3} key={emoji}>
              <Box
                onClick={() => handleEmojiClick(emoji)}
                sx={{
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: spacing.sm,
                  borderRadius: spacing.md,
                  transition: transitions.fast,
                  '&:hover': {
                    background: `rgba(139, 92, 246, 0.2)`,
                    transform: 'scale(1.2)',
                  },
                }}
              >
                {emoji}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Popover>
    </Box>
  );
};

export default StreamChat;
