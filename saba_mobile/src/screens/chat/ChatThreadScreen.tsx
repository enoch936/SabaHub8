import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MessageBubble } from "../../components/chat/MessageBubble";
import { MessageComposer } from "../../components/chat/MessageComposer";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useTyping } from "../../hooks/useTyping";
import type { ChatStackParamList } from "../../navigation/types";
import { buildCallInviteMessage, createThreadCallInvite } from "../../services/chat/call-invites";
import { uploadChatAttachment } from "../../services/uploads/chat-upload";
import { useChatStore } from "../../store/chat-store";
import { useSessionStore } from "../../store/session-store";
import { listPerfConfig } from "../../utils/perf";

type Props = NativeStackScreenProps<ChatStackParamList, "ChatThread">;

export function ChatThreadScreen({ navigation, route }: Props) {
  const threadId = route.params.threadId;
  const theme = useAppTheme();
  const sessionUser = useSessionStore((state) => state.user);
  const sessionUserId = useSessionStore((state) => state.user?.id);
  const thread = useChatStore((state) => state.threads.find((item) => item.id === threadId));
  const typingIds = useChatStore((state) => state.typingByThread[threadId] ?? []);
  const messages = useChatStore((state) => state.messagesByThread[threadId] ?? []);
  const loadMessages = useChatStore((state) => state.loadMessages);
  const sendText = useChatStore((state) => state.sendText);
  const sendAsset = useChatStore((state) => state.sendAsset);
  const markRead = useChatStore((state) => state.markRead);
  const subscribeRealtime = useChatStore((state) => state.subscribeThreadRealtime);
  const unsubscribeRealtime = useChatStore((state) => state.unsubscribeThreadRealtime);
  const { sendTyping } = useTyping(threadId);
  const [startingCall, setStartingCall] = useState<"AUDIO" | "AUDIO_VIDEO" | null>(null);

  useEffect(() => {
    loadMessages(threadId).catch(() => undefined);
    markRead(threadId).catch(() => undefined);
    subscribeRealtime(threadId).catch(() => undefined);
    return () => {
      unsubscribeRealtime(threadId);
    };
  }, [loadMessages, markRead, subscribeRealtime, threadId, unsubscribeRealtime]);

  const rendered = useMemo(() => [...messages], [messages]);
  const threadType = thread?.threadType ?? ((thread?.participantIds.length ?? 0) > 2 ? "GROUP" : "DIRECT");
  const audioLabel = threadType === "CHANNEL" ? "Audio Live" : "Audio Call";
  const videoLabel = threadType === "CHANNEL" ? "Video Live" : "Video Call";
  const canStartLive =
    threadType !== "CHANNEL" || Boolean(thread?.memberMessagingEnabled) || thread?.ownerUserId === sessionUserId;

  const startCall = useCallback(
    async (mediaKind: "AUDIO" | "AUDIO_VIDEO") => {
      if (!thread || !sessionUserId) {
        Alert.alert("Call unavailable", "This conversation is not ready for calling yet.");
        return;
      }
      if (!canStartLive) {
        Alert.alert("Live unavailable", "Only the channel owner can start a live session in this channel.");
        return;
      }

      try {
        setStartingCall(mediaKind);
        const invite = await createThreadCallInvite({
          thread,
          mediaKind,
          startedByUserId: sessionUserId,
          startedByDisplayName: sessionUser?.fullName ?? sessionUser?.username ?? sessionUser?.email ?? "Host",
        });
        const inviteMessage = buildCallInviteMessage(invite);
        let invitePosted = true;
        try {
          await sendText(threadId, inviteMessage);
        } catch {
          invitePosted = false;
        }
        navigation.navigate("CallSession", {
          streamId: invite.streamId,
          inviteText: inviteMessage,
          title: invite.title,
        });
        if (!invitePosted) {
          Alert.alert("Call started", "The live session opened, but the invite message could not be posted to this thread.");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to start the live session.";
        Alert.alert("Call failed", message);
      } finally {
        setStartingCall(null);
      }
    },
    [canStartLive, navigation, sendText, sessionUser?.email, sessionUser?.fullName, sessionUser?.username, sessionUserId, thread, threadId],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            style={[
              styles.headerButton,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              (!canStartLive || startingCall !== null) ? styles.callButtonDisabled : null,
            ]}
            disabled={!canStartLive || startingCall !== null}
            onPress={() => startCall("AUDIO")}
          >
            <Text style={[styles.headerButtonLabel, { color: theme.colors.text }]}>Audio</Text>
          </Pressable>
          <Pressable
            style={[
              styles.headerButtonPrimary,
              { backgroundColor: theme.colors.primary },
              (!canStartLive || startingCall !== null) ? styles.callButtonDisabled : null,
            ]}
            disabled={!canStartLive || startingCall !== null}
            onPress={() => startCall("AUDIO_VIDEO")}
          >
            <Text style={styles.headerButtonPrimaryLabel}>Video</Text>
          </Pressable>
        </View>
      ),
    });
  }, [canStartLive, navigation, startCall, startingCall, theme.colors.border, theme.colors.primary, theme.colors.surface, theme.colors.text]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {typingIds.length > 0 ? (
        <Text style={[styles.typing, { color: theme.colors.subtext }]}>
          {typingIds.length === 1 ? "Someone is typing..." : `${typingIds.length} people are typing...`}
        </Text>
      ) : null}

      <View style={styles.actionsRow}>
        <Text style={[styles.actionsHeading, { color: theme.colors.subtext }]}>
          {threadType === "CHANNEL" ? "Start a real live broadcast in this channel" : "Start a real audio or video call"}
        </Text>
        <Pressable
          style={[
            styles.callButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            (!canStartLive || startingCall !== null) ? styles.callButtonDisabled : null,
          ]}
          disabled={!canStartLive || startingCall !== null}
          onPress={() => startCall("AUDIO")}
        >
          <Text style={[styles.callButtonLabel, { color: theme.colors.text }]}>
            {startingCall === "AUDIO" ? "Starting..." : audioLabel}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.callButtonPrimary,
            { backgroundColor: theme.colors.primary },
            (!canStartLive || startingCall !== null) ? styles.callButtonDisabled : null,
          ]}
          disabled={!canStartLive || startingCall !== null}
          onPress={() => startCall("AUDIO_VIDEO")}
        >
          <Text style={styles.callButtonPrimaryLabel}>
            {startingCall === "AUDIO_VIDEO" ? "Starting..." : videoLabel}
          </Text>
        </Pressable>
      </View>

      <FlatList
        {...listPerfConfig}
        data={rendered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        inverted
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isMine={sessionUserId === item.senderId}
            onOpenInvite={(streamId, inviteText, title) => {
              navigation.navigate("CallSession", { streamId, inviteText, title });
            }}
          />
        )}
      />

      <MessageComposer
        onSend={(text) => {
          sendText(threadId, text).catch(() => undefined);
          sendTyping(false);
        }}
        onTyping={sendTyping}
        onPickAttachment={(file) => {
          uploadChatAttachment(file.uri, file.name, file.mimeType)
            .then((asset) => sendAsset(threadId, asset.id))
            .catch(() => undefined);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  typing: {
    fontSize: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  actionsRow: {
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  actionsHeading: {
    fontSize: 12,
    fontWeight: "600",
  },
  callButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
  },
  callButtonPrimary: {
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 10,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 62,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonPrimary: {
    alignItems: "center",
    borderRadius: 999,
    minWidth: 62,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  callButtonDisabled: {
    opacity: 0.45,
  },
  callButtonLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  callButtonPrimaryLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  headerButtonLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  headerButtonPrimaryLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
});
