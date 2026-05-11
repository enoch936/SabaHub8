import { useCallback } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { EmptyState } from "../../components/common/EmptyState";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { StreamsStackParamList } from "../../navigation/types";
import { useStreamStore } from "../../store/stream-store";
import { formatViewerCount } from "../../utils/formatters";

type Nav = NativeStackNavigationProp<StreamsStackParamList, "StreamsList">;

export function StreamsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<Nav>();
  const streams = useStreamStore((state) => state.streams);
  const loading = useStreamStore((state) => state.loading);
  const loadStreams = useStreamStore((state) => state.loadStreams);
  const startQuickStream = useStreamStore((state) => state.startQuickStream);

  useFocusEffect(
    useCallback(() => {
      loadStreams().catch(() => undefined);
    }, [loadStreams]),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.actionsRow}>
        <Pressable
          disabled={loading}
          style={[
            styles.startButton,
            { backgroundColor: theme.colors.primary },
            loading ? styles.startButtonDisabled : null,
          ]}
          onPress={() => {
            startQuickStream()
              .then((streamId) => {
                navigation.navigate("StreamViewer", { streamId });
              })
              .catch((error) => {
                const message = error instanceof Error ? error.message : "Unable to start stream";
                Alert.alert("Start stream failed", message);
              });
          }}
        >
          <Text style={styles.startButtonText}>{loading ? "Starting..." : "Start Broadcast"}</Text>
        </Pressable>
      </View>
      <FlatList
        data={streams}
        refreshing={loading}
        onRefresh={() => loadStreams()}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="No streams available" subtitle="Tap Start Broadcast to launch your first live session." />}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate("StreamViewer", { streamId: item.id })}
          >
            <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.subtext }]} numberOfLines={2}>
              {item.description || "No description"}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.subtext }]}>
              {item.status} · {formatViewerCount(item.viewerCount)} viewers
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actionsRow: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  startButton: {
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  content: { padding: 12, gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    fontSize: 12,
  },
});
