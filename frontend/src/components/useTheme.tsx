"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  // Fallback to class present on documentElement (set in layout startup script)
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (root.classList.contains("theme-dark")) return "dark";
  }
  return "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    const desired = next === "dark" ? "theme-dark" : "theme-light";
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(desired);
    // Tailwind dark mode compatibility
    if (next === "dark") { root.classList.add("dark"); } else { root.classList.remove("dark"); }
    // Swap theme CSS file if present
    const link = document.getElementById("theme-css");
    if (link && link.tagName === "LINK") {
      link.setAttribute("href", next === "dark" ? "/themes/dark.css" : "/themes/light.css");
    }
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme, applyTheme]);

  return { theme, setTheme: applyTheme, toggleTheme } as const;
}

// Inline icons to avoid external deps
function SunIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// Small round icon button for navbar
export function ThemeIconButton({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all hover:bg-slate-200 hover:shadow-md active:scale-95 ${className}`}
    >
      <span
        className={`absolute transition-all duration-300 ${isDark ? "opacity-0 scale-75 rotate-45" : "opacity-100 scale-100 rotate-0"}`}
      >
        <SunIcon />
      </span>
      <span
        className={`absolute transition-all duration-300 ${isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-45"}`}
      >
        <MoonIcon />
      </span>
    </button>
  );
}

// Segmented toggle for sidebar
export function SegmentedThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const options = useMemo(
    () => [
      { key: "light" as Theme, label: "Light", icon: SunIcon },
      { key: "dark" as Theme, label: "Dark", icon: MoonIcon },
    ],
    []
  );

  return (
    <div className={`relative flex rounded-xl border border-slate-200 bg-white p-1 text-slate-700 ${className}`} role="tablist" aria-label="Theme">
      {/* Thumb */}
      <div
        className={`absolute inset-y-1 w-1/2 rounded-lg bg-slate-100 shadow-sm transition-transform duration-300 ${isDark ? "translate-x-full" : "translate-x-0"}`}
        aria-hidden
      />
      {options.map((opt, idx) => {
        const Icon = opt.icon;
        const active = theme === opt.key;
        return (
          <button
            key={opt.key}
            role="tab"
            aria-selected={active}
            onClick={() => setTheme(opt.key)}
            className={`relative z-10 flex w-1/2 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
