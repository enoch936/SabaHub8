"use client";

import { motion } from "framer-motion";

export function TypingIndicator({ label = "Typing…" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-sky-500"
            animate={{ y: [0, -4, 0], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 0.72, repeat: Infinity, delay: index * 0.14 }}
          />
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}
