"use client";

import { ReactNode, useMemo } from "react";
import { CssBaseline, StyledEngineProvider, ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAppTheme } from "@/components/ThemeProvider";

export default function MuiAppProvider({ children }: { children: ReactNode }) {
  const { theme: mode } = useAppTheme();

  const theme = useMemo(() => {
    const transition = "background-color 160ms ease, color 160ms ease, border-color 160ms ease, box-shadow 160ms ease";
    const isDark = mode === "dark";

    const primary = isDark ? "#60a5fa" : "#2563eb";
    const secondary = isDark ? "#c084fc" : "#7c3aed";
    const bg = isDark ? "#030712" : "#f8fafc";
    const paper = isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.7)";
    const divider = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)";
    const textPrimary = isDark ? "#f8fafc" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#475569";
    const contrastText = "#ffffff";

    const base = createTheme({
      palette: {
        mode,
        primary: {
          main: primary,
          contrastText,
        },
        secondary: {
          main: secondary,
          contrastText: "#ffffff",
        },
        success: {
          main: "#10b981",
        },
        warning: {
          main: "#f59e0b",
        },
        error: {
          main: "#ef4444",
        },
        text: {
          primary: textPrimary,
          secondary: textSecondary,
        },
        divider,
        background: {
          default: bg,
          paper,
        },
      },
      shape: {
        borderRadius: 24,
      },
      typography: {
        fontFamily: "var(--font-sans), ui-sans-serif, sans-serif",
        h1: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, fontSize: "clamp(2.5rem, 6vw, 4.5rem)" },
        h2: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, fontSize: "clamp(2rem, 5vw, 3.5rem)" },
        h3: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, fontSize: "clamp(1.75rem, 4vw, 2.75rem)" },
        h4: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2, fontSize: "clamp(1.5rem, 3vw, 2rem)" },
        body1: { fontSize: "1rem", lineHeight: 1.6 },
        body2: { fontSize: "0.875rem", lineHeight: 1.5 },
        button: { fontWeight: 600, textTransform: "none" },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            ":root": {
              colorScheme: mode,
            },
            body: {
              backgroundColor: bg,
              color: textPrimary,
              backgroundImage: isDark 
                ? "radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%)"
                : "none",
              transition: "background-color 300ms ease, color 300ms ease",
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 24,
              border: `1px solid ${divider}`,
              backgroundImage: "none",
              backgroundColor: paper,
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
              transition,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 32,
              border: `1px solid ${divider}`,
              backgroundImage: "none",
              backgroundColor: paper,
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
              transition,
              "&:hover": {
                borderColor: alpha(primary, 0.3),
                transform: "translateY(-4px)",
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
              borderRadius: 14,
              padding: "10px 24px",
              fontWeight: 600,
              transition,
            },
            contained: {
              backgroundColor: primary,
              backgroundImage: "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
              "&:hover": {
                backgroundColor: alpha(primary, 0.8),
                boxShadow: `0 0 20px ${alpha(primary, 0.4)}`,
              },
            },
            outlined: {
              borderWidth: "1.5px",
              "&:hover": {
                borderWidth: "1.5px",
                backgroundColor: alpha(primary, 0.05),
              },
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              backgroundColor: alpha(isDark ? "#ffffff" : "#000000", 0.04),
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: divider,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(primary, 0.5),
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: primary,
                boxShadow: `0 0 10px ${alpha(primary, 0.2)}`,
              },
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
