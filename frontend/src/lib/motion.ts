/**
 * Centralized Motion Constants
 * Consistent, professional-grade motion presets for the SabaHub platform.
 */

export const TRANSITION_PRESETS = {
  // Smooth, subtle transitions for general UI changes
  smooth: {
    type: "tween",
    ease: [0.4, 0, 0.2, 1],
    duration: 0.25,
  },
  // Snappy, professional spring for interactions
  snappy: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
} as const;

export const MOTION_VARIANTS = {
  // Sidebar expansion / collapsing
  sidebar: {
    collapsed: { width: 80, transition: TRANSITION_PRESETS.smooth },
    expanded: { width: 280, transition: TRANSITION_PRESETS.smooth },
  },
  // Fade-in entry for components
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: TRANSITION_PRESETS.smooth },
  },
  // Slide-in for notifications/alerts
  slideInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: TRANSITION_PRESETS.snappy },
  },
  // Button hover / interaction
  hoverScale: {
    rest: { scale: 1 },
    hover: { scale: 1.02, transition: TRANSITION_PRESETS.snappy },
  },
} as const;
