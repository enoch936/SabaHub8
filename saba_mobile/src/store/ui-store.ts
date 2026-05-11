import { create } from "zustand";

type ThemeMode = "system" | "light" | "dark";

type UIState = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

export const useUIStore = create<UIState>((set) => ({
  themeMode: "system",
  setThemeMode: (themeMode) => set({ themeMode }),
}));
