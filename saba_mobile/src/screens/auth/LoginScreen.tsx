import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { login, me } from "../../api/auth";
import { useSessionStore } from "../../store/session-store";
import { useAppTheme } from "../../hooks/useAppTheme";
import { isEmail, minLength } from "../../utils/validators";
import type { AuthStackParamList } from "../../navigation/types";
import { toApiErrorMessage } from "../../api/client";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setToken = useSessionStore((state) => state.setToken);
  const setUser = useSessionStore((state) => state.setUser);

  const submit = async () => {
    setError(null);
    if (!isEmail(identifier) && identifier.trim().length < 3) {
      setError("Enter a valid email or username.");
      return;
    }
    if (!minLength(password, 8)) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await login({ identifier, password });
      if (result.requiresTwoFactor && result.challengeId) {
        navigation.navigate("TwoFactor", {
          challengeId: result.challengeId,
          method: result.twoFactorMethod,
          identifier,
        });
        return;
      }
      if (!result.token) {
        throw new Error("Login response did not include a token.");
      }
      setToken(result.token);
      const user = await me();
      setUser(user);
    } catch (err) {
      setError(toApiErrorMessage(err, "Unable to login."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Sabahub Mobile</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>Sign in to continue</Text>

        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Email or username"
          placeholderTextColor={theme.colors.subtext}
          autoCapitalize="none"
          value={identifier}
          onChangeText={setIdentifier}
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
          <Text style={styles.buttonLabel}>{loading ? "Signing in..." : "Sign In"}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={[styles.link, { color: theme.colors.primary }]}>Create account</Text>
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
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 4,
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
