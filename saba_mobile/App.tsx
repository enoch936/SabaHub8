import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AppProviders } from "./src/providers/AppProviders";
import { useAppTheme } from "./src/hooks/useAppTheme";
import { useSessionBootstrap } from "./src/hooks/useSessionBootstrap";

export default function App() {
  useSessionBootstrap();
  const theme = useAppTheme();
  return (
    <AppProviders>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <RootNavigator />
    </AppProviders>
  );
}
