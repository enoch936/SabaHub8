/**
 * Floating Particles System
 * GPU-accelerated particle animations with interactive physics
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color?: string;
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
  colors?: string[];
  speed?: number;
  interactive?: boolean;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 50,
  className = "",
  colors = ["#38bdf8", "#8b5cf6", "#ec4899", "#22d3ee"],
  speed = 0.5,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Apply interactive force
        if (interactive) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 150;

          if (distance < maxDistance) {
            const force = (1 - distance / maxDistance) * 0.02;
            particle.vx -= (dx / distance) * force;
            particle.vy -= (dy / distance) * force;
          }
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Apply friction
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Draw particle
        ctx.fillStyle = particle.color || "#38bdf8";
        ctx.globalAlpha = particle.opacity;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections
        ctx.strokeStyle = particle.color || "#38bdf8";
        ctx.globalAlpha = particle.opacity * 0.3;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);

        particlesRef.current.forEach((other) => {
          const dx2 = other.x - particle.x;
          const dy2 = other.y - particle.y;
          const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (distance2 < 100) {
            ctx.lineTo(other.x, other.y);
          }
        });
        ctx.stroke();
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count, colors, speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        willChange: "contents",
        imageRendering: "crisp-edges",
      }}
    />
  );
};

// Simpler particles using DOM for better accessibility
interface DOMParticleProps {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  duration: number;
}

interface DOMParticlesProps {
  count?: number;
  className?: string;
  colors?: string[];
  autoSpawn?: boolean;
}

export const DOMParticles: React.FC<DOMParticlesProps> = ({
  count = 30,
  className = "",
  colors = ["#38bdf8", "#8b5cf6", "#ec4899", "#22d3ee"],
  autoSpawn = false,
}) => {
  const [particles, setParticles] = useState<DOMParticleProps[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoSpawn) return;

    const spawnParticle = () => {
      if (Math.random() > 0.5) return;

      const newParticle: DOMParticleProps = {
        id: Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        targetX: (Math.random() - 0.5) * 100,
        targetY: -100 - Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        duration: Math.random() * 3 + 2,
      };

      setParticles((prev) => [...prev, newParticle]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, newParticle.duration * 1000);
    };

    const interval = setInterval(spawnParticle, 200);
    return () => clearInterval(interval);
  }, [autoSpawn, colors]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="pointer-events-none fixed rounded-full mix-blend-screen"
          initial={{
            x: particle.x,
            y: particle.y,
            opacity: 1,
            scale: 0.5,
          }}
          animate={{
            x: particle.x + particle.targetX,
            y: particle.y + particle.targetY,
            opacity: 0,
            scale: 1,
          }}
          transition={{
            duration: particle.duration,
            ease: "easeOut",
          }}
          style={{
            width: particle.size,
            height: particle.size,
            background: particle.color,
            filter: `blur(${particle.size / 4}px)`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
};

// Particle burst effect on click
interface ParticleBurstProps {
  className?: string;
  colors?: string[];
}

export const ParticleBurst: React.FC<ParticleBurstProps> = ({
  className = "",
  colors = ["#38bdf8", "#8b5cf6", "#ec4899", "#22d3ee"],
}) => {
  const [bursts, setBursts] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);

  const handleClick = (e: React.MouseEvent) => {
    const burst = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
    };

    setBursts((prev) => [...prev, burst]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burst.id));
    }, 800);
  };

  return (
    <div
      className={`relative ${className}`}
      onClick={handleClick}
      style={{ cursor: "crosshair" }}
    >
      {bursts.map((burst) =>
        Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`${burst.id}-${i}`}
            className="pointer-events-none fixed rounded-full mix-blend-screen"
            initial={{
              x: burst.x,
              y: burst.y,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: burst.x + Math.cos((i / 12) * Math.PI * 2) * 100,
              y: burst.y + Math.sin((i / 12) * Math.PI * 2) * 100,
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            style={{
              width: 8,
              height: 8,
              background: colors[i % colors.length],
              filter: "blur(2px)",
              willChange: "transform, opacity",
            }}
          />
        ))
      )}
    </div>
  );
};
