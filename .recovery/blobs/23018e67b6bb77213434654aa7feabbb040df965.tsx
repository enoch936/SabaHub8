"use client";

import { TextField, TextFieldProps } from "@mui/material";

export default function SoftTextField(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      sx={[
        (theme) => ({
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            transition: "all 240ms cubic-bezier(0.22, 1, 0.36, 1)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.mode === "light" ? "rgba(15,23,42,0.15)" : "rgba(148,163,184,0.34)",
              transition: "all 240ms cubic-bezier(0.22, 1, 0.36, 1)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.mode === "light" ? "rgba(91,124,250,0.45)" : "rgba(157,177,255,0.55)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.mode === "light" ? "#5b7cfa" : "#9db1ff",
              borderWidth: 1.5,
            },
          },
        }),
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
}
