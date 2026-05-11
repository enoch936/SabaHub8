import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { aiChatbotAssist } from "../../api/ai";
import { useAppTheme } from "../../hooks/useAppTheme";
import { toApiErrorMessage } from "../../api/client";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export function AIChatScreen() {
  const theme = useAppTheme();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    if (!prompt.trim()) {
      return;
    }
    const text = prompt.trim();
    setPrompt("");
    setError(null);
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", text }]);
    setLoading(true);
    try {
      const response = await aiChatbotAssist({ prompt: text });
      const answer =
        (typeof response.answer === "string" && response.answer) ||
        (typeof response.message === "string" && response.message) ||
        JSON.stringify(response.data ?? response);
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", text: answer }]);
    } catch (err) {
      setError(toApiErrorMessage(err, "Unable to reach AI assistant."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>AI Assistant</Text>
      <FlatList
        style={styles.list}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              {
                alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                backgroundColor: item.role === "user" ? theme.colors.primary : theme.colors.surface,
                borderColor: item.role === "user" ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: item.role === "user" ? "#ffffff" : theme.colors.text,
              }}
            >
              {item.text}
            </Text>
          </View>
        )}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      <TextInput
        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
        placeholder="Ask anything..."
        placeholderTextColor={theme.colors.subtext}
        value={prompt}
        onChangeText={setPrompt}
      />
      <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={ask} disabled={loading}>
        <Text style={styles.buttonLabel}>{loading ? "Thinking..." : "Send"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  list: {
    flex: 1,
  },
  message: {
    maxWidth: "85%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginVertical: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  error: {
    fontSize: 12,
  },
});
