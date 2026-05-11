"use client";

import { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';

interface ConfettiCelebrationProps {
  trigger: number;
  duration?: number;
}

export default function ConfettiCelebration({ trigger, duration = 4000 }: ConfettiCelebrationProps) {
  const [active, setActive] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  useEffect(() => {
    if (trigger > 0) {
      setActive(true);
      const t = setTimeout(() => setActive(false), duration);
      return () => clearTimeout(t);
    }
  }, [trigger, duration]);

  if (!active) return null;

  return (
    <ReactConfetti
      width={size.width}
      height={size.height}
      recycle={false}
      numberOfPieces={300}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
    />
  );
}
