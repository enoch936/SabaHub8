import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  beginAuthenticatorSetup,
  confirmEmailVerification,
  confirmPhoneVerification,
  disableTwoFactor,
  enableTwoFactor,
  regenerateRecoveryCodes,
  requestEmailVerification,
  requestPhoneVerification,
} from "../../api/settings";
import { toApiErrorMessage } from "../../api/client";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { UserSettingsProfile } from "../../types/models";
import { formatDateTime } from "../../utils/formatters";

type Props = {
  profile: UserSettingsProfile | null;
  onProfileChange: (profile: UserSettingsProfile) => void;
};

type AuthenticatorSetupState = {
  secret?: string;
  otpAuthUrl?: string;
  issuer?: string;
  accountName?: string;
} | null;

type TwoFactorMethod = "EMAIL" | "PHONE" | "BOTH" | "AUTHENTICATOR" | "PIN";

function normalizeMethod(value?: string | null): TwoFactorMethod | null {
  const normalized = (value ?? "").trim().toUpperCase().replace(/[\s/-]+/g, "_");
  if (normalized === "EMAIL" || normalized === "PHONE" || normalized === "BOTH") {
    return normalized;
  }
  if (["AUTHENTICATOR", "TOTP", "AUTHENTICATOR_TOTP", "GOOGLE_AUTHENTICATOR", "AUTH_APP", "APP"].includes(normalized)) {
    return "AUTHENTICATOR";
  }
  if (["PIN", "PINCODE", "PIN_CODE", "PINCODE_PASSWORD", "PIN_PASSWORD", "PIN_OR_PASSWORD", "PASSCODE", "PASSWORD"].includes(normalized)) {
    return "PIN";
  }
  return null;
}

function methodLabel(method: TwoFactorMethod) {
  if (method === "AUTHENTICATOR") {
    return "TOTP (Authenticator)";
  }
  if (method === "PIN") {
    return "PIN / Password";
  }
  if (method === "BOTH") {
    return "Email + Phone";
  }
  if (method === "PHONE") {
    return "Phone";
  }
  return "Email";
}

function statusTone(enabled?: boolean | null) {
  return Boolean(enabled) ? "Enabled" : "Disabled";
}

