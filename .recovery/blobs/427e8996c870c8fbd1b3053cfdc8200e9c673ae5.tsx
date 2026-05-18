"use client";

import { Card, CardProps } from "@mui/material";

export default function SoftCard(props: CardProps) {
  return (
    <Card
      {...props}
      sx={[
        {
          borderRadius: 14,
          transition: "all 240ms cubic-bezier(0.22, 1, 0.36, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: 6,
          },
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
}
