import type { SessionUser } from "../types/models";
import { api, unwrapResponse } from "./client";

export type LoginInput = {
  identifier: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
  email?: string;
  username?: string;
  fullName?: string;
  requiresTwoFactor?: boolean;
  challengeId?: string;
  twoFactorMethod?: string;
  message?: string;
};

export async function login(input: LoginInput) {
  const response = await api.post("/auth/login", input);
  return unwrapResponse(response, "Unable to login") as LoginResponse;
}

export async function verifyLoginTwoFactor(input: {
  challengeId: string;
  otpCode?: string;
  emailOtp?: string;
  phoneOtp?: string;
  recoveryCode?: string;
}) {
  const response = await api.post("/auth/login/2fa/verify", input);
  return unwrapResponse(response, "2FA verification failed") as {
    token: string;
    email: string;
    username?: string;
    fullName?: string;
  };
}

export async function resendLoginTwoFactor(challengeId: string) {
  const response = await api.post("/auth/login/2fa/resend", { challengeId });
  return unwrapResponse(response, "Unable to resend code") as { success?: boolean; message?: string };
}

export async function register(input: {
  email: string;
  username?: string;
  password: string;
  fullName: string;
  country?: string;
  location?: string;
  timezone?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
}) {
  const response = await api.post("/auth/register", input);
  return unwrapResponse(response, "Unable to register") as {
    token: string;
    email: string;
    username?: string;
    fullName?: string;
  };
}

export async function me() {
  const response = await api.get("/auth/me");
  const data = unwrapResponse(response, "Unable to load current user");
  const record = data as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id) {
    throw new Error("Invalid user session");
  }
  return {
    id: record.id as string,
    email: (record.email as string) ?? "",
    username: typeof record.username === "string" ? record.username : undefined,
    fullName: typeof record.fullName === "string" ? record.fullName : undefined,
    profilePictureUrl: typeof record.profilePictureUrl === "string" ? record.profilePictureUrl : null,
    roles: Array.isArray(record.roles) ? (record.roles as string[]) : [],
  } as SessionUser;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Client-side logout still proceeds even if backend call fails.
  }
}
