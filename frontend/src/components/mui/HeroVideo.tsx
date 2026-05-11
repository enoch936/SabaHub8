"use client";

import { ReactNode } from "react";
import { Box } from "@mui/material";

type HeroVideoProps = {
  src: string;
  poster?: string;
  children: ReactNode;
  minHeight?: number | string | Record<string, number | string>;
};

export default function HeroVideo({ src: _src, poster, children, minHeight = { xs: 280, md: 520 } }: HeroVideoProps) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: { xs: 3, md: 4 },
        minHeight,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
      }}
    >
      {poster ? (
        <Box
          component="img"
          src={poster}
          alt="Hero"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: { xs: "center center", md: "center 40%" },
          }}
        />
      ) : (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(120deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.84) 60%, rgba(2,132,199,0.65) 100%)",
          }}
        />
      )}

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(120deg, rgba(2,6,23,0.78) 0%, rgba(15,23,42,0.58) 52%, rgba(8,47,73,0.48) 100%)",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, height: "100%" }}>{children}</Box>
    </Box>
  );
}
