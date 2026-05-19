"use client";

import { ReactNode, useMemo } from "react";
import { CssBaseline, StyledEngineProvider, ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAppTheme } from "@/components/ThemeProvider";

export default function MuiAppProvider({ children }: { children: ReactNode }) {
  const { theme: mode } = useAppTheme();

  const theme = useMemo(() => {
    const transition = "background-color 220ms ease, color 220ms ease, border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease";
    const isDark = mode === "dark";

    const primary = isDark ? "#7dd3fc" : "#0f172a";
    const secondary = isDark ? "#a78bfa" : "#2563eb";
    const bg = isDark ? "#030712" : "#f5f8ff";
    const paper = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.68)";
    const divider = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(15, 23, 42, 0.12)";
    const textPrimary = isDark ? "#f8fbff" : "#0a1020";
    const textSecondary = isDark ? "#a8b3c7" : "#5b6478";
    const contrastText = isDark ? "#03111f" : "#ffffff";
    const glassBg = isDark
      ? "linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.055))"
      : "linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.46))";
    const glassShadow = isDark
      ? "0 24px 70px rgba(0, 0, 0, 0.42), 0 0 60px rgba(56,189,248,0.08)"
      : "0 24px 70px rgba(15, 23, 42, 0.12), 0 0 52px rgba(56,189,248,0.1)";

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
        h1: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 720, letterSpacing: 0, lineHeight: 1.02, fontSize: "clamp(2.2rem, 5vw, 3.7rem)" },
        h2: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 720, letterSpacing: 0, lineHeight: 1.05, fontSize: "clamp(1.95rem, 4vw, 3.2rem)" },
        h3: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 700, letterSpacing: 0, lineHeight: 1.08, fontSize: "clamp(1.6rem, 3vw, 2.45rem)" },
        h4: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 680, letterSpacing: 0, lineHeight: 1.12, fontSize: "clamp(1.32rem, 2.2vw, 1.95rem)" },
        h5: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 660, letterSpacing: 0, lineHeight: 1.14, fontSize: "clamp(1.16rem, 1.8vw, 1.5rem)" },
        h6: { fontFamily: "var(--font-display), var(--font-sans), sans-serif", fontWeight: 650, letterSpacing: 0, lineHeight: 1.18, fontSize: "clamp(1.02rem, 1.1vw, 1.2rem)" },
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
              backgroundImage: isDark
                ? "radial-gradient(circle at 18% 12%, rgba(56,189,248,0.2), transparent 30rem), radial-gradient(circle at 86% 6%, rgba(139,92,246,0.2), transparent 32rem), linear-gradient(135deg, #020617 0%, #06111f 48%, #0a0718 100%)"
                : "radial-gradient(circle at 16% 12%, rgba(56,189,248,0.16), transparent 28rem), radial-gradient(circle at 86% 8%, rgba(139,92,246,0.12), transparent 30rem), linear-gradient(135deg, #f7fbff 0%, #eef4ff 48%, #f9f7ff 100%)",
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
                color: secondary,
                textDecorationColor: alpha(secondary, 0.72),
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              transition,
              borderBottom: `1px solid ${divider}`,
              backdropFilter: "blur(28px) saturate(1.45)",
              WebkitBackdropFilter: "blur(28px) saturate(1.45)",
              backgroundImage: glassBg,
              backgroundColor: "transparent",
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              transition,
              backgroundImage: glassBg,
              backgroundColor: "transparent",
              backdropFilter: "blur(28px) saturate(1.35)",
              WebkitBackdropFilter: "blur(28px) saturate(1.35)",
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
              backgroundImage: glassBg,
              backgroundColor: "transparent",
              backdropFilter: "blur(24px) saturate(1.3)",
              WebkitBackdropFilter: "blur(24px) saturate(1.3)",
              boxShadow: glassShadow,
              transition,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 20,
              border: `1px solid ${divider}`,
              backgroundImage: glassBg,
              backgroundColor: "transparent",
              backdropFilter: "blur(24px) saturate(1.3)",
              WebkitBackdropFilter: "blur(24px) saturate(1.3)",
              boxShadow: glassShadow,
              transition,
              "&:hover": {
                transform: "translateY(-3px)",
                borderColor: alpha("#7dd3fc", 0.36),
                boxShadow: isDark ? "0 32px 90px rgba(0,0,0,0.48), 0 0 70px rgba(56,189,248,0.12)" : "0 32px 90px rgba(15,23,42,0.16)",
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
              borderRadius: 16,
              transition,
              position: "relative",
              overflow: "hidden",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
            },
            contained: {
              color: contrastText,
              backgroundImage: isDark
                ? "linear-gradient(135deg, rgba(125,211,252,0.95), rgba(167,139,250,0.86))"
                : "linear-gradient(135deg, #0f172a, #312e81)",
              backgroundColor: primary,
              boxShadow: isDark ? "0 16px 42px rgba(56, 189, 248, 0.22)" : "0 16px 42px rgba(15, 23, 42, 0.18)",
              "&:hover": {
                transform: "translateY(-2px)",
                backgroundColor: isDark ? "#7dd3fc" : "#0f172a",
                boxShadow: isDark ? "0 22px 58px rgba(139,92,246,0.26)" : "0 22px 58px rgba(15,23,42,0.22)",
              },
            },
            outlined: {
              borderColor: divider,
              backgroundColor: isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.48)",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: alpha("#7dd3fc", 0.42),
                backgroundColor: isDark ? alpha("#ffffff", 0.1) : "rgba(255,255,255,0.72)",
              },
            },
            text: {
              "&:hover": {
                backgroundColor: alpha(primary, 0.04),
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
                transform: "translateY(-2px)",
                backgroundColor: alpha(primary, isDark ? 0.14 : 0.08),
                boxShadow: `0 14px 34px ${alpha("#38bdf8", isDark ? 0.14 : 0.1)}`,
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
              borderRadius: 16,
              transition,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.62)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: divider,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha("#7dd3fc", 0.36),
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: secondary,
                borderWidth: 1.5,
              },
              "&.Mui-focused": {
                boxShadow: `0 0 0 4px ${alpha(secondary, 0.14)}, 0 18px 42px ${alpha("#38bdf8", isDark ? 0.14 : 0.08)}`,
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
              border: `1px solid ${divider}`,
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              backgroundImage: isDark ? "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))" : undefined,
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
