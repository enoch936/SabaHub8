/**
 * Ultra-smooth Modern Motion Design System
 * GPU-accelerated animations with cinematic quality
 */

export const motionConfig = {
  // Easing functions for smooth motion
  easing: {
    // Elastic easing for playful interactions
    elasticOut: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    elasticIn: "cubic-bezier(0.36, 0, 0.66, -0.56)",
    elasticInOut: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",

    // Smooth easing for cinema-like motion
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
    smoothIn: "cubic-bezier(0.4, 0, 1, 1)",
    smoothOut: "cubic-bezier(0, 0, 0.2, 1)",

    // Snappy easing for interactive elements
    snappy: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    snappyOut: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",

    // Linear for consistent motion
    linear: "linear",
  },

  // Timing configurations
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
    cinematic: 1200,
  },

  // Stagger timings for sequential animations
  stagger: {
    small: 30,
    medium: 50,
    large: 80,
    xl: 120,
  },

  // GPU acceleration properties
  gpu: {
    transform: "translate3d(0, 0, 0)",
    willChange: "transform, opacity",
    backfaceVisibility: "hidden",
    perspective: "1000px",
  },
};

// Parallax calculation utilities
export const parallaxUtils = {
  calculateParallax: (scrollProgress: number, depth: number) => {
    return scrollProgress * depth * 100;
  },

  calculateDepthTransform: (depth: number, offset: number) => {
    const scale = 1 - depth * 0.05;
    const translateY = offset * depth;
    return {
      scale,
      translateY,
      opacity: 1 - depth * 0.1,
    };
  },
};

// Magnetic cursor utilities
export const magneticUtils = {
  calculateMagneticOffset: (
    mouseX: number,
    mouseY: number,
    elementX: number,
    elementY: number,
    strength: number = 0.5
  ) => {
    const dx = mouseX - (elementX + 50); // 50 = half of typical element width
    const dy = mouseY - (elementY + 50);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Magnetic pull decreases with distance
    const maxDistance = 200;
    if (distance > maxDistance) return { x: 0, y: 0 };

    const force = (1 - distance / maxDistance) * strength;
    return {
      x: (dx / distance) * force * 15,
      y: (dy / distance) * force * 15,
    };
  },

  calculateCursorDistance: (
    mouseX: number,
    mouseY: number,
    elementX: number,
    elementY: number
  ) => {
    const dx = mouseX - elementX;
    const dy = mouseY - elementY;
    return Math.sqrt(dx * dx + dy * dy);
  },
};

// Color utilities for dynamic lighting
export const colorUtils = {
  hexToRgb: (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  rgbToHex: (r: number, g: number, b: number) => {
    return `#${[r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("")}`;
  },

  lerpColor: (color1: string, color2: string, factor: number) => {
    const rgb1 = colorUtils.hexToRgb(color1);
    const rgb2 = colorUtils.hexToRgb(color2);
    if (!rgb1 || !rgb2) return color1;

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);

    return colorUtils.rgbToHex(r, g, b);
  },
};

// Particle generation utilities
export const particleUtils = {
  generateParticles: (count: number, width: number, height: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.25,
    }));
  },

  updateParticles: (
    particles: any[],
    width: number,
    height: number,
    friction: number = 0.99
  ) => {
    return particles.map((p) => {
      let { x, y, vx, vy } = p;

      x += vx;
      y += vy;

      vx *= friction;
      vy *= friction;

      // Bounce off edges
      if (x < 0 || x > width) vx *= -1;
      if (y < 0 || y > height) vy *= -1;

      x = Math.max(0, Math.min(width, x));
      y = Math.max(0, Math.min(height, y));

      return { ...p, x, y, vx, vy };
    });
  },
};

// Glass reflection utilities
export const glassUtils = {
  generateGlassReflection: (
    mouseX: number,
    mouseY: number,
    intensity: number = 0.3
  ) => {
    return {
      x: mouseX,
      y: mouseY,
      intensity,
      blur: 20,
      spread: 100,
    };
  },

  calculateReflectionAngle: (
    normalX: number,
    normalY: number,
    lightX: number,
    lightY: number
  ) => {
    const dx = lightX - normalX;
    const dy = lightY - normalY;
    return Math.atan2(dy, dx);
  },
};

// Aurora gradient utilities
export const auroraUtils = {
  generateAuroraColors: () => [
    "#38bdf8", // neon blue
    "#8b5cf6", // neon violet
    "#ec4899", // neon pink
    "#22d3ee", // neon cyan
  ],

  generateAuroraGradient: (rotation: number) => {
    const colors = auroraUtils.generateAuroraColors();
    const angle = rotation;
    return `conic-gradient(from ${angle}deg, ${colors.join(", ")})`;
  },
};

// Mesh animation utilities
export const meshUtils = {
  generateMeshNoise: (x: number, y: number, scale: number = 50) => {
    // Perlin-like noise using sine waves
    return (
      Math.sin(x / scale) * Math.cos(y / scale) * 0.5 +
      Math.sin(y / scale * 0.7) * Math.cos(x / scale * 0.7) * 0.3 +
      Math.sin((x + y) / scale * 1.3) * 0.2
    );
  },

  generateMeshGrid: (
    width: number,
    height: number,
    resolution: number = 50
  ) => {
    const points = [];
    for (let x = 0; x < width; x += resolution) {
      for (let y = 0; y < height; y += resolution) {
        const noise = meshUtils.generateMeshNoise(x, y);
        points.push({
          x,
          y,
          offsetX: Math.sin(x / 100) * 20,
          offsetY: Math.cos(y / 100) * 20 + noise * 30,
          noise,
        });
      }
    }
    return points;
  },
};

// Depth perspective utilities
export const depthUtils = {
  calculateDepthScale: (depth: number, maxDepth: number = 1) => {
    return 1 - (depth / maxDepth) * 0.3; // Scales from 1 to 0.7
  },

  calculateDepthOpacity: (depth: number, maxDepth: number = 1) => {
    return 1 - (depth / maxDepth) * 0.4; // Fades with depth
  },

  calculateParallaxOffset: (depth: number, scrollY: number) => {
    return scrollY * depth * 0.5;
  },

  createDepthTransform: (depth: number, scrollY: number = 0) => {
    const scale = depthUtils.calculateDepthScale(depth);
    const opacity = depthUtils.calculateDepthOpacity(depth);
    const offset = depthUtils.calculateParallaxOffset(depth, scrollY);

    return {
      transform: `translateY(${offset}px) scale(${scale})`,
      opacity,
      zIndex: Math.round(depth * 1000),
    };
  },
};

// Transition utilities
export const transitionUtils = {
  smoothOpacity: (duration = 300) => ({
    transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  }),

  smoothTransform: (duration = 300) => ({
    transition: `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  }),

  smoothAll: (duration = 300, easing = "cubic-bezier(0.4, 0, 0.2, 1)") => ({
    transition: `all ${duration}ms ${easing}`,
  }),

  elasticPopIn: (duration = 400) => ({
    transition: `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
  }),
};

// Blur and filter utilities
export const filterUtils = {
  cinematicBlur: (amount: number = 5) => `blur(${amount}px)`,
  glassBlur: () => "blur(10px)",
  auroraBlur: () => "blur(40px)",
  glassReflectionBlur: () => "blur(20px)",
};

// Animation keyframes as constants
export const animationKeyframes = {
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
  `,

  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  `,

  glow: `
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
      50% { box-shadow: 0 0 40px rgba(56, 189, 248, 0.6); }
    }
  `,

  shimmer: `
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
  `,

  rotate: `
    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,

  aurora: `
    @keyframes aurora {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
};
