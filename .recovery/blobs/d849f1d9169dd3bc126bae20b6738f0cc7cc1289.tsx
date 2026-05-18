"use client";

import { useEffect, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";

type ThemeMode = "light" | "dark";

function readMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("sabahub-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(mode);
  root.style.colorScheme = mode;
  localStorage.setItem("sabahub-theme", mode);
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const initial = readMode();
    setMode(initial);
  }, []);

  const toggle = () => {
    const next = mode === "light" ? "dark" : "light";
    applyMode(next);
    setMode(next);
  };

  return (
    <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
      <IconButton aria-label="toggle theme" onClick={toggle}>
        {mode === "light" ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
      </IconButton>
    </Tooltip>
  );
}
