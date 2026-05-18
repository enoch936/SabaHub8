"use client";

import { ReactNode, useEffect } from "react";

function applyLightMode() {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add("light");
  root.setAttribute("data-theme", "light");
  root.style.colorScheme = "light";
  localStorage.setItem("sabahub-theme", "light");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyLightMode();
  }, []);

  return <>{children}</>;
}