export function SecuritySettingsPanel({ onProfileChange, profile }: Props) {
  const theme = useAppTheme();
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>("EMAIL");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [authenticatorSetup, setAuthenticatorSetup] = useState<AuthenticatorSetupState>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    const nextMethod = normalizeMethod(profile?.twoFactorMethod);
    if (nextMethod) {
      setSelectedMethod(nextMethod);
    }
  }, [profile?.twoFactorMethod]);

  const methodAvailability = useMemo(
    () => ({
      EMAIL: Boolean(profile?.emailVerified),
      PHONE: Boolean(profile?.phoneVerified),
      BOTH: Boolean(profile?.emailVerified) && Boolean(profile?.phoneVerified),
      AUTHENTICATOR: true,
      PIN: true,
    }),
    [profile?.emailVerified, profile?.phoneVerified],
  );
  const activeMethod = normalizeMethod(profile?.twoFactorMethod);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setLoading(key);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      setMessage(toApiErrorMessage(error, "Unable to complete security action."));
    } finally {
      setLoading(null);
    }
  };

  const handleEnableTwoFactor = () =>
    runAction("enable", async () => {
      const result = await enableTwoFactor({
        method: selectedMethod,
        currentPassword,
        authenticatorCode: authenticatorCode.trim() || undefined,
        pinCode: pinCode.trim() || undefined,
      });
      if (result.profile) {
        onProfileChange(result.profile);
      }
      setRecoveryCodes(result.recoveryCodes ?? []);
      setMessage(result.message ?? "2-step verification enabled.");
    });

  const handleDisableTwoFactor = () =>
    runAction("disable", async () => {
      const result = await disableTwoFactor({ currentPassword });
      if (result.profile) {
        onProfileChange(result.profile);
      }
      setAuthenticatorSetup(null);
      setRecoveryCodes([]);
      setAuthenticatorCode("");
      setPinCode("");
      setRecoveryCode("");
      setMessage(result.message ?? "2-step verification disabled.");
    });

  const handleBeginAuthenticatorSetup = () =>
    runAction("setup", async () => {
      const result = await beginAuthenticatorSetup();
      if (result.profile) {
        onProfileChange(result.profile);
      }
      setAuthenticatorSetup(result.setup ?? null);
      setSelectedMethod("AUTHENTICATOR");
      setMessage("Authenticator setup generated. Add the secret to your authenticator app, then verify it.");
    });

  const handleRegenerateRecoveryCodes = () =>
    runAction("recovery", async () => {
      const result = await regenerateRecoveryCodes({
        currentPassword,
        authenticatorCode: authenticatorCode.trim() || undefined,
        recoveryCode: recoveryCode.trim() || undefined,
      });
      if (result.profile) {
        onProfileChange(result.profile);
      }
      setRecoveryCodes(result.recoveryCodes ?? []);
      setMessage(result.message ?? "Recovery codes regenerated.");
    });

  const handleRequestEmail = () =>
    runAction("email-request", async () => {
      const result = await requestEmailVerification();
      setMessage(result.message ?? "Email verification code sent.");
    });

  const handleConfirmEmail = () =>
    runAction("email-confirm", async () => {
      const nextProfile = await confirmEmailVerification(emailOtp.trim());
      onProfileChange(nextProfile);
      setEmailOtp("");
      setMessage("Email verified.");
    });

  const handleRequestPhone = () =>
    runAction("phone-request", async () => {
      const result = await requestPhoneVerification();
      setMessage(result.message ?? "Phone verification code sent.");
    });

  const handleConfirmPhone = () =>
    runAction("phone-confirm", async () => {
      const nextProfile = await confirmPhoneVerification(phoneOtp.trim());
      onProfileChange(nextProfile);
      setPhoneOtp("");
      setMessage("Phone verified.");
    });

  const openAuthenticatorApp = async () => {
    if (!authenticatorSetup?.otpAuthUrl) {
      return;
    }
    try {
      await Linking.openURL(authenticatorSetup.otpAuthUrl);
    } catch {
      setMessage("Could not open an authenticator app automatically. Use the secret below to add it manually.");
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Security & 2-Step Verification</Text>

      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
          <Text style={{ color: profile?.emailVerified ? theme.colors.success : theme.colors.subtext }}>
            {profile?.emailVerified ? "Verified" : "Unverified"}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Phone</Text>
          <Text style={{ color: profile?.phoneVerified ? theme.colors.success : theme.colors.subtext }}>
            {profile?.phoneVerified ? "Verified" : "Unverified"}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.label, { color: theme.colors.text }]}>2-Step</Text>
          <Text style={{ color: profile?.twoFactorEnabled ? theme.colors.success : theme.colors.subtext }}>
            {statusTone(profile?.twoFactorEnabled)}
          </Text>
        </View>
      </View>

      <Text style={[styles.helper, { color: theme.colors.subtext }]}> 
        Active method: {activeMethod ? methodLabel(activeMethod) : "Not configured"}
      </Text>
      {profile?.recoveryCodesRemaining ? (
        <Text style={[styles.helper, { color: theme.colors.subtext }]}>
          Recovery codes remaining: {profile.recoveryCodesRemaining}
        </Text>
      ) : null}
      {profile?.authenticatorVerifiedAt ? (
        <Text style={[styles.helper, { color: theme.colors.subtext }]}>
          Authenticator verified: {formatDateTime(profile.authenticatorVerifiedAt)}
        </Text>
      ) : null}
      {profile?.securityPinUpdatedAt ? (
        <Text style={[styles.helper, { color: theme.colors.subtext }]}>
          PIN updated: {formatDateTime(profile.securityPinUpdatedAt)}
        </Text>
      ) : null}

      <View style={styles.verificationBlock}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Verify Email</Text>
        <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={handleRequestEmail} disabled={loading !== null}>
          <Text style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}>
            {loading === "email-request" ? "Sending..." : "Send Email Code"}
          </Text>
        </Pressable>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Email OTP"
          placeholderTextColor={theme.colors.subtext}
          keyboardType="number-pad"
          value={emailOtp}
          onChangeText={setEmailOtp}
        />
        <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={handleConfirmEmail} disabled={loading !== null}>
          <Text style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}>
            {loading === "email-confirm" ? "Verifying..." : "Confirm Email"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.verificationBlock}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Verify Phone</Text>
        <Text style={[styles.helper, { color: theme.colors.subtext }]}>
          Set your phone number in the profile form before requesting SMS verification.
        </Text>
        <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={handleRequestPhone} disabled={loading !== null}>
          <Text style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}>
            {loading === "phone-request" ? "Sending..." : "Send SMS Code"}
          </Text>
        </Pressable>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Phone OTP"
          placeholderTextColor={theme.colors.subtext}
          keyboardType="number-pad"
          value={phoneOtp}
          onChangeText={setPhoneOtp}
        />
        <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={handleConfirmPhone} disabled={loading !== null}>
          <Text style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}>
            {loading === "phone-confirm" ? "Verifying..." : "Confirm Phone"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.verificationBlock}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Choose 2-Step Method</Text>
        <View style={styles.pillRow}>
          {(["EMAIL", "PHONE", "BOTH", "AUTHENTICATOR", "PIN"] as TwoFactorMethod[]).map((method) => (
            <Pressable
              key={method}
              style={[
                styles.methodPill,
                {
                  borderColor: selectedMethod === method ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selectedMethod === method ? `${theme.colors.primary}18` : "transparent",
                  opacity: methodAvailability[method] ? 1 : 0.45,
                },
              ]}
              onPress={() => {
                if (methodAvailability[method]) {
                  setSelectedMethod(method);
                }
              }}
            >
              <Text style={{ color: theme.colors.text }}>{methodLabel(method)}</Text>
            </Pressable>
          ))}
        </View>

        {selectedMethod === "AUTHENTICATOR" ? (
          <>
            <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={handleBeginAuthenticatorSetup} disabled={loading !== null}>
              <Text style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}>
                {loading === "setup" ? "Generating..." : "Generate Authenticator Secret"}
              </Text>
            </Pressable>

            {authenticatorSetup ? (
              <View style={[styles.codeBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                <Text style={[styles.codeLabel, { color: theme.colors.text }]}>Secret</Text>
                <Text style={[styles.codeValue, { color: theme.colors.text }]}>{authenticatorSetup.secret ?? ""}</Text>
                <Text style={[styles.helper, { color: theme.colors.subtext }]}>
                  {authenticatorSetup.issuer} · {authenticatorSetup.accountName}
                </Text>
                <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={openAuthenticatorApp}>
                  <Text style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}>Open in Authenticator App</Text>
                </Pressable>
              </View>
            ) : null}

            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Authenticator code"
              placeholderTextColor={theme.colors.subtext}
              keyboardType="number-pad"
              value={authenticatorCode}
              onChangeText={setAuthenticatorCode}
            />
          </>
        ) : null}

        {selectedMethod === "PIN" ? (
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="4 to 8 digit security PIN"
            placeholderTextColor={theme.colors.subtext}
            keyboardType="number-pad"
            secureTextEntry
            value={pinCode}
            onChangeText={setPinCode}
          />
        ) : null}

        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Current password"
          placeholderTextColor={theme.colors.subtext}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <Pressable style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]} onPress={handleEnableTwoFactor} disabled={loading !== null}>
          <Text style={styles.primaryButtonLabel}>{loading === "enable" ? "Enabling..." : "Enable 2-Step Verification"}</Text>
        </Pressable>

        {profile?.twoFactorEnabled ? (
          <Pressable style={[styles.dangerButton, { borderColor: theme.colors.danger }]} onPress={handleDisableTwoFactor} disabled={loading !== null}>
            <Text style={[styles.dangerButtonLabel, { color: theme.colors.danger }]}>
              {loading === "disable" ? "Disabling..." : "Disable 2-Step Verification"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {(normalizeMethod(profile?.twoFactorMethod) === "AUTHENTICATOR" || authenticatorSetup) ? (
        <View style={styles.verificationBlock}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recovery Codes</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Recovery code (optional for regeneration)"
            placeholderTextColor={theme.colors.subtext}
            autoCapitalize="characters"
            value={recoveryCode}
            onChangeText={setRecoveryCode}
          />
          <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={handleRegenerateRecoveryCodes} disabled={loading !== null}>
            <Text style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}>
              {loading === "recovery" ? "Regenerating..." : "Regenerate Recovery Codes"}
            </Text>
          </Pressable>

          {recoveryCodes.length > 0 ? (
            <View style={[styles.codeBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <Text style={[styles.codeLabel, { color: theme.colors.text }]}>Store these codes safely</Text>
              {recoveryCodes.map((code) => (
                <Text key={code} style={[styles.codeValue, { color: theme.colors.text }]}>
                  {code}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {message ? <Text style={[styles.message, { color: theme.colors.subtext }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusItem: {
    minWidth: 88,
    gap: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  helper: {
    fontSize: 12,
    lineHeight: 17,
  },
  verificationBlock: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  methodPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 11,
  },
  secondaryButtonLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  primaryButton: {
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  dangerButton: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  dangerButtonLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  codeBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  codeValue: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
  },
});
