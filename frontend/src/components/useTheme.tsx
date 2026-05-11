"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

export { SegmentedThemeToggle, ThemeIconButton } from "./mui/ThemeToggle";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  const applyThemeToDOM = useCallback((nextTheme: Theme) => {
    if (typeof document === "undefined") return;
    
    const html = document.documentElement;
    const isDark = nextTheme === "dark";
    
    // Set class for Tailwind dark: variants
    if (isDark) {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
    }
    
    // Set data attribute for direct CSS selectors
    html.setAttribute("data-theme", nextTheme);
    
    // Set color-scheme for native elements
    html.style.colorScheme = nextTheme;
    
    // Apply inline styles for critical elements
    const root = document.documentElement;
    root.style.setProperty("--background", nextTheme === "dark" ? "#111827" : "#f9fafb");
    root.style.setProperty("--foreground", nextTheme === "dark" ? "#e5e7eb" : "#0f172a");
    
    // Save to localStorage
    try {
      localStorage.setItem("sabahub-theme", nextTheme);
    } catch {}
  }, []);

  const resolveTheme = useCallback((): Theme => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("sabahub-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);

  // Initialize on mount and listen for changes
  useEffect(() => {
    const initializeTheme = () => {
      try {
        const initialTheme = resolveTheme();
        setThemeState(initialTheme);
        applyThemeToDOM(initialTheme);
      } catch {
        const fallbackTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        applyThemeToDOM(fallbackTheme);
      }
    };

    initializeTheme();
    setMounted(true);

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sabahub-theme") {
        const newTheme = resolveTheme();
        setThemeState(newTheme);
        applyThemeToDOM(newTheme);
      }
    };

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const saved = localStorage.getItem("sabahub-theme");
      if (saved === "light" || saved === "dark") return;
      const systemTheme = media.matches ? "dark" : "light";
      setThemeState(systemTheme);
      applyThemeToDOM(systemTheme);
    };

    // Listen for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const html = document.documentElement;
          const isDark = html.classList.contains("dark");
          const newTheme = isDark ? "dark" : "light";
          setThemeState(newTheme);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    window.addEventListener("storage", handleStorageChange);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleSystemChange);
    } else {
      media.addListener(handleSystemChange);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorageChange);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", handleSystemChange);
      } else {
        media.removeListener(handleSystemChange);
      }
    };
  }, [applyThemeToDOM, resolveTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      applyThemeToDOM(next);
    },
    [applyThemeToDOM]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, mounted };
}
