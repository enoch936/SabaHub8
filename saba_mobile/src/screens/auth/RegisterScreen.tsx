import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { register, me } from "../../api/auth";
import { useSessionStore } from "../../store/session-store";
import { useAppTheme } from "../../hooks/useAppTheme";
import { isEmail, minLength, isNonEmpty } from "../../utils/validators";
import type { AuthStackParamList } from "../../navigation/types";
import { toApiErrorMessage } from "../../api/client";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setToken = useSessionStore((state) => state.setToken);
  const setUser = useSessionStore((state) => state.setUser);

  const submit = async () => {
    setError(null);
    if (!isNonEmpty(fullName)) {
      setError("Full name is required.");
      return;
    }
    if (!isEmail(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (!minLength(password, 8)) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await register({ email, password, fullName });
      setToken(result.token);
      const user = await me();
      setUser(user);
    } catch (err) {
      setError(toApiErrorMessage(err, "Unable to create account."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Create account</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Full name"
          placeholderTextColor={theme.colors.subtext}
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Email"
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Password"
          placeholderTextColor={theme.colors.subtext}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

        <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={submit} disabled={loading}>
          <Text style={styles.buttonLabel}>{loading ? "Creating..." : "Create account"}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.link, { color: theme.colors.primary }]}>Back to login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  link: {
    textAlign: "center",
    paddingVertical: 8,
    fontWeight: "600",
  },
  error: {
    fontSize: 13,
  },
});
