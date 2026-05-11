import type { Variants } from "framer-motion";

/**
 * Framer Motion variants for modals, optimized for mobile performance.
 *
 * - Mobile: slide-up from bottom (feels native, avoids scale jank on low-end devices)
 * - Desktop: scale-in from center (standard modal feel)
 * - Respects prefers-reduced-motion via the `reducedMotion` variants
 */

/** Slide-up animation — used on mobile (< 600px) */
export const slideUpVariants: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

/** Scale-in animation — used on desktop (≥ 600px) */
export const scaleInVariants: Variants = {
  hidden: { scale: 0.92, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", damping: 28, stiffness: 320 },
  },
  exit: {
    scale: 0.92,
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

/** Reduced-motion fallback — simple fade only */
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/** Backdrop fade */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/**
 * Returns the appropriate modal variants based on viewport width.
 * SSR-safe: defaults to scaleIn on server.
 */
export function getModalVariants(): Variants {
  if (typeof window === "undefined") return scaleInVariants;

  // Respect prefers-reduced-motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return reducedMotionVariants;
  }

  // Mobile: slide-up
  if (window.innerWidth < 600) return slideUpVariants;

  // Desktop: scale-in
  return scaleInVariants;
}
