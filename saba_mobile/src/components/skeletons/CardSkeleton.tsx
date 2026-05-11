import { StyleSheet, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";

export function CardSkeleton() {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[styles.line, { backgroundColor: theme.colors.border, width: "72%" }]} />
      <View style={[styles.line, { backgroundColor: theme.colors.border, width: "98%" }]} />
      <View style={[styles.line, { backgroundColor: theme.colors.border, width: "58%" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  line: {
    height: 10,
    borderRadius: 999,
  },
});
