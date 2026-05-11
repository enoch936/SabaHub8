import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAppTheme } from "../../hooks/useAppTheme";

export function MessageComposer({
  onSend,
  onTyping,
  onPickAttachment,
}: {
  onSend: (text: string) => void;
  onTyping?: (typing: boolean) => void;
  onPickAttachment?: (payload: { uri: string; name: string; mimeType?: string }) => void;
}) {
  const [text, setText] = useState("");
  const theme = useAppTheme();

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    onSend(trimmed);
    setText("");
    onTyping?.(false);
  };

  const pickImage = async () => {
    if (!onPickAttachment) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled) {
      return;
    }
    const asset = result.assets[0];
    if (!asset) {
      return;
    }
    onPickAttachment({
      uri: asset.uri,
      name: asset.fileName ?? `image-${Date.now()}.jpg`,
      mimeType: asset.mimeType,
    });
  };

  const pickFile = async () => {
    if (!onPickAttachment) {
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) {
      return;
    }
    const asset = result.assets[0];
    if (!asset) {
      return;
    }
    onPickAttachment({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
    });
  };

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
      <TextInput
        style={[styles.input, { color: theme.colors.text }]}
        placeholder="Write a message..."
        placeholderTextColor={theme.colors.subtext}
        value={text}
        onChangeText={(next) => {
          setText(next);
          onTyping?.(next.trim().length > 0);
        }}
      />
      <View style={styles.actions}>
        <Pressable onPress={pickImage} style={styles.iconButton}>
          <Text style={[styles.iconText, { color: theme.colors.primary }]}>IMG</Text>
        </Pressable>
        <Pressable onPress={pickFile} style={styles.iconButton}>
          <Text style={[styles.iconText, { color: theme.colors.primary }]}>FILE</Text>
        </Pressable>
        <Pressable onPress={send} style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.sendLabel}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    padding: 12,
    gap: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#9ea8bb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  iconButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconText: {
    fontWeight: "700",
    fontSize: 12,
  },
  sendButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendLabel: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
});
