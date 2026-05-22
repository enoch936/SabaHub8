/**
 * Aurora Gradients & Animated Mesh Backgrounds
 * Cinematic gradient animations with organic mesh effects
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface AuroraGradientProps {
  className?: string;
  intensity?: number;
  speed?: number;
  children?: React.ReactNode;
}

export const AuroraGradient: React.FC<AuroraGradientProps> = ({
  className = "",
  intensity = 0.8,
  speed = 4,
  children,
}) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      angle = (angle + speed) % 360;
      setRotation(angle);
    }, 50);

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `
          conic-gradient(from ${rotation}deg,
            rgba(56, 189, 248, ${0.1 * intensity}),
            rgba(139, 92, 246, ${0.08 * intensity}),
            rgba(236, 72, 153, ${0.1 * intensity}),
            rgba(34, 211, 238, ${0.08 * intensity}),
            rgba(52, 211, 153, ${0.07 * intensity}),
            rgba(56, 189, 248, ${0.1 * intensity})
          )
        `,
        backgroundSize: "200% 200%",
        animation: `aurora ${20 / speed}s linear infinite`,
      }}
    >
      <style>{`
        @keyframes aurora {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
      {children}
    </div>
  );
};

// Dynamic animated background with moving gradients
interface AnimatedBackgroundProps {
  className?: string;
  variant?: "aurora" | "mesh" | "fluid" | "cosmic";
  children?: React.ReactNode;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  className = "",
  variant = "aurora",
  children,
}) => {
  const variants = {
    aurora: {
      background: `
        radial-gradient(at 20% 50%, rgba(56, 189, 248, 0.2) 0px, transparent 50%),
        radial-gradient(at 60% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.1) 0px, transparent 50%)
      `,
      backgroundSize: "200% 200%",
      animation: "gradientShift 15s ease infinite",
    },
    mesh: {
      background: `
        linear-gradient(45deg, 
          rgba(56, 189, 248, 0.05) 25%, 
          transparent 25%,
          transparent 50%, 
          rgba(56, 189, 248, 0.05) 50%,
          rgba(56, 189, 248, 0.05) 75%, 
          transparent 75%, 
          transparent
        )
      `,
      backgroundSize: "60px 60px",
      animation: "meshShift 30s linear infinite",
    },
    fluid: {
      background: `
        radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.25) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.2) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(139, 92, 246, 0.15) 0px, transparent 50%)
      `,
      backgroundSize: "200% 200%",
      animation: "fluidShift 20s ease-in-out infinite",
    },
    cosmic: {
      background: `
        radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.25) 0%, transparent 50%),
        radial-gradient(circle at 40% 0%, rgba(34, 211, 238, 0.2) 0%, transparent 60%)
      `,
      backgroundSize: "100% 100%",
      animation: "cosmicShift 25s ease-in-out infinite",
    },
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        ...variants[variant],
        backgroundAttachment: "fixed",
      } as React.CSSProperties}
    >
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }
        @keyframes meshShift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
        @keyframes fluidShift {
          0%, 100% { background-position: 0% 0%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
        }
        @keyframes cosmicShift {
          0%, 100% { filter: hue-rotate(0deg) brightness(1); }
          50% { filter: hue-rotate(180deg) brightness(1.1); }
        }
      `}</style>
      {children}
    </div>
  );
};

// Animated mesh grid background
interface AnimatedMeshProps {
  className?: string;
  resolution?: number;
  speed?: number;
  intensity?: number;
  children?: React.ReactNode;
}

export const AnimatedMesh: React.FC<AnimatedMeshProps> = ({
  className = "",
  resolution = 50,
  speed = 1,
  intensity = 0.3,
  children,
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
      timeRef.current += speed;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = `rgba(56, 189, 248, ${intensity})`;
      ctx.lineWidth = 1;

      // Draw mesh grid with wave distortion
      for (let x = 0; x < canvas.width; x += resolution) {
        ctx.beginPath();
        for (let y = 0; y < canvas.height; y += 5) {
          const wave = Math.sin(y / 50 + timeRef.current * 0.05) * 10;
          const newX = x + wave;
          if (y === 0) {
            ctx.moveTo(newX, y);
          } else {
            ctx.lineTo(newX, y);
          }
        }
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += resolution) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 5) {
          const wave = Math.cos(x / 50 + timeRef.current * 0.05) * 10;
          const newY = y + wave;
          if (x === 0) {
            ctx.moveTo(x, newY);
          } else {
            ctx.lineTo(x, newY);
          }
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [resolution, speed, intensity]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          willChange: "contents",
        }}
      />
      {children}
    </div>
  );
};

// Fluid gradient background with mouse tracking
interface FluidGradientProps {
  className?: string;
  colors?: string[];
  children?: React.ReactNode;
}

export const FluidGradient: React.FC<FluidGradientProps> = ({
  className = "",
  colors = [
    "rgba(56, 189, 248, 0.3)",
    "rgba(139, 92, 246, 0.2)",
    "rgba(236, 72, 153, 0.25)",
  ],
  children,
}) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `
          radial-gradient(at ${mousePos.x}% ${mousePos.y}%, 
            ${colors[0]} 0%, 
            transparent 50%),
          radial-gradient(at ${100 - mousePos.x}% ${100 - mousePos.y}%, 
            ${colors[1]} 0%, 
            transparent 50%),
          radial-gradient(at 50% 50%, 
            ${colors[2]} 0%, 
            transparent 50%)
        `,
        transition: "background 100ms ease-out",
      }}
    >
      {children}
    </div>
  );
};

// Particle-based mesh background
export const ParticleMesh: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 1.5,
    }));

    let animationFrameId: number;

    const animate = () => {
      ctx.fillStyle = "rgba(15, 23, 42, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = "rgba(56, 189, 248, 0.5)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        particles.forEach((other) => {
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ willChange: "contents" }}
    />
  );
};
