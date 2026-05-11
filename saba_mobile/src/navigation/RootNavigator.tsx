import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useAppTheme } from "../hooks/useAppTheme";
import { useSessionStore } from "../store/session-store";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabs } from "./MainTabs";
import { useStompConnection } from "../hooks/useStompConnection";
import { LoadingState } from "../components/common/LoadingState";

export function RootNavigator() {
  useStompConnection();
  const initialized = useSessionStore((state) => state.initialized);
  const token = useSessionStore((state) => state.token);
  const theme = useAppTheme();

  if (!initialized) {
    return <LoadingState label="Bootstrapping session..." />;
  }

  const navigationTheme = theme.dark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.colors.background,
          card: theme.colors.surface,
          border: theme.colors.border,
          text: theme.colors.text,
          primary: theme.colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.background,
          card: theme.colors.surface,
          border: theme.colors.border,
          text: theme.colors.text,
          primary: theme.colors.primary,
        },
      };

  return <NavigationContainer theme={navigationTheme}>{token ? <MainTabs /> : <AuthNavigator />}</NavigationContainer>;
}
