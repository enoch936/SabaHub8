import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "../../types/models";
import { useAppTheme } from "../../hooks/useAppTheme";
import { callInviteActionLabel, describeCallInvite, parseCallInviteMessage } from "../../services/chat/call-invites";
import { formatDateTime } from "../../utils/formatters";

export function MessageBubble({
  message,
  isMine,
  onOpenInvite,
}: {
  message: ChatMessage;
  isMine: boolean;
  onOpenInvite?: (streamId: string, inviteText: string, title?: string) => void;
}) {
  const theme = useAppTheme();
  const bubbleColor = isMine ? theme.colors.primary : theme.colors.surface;
  const textColor = isMine ? "#ffffff" : theme.colors.text;
  const borderColor = isMine ? theme.colors.primary : theme.colors.border;
  const invite = message.type === "TEXT" ? parseCallInviteMessage(message.text) : null;

  return (
    <View style={[styles.row, { justifyContent: isMine ? "flex-end" : "flex-start" }]}>
      <View style={[styles.bubble, { backgroundColor: bubbleColor, borderColor }]}>
        {invite ? (
          <Pressable
            style={[styles.inviteCard, { backgroundColor: isMine ? "rgba(255,255,255,0.14)" : "#eef4ff" }]}
            onPress={() => {
              if (!message.text) {
                return;
              }
              onOpenInvite?.(invite.streamId, message.text, invite.title);
            }}
          >
            <Text style={[styles.inviteTitle, { color: textColor }]}>{invite.title}</Text>
            <Text style={[styles.body, { color: textColor }]}>{describeCallInvite(invite)}</Text>
            <Text style={[styles.inviteAction, { color: textColor }]}>{callInviteActionLabel(invite)}</Text>
          </Pressable>
        ) : (
          <Text style={[styles.body, { color: textColor }]}>
            {message.type === "ASSET" ? `[Attachment] ${message.assetId ?? ""}` : message.text ?? ""}
          </Text>
        )}
        <Text style={[styles.time, { color: isMine ? "rgba(255,255,255,0.8)" : theme.colors.subtext }]}>
          {formatDateTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    marginVertical: 4,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  inviteCard: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  inviteAction: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  time: {
    fontSize: 11,
  },
});
