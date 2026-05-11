"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  threshold?: number;
  className?: string;
}

const THRESHOLD_DEFAULT = 72;

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = THRESHOLD_DEFAULT,
  className,
}: PullToRefreshProps) {
  const startYRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const onTouchStart = (event: TouchEvent) => {
      if (element.scrollTop === 0) {
        startYRef.current = event.touches[0]?.clientY ?? null;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startYRef.current === null || refreshing) {
        return;
      }

      const currentY = event.touches[0]?.clientY;
      if (typeof currentY !== "number") {
        return;
      }

      const delta = currentY - startYRef.current;
      if (delta > 0) {
        event.preventDefault();
        setPullDistance(Math.min(delta, threshold * 1.5));
      }
    };

    const onTouchEnd = async () => {
      if (startYRef.current === null) {
        return;
      }

      if (pullDistance >= threshold && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }

      startYRef.current = null;
      setPullDistance(0);
    };

    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    element.addEventListener("touchend", onTouchEnd);

    return () => {
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, pullDistance, refreshing, threshold]);

  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const indicatorScale = 0.5 + indicatorOpacity * 0.5;

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className ?? ""}`}
      style={{ overscrollBehavior: "none" }}
    >
      {pullDistance > 0 || refreshing ? (
        <div
          className="flex items-center justify-center py-2 transition-all"
          style={{
            height: refreshing ? 48 : pullDistance,
            opacity: refreshing ? 1 : indicatorOpacity,
            transform: `scale(${refreshing ? 1 : indicatorScale})`,
          }}
        >
          <div
            className={`h-6 w-6 rounded-full border-2 border-primary border-t-transparent ${
              refreshing ? "animate-spin" : ""
            }`}
          />
        </div>
      ) : null}

      {children}
    </div>
  );
}
