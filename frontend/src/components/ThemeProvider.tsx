"use client";

import { ReactNode, useEffect } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Apply saved theme on mount
    try {
      const saved = localStorage.getItem("sabahub-theme");
      const theme = saved === "dark" ? "dark" : "light";
      const root = document.documentElement;
      
      root.classList.remove("dark", "light");
      root.classList.add(theme);
      root.style.colorScheme = theme;
    } catch (e) {
      console.error("Theme loading failed:", e);
    }
  }, []);

  return <>{children}</>;
}
