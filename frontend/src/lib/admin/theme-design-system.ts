/**
 * Modern Enterprise Admin Dashboard Design System
 * Glassmorphism + Premium Enterprise Aesthetic
 */

export const designSystem = {
  // Color Palettes
  colors: {
    // Dark Theme
    dark: {
      background: "#0B1120",
      surface: "rgba(17, 25, 40, 0.75)",
      surfaceAlt: "rgba(30, 41, 59, 0.65)",
      border: "rgba(255,255,255,0.08)",
      borderHover: "rgba(255,255,255,0.16)",
      
      primary: "#6366F1",
      primaryLight: "#818CF8",
      primaryDark: "#4F46E5",
      
      secondary: "#8B5CF6",
      secondaryLight: "#A78BFA",
      
      accent: "#06B6D4",
      accentLight: "#22D3EE",
      
      success: "#10B981",
      successLight: "#34D399",
      
      warning: "#F59E0B",
      warningLight: "#FBBF24",
      
      error: "#EF4444",
      errorLight: "#F87171",
      
      textPrimary: "#F8FAFC",
      textSecondary: "#94A3B8",
      textTertiary: "#64748B",
      
      overlay: "rgba(0,0,0,0.4)",
      shadow: "rgba(0,0,0,0.2)",
    },
    
    // Light Theme
    light: {
      background: "#F8FAFC",
      surface: "rgba(255,255,255,0.75)",
      surfaceAlt: "rgba(241,245,249,0.85)",
      border: "rgba(15,23,42,0.06)",
      borderHover: "rgba(15,23,42,0.12)",
      
      primary: "#6366F1",
      primaryLight: "#818CF8",
      primaryDark: "#4F46E5",
      
      secondary: "#8B5CF6",
      secondaryLight: "#A78BFA",
      
      accent: "#06B6D4",
      accentLight: "#22D3EE",
      
      success: "#10B981",
      successLight: "#34D399",
      
      warning: "#F59E0B",
      warningLight: "#FBBF24",
      
      error: "#EF4444",
      errorLight: "#F87171",
      
      textPrimary: "#111827",
      textSecondary: "#6B7280",
      textTertiary: "#9CA3AF",
      
      overlay: "rgba(0,0,0,0.08)",
      shadow: "rgba(0,0,0,0.08)",
    },
  },

  // Typography
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    
    heading1: {
      fontSize: "32px",
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: "-0.5px",
    },
    
    heading2: {
      fontSize: "24px",
      fontWeight: 700,
      lineHeight: 1.33,
      letterSpacing: "-0.3px",
    },
    
    heading3: {
      fontSize: "20px",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    
    bodyLarge: {
      fontSize: "16px",
      fontWeight: 500,
      lineHeight: 1.5,
    },
    
    body: {
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 1.5,
    },
    
    bodySmall: {
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: 1.4,
    },
    
    labelLarge: {
      fontSize: "13px",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
    },
    
    label: {
      fontSize: "12px",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
    },
  },

  // Spacing
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
  },

  // Border Radius
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    full: "9999px",
  },

  // Glass Effect
  glass: {
    blur: "blur(18px)",
    backdropFilter: "backdrop-filter: blur(18px)",
  },

  // Shadow System
  shadows: {
    sm: "0 4px 16px rgba(0, 0, 0, 0.1)",
    md: "0 8px 24px rgba(0, 0, 0, 0.12)",
    lg: "0 12px 32px rgba(0, 0, 0, 0.15)",
    xl: "0 24px 48px rgba(0, 0, 0, 0.18)",
    
    // Glass shadows
    glassDark: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
    glassLight: "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.4)",
    
    // Hover states
    glassHoverDark: "0 12px 48px rgba(0,0,0,0.25)",
    glassHoverLight: "0 12px 48px rgba(0,0,0,0.12)",
  },

  // Transitions
  transitions: {
    fast: "all 150ms ease-out",
    base: "all 200ms ease-out",
    slow: "all 300ms ease-out",
    slowest: "all 500ms ease-out",
  },

  // Z-index Scale
  zIndex: {
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modal: 400,
    tooltip: 500,
    notification: 600,
  },

  // Animation Curves
  easing: {
    easeOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 1, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },
} as const;

// Responsive breakpoints
export const breakpoints = {
  mobile: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// Layout constants
export const layout = {
  sidebarWidth: 280,
  sidebarWidthCompact: 80,
  navbarHeight: 64,
  contentPadding: 24,
} as const;

// Chart colors (Recharts compatible)
export const chartColors = {
  primary: "#6366F1",
  secondary: "#8B5CF6",
  accent: "#06B6D4",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  neutral: "#94A3B8",
  palette: [
    "#6366F1",
    "#8B5CF6",
    "#06B6D4",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#3B82F6",
    "#14B8A6",
    "#F43F5E",
    "#06B6D4",
  ],
} as const;
