"use client";

import { Button, ButtonProps } from "@mui/material";

export default function SoftButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      sx={[
        {
          borderRadius: 10,
          textTransform: "none",
          transition: "all 240ms cubic-bezier(0.22, 1, 0.36, 1)",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: 4,
          },
          "&:active": {
            transform: "scale(0.985)",
          },
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
}
