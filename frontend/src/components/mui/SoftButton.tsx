"use client";

import { ReactNode } from "react";
import { Button, ButtonProps } from "@mui/material";

interface SoftButtonProps extends Omit<ButtonProps, "variant" | "size" | "color"> {
  variant?: ButtonProps["variant"] | "outline";
  color?: ButtonProps["color"] | "danger";
  size?: ButtonProps["size"] | "sm";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function SoftButton({ disableElevation, variant, color, size, sx, leftIcon, rightIcon, ...props }: SoftButtonProps) {
  const muiVariant = variant === "outline" ? "outlined" : variant;
  const muiColor = color === "danger" ? "error" : color;
  const muiSize = size === "sm" ? "small" : size;
  const baseSx = muiSize === "small"
    ? { borderRadius: 2.5, px: 1.2, minHeight: 30, textTransform: "none", fontSize: "0.78rem" }
    : muiSize === "large"
      ? { borderRadius: 2.75, px: 1.5, minHeight: 36, textTransform: "none", fontSize: "0.875rem" }
      : { borderRadius: 2.5, px: 1.35, minHeight: 32, textTransform: "none", fontSize: "0.82rem" };

  const mergedSx = Array.isArray(sx)
    ? [baseSx, ...sx]
    : [baseSx, sx];

  return (
    <Button
      disableElevation={disableElevation ?? true}
      variant={muiVariant}
      color={muiColor}
      size={muiSize ?? "medium"}
      sx={mergedSx}
      startIcon={leftIcon}
      endIcon={rightIcon}
      {...props}
    />
  );
}
