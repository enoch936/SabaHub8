import { keyframes } from '@mui/system';

// Animations
export const floatUp = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0) translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-150px) translateX(${Math.random() * 60 - 30}px) scale(0.8);
  }
`;

export const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.1);
  }
  50% {
    box-shadow: 0 0 40px rgba(139, 92, 246, 0.5), inset 0 0 30px rgba(139, 92, 246, 0.2);
  }
`;

export const typingAnimation = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
`;

export const slideInRight = keyframes`
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

export const slideInLeft = keyframes`
  from {
    transform: translateX(-400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

export const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

export const scaleIn = keyframes`
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

export const breathe = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

// Color Palette - Premium Dark Theme
export const colors = {
  // Primary - Deep Space Navy
  primary: '#0a0e27',
  primaryLight: '#1a1f3a',
  
  // Secondary - Vibrant Purple
  accent: '#8b5cf6',
  accentLight: '#a78bfa',
  accentDark: '#7c3aed',
  
  // Neon Accents
  neonPurple: '#d946ef',
  neonCyan: '#06b6d4',
  neonGreen: '#10b981',
  neonOrange: '#f97316',
  neonPink: '#ec4899',
  
  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  
  // Glass Effects
  glassDark: 'rgba(10, 14, 39, 0.7)',
  glassLight: 'rgba(148, 163, 184, 0.05)',
  
  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

// Glass Morphism Effect Styles
export const glassEffect = {
  background: `linear-gradient(135deg, ${colors.glassDark} 0%, rgba(15, 23, 42, 0.5) 100%)`,
  backdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid rgba(203, 213, 225, 0.1)`,
  boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05)`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const glassEffectHover = {
  background: `linear-gradient(135deg, ${colors.glassDark} 0%, rgba(15, 23, 42, 0.6) 100%)`,
  backdropFilter: 'blur(25px) saturate(200%)',
  border: `1px solid rgba(203, 213, 225, 0.2)`,
  boxShadow: `0 25px 70px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.08)`,
};

// Gradient Definitions
export const gradients = {
  purpleToBlue: `linear-gradient(135deg, ${colors.accent} 0%, #3b82f6 100%)`,
  purpleToNeon: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.neonPink} 100%)`,
  darkToPurple: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
  neonGradient: `linear-gradient(90deg, ${colors.neonCyan} 0%, ${colors.neonPurple} 50%, ${colors.neonPink} 100%)`,
  streamActive: `linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)`,
};

// Shadow Definitions
export const shadows = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
  md: '0 8px 24px rgba(0, 0, 0, 0.4)',
  lg: '0 16px 40px rgba(0, 0, 0, 0.5)',
  xl: '0 24px 60px rgba(0, 0, 0, 0.6)',
  
  // Neon glows
  accentGlow: `0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)`,
  neonGlow: `0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(139, 92, 246, 0.3)`,
  successGlow: `0 0 20px rgba(16, 185, 129, 0.3)`,
};

// Border Radius
export const borderRadius = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
};

// Spacing
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
};

// Transitions
export const transitions = {
  fast: 'all 0.15s ease-in-out',
  normal: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
};
