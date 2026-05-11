import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useChatStore } from "../../store/chat-store";
import { useAppTheme } from "../../hooks/useAppTheme";
import { EmptyState } from "../../components/common/EmptyState";
import type { ChatStackParamList } from "../../navigation/types";
import { listPerfConfig } from "../../utils/perf";

type Nav = NativeStackNavigationProp<ChatStackParamList, "ChatThreads">;

export function ChatThreadsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<Nav>();
  const threads = useChatStore((state) => state.threads);
  const loading = useChatStore((state) => state.loadingThreads);
  const loadThreads = useChatStore((state) => state.loadThreads);

  useFocusEffect(
    useCallback(() => {
      loadThreads().catch(() => undefined);
    }, [loadThreads]),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        {...listPerfConfig}
        data={threads}
        keyExtractor={(item) => item.id}
        onRefresh={() => loadThreads()}
        refreshing={loading}
        ListEmptyComponent={<EmptyState title="No conversations yet" subtitle="Start a chat from jobs, streams, or profiles." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("ChatThread", { threadId: item.id, title: item.groupName ?? "Conversation" })}
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.title, { color: theme.colors.text }]}>{item.groupName ?? item.threadType ?? "Conversation"}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.subtext }]} numberOfLines={1}>
              {item.lastMessage ?? "No messages yet"}
            </Text>
            <Text style={[styles.small, { color: theme.colors.subtext }]}>Unread: {item.unreadCount ?? 0}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    marginHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
  small: {
    fontSize: 11,
  },
});
