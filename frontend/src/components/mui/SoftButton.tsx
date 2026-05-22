"use client";

import { Button, ButtonProps } from "@mui/material";

export default function SoftButton({ disableElevation, size, sx, ...props }: ButtonProps) {
  const baseSx = size === "small"
    ? { borderRadius: 2.5, px: 1.2, minHeight: 30, textTransform: "none", fontSize: "0.78rem" }
    : size === "large"
      ? { borderRadius: 2.75, px: 1.5, minHeight: 36, textTransform: "none", fontSize: "0.875rem" }
      : { borderRadius: 2.5, px: 1.35, minHeight: 32, textTransform: "none", fontSize: "0.82rem" };

  const mergedSx = Array.isArray(sx)
    ? [baseSx, ...sx]
    : [baseSx, sx];

  return <Button disableElevation={disableElevation ?? true} size={size ?? "medium"} sx={mergedSx} {...props} />;
}
