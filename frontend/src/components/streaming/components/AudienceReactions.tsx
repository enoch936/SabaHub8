import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { colors, floatUp, spacing } from '../theme';
import { AudienceReaction } from '../types';

const AudienceReactions: React.FC = () => {
  const [reactions, setReactions] = useState<AudienceReaction[]>([]);

  useEffect(() => {
    // Simulate audience reactions
    const interval = setInterval(() => {
      const types = ['heart', 'fire', 'clap', 'like', 'laugh'] as const;
      const emojis = {
        heart: '❤️',
        fire: '🔥',
        clap: '👏',
        like: '👍',
        laugh: '😂',
        thinking: '🤔',
      };

      const randomType = types[Math.floor(Math.random() * types.length)];
      const newReaction: AudienceReaction = {
        id: Date.now().toString(),
        type: randomType,
        emoji: emojis[randomType],
        x: Math.random() * 80 + 10,
        y: 80,
        timestamp: Date.now(),
        duration: 3000,
      };

      setReactions(prev => [...prev, newReaction]);

      // Remove reaction after animation
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== newReaction.id));
      }, newReaction.duration);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {reactions.map((reaction) => (
        <Box
          key={reaction.id}
          sx={{
            position: 'fixed',
            left: `${reaction.x}%`,
            bottom: `${reaction.y}px`,
            fontSize: '40px',
            userSelect: 'none',
            animation: `${floatUp} 3s ease-out forwards`,
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
          }}
        >
          {reaction.emoji}
        </Box>
      ))}
    </Box>
  );
};

export default AudienceReactions;
