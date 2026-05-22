/**
 * Cinematic Loading Screens & GPU Acceleration
 * Premium loading experiences with AI futuristic atmosphere
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Cinematic loading bar
interface CinematicLoadingBarProps {
  progress?: number;
  duration?: number;
  className?: string;
}

export const CinematicLoadingBar: React.FC<CinematicLoadingBarProps> = ({
  progress = 0,
  duration = 0.6,
  className = "",
}) => {
  return (
    <div className={`relative w-full h-1 bg-white/10 overflow-hidden rounded-full ${className}`}>
      <motion.div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
        animate={{
          width: `${progress}%`,
          boxShadow: `0 0 ${progress / 2}px rgba(56, 189, 248, ${progress / 100})`,
        }}
        transition={{
          duration,
          ease: "easeOut",
        }}
        style={{
          willChange: "width, box-shadow",
        }}
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
        animate={{
          x: ["0%", "300%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          filter: "blur(4px)",
        }}
      />
    </div>
  );
};

// AI holographic loading spinner
interface HolographicSpinnerProps {
  className?: string;
  size?: number;
}

export const HolographicSpinner: React.FC<HolographicSpinnerProps> = ({
  className = "",
  size = 60,
}) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-purple-400"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-400 border-r-pink-400"
        animate={{ rotate: -360 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          willChange: "transform",
        }}
      />

      {/* Inner ring */}
      <motion.div
        className="absolute inset-4 rounded-full border border-cyan-300/50"
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          willChange: "transform, opacity",
        }}
      />

      {/* Center dot */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          transform: "translate(-50%, -50%)",
          willChange: "transform, opacity",
          boxShadow: "0 0 20px rgba(34, 211, 238, 0.8)",
        }}
      />
    </div>
  );
};

// Animated mesh loading screen
interface MeshLoadingScreenProps {
  progress?: number;
  title?: string;
  subtitle?: string;
}

export const MeshLoadingScreen: React.FC<MeshLoadingScreenProps> = ({
  progress = 50,
  title = "Loading",
  subtitle = "Preparing your experience",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationFrameId: number;

    const animate = () => {
      timeRef.current += 1;

      ctx.fillStyle = "rgba(3, 7, 18, 0.9)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated mesh grid
      ctx.strokeStyle = `rgba(56, 189, 248, 0.1)`;
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        for (let y = 0; y < canvas.height; y += 2) {
          const wave = Math.sin(y / 50 + timeRef.current * 0.05) * 5;
          const newX = x + wave;
          if (y === 0) ctx.moveTo(newX, y);
          else ctx.lineTo(newX, y);
        }
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 2) {
          const wave = Math.cos(x / 50 + timeRef.current * 0.05) * 5;
          const newY = y + wave;
          if (x === 0) ctx.moveTo(x, newY);
          else ctx.lineTo(x, newY);
        }
        ctx.stroke();
      }

      // Draw progress indicator on mesh
      ctx.strokeStyle = `rgba(56, 189, 248, 0.5)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60;
      const angle = (progress / 100) * Math.PI * 2 - Math.PI / 2;
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [progress]);

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          willChange: "contents",
        }}
      />

      <div className="relative z-10 text-center">
        <HolographicSpinner size={80} className="mb-8 mx-auto" />

        {title && (
          <motion.h2
            className="text-2xl font-bold text-white mb-2"
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            {title}
          </motion.h2>
        )}

        {subtitle && (
          <motion.p
            className="text-cyan-400 text-sm"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            {subtitle}
          </motion.p>
        )}

        <div className="mt-8 w-48">
          <CinematicLoadingBar progress={progress} />
          <p className="text-xs text-white/50 mt-2">{progress}%</p>
        </div>
      </div>
    </div>
  );
};

// Aurora loading animation
interface AuroraLoadingProps {
  size?: number;
  colors?: string[];
}

export const AuroraLoading: React.FC<AuroraLoadingProps> = ({
  size = 120,
  colors = ["#38bdf8", "#8b5cf6", "#ec4899", "#22d3ee"],
}) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      angle = (angle + 2) % 360;
      setRotation(angle);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          background: `conic-gradient(
            ${colors[0]} 0deg,
            ${colors[1]} 90deg,
            ${colors[2]} 180deg,
            ${colors[3]} 270deg,
            ${colors[0]} 360deg
          )`,
          filter: "blur(20px)",
          opacity: 0.6,
        }}
      />

      <motion.div
        className="absolute inset-2 rounded-full bg-black"
        style={{
          zIndex: 10,
        }}
      />

      <motion.div
        className="relative z-20 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
        animate={{
          scale: [0.8, 1.2, 0.8],
          boxShadow: [
            "0 0 10px rgba(56, 189, 248, 0.5)",
            "0 0 20px rgba(56, 189, 248, 0.8)",
            "0 0 10px rgba(56, 189, 248, 0.5)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

// Futuristic circuit loading
interface CircuitLoadingProps {
  className?: string;
}

export const CircuitLoading: React.FC<CircuitLoadingProps> = ({
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationFrameId: number;

    const animate = () => {
      timeRef.current += 1;

      ctx.fillStyle = "rgba(3, 7, 18, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw pulsing circles
      for (let i = 1; i < 4; i++) {
        const radius = (100 + timeRef.current * 2) % 200 - i * 40;
        if (radius > 0) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 - i * 0.1})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw data nodes
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
        const nodeRadius = 80;
        const x = centerX + Math.cos(angle + timeRef.current * 0.02) * nodeRadius;
        const y = centerY + Math.sin(angle + timeRef.current * 0.02) * nodeRadius;

        ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Connection lines
        ctx.strokeStyle = "rgba(56, 189, 248, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{
        willChange: "contents",
      }}
    />
  );
};

// Full-screen loading modal
interface CinematicLoadingModalProps {
  isOpen: boolean;
  progress?: number;
  title?: string;
  subtitle?: string;
}

export const CinematicLoadingModal: React.FC<CinematicLoadingModalProps> = ({
  isOpen,
  progress = 50,
  title = "Loading",
  subtitle = "Preparing your experience",
}) => {
  return (
    <motion.div
      animate={{
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
      }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center"
    >
      <MeshLoadingScreen
        progress={progress}
        title={title}
        subtitle={subtitle}
      />
    </motion.div>
  );
};
