"use client";

import { ElementType } from "react";
import { Card, CardProps } from "@mui/material";

type SoftCardProps<C extends ElementType = "div"> = CardProps<C, { component?: C }>;

export default function SoftCard<C extends ElementType = "div">({
  elevation,
  sx,
  ...props
}: SoftCardProps<C>) {
  const mergedSx = Array.isArray(sx)
    ? [{ overflow: "hidden", position: "relative" }, ...sx]
    : [{ overflow: "hidden", position: "relative" }, sx];

  return <Card elevation={elevation ?? 0} sx={mergedSx} {...props} />;
}
