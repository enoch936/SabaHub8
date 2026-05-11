import { useColorScheme } from "react-native";
import { useUIStore } from "../store/ui-store";
import { darkTheme, lightTheme } from "../theme/theme";

export function useAppTheme() {
  const scheme = useColorScheme();
  const mode = useUIStore((state) => state.themeMode);

  if (mode === "light") {
    return lightTheme;
  }
  if (mode === "dark") {
    return darkTheme;
  }
  return scheme === "dark" ? darkTheme : lightTheme;
}
