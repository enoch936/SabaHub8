/**
 * Depth Perspective & Smooth Transitions
 * 3D depth effects with cinematic smooth animations
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Depth-based 3D perspective container
interface DepthPerspectiveProps {
  children: React.ReactNode;
  depth?: number;
  className?: string;
  interactive?: boolean;
}

export const DepthPerspective: React.FC<DepthPerspectiveProps> = ({
  children,
  depth = 2,
  className = "",
  interactive = true,
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientY / window.innerHeight - 0.5) * 20;
      const y = (e.clientX / window.innerWidth - 0.5) * 20;

      setRotation({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive]);

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        perspective: `${1000 / depth}px`,
        transformStyle: "preserve-3d",
      }}
      animate={interactive ? { rotateX: rotation.x, rotateY: rotation.y } : {}}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
    >
      {children}
    </motion.div>
  );
};

// Parallax depth layers with different distances
interface DepthLayerProps {
  children: React.ReactNode;
  z?: number;
  className?: string;
}

export const DepthLayer: React.FC<DepthLayerProps> = ({
  children,
  z = 0,
  className = "",
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scale = 1 - z * 0.05;
  const opacity = 1 - z * 0.1;
  const offset = scrollY * z * 0.3;

  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        y: offset,
        scale,
        opacity,
      }}
      transition={{
        type: "tween",
        duration: 0,
      }}
      style={{
        transformOrigin: "center",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </motion.div>
  );
};

// Staggered depth reveal animation
interface StaggeredDepthRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  staggerDelay?: number;
}

export const StaggeredDepthReveal: React.FC<StaggeredDepthRevealProps> = ({
  children,
  delay = 0,
  className = "",
  staggerDelay = 100,
}) => {
  const childArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            delay: delay + index * (staggerDelay / 1000),
            ease: "easeOut",
          }}
          viewport={{ once: true, margin: "-100px" }}
          style={{
            perspective: "1000px",
            transformStyle: "preserve-3d",
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Smooth opacity transitions wrapper
interface SmoothOpacityProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export const SmoothOpacity: React.FC<SmoothOpacityProps> = ({
  children,
  duration = 0.5,
  delay = 0,
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        delay,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Smooth transform transitions
interface SmoothTransformProps {
  children: React.ReactNode;
  from?: { x?: number; y?: number; scale?: number; rotate?: number };
  to?: { x?: number; y?: number; scale?: number; rotate?: number };
  duration?: number;
  delay?: number;
  className?: string;
}

export const SmoothTransform: React.FC<SmoothTransformProps> = ({
  children,
  from = { y: 20, opacity: 0 },
  to = { y: 0, opacity: 1 },
  duration = 0.6,
  delay = 0,
  className = "",
}) => {
  return (
    <motion.div
      initial={from}
      whileInView={to}
      transition={{
        duration,
        delay,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
      viewport={{ once: true, margin: "-100px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Elastic pop-in animation
interface ElasticPopInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  onClick?: () => void;
}

export const ElasticPopIn: React.FC<ElasticPopInProps> = ({
  children,
  delay = 0,
  className = "",
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay,
        mass: 0.5,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

// Smooth fade in from scroll
interface FadeInOnScrollProps {
  children: React.ReactNode;
  from?: "bottom" | "top" | "left" | "right";
  distance?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

export const FadeInOnScroll: React.FC<FadeInOnScrollProps> = ({
  children,
  from = "bottom",
  distance = 40,
  duration = 0.8,
  delay = 0,
  className = "",
}) => {
  const initialValues = {
    bottom: { opacity: 0, y: distance },
    top: { opacity: 0, y: -distance },
    left: { opacity: 0, x: -distance },
    right: { opacity: 0, x: distance },
  };

  return (
    <motion.div
      initial={initialValues[from]}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      viewport={{ once: true, margin: "-50px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Staggered text character animation
interface StaggeredTextProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export const StaggeredText: React.FC<StaggeredTextProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 0.05,
}) => {
  const characters = children.split("");

  return (
    <span className={className}>
      {characters.map((char, idx) => (
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration,
            delay: delay + idx * 0.03,
            ease: "easeOut",
          }}
          style={{
            display: "inline-block",
            willChange: "transform, opacity",
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};

// Smooth scroll-triggered animations
interface SmoothScrollTriggerProps {
  children: React.ReactNode;
  onScroll?: (progress: number) => void;
  className?: string;
}

export const SmoothScrollTrigger: React.FC<SmoothScrollTriggerProps> = ({
  children,
  onScroll,
  className = "",
}) => {
  const elementRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const progress = 1 - (rect.top / window.innerHeight);
      const clampedProgress = Math.max(0, Math.min(1, progress));

      onScroll?.(clampedProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onScroll]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};
