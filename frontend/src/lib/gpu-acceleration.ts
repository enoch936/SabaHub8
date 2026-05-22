/**
 * GPU Acceleration & Performance Utilities
 * Optimized rendering settings and performance monitoring
 */

export const gpuAccelerationConfig = {
  // CSS properties for GPU acceleration
  transform3d: {
    transform: "translate3d(0, 0, 0)",
    WebkitTransform: "translate3d(0, 0, 0)",
  },

  willChange: {
    willChange: "transform, opacity",
    WebkitWillChange: "transform, opacity",
  },

  backfaceHidden: {
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  },

  perspective: {
    perspective: "1000px",
    WebkitPerspective: "1000px",
  },

  // Framer Motion optimization config
  animationConfig: {
    initial: { willChange: "auto" },
    animate: { willChange: "transform, opacity" },
    exit: { willChange: "auto" },
  },

  // Spring configuration for smooth motion
  springConfig: {
    smooth: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
      mass: 0.5,
    },
    snappy: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      mass: 0.5,
    },
    bouncy: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10,
      mass: 0.8,
    },
  },

  // Timing optimizations
  timingConfig: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    verySlow: 0.8,
  },
};

// Performance utilities
export const performanceUtils = {
  // Check GPU support
  isGPUAccelerationSupported: () => {
    if (typeof window === "undefined") return false;
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as any);
    return !!gl;
  },

  // Request idle callback with fallback
  requestIdleCallback:
    typeof window !== "undefined"
      ? window.requestIdleCallback ||
        ((cb: IdleRequestCallback) => setTimeout(cb, 1))
      : () => 0,

  // Debounce animations
  debounceAnimation: (
    callback: FrameRequestCallback,
    delay: number = 16
  ) => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  },

  // Throttle animations
  throttleAnimation: (
    callback: FrameRequestCallback,
    limit: number = 16
  ) => {
    let inThrottle: boolean;
    return () => {
      if (!inThrottle) {
        callback(Date.now());
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  },

  // Measure performance
  measurePerformance: (
    name: string,
    callback: () => void
  ) => {
    if (typeof window === "undefined" || !performance) return;
    const start = performance.now();
    callback();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  },

  // Detect reduced motion preference
  prefersReducedMotion: () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  // Get optimal animation duration based on motion preference
  getAnimationDuration: (
    normalDuration: number,
    reducedDuration: number = 0.1
  ) => {
    return performanceUtils.prefersReducedMotion()
      ? reducedDuration
      : normalDuration;
  },
};

// CSS-in-JS utilities for GPU acceleration
export const gpuOptimizedStyles = {
  // Highly optimized transition
  smoothTransition: (
    properties: string = "all",
    duration: number = 300
  ) => ({
    transition: `${properties} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    willChange: properties,
  }),

  // Hardware accelerated animation setup
  hardwareAccelerated: {
    WebkitTransform: "translateZ(0)",
    WebkitWillChange: "transform, opacity",
    perspective: "1000px",
    backfaceVisibility: "hidden",
  },

  // Optimized container for animations
  animationContainer: {
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
    perspective: "1000px",
    WebkitFontSmoothing: "antialiased",
    WebkitTextSizeAdjust: "100%",
  },

  // GPU-accelerated filter effects
  efficientFilter: (
    blur: number = 0,
    brightness: number = 1,
    contrast: number = 1
  ) => ({
    filter: `blur(${blur}px) brightness(${brightness}) contrast(${contrast})`,
    WebkitFilter: `blur(${blur}px) brightness(${brightness}) contrast(${contrast})`,
    willChange: "filter",
  }),

  // Optimized opacity transition
  opacityTransition: {
    transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    willChange: "opacity",
  },

  // Optimized transform transition
  transformTransition: {
    transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    willChange: "transform",
  },
};

// Animation performance hooks helpers
export const animationPerformanceHints = {
  // Recommended animation count for smooth 60fps
  maxConcurrentAnimations: 5,

  // Canvas rendering recommendations
  canvasOptimizations: {
    useOffscreenCanvas: true,
    enableImageSmoothing: false,
    renderOnDemand: true,
  },

  // Particle system recommendations
  particleSystemLimits: {
    maxParticles: 500,
    maxConcurrentSystems: 3,
    useCanvasRendering: true,
  },

  // Recommended debounce/throttle delays
  throttleDelays: {
    mousemove: 16, // 60fps
    scroll: 16, // 60fps
    resize: 100, // Less frequent
  },
};

// Cache-friendly animation utilities
export const cacheFriendlyAnimations = {
  // Create memoized spring configs
  createSpringConfig: (
    preset: "smooth" | "snappy" | "bouncy" = "smooth"
  ) => {
    const configs = {
      smooth: { stiffness: 100, damping: 20 },
      snappy: { stiffness: 300, damping: 30 },
      bouncy: { stiffness: 400, damping: 10 },
    };
    return {
      type: "spring" as const,
      ...configs[preset],
    };
  },

  // Create memoized transition configs
  createTransitionConfig: (
    duration: number = 300,
    easing: string = "cubic-bezier(0.4, 0, 0.2, 1)"
  ) => ({
    duration: duration / 1000,
    ease: easing,
  }),
};

// Memory management for animations
export const memoryOptimization = {
  // Cleanup animation resources
  cleanupAnimationResources: () => {
    if (typeof window === "undefined") return;

    // Cancel all animation frames
    let maxId = 0;
    while (maxId <= 10000) {
      try {
        cancelAnimationFrame(maxId);
      } catch {
        // Continue
      }
      maxId++;
    }
  },

  // Monitor animation memory usage
  getAnimationMemoryUsage: () => {
    if (
      typeof performance === "undefined" ||
      !performance.memory
    ) {
      return null;
    }

    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      percentUsed:
        (performance.memory.usedJSHeapSize /
          performance.memory.jsHeapSizeLimit) *
        100,
    };
  },
};

// Progressive enhancement for animations
export const progressiveEnhancement = {
  // Disable animations on low-end devices
  shouldReduceAnimations: () => {
    return (
      performanceUtils.prefersReducedMotion() ||
      !performanceUtils.isGPUAccelerationSupported()
    );
  },

  // Get animation config based on device capabilities
  getAdaptiveAnimationConfig: () => {
    if (progressiveEnhancement.shouldReduceAnimations()) {
      return {
        duration: 0,
        stiffness: 500,
        damping: 50,
      };
    }

    return {
      duration: 0.3,
      stiffness: 100,
      damping: 20,
    };
  },

  // Polyfill for missing animation APIs
  polyfillAnimationAPIs: () => {
    if (typeof window === "undefined") return;

    // Polyfill requestIdleCallback
    if (!window.requestIdleCallback) {
      window.requestIdleCallback = (cb: IdleRequestCallback) =>
        setTimeout(cb, 1);
    }

    // Polyfill cancelIdleCallback
    if (!window.cancelIdleCallback) {
      window.cancelIdleCallback = (id: number) => clearTimeout(id);
    }
  },
};
