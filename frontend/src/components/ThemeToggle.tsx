"use client";

import { useTheme } from "./useTheme";

// Inline icons
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

export function SegmentedThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  if (!mounted) {
    return <div className={`h-10 w-32 rounded-xl bg-slate-200 animate-pulse ${className}`} />;
  }

  return (
    <div className={`relative inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1 ${className}`} role="tablist" aria-label="Theme" style={{
      borderColor: isDark ? "#334155" : "#cbd5e1",
      backgroundColor: isDark ? "#1e293b" : "#f8fafc",
    }}>
      <div
        className={`absolute inset-y-1 w-1/2 rounded-lg shadow-sm transition-transform duration-300 ease-out ${
          isDark ? "translate-x-full" : "translate-x-0"
        }`}
        style={{
          backgroundColor: isDark ? "#334155" : "#ffffff",
        }}
        aria-hidden="true"
      />

      <button
        role="tab"
        aria-selected={!isDark}
        onClick={() => setTheme("light")}
        type="button"
        className={`relative z-10 flex w-20 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors`}
        style={{
          color: isDark ? "#64748b" : "#0f172a",
        }}
      >
        <SunIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        role="tab"
        aria-selected={isDark}
        onClick={() => setTheme("dark")}
        type="button"
        className={`relative z-10 flex w-20 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors`}
        style={{
          color: isDark ? "#f1f5f9" : "#64748b",
        }}
      >
        <MoonIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
}

export function ThemeIconButton({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
      className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${className}`}
      style={{
        borderColor: isDark ? "#334155" : "#cbd5e1",
        backgroundColor: isDark ? "#1e293b" : "#f8fafc",
        color: isDark ? "#cbd5e1" : "#475569",
      }}
    >
      <div className="relative h-5 w-5">
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            isDark ? "opacity-0 scale-75" : "opacity-100 scale-100"
          }`}
        >
          <SunIcon className="h-5 w-5" />
        </div>
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            isDark ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          <MoonIcon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}
