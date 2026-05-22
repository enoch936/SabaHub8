/**
 * Dynamic Glass Reflections
 * Real-time reflective glass surface effects with lighting
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface DynamicGlassReflectionProps {
  className?: string;
  children?: React.ReactNode;
  intensity?: number;
  blur?: number;
}

export const DynamicGlassReflection: React.FC<
  DynamicGlassReflectionProps
> = ({
  className = "",
  children,
  intensity = 0.4,
  blur = 20,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [reflection, setReflection] = useState({ x: 0, y: 0, opacity: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX,
        y: e.clientY,
      });

      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      // Calculate reflection based on position
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const distX = (localX - centerX) / centerX;
      const distY = (localY - centerY) / centerY;

      setReflection({
        x: distX * 20,
        y: distY * 20,
        opacity: intensity,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        background: `linear-gradient(135deg, 
          rgba(255,255,255,0.1) 0%,
          rgba(255,255,255,0.05) 50%,
          rgba(255,255,255,0) 100%)`,
        backdropFilter: `blur(10px)`,
        WebkitBackdropFilter: `blur(10px)`,
        borderRadius: "inherit",
      }}
    >
      {/* Reflection layer */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-inherit"
        animate={{
          x: reflection.x,
          y: reflection.y,
          opacity: reflection.opacity,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        style={{
          background: `radial-gradient(circle at 30% 30%, 
            rgba(255,255,255,0.4) 0%,
            rgba(255,255,255,0.1) 30%,
            transparent 70%)`,
          filter: `blur(${blur}px)`,
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
        }}
      />

      {/* Secondary reflection for depth */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-inherit"
        animate={{
          x: -reflection.x * 0.5,
          y: -reflection.y * 0.5,
          opacity: reflection.opacity * 0.3,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 40,
        }}
        style={{
          background: `radial-gradient(circle at 70% 70%, 
            rgba(255,255,255,0.2) 0%,
            transparent 60%)`,
          filter: `blur(${blur * 1.5}px)`,
          willChange: "transform, opacity",
        }}
      />

      {children}
    </div>
  );
};

// Advanced glass morphism with dynamic reflections
interface GlassMorphismProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "light" | "dark" | "neon";
}

export const GlassMorphism: React.FC<GlassMorphismProps> = ({
  className = "",
  children,
  variant = "light",
}) => {
  const glassStyles: Record<string, React.CSSProperties> = {
    light: {
      background: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(20px) brightness(1.1)",
    },
    dark: {
      background: "rgba(0, 0, 0, 0.3)",
      backdropFilter: "blur(20px)",
    },
    neon: {
      background: "rgba(56, 189, 248, 0.1)",
      backdropFilter: "blur(20px)",
      boxShadow: "0 0 20px rgba(56, 189, 248, 0.2)",
    },
  };

  return (
    <motion.div
      className={`relative backdrop-blur-lg border border-white/20 ${className}`}
      style={glassStyles[variant] as React.CSSProperties}
      whileHover={{
        borderColor: "rgba(255, 255, 255, 0.4)",
        boxShadow: "0 0 30px rgba(56, 189, 248, 0.1)",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
};

// Real-time reflection based on environment
interface EnvironmentalReflectionProps {
  className?: string;
  children?: React.ReactNode;
  reflectColor?: string;
}

export const EnvironmentalReflection: React.FC<
  EnvironmentalReflectionProps
> = ({
  className = "",
  children,
  reflectColor = "#38bdf8",
}) => {
  const [gradient, setGradient] = useState("0deg");

  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      angle = (angle + 0.5) % 360;
      setGradient(`${angle}deg`);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      style={{
        background: `conic-gradient(from ${gradient}, 
          ${reflectColor}11 0deg,
          transparent 120deg,
          ${reflectColor}08 240deg,
          transparent 360deg)`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {children}
    </div>
  );
};

// Prismatic glass effect
interface PrismaticGlassProps {
  className?: string;
  children?: React.ReactNode;
}

export const PrismaticGlass: React.FC<PrismaticGlassProps> = ({
  className = "",
  children,
}) => {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(45deg,
          rgba(56, 189, 248, 0.1) 0%,
          rgba(139, 92, 246, 0.05) 50%,
          rgba(236, 72, 153, 0.1) 100%)`,
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.25)",
      }}
      whileHover={{
        boxShadow:
          "0 8px 32px rgba(56, 189, 248, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.05)",
      }}
    >
      {children}
    </motion.div>
  );
};
