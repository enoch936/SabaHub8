"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Palette,
  Megaphone,
  DollarSign,
  Shield,
  Users,
  PenTool,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const CATEGORIES = [
  { id: "technical", label: "Technical", icon: Code2 },
  { id: "design", label: "Design", icon: Palette },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "finance", label: "Finance", icon: DollarSign },
  { id: "admin", label: "Admin", icon: Shield },
  { id: "sales", label: "Sales", icon: Users },
  { id: "writing", label: "Writing", icon: PenTool },
  { id: "media", label: "Media", icon: Video },
];

type JobCategoryBarProps = {
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
};

export function JobCategoryBar({
  selectedCategory = "technical",
  onCategoryChange,
}: JobCategoryBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange?.(categoryId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative mb-6 flex items-center gap-2"
    >
      {/* Left scroll button */}
      {canScrollLeft && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-md transition-all hover:bg-gradient-to-r hover:from-white/90 hover:to-white/70 dark:from-slate-900/80 dark:to-slate-900/60 dark:hover:from-slate-900/90 dark:hover:to-slate-900/70"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </motion.button>
      )}

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="hide-scrollbar flex gap-3 overflow-x-auto px-2 py-1 sm:px-0"
      >
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = category.id === selectedCategory;

          return (
            <motion.button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30"
                  : "border border-white/20 bg-white/40 text-slate-700 backdrop-blur-md transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800/60"
              }`}
              aria-pressed={isSelected}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap text-sm">{category.label}</span>

              {/* Animated underline for selected */}
              {isSelected && (
                <motion.div
                  layoutId="categoryUnderline"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-gradient-to-l from-white/80 to-white/60 backdrop-blur-md transition-all hover:bg-gradient-to-l hover:from-white/90 hover:to-white/70 dark:from-slate-900/80 dark:to-slate-900/60 dark:hover:from-slate-900/90 dark:hover:to-slate-900/70"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </motion.button>
      )}

      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.div>
  );
}
