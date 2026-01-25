"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

export { SegmentedThemeToggle, ThemeIconButton } from "./ThemeToggle";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize on mount and listen for changes
  useEffect(() => {
    const initializeTheme = () => {
      try {
        const saved = localStorage.getItem("sabahub-theme");
        const initialTheme = (saved === "dark" ? "dark" : "light") as Theme;
        setThemeState(initialTheme);
        applyThemeToDOM(initialTheme);
      } catch {
        applyThemeToDOM("light");
      }
    };

    initializeTheme();
    setMounted(true);

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sabahub-theme" && e.newValue) {
        const newTheme = (e.newValue === "dark" ? "dark" : "light") as Theme;
        setThemeState(newTheme);
        applyThemeToDOM(newTheme);
      }
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

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

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
    root.style.setProperty("--background", nextTheme === "dark" ? "#0a0a0a" : "#ffffff");
    root.style.setProperty("--foreground", nextTheme === "dark" ? "#ededed" : "#171717");
    
    // Save to localStorage
    try {
      localStorage.setItem("sabahub-theme", nextTheme);
    } catch {}
  }, []);

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
