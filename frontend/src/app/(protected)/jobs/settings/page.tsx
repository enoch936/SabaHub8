"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  BellRing,
  CheckCircle2,
  LocateFixed,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  confirmEmailVerification,
  confirmPhoneVerification,
  getUserSettings,
  listActiveSessions,
  logoutApi,
  requestEmailVerification,
  requestPhoneVerification,
  revokeOtherSessions,
  revokeSession,
  suggestUserSettingsTaxonomy,
  updateUserContact,
  updateUserSettings,
  uploadProfileImage,
  type ActiveSession,
  type TaxonomySuggestion,
  type UserProfile,
} from "@/lib/api";
import { findJobCategoryIdByDisplay, getJobCategoryDisplay } from "@/lib/jobTaxonomy";
import {
  COUNTRY_OPTIONS,
  detectLocationFromBrowser,
  detectTimeZoneFromBrowser,
  formatPhoneNumberWithCountryCode,
  getCountryByCode,
  getLocationSuggestions,
} from "@/lib/location-utils";
import { useSession } from "@/lib/session";
import { SecurityTwoFactorCard } from "@/components/workspace/settings/SecurityTwoFactorCard";

type SettingsSectionId = "overview" | "contact" | "security" | "verification" | "preferences" | "sessions";
type TwoFactorMethod = "EMAIL" | "PHONE" | "BOTH" | "AUTHENTICATOR" | "PIN";

const sections: Array<{
  id: SettingsSectionId;
  label: string;
  helper: string;
  icon: typeof UserRound;
}> = [
  { id: "overview", label: "Overview", helper: "Profile, avatar, and region.", icon: UserRound },
  { id: "contact", label: "Contact", helper: "Saved email and phone details.", icon: Mail },
  { id: "security", label: "Security & 2FA", helper: "Email, phone, authenticator, or PIN.", icon: ShieldCheck },
  { id: "verification", label: "Verification", helper: "Confirm email and phone ownership.", icon: BadgeCheck },
  { id: "preferences", label: "Preferences", helper: "Notifications and work settings.", icon: BellRing },
  { id: "sessions", label: "Current devices", helper: "Review and remotely sign out devices.", icon: Smartphone },
];

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeTwoFactorMethod(value: string | null | undefined): TwoFactorMethod | null {
  const normalized = value?.trim().toUpperCase();
  if (
    normalized === "EMAIL" ||
    normalized === "PHONE" ||
    normalized === "BOTH" ||
    normalized === "AUTHENTICATOR" ||
    normalized === "PIN"
  ) {
    return normalized;
  }
  return null;
}

function formatTwoFactorMethodLabel(value: string | null | undefined) {
  const normalized = normalizeTwoFactorMethod(value);
  if (normalized === "AUTHENTICATOR") {
    return "Authenticator (TOTP)";
  }
  if (normalized === "PIN") {
    return "Security PIN";
  }
  if (normalized === "BOTH") {
    return "Email + Phone";
  }
  if (normalized === "PHONE") {
    return "Phone";
  }
  return "Email";
}

function isSettingsSectionId(value: string | null): value is SettingsSectionId {
  return sections.some((section) => section.id === value);
}

function toEditableProfile(incoming: Partial<UserProfile> | null | undefined): Partial<UserProfile> {
  const next = incoming ?? {};
  const rawPhone = next.phoneNumber ?? "";
  const matchedDialCode = [...COUNTRY_OPTIONS]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => rawPhone.startsWith(country.dialCode));

  return {
    ...next,
    timezone: next.timezone ?? detectTimeZoneFromBrowser(),
    phoneCountryCode: next.phoneCountryCode ?? matchedDialCode?.dialCode ?? "+251",
    phoneNumber: matchedDialCode ? rawPhone.slice(matchedDialCode.dialCode.length) : rawPhone.replace(/[^\d]/g, ""),
  };
}

