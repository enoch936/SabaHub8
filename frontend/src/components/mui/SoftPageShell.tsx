"use client";

import { ReactNode } from "react";
import { Box, Container, type ContainerProps } from "@mui/material";

type SoftPageShellProps = {
  children: ReactNode;
  containerProps?: ContainerProps;
  noContainer?: boolean;
  py?: number;
};

export default function SoftPageShell({
  children,
  containerProps,
  noContainer = false,
  py = 3,
}: SoftPageShellProps) {
  return (
    <Box
      className="sheet-shell"
      sx={{
        minHeight: "100vh",
        py,
        backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      {noContainer ? (
        <Box>{children}</Box>
      ) : (
        <Container maxWidth="xl" className="sheet-container" {...containerProps}>
          {children}
        </Container>
      )}
    </Box>
  );
}
