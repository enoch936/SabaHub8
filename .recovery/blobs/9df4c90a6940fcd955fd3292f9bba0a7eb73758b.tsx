"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { CssBaseline, StyledEngineProvider, ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material";
import { alpha } from "@mui/material/styles";

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
    const isLight = mode === "light";
    const transition = "all 240ms cubic-bezier(0.22, 1, 0.36, 1)";

    const base = createTheme({
      palette: {
        mode,
        primary: {
          main: isLight ? "#5b7cfa" : "#9db1ff",
          light: isLight ? "#7f98ff" : "#b8c6ff",
          dark: isLight ? "#3f62e7" : "#7e95f4",
        },
        secondary: {
          main: isLight ? "#4da69a" : "#76c8bc",
          light: isLight ? "#73bdb3" : "#94d6cd",
          dark: isLight ? "#3d8f84" : "#5caea2",
        },
        text: {
          primary: isLight ? "#0f172a" : "#e5e7eb",
          secondary: isLight ? "#475467" : "#9ca3af",
        },
        divider: isLight ? "rgba(15,23,42,0.10)" : "rgba(148,163,184,0.26)",
        background: {
          default: isLight ? "#f9fafb" : "#111827",
          paper: isLight ? "#ffffff" : "#1f2937",
        },
      },
      shape: { borderRadius: 12 },
      typography: {
        fontFamily: "var(--font-inter), var(--font-geist-sans), ui-sans-serif, sans-serif",
        h1: { fontWeight: 700, letterSpacing: "-0.02em" },
        h2: { fontWeight: 700, letterSpacing: "-0.02em" },
        h3: { fontWeight: 650, letterSpacing: "-0.01em" },
        h4: { fontWeight: 650, letterSpacing: "-0.01em" },
        h5: { fontWeight: 650, letterSpacing: "-0.008em" },
        h6: { fontWeight: 620, letterSpacing: "-0.006em" },
        button: { fontWeight: 600, textTransform: "none" },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            ":root": {
              colorScheme: mode,
            },
            body: {
              backgroundColor: isLight ? "#f9fafb" : "#111827",
              color: isLight ? "#0f172a" : "#e5e7eb",
              transition: "background-color 240ms ease, color 240ms ease",
            },
            a: {
              transition: transition,
            },
            "*": {
              WebkitTapHighlightColor: "transparent",
            },
          },
        },
        MuiLink: {
          styleOverrides: {
            root: {
              textDecorationColor: isLight ? "rgba(91,124,250,0.35)" : "rgba(157,177,255,0.45)",
              textUnderlineOffset: 3,
              transition,
              "&:hover": {
                color: isLight ? "#3f62e7" : "#b8c6ff",
                textDecorationColor: isLight ? "rgba(91,124,250,0.8)" : "rgba(184,198,255,0.85)",
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              border: `1px solid ${isLight ? "rgba(15,23,42,0.08)" : "rgba(148,163,184,0.2)"}`,
              boxShadow: isLight ? "0 8px 22px rgba(15,23,42,0.05)" : "0 12px 26px rgba(2,6,23,0.3)",
              transition,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 14,
              border: `1px solid ${isLight ? "rgba(15,23,42,0.08)" : "rgba(148,163,184,0.2)"}`,
              boxShadow: isLight ? "0 8px 24px rgba(15,23,42,0.06)" : "0 12px 28px rgba(2,6,23,0.32)",
              transition,
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: isLight ? "0 14px 30px rgba(15,23,42,0.1)" : "0 18px 36px rgba(2,6,23,0.4)",
              },
            },
          },
        },
        MuiButton: {
          defaultProps: {
            disableElevation: true,
          },
          styleOverrides: {
            root: {
              borderRadius: 10,
              minHeight: 38,
              transition,
              "&:hover": {
                boxShadow: isLight ? "0 6px 16px rgba(15,23,42,0.12)" : "0 8px 18px rgba(2,6,23,0.35)",
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "scale(0.985)",
              },
            },
            contained: {
              boxShadow: isLight ? "0 5px 14px rgba(91,124,250,0.24)" : "0 6px 16px rgba(109,136,255,0.28)",
            },
            outlined: {
              borderColor: isLight ? "rgba(15,23,42,0.16)" : "rgba(148,163,184,0.36)",
              "&:hover": {
                borderColor: isLight ? "rgba(91,124,250,0.45)" : "rgba(157,177,255,0.55)",
              },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              transition,
              "&:hover": {
                backgroundColor: isLight ? "rgba(91,124,250,0.08)" : "rgba(157,177,255,0.14)",
                boxShadow: isLight ? "0 4px 12px rgba(15,23,42,0.1)" : "0 6px 14px rgba(2,6,23,0.34)",
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "scale(0.97)",
              },
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              transition,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              backgroundColor: isLight ? "rgba(255,255,255,0.7)" : "rgba(17,24,39,0.3)",
              transition,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: isLight ? "rgba(15,23,42,0.15)" : "rgba(148,163,184,0.34)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: isLight ? "rgba(91,124,250,0.45)" : "rgba(157,177,255,0.55)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: isLight ? "#5b7cfa" : "#9db1ff",
                borderWidth: 1.5,
              },
            },
            notchedOutline: {
              transition,
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              transition,
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderBottom: `1px solid ${isLight ? "rgba(15,23,42,0.08)" : "rgba(148,163,184,0.2)"}`,
            },
            head: {
              fontWeight: 700,
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              borderRadius: 10,
              backgroundColor: isLight ? alpha("#0f172a", 0.88) : alpha("#020617", 0.9),
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
