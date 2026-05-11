"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function VirtualList<T>({
  items,
  itemHeight,
  overscan = 3,
  renderItem,
  className,
  style,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const totalHeight = items.length * itemHeight;

  const onScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    setContainerHeight(element.clientHeight || 600);
    element.addEventListener("scroll", onScroll, { passive: true });

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(element);

    return () => {
      element.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [onScroll]);

  const safeItemHeight = Math.max(1, itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / safeItemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / safeItemHeight) + overscan * 2;
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetTop = startIndex * safeItemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className ?? ""}`}
      style={{ position: "relative", ...style }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ position: "absolute", top: offsetTop, left: 0, right: 0 }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: safeItemHeight, overflow: "hidden" }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
