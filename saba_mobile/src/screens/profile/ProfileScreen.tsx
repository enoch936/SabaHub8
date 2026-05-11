import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { getUserSettings, logout, updateUserSettings } from "../../api";
import { DisputePanel } from "../../components/profile/DisputePanel";
import { SecuritySettingsPanel } from "../../components/profile/SecuritySettingsPanel";
import type { UserSettingsProfile } from "../../types/models";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useSessionStore } from "../../store/session-store";
import { toApiErrorMessage } from "../../api/client";

export function ProfileScreen() {
  const theme = useAppTheme();
  const user = useSessionStore((state) => state.user);
  const roles = useSessionStore((state) => state.roles);
  const activeRole = useSessionStore((state) => state.activeRole);
  const workspaceOptions = useSessionStore((state) => state.workspaceRoleOptions);
  const setActiveRole = useSessionStore((state) => state.setActiveRole);
  const clear = useSessionStore((state) => state.clear);

  const [profile, setProfile] = useState<UserSettingsProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUserSettings()
      .then((result) => setProfile(result))
      .catch(() => undefined);
  }, []);

  const save = async () => {
    if (!profile) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUserSettings({
        bio: profile.bio,
        location: profile.location,
        timezone: profile.timezone,
        language: profile.language,
        phoneCountryCode: profile.phoneCountryCode,
        phoneNumber: profile.phoneNumber,
      });
      setProfile(updated);
    } catch (err) {
      setError(toApiErrorMessage(err, "Unable to save settings."));
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await logout();
    clear();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Profile & Settings</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{user?.fullName ?? "User"}</Text>
        <Text style={[styles.value, { color: theme.colors.subtext }]}>{user?.email ?? ""}</Text>
        <Text style={[styles.value, { color: theme.colors.subtext }]}>Roles: {roles.join(", ") || "N/A"}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Active workspace role</Text>
        <View style={styles.row}>
          {workspaceOptions.map((role) => (
            <Pressable
              key={role}
              style={[
                styles.rolePill,
                {
                  borderColor: activeRole === role ? theme.colors.primary : theme.colors.border,
                  backgroundColor: activeRole === role ? `${theme.colors.primary}1a` : "transparent",
                },
              ]}
              onPress={() => setActiveRole(role)}
            >
              <Text style={{ color: theme.colors.text }}>{role}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Bio</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={profile?.bio ?? ""}
          placeholder="Tell us about yourself"
          placeholderTextColor={theme.colors.subtext}
          onChangeText={(bio) => setProfile((current) => ({ ...(current ?? {}), bio }))}
          multiline
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Location</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={profile?.location ?? ""}
          placeholder="City, Country"
          placeholderTextColor={theme.colors.subtext}
          onChangeText={(location) => setProfile((current) => ({ ...(current ?? {}), location }))}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Timezone</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={profile?.timezone ?? ""}
          placeholder="Africa/Addis_Ababa"
          placeholderTextColor={theme.colors.subtext}
          onChangeText={(timezone) => setProfile((current) => ({ ...(current ?? {}), timezone }))}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Phone Country Code</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={profile?.phoneCountryCode ?? ""}
          placeholder="+251"
          placeholderTextColor={theme.colors.subtext}
          onChangeText={(phoneCountryCode) => setProfile((current) => ({ ...(current ?? {}), phoneCountryCode }))}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Phone Number</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={profile?.phoneNumber ?? ""}
          placeholder="+251900000000"
          placeholderTextColor={theme.colors.subtext}
          keyboardType="phone-pad"
          onChangeText={(phoneNumber) => setProfile((current) => ({ ...(current ?? {}), phoneNumber }))}
        />

        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}

        <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={save} disabled={saving}>
          <Text style={styles.buttonLabel}>{saving ? "Saving..." : "Save settings"}</Text>
        </Pressable>
      </View>

      <SecuritySettingsPanel
        profile={profile}
        onProfileChange={(nextProfile) => {
          setProfile(nextProfile);
        }}
      />

      <DisputePanel />

      <Pressable style={[styles.logout, { borderColor: theme.colors.danger }]} onPress={signOut}>
        <Text style={{ color: theme.colors.danger, fontWeight: "700" }}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 12,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  value: {
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rolePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 6,
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  logout: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
});
