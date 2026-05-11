import type { UserSettingsProfile } from "../types/models";
import { api, unwrapResponse } from "./client";

export async function getUserSettings() {
  const response = await api.get("/user/settings");
  return unwrapResponse(response, "Unable to load user settings") as UserSettingsProfile;
}

export async function updateUserSettings(patch: Partial<UserSettingsProfile>) {
  const response = await api.patch("/user/settings", patch);
  return unwrapResponse(response, "Unable to update settings") as UserSettingsProfile;
}

export async function updateUserContact(input: {
  email: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
}) {
  const response = await api.patch("/user/settings/contact", input);
  return unwrapResponse(response, "Unable to update contact") as {
    profile: UserSettingsProfile;
    token: string;
    message?: string;
  };
}

export async function uploadAvatar(formData: FormData) {
  const response = await api.post("/user/settings/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapResponse(response, "Unable to upload avatar");
}

export async function beginAuthenticatorSetup() {
  const response = await api.post("/user/settings/2fa/authenticator/setup");
  return unwrapResponse(response, "Unable to setup authenticator") as {
    success?: boolean;
    setup?: {
      secret?: string;
      otpAuthUrl?: string;
      issuer?: string;
      accountName?: string;
    };
    profile?: UserSettingsProfile;
  };
}

export async function enableTwoFactor(input: {
  method: "EMAIL" | "PHONE" | "BOTH" | "AUTHENTICATOR" | "PIN";
  currentPassword: string;
  authenticatorCode?: string;
  pinCode?: string;
}) {
  const response = await api.post("/user/settings/2fa/enable", input);
  return unwrapResponse(response, "Unable to enable 2FA") as {
    success?: boolean;
    profile?: UserSettingsProfile;
    recoveryCodes?: string[];
    message?: string;
  };
}

export async function disableTwoFactor(input: { currentPassword: string }) {
  const response = await api.post("/user/settings/2fa/disable", input);
  return unwrapResponse(response, "Unable to disable 2FA") as {
    success?: boolean;
    profile?: UserSettingsProfile;
    message?: string;
  };
}

export async function requestEmailVerification() {
  const response = await api.post("/user/settings/verify-email/request");
  return unwrapResponse(response, "Unable to send email verification code") as {
    success?: boolean;
    message?: string;
  };
}

export async function confirmEmailVerification(otpCode: string) {
  const response = await api.post("/user/settings/verify-email/confirm", { otpCode });
  return unwrapResponse(response, "Unable to verify email") as UserSettingsProfile;
}

export async function requestPhoneVerification() {
  const response = await api.post("/user/settings/verify-phone/request");
  return unwrapResponse(response, "Unable to send phone verification code") as {
    success?: boolean;
    message?: string;
  };
}

export async function confirmPhoneVerification(otpCode: string) {
  const response = await api.post("/user/settings/verify-phone/confirm", { otpCode });
  return unwrapResponse(response, "Unable to verify phone") as UserSettingsProfile;
}

export async function regenerateRecoveryCodes(input: {
  currentPassword: string;
  authenticatorCode?: string;
  recoveryCode?: string;
}) {
  const response = await api.post("/user/settings/2fa/recovery-codes/regenerate", input);
  return unwrapResponse(response, "Unable to regenerate recovery codes") as {
    success?: boolean;
    profile?: UserSettingsProfile;
    recoveryCodes?: string[];
    message?: string;
  };
}
