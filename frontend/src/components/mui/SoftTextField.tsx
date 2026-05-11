"use client";

import { TextField, TextFieldProps } from "@mui/material";

export default function SoftTextField({ variant, size, sx, ...props }: TextFieldProps) {
  const mergedSx = Array.isArray(sx)
    ? [{ "& .MuiInputBase-input": { fontWeight: 500 } }, ...sx]
    : [{ "& .MuiInputBase-input": { fontWeight: 500 } }, sx];

  return <TextField variant={variant ?? "outlined"} size={size ?? "small"} sx={mergedSx} {...props} />;
}
