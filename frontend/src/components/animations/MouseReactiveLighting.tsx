/**
 * Mouse Reactive Lighting Effect
 * Dynamic light source following cursor with GPU acceleration
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface MouseReactiveLightProps {
  intensity?: number;
  color?: string;
  blur?: number;
  className?: string;
  children?: React.ReactNode;
}

export const MouseReactiveLight: React.FC<MouseReactiveLightProps> = ({
  intensity = 0.5,
  color = "#38bdf8",
  blur = 60,
  className = "",
  children,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsActive(true);
    };

    const handleMouseLeave = () => {
      setIsActive(false);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ perspective: "1000px" }}
    >
      {/* Light effect gradient */}
      <motion.div
        className="pointer-events-none absolute rounded-full mix-blend-screen"
        animate={{
          x: mousePos.x,
          y: mousePos.y,
          opacity: isActive ? intensity : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 60,
          mass: 0.5,
        }}
        style={{
          width: 300,
          height: 300,
          marginLeft: -150,
          marginTop: -150,
          background: `radial-gradient(circle, ${color}66 0%, ${color}22 40%, transparent 70%)`,
          filter: `blur(${blur}px)`,
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
        }}
      />

      {/* Inner glow layer */}
      <motion.div
        className="pointer-events-none absolute rounded-full mix-blend-screen"
        animate={{
          x: mousePos.x,
          y: mousePos.y,
          opacity: isActive ? intensity * 0.6 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 80,
          mass: 0.3,
        }}
        style={{
          width: 150,
          height: 150,
          marginLeft: -75,
          marginTop: -75,
          background: `radial-gradient(circle, ${color}99 0%, transparent 70%)`,
          filter: `blur(${blur / 2}px)`,
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
        }}
      />

      {children}
    </div>
  );
};

// Multi-light interactive lighting system
interface LightSourceProps {
  x: number;
  y: number;
  intensity: number;
  color: string;
  size: number;
}

interface InteractiveLightingProps {
  className?: string;
  children?: React.ReactNode;
  baseColor?: string;
  accentColor?: string;
}

export const InteractiveLighting: React.FC<InteractiveLightingProps> = ({
  className = "",
  children,
  baseColor = "#38bdf8",
  accentColor = "#ec4899",
}) => {
  const [lights, setLights] = useState<LightSourceProps[]>([
    { x: 0, y: 0, intensity: 0, color: baseColor, size: 250 },
    { x: 0, y: 0, intensity: 0, color: accentColor, size: 300 },
  ]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setLights((prev) =>
        prev.map((light, idx) => ({
          ...light,
          x: e.clientX + (idx === 0 ? 50 : -50),
          y: e.clientY + (idx === 0 ? 50 : -50),
          intensity: 0.3 + idx * 0.15,
        }))
      );
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      style={{
        background: `
          radial-gradient(circle at ${lights[0].x}px ${lights[0].y}px, 
            ${baseColor}22 0%, transparent 40%),
          radial-gradient(circle at ${lights[1].x}px ${lights[1].y}px, 
            ${accentColor}11 0%, transparent 50%)
        `,
      }}
    >
      {lights.map((light, idx) => (
        <motion.div
          key={idx}
          className="pointer-events-none absolute mix-blend-screen rounded-full"
          animate={{
            x: light.x,
            y: light.y,
            opacity: light.intensity,
          }}
          transition={{
            type: "spring",
            stiffness: 150 + idx * 100,
            damping: 40 + idx * 20,
          }}
          style={{
            width: light.size,
            height: light.size,
            marginLeft: -light.size / 2,
            marginTop: -light.size / 2,
            background: `radial-gradient(circle, ${light.color}66 0%, transparent 70%)`,
            filter: `blur(${40 + idx * 10}px)`,
            willChange: "transform, opacity",
          }}
        />
      ))}

      {children}
    </div>
  );
};

// Cinematic spotlight effect
interface SpotlightProps {
  className?: string;
  children?: React.ReactNode;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  className = "",
  children,
}) => {
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setSpotlight({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="pointer-events-none fixed"
        animate={{
          background: `radial-gradient(circle 300px at ${spotlight.x}px ${spotlight.y}px, rgba(56,189,248,0.1) 0%, transparent 80%)`,
        }}
        transition={{ duration: 0 }}
        style={{
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          willChange: "background",
        }}
      />
      {children}
    </div>
  );
};