function formatTime(timestamp: number) {
  if (!timestamp) {
    return "Unknown";
  }
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatLocation(location?: string) {
  if (!location?.trim()) {
    return "Unknown";
  }

  return location.replaceAll("_", " ").replaceAll("/", " / ");
}

function formatSessionMeta(session: ActiveSession) {
  const parts = [session.deviceType, session.platform, session.browser, session.viewport].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : session.device;
}

export default function WorkspaceSettingsPage() {
  const searchParams = useSearchParams();
  const setProfilePictureUrl = useSession((state) => state.setProfilePictureUrl);

  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isContactSaving, setIsContactSaving] = useState(false);
  const [isSecuritySaving, setIsSecuritySaving] = useState(false);
  const [isPreferencesSaving, setIsPreferencesSaving] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isDetectingTimezone, setIsDetectingTimezone] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingJti, setRevokingJti] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [taxonomySuggestion, setTaxonomySuggestion] = useState<TaxonomySuggestion | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const locationSuggestions = useMemo(
    () => getLocationSuggestions(profile.country ?? ""),
    [profile.country],
  );
  const normalizedPhonePreview = useMemo(
    () => formatPhoneNumberWithCountryCode(profile.phoneCountryCode ?? "+251", profile.phoneNumber ?? ""),
    [profile.phoneCountryCode, profile.phoneNumber],
  );
  const hasMultipleSessions = sessions.length > 1;

  const applyLoadedProfile = (incoming: Partial<UserProfile> | null | undefined) => {
    const editable = toEditableProfile(incoming);
    setProfile(editable);
    setProfilePictureUrl(editable.profilePictureUrl ?? null);
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await listActiveSessions();
      setSessions(data.sessions ?? []);
    } catch {
      toast.error("Unable to load active sessions.");
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await getUserSettings();
        if (!active) {
          return;
        }
        applyLoadedProfile(data);
      } catch {
        if (active) {
          toast.error("Failed to load settings.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();
    void loadSessions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const requested = searchParams.get("section");
    if (!isSettingsSectionId(requested)) {
      return;
    }

    setActiveSection(requested);
    window.setTimeout(() => {
      document.getElementById(`settings-${requested}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [searchParams, isLoading]);

  const goToSection = (section: SettingsSectionId) => {
    setActiveSection(section);
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const detected = await detectLocationFromBrowser();
      const matchedCountry = COUNTRY_OPTIONS.find(
        (country) => country.name.toLowerCase() === detected.country.toLowerCase(),
      );

      setProfile((current) => ({
        ...current,
        country: matchedCountry?.code ?? current.country,
        phoneCountryCode: matchedCountry?.dialCode ?? current.phoneCountryCode ?? "+251",
        location: detected.location || current.location,
      }));
      toast.success("Location detected.");
    } catch {
      toast.error("Could not detect location. Please choose manually.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const detectTimezone = () => {
    setIsDetectingTimezone(true);
    try {
      const timezone = detectTimeZoneFromBrowser();
      if (!timezone) {
        toast.error("Could not detect timezone. Please enter it manually.");
        return;
      }

      setProfile((current) => ({ ...current, timezone }));
      toast.success("Timezone detected.");
    } finally {
      setIsDetectingTimezone(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const url = await uploadProfileImage(file);
      if (!url) {
        throw new Error("Avatar upload did not return a URL.");
      }
      setProfile((current) => ({ ...current, profilePictureUrl: url }));
      setProfilePictureUrl(url);
      toast.success("Avatar uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const saveOverview = async () => {
    if (!profile.username?.trim()) {
      toast.error("Username is required.");
      return;
    }

    setIsProfileSaving(true);
    try {
      const updated = await updateUserSettings({
        username: profile.username.trim(),
        bio: profile.bio ?? "",
        country: profile.country ?? "",
        location: profile.location ?? "",
        timezone: profile.timezone ?? "",
        profilePictureUrl: profile.profilePictureUrl ?? undefined,
      });
      applyLoadedProfile(updated);
      toast.success("Overview saved.");
    } catch {
      toast.error("Failed to save overview.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const saveContact = async () => {
    if (!profile.email?.trim() || !profile.email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }

    setIsContactSaving(true);
    try {
      const response = await updateUserContact({
        email: profile.email.trim().toLowerCase(),
        phoneCountryCode: profile.phoneCountryCode ?? "+251",
        phoneNumber: normalizedPhonePreview || "",
      });

      if (response.token) {
        localStorage.setItem("auth_token", response.token);
      }

      applyLoadedProfile(response.profile);
      setEmailOtp("");
      setPhoneOtp("");
      toast.success("Contact details saved. Review verification status below.");
      goToSection("verification");
    } catch {
      toast.error("Failed to save contact details.");
    } finally {
      setIsContactSaving(false);
    }
  };

  const savePreferences = async () => {
    setIsPreferencesSaving(true);
    try {
      const updated = await updateUserSettings({
        skills: profile.skills ?? [],
        preferredCategories: profile.preferredCategories ?? [],
        emailNotifications: Boolean(profile.emailNotifications),
        smsNotifications: Boolean(profile.smsNotifications),
        openToOpportunities: Boolean(profile.openToOpportunities),
        preferredLanguage: profile.preferredLanguage ?? "",
        availability: profile.availability ?? "",
        expertise: profile.expertise ?? "",
      });
      applyLoadedProfile(updated);
      toast.success("Preferences saved.");
    } catch {
      toast.error("Failed to save preferences.");
    } finally {
      setIsPreferencesSaving(false);
    }
  };

  const requestChannelVerification = async (channel: "EMAIL" | "PHONE") => {
    try {
      if (channel === "EMAIL") {
        await requestEmailVerification();
        toast.success("Email verification code sent.");
      } else {
        await requestPhoneVerification();
        toast.success("Phone verification code sent.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to request ${channel.toLowerCase()} verification.`);
    }
  };

  const confirmChannelVerification = async (channel: "EMAIL" | "PHONE") => {
    const code = channel === "EMAIL" ? emailOtp.trim() : phoneOtp.trim();
    if (code.length < 6) {
      toast.error(`Enter the 6-digit ${channel.toLowerCase()} code first.`);
      return;
    }

    setIsSecuritySaving(true);
    try {
      const updated = channel === "EMAIL"
        ? await confirmEmailVerification(code)
        : await confirmPhoneVerification(code);
      applyLoadedProfile(updated);
      if (channel === "EMAIL") {
        setEmailOtp("");
      } else {
        setPhoneOtp("");
      }
      toast.success(`${channel === "EMAIL" ? "Email" : "Phone"} verified.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${channel === "EMAIL" ? "Email" : "Phone"} verification failed.`);
    } finally {
      setIsSecuritySaving(false);
    }
  };

  const handleSuggestTaxonomy = async () => {
    setIsSuggesting(true);
    try {
      const suggestion = await suggestUserSettingsTaxonomy(profile);
      setTaxonomySuggestion(suggestion);
      toast.success("AI suggestion is ready.");
    } catch {
      toast.error("Failed to generate AI suggestion.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!taxonomySuggestion) {
      return;
    }

    const mappedCategoryId = findJobCategoryIdByDisplay(
      taxonomySuggestion.recommendations.suggested_categories?.[0],
    );
    const mergedSkills = unique([
      ...(profile.skills ?? []),
      ...taxonomySuggestion.skills.slice(0, 8),
    ]);
    const mergedPreferredCategories = unique([
      ...(profile.preferredCategories ?? []),
      ...(mappedCategoryId ? [mappedCategoryId] : []),
    ]);

    setProfile((current) => ({
      ...current,
      skills: mergedSkills,
      preferredCategories: mergedPreferredCategories,
      expertise: taxonomySuggestion.expertise_level ?? current.expertise,
    }));

    if (!mappedCategoryId && taxonomySuggestion.recommendations.suggested_categories?.[0]) {
      toast("AI suggested a category path, but it could not be mapped automatically.");
      return;
    }

    toast.success("AI suggestion applied to preferences.");
  };

  const handleRevokeSession = async (session: ActiveSession) => {
    setRevokingJti(session.jti);
    try {
      await revokeSession(session.jti);
      if (session.current) {
        await logoutApi();
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
        return;
      }
      toast.success("Session removed.");
      await loadSessions();
    } catch {
      toast.error("Failed to remove session.");
    } finally {
      setRevokingJti(null);
    }
  };

  const handleRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      const result = await revokeOtherSessions();
      toast.success(`${result.revoked} session(s) removed.`);
      await loadSessions();
    } catch {
      toast.error("Failed to remove other sessions.");
    } finally {
      setRevokingOthers(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <p className="text-sm text-gray-500">Loading workspace settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-gray-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Settings hub
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-gray-900">Workspace settings</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              One saved place for profile details, contact info, verification, 2-step login, preferences, and live session control.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Email</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{profile.emailVerified ? "Verified" : "Pending"}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Phone</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{profile.phoneVerified ? "Verified" : "Pending"}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">2-step</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {profile.twoFactorEnabled ? `Enabled (${formatTwoFactorMethodLabel(profile.twoFactorMethod)})` : "Disabled"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Devices</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{sessionsLoading ? "Loading..." : `${sessions.length} active`}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-[96px] xl:self-start">
          <div className="flex gap-2 overflow-x-auto rounded-[28px] border border-gray-200/80 bg-white p-3 shadow-[0_18px_44px_rgba(15,23,42,0.04)] xl:block xl:space-y-2 xl:overflow-visible">
            {sections.map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => goToSection(section.id)}
                  className={`min-w-[220px] rounded-2xl border px-4 py-3 text-left transition xl:min-w-0 xl:w-full ${
                    active
                      ? "border-gray-900 bg-gray-900 text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)]"
                      : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <section.icon className={`h-4 w-4 ${active ? "text-white" : "text-gray-500"}`} />
                    <div>
                      <p className="text-sm font-semibold">{section.label}</p>
                      <p className={`mt-1 text-xs ${active ? "text-gray-200" : "text-gray-500"}`}>{section.helper}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[28px] border border-sky-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.98),rgba(255,255,255,0.95))] p-5 shadow-[0_18px_44px_rgba(14,165,233,0.08)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Sparkles className="h-4 w-4 text-sky-600" />
              Quick status
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-gray-700">
                Contact changes are saved once and kept for future logins.
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-gray-700">
                When 2-step uses both channels, login requires both codes.
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <section
            id="settings-overview"
            className={`${activeSection === "overview" ? "block" : "hidden"} rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]`}
          >
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <UserRound className="h-5 w-5 text-gray-700" />
              Overview
            </div>
            <p className="mt-2 text-sm text-gray-500">Profile basics, avatar, location, and the information your workspace should remember.</p>

            <div className="mt-5 grid gap-5">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Avatar upload</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl bg-gray-900 text-white">
                    {profile.profilePictureUrl ? (
                      <img src={profile.profilePictureUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase">No photo</div>
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800">
                    {isUploadingAvatar ? "Uploading..." : "Upload avatar"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingAvatar}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        void handleAvatarUpload(file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-900">Username</span>
                  <input
                    value={profile.username ?? ""}
                    onChange={(event) => setProfile((current) => ({ ...current, username: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                    placeholder="username"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-900">Country</span>
                  <select
                    value={profile.country ?? ""}
                    onChange={(event) => {
                      const nextCountryCode = event.target.value;
                      const selectedCountry = getCountryByCode(nextCountryCode);
                      setProfile((current) => ({
                        ...current,
                        country: nextCountryCode,
                        phoneCountryCode: selectedCountry?.dialCode ?? current.phoneCountryCode,
                      }));
                    }}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">Bio</span>
                <textarea
                  value={profile.bio ?? ""}
                  onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
                  rows={5}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="Tell clients or collaborators about this workspace."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-900">Location</span>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      value={profile.location ?? ""}
                      onChange={(event) => setProfile((current) => ({ ...current, location: event.target.value }))}
                      list="settings-location-suggestions"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                      placeholder="City or region"
                    />
                    <button
                      type="button"
                      onClick={() => void detectLocation()}
                      disabled={isDetectingLocation}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 disabled:opacity-60"
                    >
                      {isDetectingLocation ? <MapPin className="h-4 w-4 animate-pulse" /> : <LocateFixed className="h-4 w-4" />}
                      Detect
                    </button>
                  </div>
                  <datalist id="settings-location-suggestions">
                    {locationSuggestions.map((location) => (
                      <option key={location} value={location} />
                    ))}
                  </datalist>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-900">Timezone</span>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      value={profile.timezone ?? ""}
                      onChange={(event) => setProfile((current) => ({ ...current, timezone: event.target.value }))}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                      placeholder="Africa/Addis_Ababa"
                    />
                    <button
                      type="button"
                      onClick={detectTimezone}
                      disabled={isDetectingTimezone}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 disabled:opacity-60"
                    >
                      <LocateFixed className="h-4 w-4" />
                      {isDetectingTimezone ? "Detecting..." : "Detect"}
                    </button>
                  </div>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void saveOverview()}
                  disabled={isProfileSaving}
                  className="rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isProfileSaving ? "Saving..." : "Save overview"}
                </button>
              </div>
            </div>
          </section>

          <section
            id="settings-contact"
            className={`${activeSection === "contact" ? "block" : "hidden"} rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]`}
          >
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Mail className="h-5 w-5 text-gray-700" />
              Contact
            </div>
            <p className="mt-2 text-sm text-gray-500">Primary email and phone are saved here. If you change them, the relevant verification state resets automatically.</p>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">Email</span>
                <input
                  type="email"
                  value={profile.email ?? ""}
                  onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="you@example.com"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-900">Phone code</span>
                  <select
                    value={profile.phoneCountryCode ?? "+251"}
                    onChange={(event) => setProfile((current) => ({ ...current, phoneCountryCode: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={`${country.code}-${country.dialCode}`} value={country.dialCode}>
                        {country.dialCode} ({country.code})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-900">Phone number</span>
                  <input
                    type="tel"
                    value={(profile.phoneNumber ?? "").replace(/[^\d]/g, "")}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        phoneNumber: event.target.value.replace(/[^\d]/g, "").slice(0, 15),
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                    placeholder="911223344"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-800">
                Normalized phone preview: {normalizedPhonePreview || "Not set"}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void saveContact()}
                  disabled={isContactSaving}
                  className="rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isContactSaving ? "Saving..." : "Save contact"}
                </button>
              </div>
            </div>
          </section>

          <div id="settings-security" className={activeSection === "security" ? "block" : "hidden"}>
            <SecurityTwoFactorCard
              profile={profile}
              onProfileChange={applyLoadedProfile}
            />
          </div>

          <section
            id="settings-verification"
            className={`${activeSection === "verification" ? "block" : "hidden"} rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]`}
          >
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <BadgeCheck className="h-5 w-5 text-gray-700" />
              Verification
            </div>
            <p className="mt-2 text-sm text-gray-500">Phone and email verification are real and persistent. Identity verification is intentionally not exposed as “done” until a true workflow exists.</p>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Email verification</p>
                    <p className="mt-1 text-xs text-gray-500">{profile.emailVerified ? "Verified and ready for login flows." : "Pending verification."}</p>
                  </div>
                  {profile.emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={() => void requestChannelVerification("EMAIL")}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    Send email code
                  </button>
                  <input
                    value={emailOtp}
                    onChange={(event) => setEmailOtp(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                    placeholder="Enter email code"
                  />
                  <button
                    type="button"
                    onClick={() => void confirmChannelVerification("EMAIL")}
                    disabled={isSecuritySaving}
                    className="rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Confirm email
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Phone verification</p>
                    <p className="mt-1 text-xs text-gray-500">{profile.phoneVerified ? "Verified and ready for login flows." : "Pending verification."}</p>
                  </div>
                  {profile.phoneVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={() => void requestChannelVerification("PHONE")}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    Send phone code
                  </button>
                  <input
                    value={phoneOtp}
                    onChange={(event) => setPhoneOtp(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                    placeholder="Enter phone code"
                  />
                  <button
                    type="button"
                    onClick={() => void confirmChannelVerification("PHONE")}
                    disabled={isSecuritySaving}
                    className="rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Confirm phone
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <ShieldCheck className="h-4 w-4" />
                  Identity verification center
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Start the KYC intake on the dedicated page, choose a method, verify your channels, and send the finished record into the admin review queue.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/jobs/identity" className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                    Open KYC center
                  </Link>
                  <span className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800">
                    {profile.identityVerified ? "Verified profile detected" : "Awaiting KYC submission"}
                  </span>
                </div>
              </div>
              <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Sparkles className="h-4 w-4 text-gray-700" />
                  Linked signals
                </div>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>Email and phone remain the two fast trust anchors.</li>
                  <li>Identity verification becomes active after a KYC method is submitted.</li>
                  <li>Admins review the same identity state from the operational console.</li>
                </ul>
              </div>
            </div>
          </section>

          <section
            id="settings-preferences"
            className={`${activeSection === "preferences" ? "block" : "hidden"} rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]`}
          >
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <BellRing className="h-5 w-5 text-gray-700" />
              Preferences
            </div>
            <p className="mt-2 text-sm text-gray-500">Notification settings, work preferences, and AI-assisted skill normalization.</p>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-900">Skills</span>
                  <input
                    value={(profile.skills ?? []).join(", ")}
                    onChange={(event) => setProfile((current) => ({ ...current, skills: splitList(event.target.value) }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                    placeholder="Skills, comma separated"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-900">Preferred category IDs</span>
                  <input
                    value={(profile.preferredCategories ?? []).join(", ")}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        preferredCategories: splitList(event.target.value),
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                    placeholder="Preferred category IDs, comma separated"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-900">Expertise</span>
                    <input
                      value={profile.expertise ?? ""}
                      onChange={(event) => setProfile((current) => ({ ...current, expertise: event.target.value }))}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                      placeholder="beginner / intermediate / expert"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-900">Availability</span>
                    <input
                      value={profile.availability ?? ""}
                      onChange={(event) => setProfile((current) => ({ ...current, availability: event.target.value }))}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                      placeholder="FULL_TIME / PART_TIME / OCCASIONAL"
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Email notifications</span>
                    <input
                      type="checkbox"
                      checked={Boolean(profile.emailNotifications)}
                      onChange={(event) =>
                        setProfile((current) => ({ ...current, emailNotifications: event.target.checked }))
                      }
                      className="accent-black"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">SMS notifications</span>
                    <input
                      type="checkbox"
                      checked={Boolean(profile.smsNotifications)}
                      onChange={(event) =>
                        setProfile((current) => ({ ...current, smsNotifications: event.target.checked }))
                      }
                      className="accent-black"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Open to opportunities</span>
                    <input
                      type="checkbox"
                      checked={Boolean(profile.openToOpportunities)}
                      onChange={(event) =>
                        setProfile((current) => ({ ...current, openToOpportunities: event.target.checked }))
                      }
                      className="accent-black"
                    />
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void savePreferences()}
                    disabled={isPreferencesSaving}
                    className="rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isPreferencesSaving ? "Saving..." : "Save preferences"}
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-sky-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.98),rgba(255,255,255,0.95))] p-5 shadow-[0_18px_44px_rgba(14,165,233,0.08)]">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  AI taxonomy assist
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Suggest normalized skills and preferred category paths from your current saved profile.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSuggestTaxonomy()}
                    disabled={isSuggesting}
                    className="rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isSuggesting ? "Suggesting..." : "Suggest with AI"}
                  </button>
                  {taxonomySuggestion ? (
                    <button
                      type="button"
                      onClick={handleApplySuggestion}
                      className="rounded-full border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700"
                    >
                      Apply suggestion
                    </button>
                  ) : null}
                </div>

                {taxonomySuggestion ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Suggested path</div>
                      <div className="mt-1 text-sm font-semibold text-gray-900">
                        {taxonomySuggestion.recommendations.suggested_categories?.[0] || "No category suggestion"}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Confidence: {Math.round((taxonomySuggestion.confidence || 0) * 100)}%
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {taxonomySuggestion.skills.slice(0, 8).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {profile.preferredCategories?.length ? (
                      <div className="rounded-2xl border border-gray-100 bg-white/70 px-4 py-3 text-sm text-gray-600">
                        Current preferred categories:{" "}
                        {profile.preferredCategories
                          .map((item) => getJobCategoryDisplay(item, { unknownFallback: item }))
                          .join(", ")}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section
            id="settings-sessions"
            className={`${activeSection === "sessions" ? "block" : "hidden"} rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Smartphone className="h-5 w-5 text-gray-700" />
                  Current devices
                </div>
                <p className="mt-2 text-sm text-gray-500">Review every signed-in device, confirm its location, and remotely sign out anything you do not recognize.</p>
              </div>

              <button
                type="button"
                onClick={() => void loadSessions()}
                disabled={sessionsLoading}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 px-4 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                {sessionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Refresh
              </button>
            </div>

            {hasMultipleSessions ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-900">Multiple active logins detected</p>
                <p className="mt-1 text-xs text-amber-800">You are logged in on more than one device. Review and remove anything you do not recognize.</p>
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {sessionsLoading ? (
                <p className="text-sm text-gray-500">Loading active sessions...</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-gray-500">No active sessions found.</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.jti} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {session.device}
                          {session.current ? (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-700">
                              This device
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{formatSessionMeta(session)}</p>
                        <div className="mt-2 grid gap-1 text-xs text-gray-500 sm:grid-cols-2">
                          <p>Location: {formatLocation(session.location)}</p>
                          <p>IP: {session.ip}</p>
                          <p>Timezone: {session.timezone || "Unknown"}</p>
                          <p>Language: {session.language || "Unknown"}</p>
                          <p>Signed in: {formatTime(session.createdAt)}</p>
                          <p>Last active: {formatTime(session.lastSeenAt)}</p>
                          <p className="sm:col-span-2">Expires: {formatTime(session.expiresAt)}</p>
                          {session.deviceId ? <p className="sm:col-span-2 break-all">Device ID: {session.deviceId}</p> : null}
                          <p className="sm:col-span-2 break-all">User agent: {session.userAgent || "Unknown"}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRevokeSession(session)}
                        disabled={revokingJti === session.jti || revokingOthers}
                        className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-200 bg-white px-4 text-xs font-semibold text-rose-700 disabled:opacity-50"
                      >
                        {revokingJti === session.jti ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                        {session.current ? "Sign out this device" : "Remote sign out"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => void handleRevokeOthers()}
                disabled={revokingOthers || sessionsLoading || sessions.length <= 1}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-gray-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {revokingOthers ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Remote sign out other devices
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
