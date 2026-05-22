/**
 * Interactive Card Tilt & Magnetic Attraction
 * 3D card effects with hover magnetic pull
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface InteractiveCardTiltProps {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
}

export const InteractiveCardTilt: React.FC<InteractiveCardTiltProps> = ({
  children,
  intensity = 20,
  className = "",
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rotationX = ((mouseY - centerY) / centerY) * intensity;
    const rotationY = ((mouseX - centerX) / centerX) * -intensity;

    setRotation({ x: rotationX, y: rotationY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovering(false);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotation.x,
        rotateY: rotation.y,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.5,
      }}
    >
      <motion.div
        style={{
          transformStyle: "preserve-3d",
        }}
        animate={{
          z: isHovering ? 20 : 0,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Magnetic hover attraction effect
interface MagneticHoverProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  trackMouse?: boolean;
}

export const MagneticHover: React.FC<MagneticHoverProps> = ({
  children,
  strength = 0.3,
  className = "",
  trackMouse = true,
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackMouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const maxDistance = 150;
      if (distance < maxDistance) {
        const force = (1 - distance / maxDistance) * strength;
        setOffset({
          x: (dx / distance) * force * 20,
          y: (dy / distance) * force * 20,
        });
      } else {
        setOffset({ x: 0, y: 0 });
      }
    };

    const handleMouseLeave = () => {
      setOffset({ x: 0, y: 0 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength, trackMouse]);

  return (
    <motion.div
      ref={containerRef}
      className={className}
      animate={{
        x: offset.x,
        y: offset.y,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 15,
        mass: 0.8,
      }}
      style={{
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
};

// Enhanced card with tilt + magnetic + glass effect
interface EnhancedInteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  magneticStrength?: number;
  tiltIntensity?: number;
}

export const EnhancedInteractiveCard: React.FC<
  EnhancedInteractiveCardProps
> = ({
  children,
  className = "",
  magneticStrength = 0.4,
  tiltIntensity = 15,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <MagneticHover strength={magneticStrength} trackMouse={isHovering}>
      <InteractiveCardTilt intensity={tiltIntensity} className={className}>
        <motion.div
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          animate={{
            boxShadow: isHovering
              ? "0 20px 60px rgba(56, 189, 248, 0.3)"
              : "0 10px 30px rgba(0, 0, 0, 0.1)",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className="relative rounded-xl backdrop-blur-lg border border-white/20 overflow-hidden"
          style={{
            perspective: "1000px",
            transformStyle: "preserve-3d",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
          }}
        >
          {children}
        </motion.div>
      </InteractiveCardTilt>
    </MagneticHover>
  );
};

// Magnetic pull button effect
interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "tertiary";
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  className = "",
  variant = "primary",
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const maxDistance = 120;
      if (distance < maxDistance) {
        const force = (1 - distance / maxDistance) * 0.4;
        setOffset({
          x: (dx / distance) * force * 15,
          y: (dy / distance) * force * 15,
        });
      } else {
        setOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg",
    secondary:
      "bg-white/10 backdrop-blur text-foreground border border-white/20 hover:bg-white/20",
    tertiary:
      "bg-transparent text-foreground hover:bg-white/5 border border-white/10",
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`relative px-6 py-3 rounded-lg font-medium transition-all ${variants[variant]} ${className}`}
      animate={{
        x: offset.x,
        y: offset.y,
      }}
      transition={{
        type: "spring",
        stiffness: 250,
        damping: 15,
        mass: 0.8,
      }}
      whileHover={{
        scale: 1.05,
      }}
      whileTap={{
        scale: 0.95,
      }}
      onClick={onClick}
      style={{
        willChange: "transform",
      }}
    >
      {children}
    </motion.button>
  );
};

// Interactive element with parallax and tilt
interface InteractiveHoverElementProps {
  children: React.ReactNode;
  className?: string;
}

export const InteractiveHoverElement: React.FC<
  InteractiveHoverElementProps
> = ({ children, className = "" }) => {
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });

  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rotationX = ((mouseY - centerY) / centerY) * 10;
    const rotationY = ((mouseX - centerX) / centerX) * -10;

    setTransform({
      rotateX: rotationX,
      rotateY: rotationY,
      scale: 1.05,
    });
  };

  const handleMouseLeave = () => {
    setTransform({
      rotateX: 0,
      rotateY: 0,
      scale: 1,
    });
  };

  return (
    <motion.div
      ref={elementRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={transform}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
    </motion.div>
  );
};
