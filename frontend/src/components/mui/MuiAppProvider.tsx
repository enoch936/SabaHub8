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

    const primary = isDark ? "#93c5fd" : "#111827";
    const secondary = isDark ? "#60a5fa" : "#2563eb";
    const bg = isDark ? "#0b1220" : "#ffffff";
    const paper = isDark ? "#0f172a" : "#ffffff";
    const divider = isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(15, 23, 42, 0.08)";
    const textPrimary = isDark ? "#e5e7eb" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#475569";
    const contrastText = isDark ? "#0b1220" : "#ffffff";

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
          main: isDark ? "#22c55e" : "#16a34a",
        },
        warning: {
          main: isDark ? "#f59e0b" : "#d97706",
        },
        error: {
          main: isDark ? "#ef4444" : "#dc2626",
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
        borderRadius: 16,
      },
      typography: {
        fontFamily: "var(--font-sans), ui-sans-serif, sans-serif",
        h1: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02, fontSize: "clamp(2.2rem, 5vw, 3.7rem)" },
        h2: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 700, letterSpacing: "-0.026em", lineHeight: 1.05, fontSize: "clamp(1.95rem, 4vw, 3.2rem)" },
        h3: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 700, letterSpacing: "-0.022em", lineHeight: 1.08, fontSize: "clamp(1.6rem, 3vw, 2.45rem)" },
        h4: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 670, letterSpacing: "-0.018em", lineHeight: 1.12, fontSize: "clamp(1.32rem, 2.2vw, 1.95rem)" },
        h5: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 650, letterSpacing: "-0.014em", lineHeight: 1.14, fontSize: "clamp(1.16rem, 1.8vw, 1.5rem)" },
        h6: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 640, letterSpacing: "-0.012em", lineHeight: 1.18, fontSize: "clamp(1.02rem, 1.1vw, 1.2rem)" },
        body1: { fontSize: "0.98rem", lineHeight: 1.66 },
        body2: { fontSize: "0.9rem", lineHeight: 1.58 },
        caption: { fontSize: "0.76rem", lineHeight: 1.5, letterSpacing: "0.02em" },
        button: { fontWeight: 620, textTransform: "none", letterSpacing: "0.01em" },
        overline: { fontWeight: 700, letterSpacing: "0.08em", fontSize: "0.7rem" },
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
              backgroundImage: "none",
              transition: "background-color 240ms ease, color 240ms ease",
            },
            "*": {
              boxSizing: "border-box",
              WebkitTapHighlightColor: "transparent",
            },
            "*::selection": {
              backgroundColor: isDark ? "rgba(96, 165, 250, 0.22)" : "rgba(37, 99, 235, 0.18)",
            },
            "::-webkit-scrollbar": {
              width: 10,
              height: 10,
            },
            "::-webkit-scrollbar-track": {
              backgroundColor: isDark ? "rgba(15, 23, 42, 0.55)" : "rgba(148, 163, 184, 0.16)",
            },
            "::-webkit-scrollbar-thumb": {
              backgroundColor: isDark ? "rgba(148, 163, 184, 0.44)" : "rgba(100, 116, 139, 0.54)",
              borderRadius: 999,
            },
          },
        },
        MuiLink: {
          styleOverrides: {
            root: {
              textDecorationColor: alpha(secondary, 0.3),
              textUnderlineOffset: 3,
              transition,
              "&:hover": {
                textDecorationColor: alpha(secondary, 0.72),
                backgroundColor: alpha(secondary, 0.04),
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              transition,
              borderBottom: `1px solid ${divider}`,
              backdropFilter: "none",
              backgroundImage: "none",
              backgroundColor: paper,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              transition,
              backgroundImage: "none",
              backgroundColor: paper,
            },
          },
        },
        MuiContainer: {
          styleOverrides: {
            root: {
              paddingLeft: 16,
              paddingRight: 16,
              "@media (min-width: 900px)": {
                paddingLeft: 24,
                paddingRight: 24,
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 18,
              border: `1px solid ${divider}`,
              backgroundImage: "none",
              backdropFilter: "none",
              boxShadow: isDark ? "0 16px 32px rgba(0, 0, 0, 0.35)" : "0 16px 32px rgba(15, 23, 42, 0.05)",
              transition,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 20,
              border: `1px solid ${divider}`,
              backgroundImage: "none",
              backdropFilter: "none",
              boxShadow: isDark ? "0 18px 38px rgba(0, 0, 0, 0.4)" : "0 18px 38px rgba(15, 23, 42, 0.06)",
              transition,
              "&:hover": {
                boxShadow: isDark ? "0 18px 38px rgba(0, 0, 0, 0.4)" : "0 18px 38px rgba(15, 23, 42, 0.06)",
              },
            },
          },
        },
        MuiCardContent: {
          styleOverrides: {
            root: {
              padding: 18,
              "@media (min-width: 900px)": {
                padding: 22,
              },
              "&:last-child": {
                paddingBottom: 18,
                "@media (min-width: 900px)": {
                  paddingBottom: 22,
                },
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
              minHeight: 40,
              borderRadius: 12,
              transition,
              "&:hover": {
                transform: "none",
                boxShadow: isDark ? "0 8px 24px rgba(0, 0, 0, 0.4)" : "0 8px 20px rgba(15, 23, 42, 0.1)",
              },
            },
            contained: {
              color: contrastText,
              backgroundImage: "none",
              backgroundColor: primary,
              boxShadow: isDark ? "0 10px 22px rgba(0, 0, 0, 0.35)" : "0 10px 22px rgba(15, 23, 42, 0.12)",
              "&:hover": {
                backgroundImage: "none",
                backgroundColor: primary,
                boxShadow: isDark ? "0 12px 30px rgba(0, 0, 0, 0.5)" : "0 12px 28px rgba(15, 23, 42, 0.2)",
              },
            },
            outlined: {
              borderColor: isDark ? "rgba(148, 163, 184, 0.28)" : "rgba(15, 23, 42, 0.16)",
              "&:hover": {
                borderColor: alpha(primary, 0.28),
                backgroundColor: isDark ? alpha("#ffffff", 0.06) : "rgba(248, 250, 252, 1)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              },
            },
            text: {
              "&:hover": {
                backgroundColor: alpha(primary, 0.04),
                boxShadow: "none",
              },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              transition,
              "&:hover": {
                backgroundColor: alpha(primary, isDark ? 0.12 : 0.05),
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                transform: "none",
              },
            },
          },
        },
        MuiTextField: {
          defaultProps: {
            variant: "outlined",
            size: "small",
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              transition,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(15, 23, 42, 0.55)" : "#ffffff",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: isDark ? "rgba(148, 163, 184, 0.28)" : "rgba(15, 23, 42, 0.14)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: isDark ? "rgba(148, 163, 184, 0.4)" : "rgba(15, 23, 42, 0.24)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: secondary,
                borderWidth: 1.5,
              },
            },
            input: {
              paddingTop: 10,
              paddingBottom: 10,
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              border: isDark ? "1px solid rgba(148, 163, 184, 0.18)" : "1px solid rgba(15, 23, 42, 0.1)",
              backdropFilter: "none",
              transition,
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              transition,
              "&.Mui-selected": {
                backgroundColor: alpha(primary, 0.07),
              },
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              borderRadius: 14,
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              margin: "2px 4px",
              transition,
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              border: `1px solid ${divider}`,
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderBottom: `1px solid ${divider}`,
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
              backgroundColor: alpha(isDark ? "#0b1220" : "#0f172a", 0.92),
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
