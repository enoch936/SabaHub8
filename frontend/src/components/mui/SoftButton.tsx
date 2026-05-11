"use client";

import { Button, ButtonProps } from "@mui/material";

export default function SoftButton({ disableElevation, size, sx, ...props }: ButtonProps) {
  const mergedSx = Array.isArray(sx)
    ? [{ borderRadius: 3, px: 1.6, minHeight: 38, textTransform: "none" }, ...sx]
    : [{ borderRadius: 3, px: 1.6, minHeight: 38, textTransform: "none" }, sx];

  return <Button disableElevation={disableElevation ?? true} size={size ?? "medium"} sx={mergedSx} {...props} />;
}
