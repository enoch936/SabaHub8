/**
 * Ultra-Smooth Parallax Scrolling Component
 * Multi-layer depth perspective with GPU acceleration
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ParallaxLayerProps {
  children: React.ReactNode;
  depth: number;
  className?: string;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  depth,
  className = "",
}) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setOffset(scrollY * depth * 0.5);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [depth]);

  return (
    <motion.div
      className={className}
      style={{
        transform: `translateY(${offset}px)`,
        willChange: "transform",
        backfaceVisibility: "hidden",
        perspective: "1000px",
      }}
    >
      {children}
    </motion.div>
  );
};

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

// Horizontal parallax for side-by-side elements
interface HorizontalParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const HorizontalParallax: React.FC<HorizontalParallaxProps> = ({
  children,
  speed = 0.3,
  className = "",
}) => {
  const [offsetX, setOffsetX] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let lastScrollX = 0;

    const handleScroll = () => {
      const scrollX = window.scrollX;
      const diff = scrollX - lastScrollX;
      lastScrollX = scrollX;

      setOffsetX((prev) => prev + diff * speed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <motion.div
      className={className}
      style={{
        x: offsetX,
        willChange: "transform",
        transform: "translateZ(0)",
      }}
    >
      {children}
    </motion.div>
  );
};

// Multi-layer parallax with automatic depth calculation
interface DepthParallaxProps {
  layers: Array<{
    id: string;
    content: React.ReactNode;
    depth: number;
    className?: string;
  }>;
  containerClassName?: string;
}

export const DepthParallax: React.FC<DepthParallaxProps> = ({
  layers,
  containerClassName = "",
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`relative ${containerClassName}`}>
      {layers.map((layer) => (
        <motion.div
          key={layer.id}
          className={layer.className}
          animate={{
            y: scrollY * layer.depth * 0.5,
            opacity: 1 - layer.depth * 0.1,
          }}
          transition={{ type: "tween", duration: 0 }}
          style={{
            willChange: "transform, opacity",
            backfaceVisibility: "hidden",
          }}
        >
          {layer.content}
        </motion.div>
      ))}
    </div>
  );
};
