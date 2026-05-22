/**
 * Motion Design System - Complete Index
 * Ultra-smooth modern animations with GPU acceleration
 */

// ============= UTILITIES & CONFIG =============

// Motion design configuration and easing functions
export * from "@/lib/motion-design";

// GPU acceleration configuration and performance utilities
export * from "@/lib/gpu-acceleration";

// ============= PARALLAX SCROLLING =============

export {
  ParallaxLayer,
  ParallaxSection,
  HorizontalParallax,
  DepthParallax,
} from "@/components/animations/ParallaxScrolling";

// ============= MOUSE REACTIVE LIGHTING =============

export {
  MouseReactiveLight,
  InteractiveLighting,
  Spotlight,
} from "@/components/animations/MouseReactiveLighting";

// ============= DYNAMIC GLASS REFLECTIONS =============

export {
  DynamicGlassReflection,
  GlassMorphism,
  EnvironmentalReflection,
  PrismaticGlass,
} from "@/components/animations/DynamicGlassReflections";

// ============= FLOATING PARTICLES =============

export {
  FloatingParticles,
  DOMParticles,
  ParticleBurst,
} from "@/components/animations/FloatingParticles";

// ============= AURORA & ANIMATED BACKGROUNDS =============

export {
  AuroraGradient,
  AnimatedBackground,
  AnimatedMesh,
  FluidGradient,
  ParticleMesh,
} from "@/components/animations/AuroraGradients";

// ============= DEPTH PERSPECTIVE & SMOOTH TRANSITIONS =============

export {
  DepthPerspective,
  DepthLayer,
  StaggeredDepthReveal,
  SmoothOpacity,
  SmoothTransform,
  ElasticPopIn,
  FadeInOnScroll,
  StaggeredText,
  SmoothScrollTrigger,
} from "@/components/animations/DepthPerspective";

// ============= INTERACTIVE CARD TILT & MAGNETIC HOVER =============

export {
  InteractiveCardTilt,
  MagneticHover,
  EnhancedInteractiveCard,
  MagneticButton,
  InteractiveHoverElement,
} from "@/components/animations/InteractiveCardTilt";

// ============= CINEMATIC LOADING SCREENS =============

export {
  CinematicLoadingBar,
  HolographicSpinner,
  MeshLoadingScreen,
  AuroraLoading,
  CircuitLoading,
  CinematicLoadingModal,
} from "@/components/animations/CinematicLoading";

// ============= AI FUTURISTIC ATMOSPHERE =============

export {
  AIEnergyPulse,
  HolographicBackground,
  NeuralNetwork,
  QuantumTunnel,
  DataStreamText,
  GlitchText,
} from "@/components/animations/AIFuturisticAtmosphere";

/**
 * QUICK START GUIDE
 * 
 * 1. PARALLAX SCROLLING
 *    Use <ParallaxLayer depth={0.5}> to create depth-based parallax effects
 * 
 * 2. MOUSE REACTIVE LIGHTING
 *    Wrap content with <MouseReactiveLight> for interactive light effects
 * 
 * 3. GLASS REFLECTIONS
 *    Use <DynamicGlassReflection> for reflective glass surfaces
 * 
 * 4. FLOATING PARTICLES
 *    Add <FloatingParticles> for background particle effects
 * 
 * 5. AURORA GRADIENTS
 *    Use <AuroraGradient> or <AnimatedBackground variant="aurora">
 * 
 * 6. DEPTH & TRANSITIONS
 *    Use <SmoothOpacity>, <StaggeredDepthReveal>, <FadeInOnScroll>
 * 
 * 7. INTERACTIVE ELEMENTS
 *    Enhance cards/buttons with <InteractiveCardTilt>, <MagneticButton>
 * 
 * 8. LOADING SCREENS
 *    Use <MeshLoadingScreen> or <HolographicSpinner>
 * 
 * 9. AI EFFECTS
 *    Use <HolographicBackground>, <NeuralNetwork>, <QuantumTunnel>
 * 
 * 10. PERFORMANCE
 *     Check GPU support: performanceUtils.isGPUAccelerationSupported()
 *     Reduce motion: performanceUtils.prefersReducedMotion()
 */
