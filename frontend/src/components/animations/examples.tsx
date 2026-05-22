/**
 * Motion Design System - Usage Examples
 * Real-world patterns for ultra-smooth modern animations
 */

import React from "react";
import {
  ParallaxLayer,
  MouseReactiveLight,
  FloatingParticles,
  AuroraGradient,
  InteractiveCardTilt,
  MagneticButton,
  SmoothOpacity,
  FadeInOnScroll,
  HolographicBackground,
  NeuralNetwork,
  MeshLoadingScreen,
  StaggeredDepthReveal,
  EnhancedInteractiveCard,
} from "./index";

// ============= EXAMPLE 1: Hero Section with All Effects =============

export const HeroSectionExample = () => {
  return (
    <AuroraGradient intensity={0.9} className="relative w-full min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <FloatingParticles count={40} colors={["#38bdf8", "#ec4899", "#8b5cf6"]} />
      </div>

      {/* Interactive light */}
      <MouseReactiveLight intensity={0.4} color="#38bdf8">
        {/* Main content */}
        <ParallaxLayer depth={0.3} className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4">
              Ultra-Smooth Motion Design
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              GPU-accelerated animations with cinematic quality
            </p>

            <MagneticButton variant="primary" className="px-8 py-4">
              Get Started
            </MagneticButton>
          </div>
        </ParallaxLayer>
      </MouseReactiveLight>

      {/* Foreground parallax layer */}
      <ParallaxLayer depth={0.8} className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </ParallaxLayer>
    </AuroraGradient>
  );
};

// ============= EXAMPLE 2: Feature Cards Section =============

export const FeatureCardsExample = () => {
  const features = [
    {
      title: "Parallax Scrolling",
      description: "Multi-layer depth effects",
      icon: "🌀",
    },
    {
      title: "Glass Morphism",
      description: "Dynamic reflective surfaces",
      icon: "✨",
    },
    {
      title: "Particle Effects",
      description: "Floating and interactive particles",
      icon: "🎆",
    },
    {
      title: "Aurora Gradients",
      description: "Cinematic animated backgrounds",
      icon: "🌌",
    },
  ];

  return (
    <div className="w-full py-20 px-4">
      <StaggeredDepthReveal className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => (
          <FadeInOnScroll key={idx} from="bottom" delay={idx * 0.1}>
            <EnhancedInteractiveCard
              className="p-6 h-full"
              magneticStrength={0.3}
              tiltIntensity={10}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {feature.description}
              </p>
            </EnhancedInteractiveCard>
          </FadeInOnScroll>
        ))}
      </StaggeredDepthReveal>
    </div>
  );
};

// ============= EXAMPLE 3: Holographic AI Section =============

export const HolographicAISection = () => {
  return (
    <HolographicBackground className="relative w-full min-h-screen overflow-hidden flex items-center justify-center">
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            AI-Powered Animation System
          </h2>
          <p className="text-gray-300">
            Experience next-generation motion design
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Holographic background with neural network */}
          <div className="relative h-96 rounded-xl overflow-hidden border border-cyan-500/30">
            <NeuralNetwork nodeCount={15} connectionDistance={100} />
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              "Quantum tunnel effects",
              "Holographic data visualization",
              "Neural network animations",
              "AI energy pulses",
              "Data stream effects",
              "Glitch animations",
            ].map((feature, idx) => (
              <SmoothOpacity key={idx} delay={idx * 0.1}>
                <div className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3" />
                  <span className="text-white">{feature}</span>
                </div>
              </SmoothOpacity>
            ))}
          </div>
        </div>
      </div>
    </HolographicBackground>
  );
};

// ============= EXAMPLE 4: Loading Screen =============

export const LoadingScreenExample = () => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 30;
        return next > 100 ? 100 : next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen">
      <MeshLoadingScreen
        progress={Math.round(progress)}
        title="Initializing Experience"
        subtitle="Preparing your motion design interface"
      />
    </div>
  );
};

// ============= EXAMPLE 5: Interactive Dashboard =============

export const InteractiveDashboardExample = () => {
  return (
    <div className="w-full min-h-screen bg-black p-8">
      {/* Animated background */}
      <div className="absolute inset-0">
        <FloatingParticles count={30} speed={0.3} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-12">
          Interactive Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat cards */}
          {[
            { label: "Performance", value: "98%", trend: "+5%" },
            { label: "Engagement", value: "2.4M", trend: "+12%" },
            { label: "Retention", value: "87%", trend: "+8%" },
          ].map((stat, idx) => (
            <FadeInOnScroll key={idx} delay={idx * 0.15}>
              <InteractiveCardTilt intensity={15}>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mb-2">
                    {stat.value}
                  </p>
                  <p className="text-green-400 text-sm">{stat.trend}</p>
                </div>
              </InteractiveCardTilt>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============= EXAMPLE 6: Smooth Page Transition =============

export const PageTransitionExample = () => {
  return (
    <div className="w-full min-h-screen">
      <SmoothOpacity duration={0.8} className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-6">
            Page Transitions
          </h1>

          <div className="space-y-6">
            {[1, 2, 3].map((item) => (
              <FadeInOnScroll key={item} from="left" distance={40}>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Section {item}
                  </h3>
                  <p className="text-gray-400">
                    Smooth fade-in animation on scroll with parallax depth effect
                  </p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </SmoothOpacity>
    </div>
  );
};

// ============= EXAMPLE 7: Advanced Parallax Layout =============

export const AdvancedParallaxExample = () => {
  return (
    <div className="relative w-full min-h-[300vh] bg-black">
      {/* Background layer */}
      <ParallaxLayer depth={0.1} className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 to-black" />
      </ParallaxLayer>

      {/* Mid-ground layer */}
      <ParallaxLayer depth={0.3} className="fixed inset-0 -z-10">
        <FloatingParticles count={20} speed={0.2} />
      </ParallaxLayer>

      {/* Foreground content */}
      <div className="relative z-0 space-y-[30vh]">
        <section className="min-h-screen flex items-center justify-center">
          <h1 className="text-5xl font-bold text-white text-center">
            Parallax Layer 1
          </h1>
        </section>

        <section className="min-h-screen flex items-center justify-center">
          <h2 className="text-5xl font-bold text-white text-center">
            Parallax Layer 2
          </h2>
        </section>

        <section className="min-h-screen flex items-center justify-center">
          <h2 className="text-5xl font-bold text-white text-center">
            Parallax Layer 3
          </h2>
        </section>
      </div>
    </div>
  );
};

/**
 * INTEGRATION PATTERNS
 * 
 * 1. HERO SECTIONS: Use AuroraGradient + MouseReactiveLight + ParallaxLayer
 * 2. FEATURE SHOWCASES: Use StaggeredDepthReveal + InteractiveCardTilt
 * 3. LOADING STATES: Use MeshLoadingScreen + HolographicSpinner
 * 4. DATA VISUALIZATIONS: Use HolographicBackground + NeuralNetwork
 * 5. DASHBOARDS: Use FloatingParticles + InteractiveCardTilt + FadeInOnScroll
 * 6. PAGE TRANSITIONS: Use SmoothOpacity + StaggeredText
 * 7. SCROLLABLE CONTENT: Use ParallaxLayer + FadeInOnScroll
 */
