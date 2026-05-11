export type AuthRole = "FREELANCER" | "EMPLOYER";

export type LoginDraft = {
  identifier: string;
  remember: boolean;
};

export type LoginTwoFactorDraft = {
  challengeId: string;
  method: string;
  identifier: string;
};

export type RegisterDraft = {
  role: AuthRole | "";
  email: string;
  username: string;
  firstName: string;
  middleName: string;
  lastName: string;
  country: string;
  phoneCountryCode: string;
  phoneNumber: string;
  location: string;
  timezone: string;
  verificationMethod: "EMAIL" | "PHONE";
  registrationChallengeId: string;
  password: string;
  confirmPassword: string;
};

const LOGIN_DRAFT_KEY = "sabahub.auth.login-draft";
const LOGIN_2FA_DRAFT_KEY = "sabahub.auth.login-2fa-draft";
const REGISTER_DRAFT_KEY = "sabahub.auth.register-draft";

export const emptyLoginDraft: LoginDraft = {
  identifier: "",
  remember: false,
};

export const emptyLoginTwoFactorDraft: LoginTwoFactorDraft = {
  challengeId: "",
  method: "EMAIL",
  identifier: "",
};

export const emptyRegisterDraft: RegisterDraft = {
  role: "",
  email: "",
  username: "",
  firstName: "",
  middleName: "",
  lastName: "",
  country: "",
  phoneCountryCode: "+251",
  phoneNumber: "",
  location: "",
  timezone: "",
  verificationMethod: "EMAIL",
  registrationChallengeId: "",
  password: "",
  confirmPassword: "",
};

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readDraft<T>(key: string, fallback: T): T {
  if (!canUseSessionStorage()) {
    return fallback;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

function writeDraft<T>(key: string, draft: T) {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Ignore draft persistence failures. The flow still works in-memory.
  }
}

function clearDraft(key: string) {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore draft persistence failures.
  }
}

export function readLoginDraft() {
  return readDraft(LOGIN_DRAFT_KEY, emptyLoginDraft);
}

export function saveLoginDraft(draft: LoginDraft) {
  writeDraft(LOGIN_DRAFT_KEY, draft);
}

export function clearLoginDraft() {
  clearDraft(LOGIN_DRAFT_KEY);
}

export function readLoginTwoFactorDraft() {
  return readDraft(LOGIN_2FA_DRAFT_KEY, emptyLoginTwoFactorDraft);
}

export function saveLoginTwoFactorDraft(draft: LoginTwoFactorDraft) {
  writeDraft(LOGIN_2FA_DRAFT_KEY, draft);
}

export function clearLoginTwoFactorDraft() {
  clearDraft(LOGIN_2FA_DRAFT_KEY);
}

export function readRegisterDraft() {
  return readDraft(REGISTER_DRAFT_KEY, emptyRegisterDraft);
}

export function saveRegisterDraft(draft: RegisterDraft) {
  writeDraft(REGISTER_DRAFT_KEY, draft);
}

export function clearRegisterDraft() {
  clearDraft(REGISTER_DRAFT_KEY);
}

export function createUniqueId(username: string) {
  return username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

export function hasRegisterRole(draft: RegisterDraft) {
  return draft.role === "FREELANCER" || draft.role === "EMPLOYER";
}

export function hasRegisterProfile(draft: RegisterDraft) {
  return (
    hasRegisterRole(draft) &&
    draft.firstName.trim().length > 0 &&
    draft.lastName.trim().length > 0 &&
    draft.email.trim().length > 0 &&
    createUniqueId(draft.username).length >= 3
  );
}

export function hasRegisterSecurity(draft: RegisterDraft) {
  return (
    hasRegisterProfile(draft) &&
    draft.password.length >= 8 &&
    draft.confirmPassword.length >= 8 &&
    draft.password === draft.confirmPassword
  );
}
