"use client";

import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { IconButton, Tooltip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useAppTheme } from "@/components/ThemeProvider";

export function ThemeIconButton({
  size = "medium",
  sx,
}: {
  size?: "small" | "medium" | "large";
  sx?: SxProps<Theme>;
}) {
  const { theme, toggleTheme, mounted } = useAppTheme();
  const isDark = theme === "dark";
  const title = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          aria-label={title}
          size={size}
          onClick={toggleTheme}
          disabled={!mounted}
          sx={sx}
        >
          {isDark ? <LightModeRoundedIcon fontSize="inherit" /> : <DarkModeRoundedIcon fontSize="inherit" />}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function SegmentedThemeToggle() {
  // Not used in the current UI (kept for future), prefer ThemeIconButton.
  return null;
}

export default function ThemeToggle() {
  return <ThemeIconButton />;
}
