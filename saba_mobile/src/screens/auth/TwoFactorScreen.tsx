import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { me, resendLoginTwoFactor, verifyLoginTwoFactor } from "../../api/auth";
import { useSessionStore } from "../../store/session-store";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { AuthStackParamList } from "../../navigation/types";
import { toApiErrorMessage } from "../../api/client";

type Props = NativeStackScreenProps<AuthStackParamList, "TwoFactor">;

function normalizeChallengeMethod(value?: string) {
  const normalized = (value ?? "").trim().toUpperCase().replace(/[\s/-]+/g, "_");
  if (!normalized) {
    return "EMAIL";
  }
  if (["AUTHENTICATOR", "TOTP", "AUTHENTICATOR_TOTP", "GOOGLE_AUTHENTICATOR", "AUTH_APP", "APP"].includes(normalized)) {
    return "AUTHENTICATOR";
  }
  if (["PIN", "PINCODE", "PIN_CODE", "PINCODE_PASSWORD", "PIN_PASSWORD", "PIN_OR_PASSWORD", "PASSCODE", "PASSWORD"].includes(normalized)) {
    return "PIN";
  }
  if (["EMAIL", "PHONE", "BOTH"].includes(normalized)) {
    return normalized;
  }
  return normalized;
}

function describeChallengeMethod(method: string) {
  if (method === "AUTHENTICATOR") {
    return "TOTP (Authenticator app)";
  }
  if (method === "PIN") {
    return "PIN / Password challenge";
  }
  if (method === "EMAIL") {
    return "Email verification code";
  }
  if (method === "PHONE") {
    return "Phone verification code";
  }
  if (method === "BOTH") {
    return "Email + Phone verification codes";
  }
  return method;
}

export function TwoFactorScreen({ route }: Props) {
  const theme = useAppTheme();
  const [otpCode, setOtpCode] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const challengeId = route.params.challengeId;
  const method = normalizeChallengeMethod(route.params.method);
  const setToken = useSessionStore((state) => state.setToken);
  const setUser = useSessionStore((state) => state.setUser);
  const usesAuthenticator = method === "AUTHENTICATOR";
  const usesPin = method === "PIN";
  const usesBoth = method === "BOTH";
  const usesOtpTransport = method === "EMAIL" || method === "PHONE" || method === "BOTH";

  const verify = async () => {
    setStatus(null);
    if (usesBoth && (!emailOtp.trim() || !phoneOtp.trim())) {
      setStatus("Enter both email and phone codes.");
      return;
    }
    if ((usesAuthenticator || usesPin || method === "EMAIL" || method === "PHONE") && !otpCode.trim() && !recoveryCode.trim()) {
      setStatus(usesPin ? "Enter your security PIN." : "Enter your verification code.");
      return;
    }
    setLoading(true);
    try {
      const response = await verifyLoginTwoFactor({
        challengeId,
        otpCode: otpCode.trim() || undefined,
        emailOtp: emailOtp.trim() || undefined,
        phoneOtp: phoneOtp.trim() || undefined,
        recoveryCode: recoveryCode.trim() || undefined,
      });
      setToken(response.token);
      const user = await me();
      setUser(user);
    } catch (err) {
      setStatus(toApiErrorMessage(err, "Verification failed."));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setStatus(null);
    if (!usesOtpTransport) {
      return;
    }
    try {
      const response = await resendLoginTwoFactor(challengeId);
      setStatus(response.message ?? "Code sent.");
    } catch (err) {
      setStatus(toApiErrorMessage(err, "Unable to resend code."));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Two-Factor Verification</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>Method: {describeChallengeMethod(method)}</Text>
        {route.params.identifier ? (
          <Text style={[styles.helper, { color: theme.colors.subtext }]}>Account: {route.params.identifier}</Text>
        ) : null}

        {usesBoth ? (
          <>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Email verification code"
              placeholderTextColor={theme.colors.subtext}
              keyboardType="number-pad"
              value={emailOtp}
              onChangeText={setEmailOtp}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Phone verification code"
              placeholderTextColor={theme.colors.subtext}
              keyboardType="number-pad"
              value={phoneOtp}
              onChangeText={setPhoneOtp}
            />
          </>
        ) : (
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder={
              usesPin
                ? "Security PIN / Password"
                : usesAuthenticator
                  ? "Authenticator code"
                  : "Verification code"
            }
            placeholderTextColor={theme.colors.subtext}
            keyboardType="number-pad"
            secureTextEntry={usesPin}
            value={otpCode}
            onChangeText={setOtpCode}
          />
        )}

        {usesAuthenticator ? (
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Recovery code (optional)"
            placeholderTextColor={theme.colors.subtext}
            autoCapitalize="characters"
            value={recoveryCode}
            onChangeText={setRecoveryCode}
          />
        ) : null}

        {status ? <Text style={[styles.status, { color: theme.colors.subtext }]}>{status}</Text> : null}
        <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={verify} disabled={loading}>
          <Text style={styles.buttonLabel}>{loading ? "Verifying..." : "Verify"}</Text>
        </Pressable>
        {usesOtpTransport ? (
          <Pressable onPress={resend}>
            <Text style={[styles.link, { color: theme.colors.primary }]}>Resend code</Text>
          </Pressable>
        ) : null}
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
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
  helper: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    letterSpacing: 2,
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
  status: {
    fontSize: 13,
  },
});
