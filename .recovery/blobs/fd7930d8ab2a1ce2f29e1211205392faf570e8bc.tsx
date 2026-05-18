"use client";

import { ReactNode, useEffect } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (theme: "light" | "dark") => {
      const root = document.documentElement;
      root.classList.remove("dark", "light");
      root.classList.add(theme);
      root.style.colorScheme = theme;
    };

    const resolveMode = (): "light" | "dark" => {
      const saved = localStorage.getItem("sabahub-theme");
      if (saved === "dark" || saved === "light") return saved;
      return media.matches ? "dark" : "light";
    };

    try {
      apply(resolveMode());
    } catch (e) {
      console.error("Theme loading failed:", e);
    }

    const onSystemModeChange = () => {
      const saved = localStorage.getItem("sabahub-theme");
      if (saved === "dark" || saved === "light") return;
      apply(resolveMode());
    };

    media.addEventListener("change", onSystemModeChange);
    return () => media.removeEventListener("change", onSystemModeChange);
  }, []);

  return <>{children}</>;
}
