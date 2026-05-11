export const TWO_FACTOR_ORDER = ["EMAIL", "PHONE", "AUTHENTICATOR", "PIN"] as const;

export type TwoFactorFactor = (typeof TWO_FACTOR_ORDER)[number];
export type RegistrationVerificationFactor = Extract<TwoFactorFactor, "EMAIL" | "PHONE">;
export type RegistrationVerificationMethod = "EMAIL" | "PHONE" | "EMAIL+PHONE";

const AUTHENTICATOR_ALIASES = new Set([
  "AUTHENTICATOR",
  "TOTP",
  "AUTHENTICATOR_TOTP",
  "GOOGLE_AUTHENTICATOR",
  "AUTH_APP",
  "APP",
]);

const PIN_ALIASES = new Set([
  "PIN",
  "PINCODE",
  "PIN_CODE",
  "PINCODE_PASSWORD",
  "PIN_PASSWORD",
  "PIN_OR_PASSWORD",
  "PASSCODE",
  "PASSWORD",
]);

function normalizeToken(token: string) {
  return token
    .trim()
    .toUpperCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .replace(/\//g, "_");
}

export function extractTwoFactorFactors(value?: string | null): TwoFactorFactor[] {
  if (!value?.trim()) {
    return [];
  }

  const factors = new Set<TwoFactorFactor>();
  for (const rawToken of value.split(/[+,;|]/g)) {
    const token = normalizeToken(rawToken);
    if (!token) {
      continue;
    }

    if (token === "BOTH") {
      factors.add("EMAIL");
      factors.add("PHONE");
      continue;
    }
    if (token === "EMAIL") {
      factors.add("EMAIL");
      continue;
    }
    if (token === "PHONE") {
      factors.add("PHONE");
      continue;
    }
    if (AUTHENTICATOR_ALIASES.has(token)) {
      factors.add("AUTHENTICATOR");
      continue;
    }
    if (PIN_ALIASES.has(token)) {
      factors.add("PIN");
    }
  }

  return TWO_FACTOR_ORDER.filter((factor) => factors.has(factor));
}

export function buildTwoFactorMethod(factors: readonly TwoFactorFactor[]) {
  const selected = new Set<TwoFactorFactor>(factors);
  return TWO_FACTOR_ORDER.filter((factor) => selected.has(factor)).join("+");
}

export function normalizeTwoFactorMethod(value?: string | null, fallback = "EMAIL") {
  const normalized = buildTwoFactorMethod(extractTwoFactorFactors(value));
  if (normalized) {
    return normalized;
  }
  return fallback ? buildTwoFactorMethod(extractTwoFactorFactors(fallback)) || "EMAIL" : "";
}

export function usesEmailFactor(value?: string | null) {
  return extractTwoFactorFactors(value).includes("EMAIL");
}

export function usesPhoneFactor(value?: string | null) {
  return extractTwoFactorFactors(value).includes("PHONE");
}

export function usesAuthenticatorFactor(value?: string | null) {
  return extractTwoFactorFactors(value).includes("AUTHENTICATOR");
}

export function usesPinFactor(value?: string | null) {
  return extractTwoFactorFactors(value).includes("PIN");
}

export function formatTwoFactorFactorLabel(factor: TwoFactorFactor) {
  if (factor === "AUTHENTICATOR") {
    return "Authenticator (TOTP)";
  }
  if (factor === "PIN") {
    return "Security PIN";
  }
  return factor === "PHONE" ? "Phone" : "Email";
}

export function formatTwoFactorMethodLabel(value?: string | null) {
  const factors = extractTwoFactorFactors(value);
  if (factors.length === 0) {
    return "Email";
  }
  return factors.map((factor) => formatTwoFactorFactorLabel(factor)).join(" + ");
}

export function extractRegistrationVerificationFactors(value?: string | null): RegistrationVerificationFactor[] {
  return extractTwoFactorFactors(value).filter(
    (factor): factor is RegistrationVerificationFactor => factor === "EMAIL" || factor === "PHONE",
  );
}

export function normalizeRegistrationVerificationMethod(value?: string | null): RegistrationVerificationMethod {
  const factors = extractRegistrationVerificationFactors(value);
  if (factors.length === 0) {
    return "EMAIL";
  }
  return factors.join("+") as RegistrationVerificationMethod;
}

export function usesRegistrationEmailFactor(value?: string | null) {
  return extractRegistrationVerificationFactors(value).includes("EMAIL");
}

export function usesRegistrationPhoneFactor(value?: string | null) {
  return extractRegistrationVerificationFactors(value).includes("PHONE");
}

export function formatRegistrationVerificationMethodLabel(value?: string | null) {
  const factors = extractRegistrationVerificationFactors(value);
  if (factors.length === 0) {
    return "Email OTP";
  }
  return factors.map((factor) => `${factor === "PHONE" ? "Phone" : "Email"} OTP`).join(" + ");
}
