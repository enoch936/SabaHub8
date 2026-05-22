/**
 * AI Futuristic Atmosphere Effects
 * Advanced visual effects for immersive AI-powered interfaces
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// AI energy pulse effect
interface AIEnergyPulseProps {
  className?: string;
  intensity?: number;
  color?: string;
}

export const AIEnergyPulse: React.FC<AIEnergyPulseProps> = ({
  className = "",
  intensity = 0.8,
  color = "#38bdf8",
}) => {
  return (
    <motion.div
      className={`rounded-full ${className}`}
      animate={{
        boxShadow: [
          `0 0 20px ${color}66`,
          `0 0 40px ${color}99`,
          `0 0 20px ${color}66`,
        ],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        willChange: "box-shadow, transform",
      }}
    />
  );
};

// Holographic data visualization background
interface HolographicBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const HolographicBackground: React.FC<HolographicBackgroundProps> = ({
  className = "",
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
      timeRef.current += 1;

      // Semi-transparent clear for trail effect
      ctx.fillStyle = "rgba(3, 7, 18, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw holographic spheres
      for (let sphere = 0; sphere < 3; sphere++) {
        const radius = 100 + sphere * 60;
        const rotation = (timeRef.current * 0.005 + sphere * 0.3) % (Math.PI * 2);

        ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 - sphere * 0.08})`;
        ctx.lineWidth = 1;

        // Wireframe sphere
        for (let lat = 0; lat < Math.PI; lat += Math.PI / 12) {
          ctx.beginPath();
          for (let lon = 0; lon < Math.PI * 2; lon += Math.PI / 16) {
            const x =
              centerX +
              Math.sin(lat) * Math.cos(lon + rotation) * radius;
            const y =
              centerY +
              Math.sin(lat) * Math.sin(lon + rotation) * radius * 0.5;

            if (lon === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Rotating rings
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const x = centerX + Math.cos(angle + rotation) * radius;
          const y = centerY + Math.sin(angle + rotation) * radius * 0.5;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw orbiting particles
      for (let i = 0; i < 12; i++) {
        const angle = (timeRef.current * 0.02 + (i / 12) * Math.PI * 2) % (Math.PI * 2);
        const orbitRadius = 150;
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius * 0.5;

        ctx.fillStyle = `rgba(56, 189, 248, 0.8)`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.strokeStyle = `rgba(56, 189, 248, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          willChange: "contents",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// AI neural network effect
interface NeuralNetworkProps {
  className?: string;
  nodeCount?: number;
  connectionDistance?: number;
}

export const NeuralNetwork: React.FC<NeuralNetworkProps> = ({
  className = "",
  nodeCount = 20,
  connectionDistance = 150,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<
    Array<{ x: number; y: number; vx: number; vy: number }>
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialize nodes
    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));

    let animationFrameId: number;

    const animate = () => {
      ctx.fillStyle = "rgba(3, 7, 18, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodesRef.current.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        // Draw node
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw glow
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw connections
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const dx =
            nodesRef.current[j].x - nodesRef.current[i].x;
          const dy =
            nodesRef.current[j].y - nodesRef.current[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 * (1 - distance / connectionDistance)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodesRef.current[i].x, nodesRef.current[i].y);
            ctx.lineTo(nodesRef.current[j].x, nodesRef.current[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [nodeCount, connectionDistance]);

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

// Quantum tunnel effect
interface QuantumTunnelProps {
  className?: string;
  children?: React.ReactNode;
}

export const QuantumTunnel: React.FC<QuantumTunnelProps> = ({
  className = "",
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
      timeRef.current += 1;

      ctx.fillStyle = "rgba(3, 7, 18, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw tunnel rings
      for (let i = 1; i < 20; i++) {
        const progress =
          ((timeRef.current * 2 + i * 50) % (canvas.width * 2)) /
          (canvas.width * 2);
        const radius = progress * canvas.width;
        const opacity = Math.max(0, 1 - progress);

        // Outer ring
        ctx.strokeStyle = `rgba(56, 189, 248, ${opacity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow
        ctx.strokeStyle = `rgba(139, 92, 246, ${opacity * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw tunnel lines
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        for (let i = 0; i < 5; i++) {
          const progress =
            ((timeRef.current + i * 50) % 500) / 500;
          const distance = progress * canvas.width;
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;

          ctx.fillStyle = `rgba(236, 72, 153, ${(1 - progress) * 0.6})`;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          willChange: "contents",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// Data stream effect for text
interface DataStreamTextProps {
  text: string;
  className?: string;
}

export const DataStreamText: React.FC<DataStreamTextProps> = ({
  text,
  className = "",
}) => {
  const characters = text.split("");
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= characters.length) {
        setDisplayed(characters.slice(0, index).join(""));
        index++;
      }
    }, 30);

    return () => clearInterval(interval);
  }, [characters]);

  return (
    <span className={className} style={{ fontFamily: "monospace" }}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        _
      </motion.span>
    </span>
  );
};

// Glitch effect
interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: number;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  className = "",
  intensity = 0.3,
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Main text */}
      <span>{text}</span>

      {/* Glitch layers */}
      <motion.span
        className="absolute inset-0 text-cyan-400"
        animate={{
          opacity: [0, intensity, 0],
          x: [0, -2, 2],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      >
        {text}
      </motion.span>

      <motion.span
        className="absolute inset-0 text-pink-400"
        animate={{
          opacity: [0, intensity * 0.6, 0],
          x: [0, 2, -2],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 2,
          delay: 0.1,
        }}
      >
        {text}
      </motion.span>
    </div>
  );
};
