"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((nextTheme: Theme) => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;

    // Apply class for dark: variants
    if (nextTheme === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
    }

    // Apply data attribute
    html.setAttribute("data-theme", nextTheme);

    // Set color-scheme
    html.style.colorScheme = nextTheme;

    // Apply CSS variables
    html.style.setProperty("--background", nextTheme === "dark" ? "#0a0a0a" : "#ffffff");
    html.style.setProperty("--foreground", nextTheme === "dark" ? "#ededed" : "#171717");

    // Save to localStorage
    try {
      localStorage.setItem("sabahub-theme", nextTheme);
    } catch {}
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sabahub-theme");
      const initialTheme = (saved === "dark" ? "dark" : "light") as Theme;
      setThemeState(initialTheme);
      applyTheme(initialTheme);
    } catch {
      applyTheme("light");
    }
    setMounted(true);
  }, [applyTheme]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      applyTheme(nextTheme);
      
      // Trigger a custom event so other instances know about the change
      window.dispatchEvent(
        new CustomEvent("theme-change", { detail: { theme: nextTheme } })
      );
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  const [, setUpdate] = useState(0);

  // Listen for theme changes from other instances
  useEffect(() => {
    if (!context) return;

    const handleThemeChange = () => {
      // Force re-render to pick up the new theme from context
      setUpdate((prev) => prev + 1);
    };

    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, [context]);

  if (!context) {
    throw new Error("useTheme must be used within ThemeContextProvider");
  }

  return context;
}
