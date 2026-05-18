"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { CssBaseline, StyledEngineProvider, ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material";

function detectMode(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function MuiAppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMode(detectMode());

    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setMode(detectMode());
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const theme = useMemo(() => {
    const base = createTheme({
      palette: {
        mode,
      },
      shape: { borderRadius: 8 },
      typography: {
        fontFamily: "var(--font-inter), var(--font-geist-sans), ui-sans-serif, sans-serif",
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            ":root": {
              colorScheme: mode,
            },
          },
        },
      },
    });

    return responsiveFontSizes(base);
  }, [mode]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
