"use client";

import { ReactNode } from "react";
import { Box, NoSsr } from "@mui/material";
import { ResponsiveContainer } from "recharts";

type NoSsrResponsiveContainerProps = {
  children: ReactNode;
  fallbackHeight?: number | string;
};

export default function NoSsrResponsiveContainer({
  children,
  fallbackHeight = 220,
}: NoSsrResponsiveContainerProps) {
  return (
    <NoSsr fallback={<Box sx={{ width: "100%", height: fallbackHeight }} />}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </NoSsr>
  );
}
