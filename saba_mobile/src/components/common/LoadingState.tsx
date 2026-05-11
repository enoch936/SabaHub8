import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.label, { color: theme.colors.subtext }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
  },
});
