export type AppTheme = {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    subtext: string;
    primary: string;
    danger: string;
    border: string;
    success: string;
  };
};

export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    background: "#f5f7fb",
    surface: "#ffffff",
    card: "#ffffff",
    text: "#0f172a",
    subtext: "#475569",
    primary: "#0b5fff",
    danger: "#d92d20",
    border: "#dbe1ea",
    success: "#0f9d58",
  },
};

export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    background: "#0b1220",
    surface: "#111b30",
    card: "#14203a",
    text: "#e5edf8",
    subtext: "#a6b7d3",
    primary: "#5f94ff",
    danger: "#ff5f5f",
    border: "#203252",
    success: "#47d284",
  },
};
