"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BadgeCheck, KeyRound, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  beginAuthenticatorSetup,
  confirmEmailVerification,
  confirmPhoneVerification,
  disableTwoFactor as disableTwoFactorApi,
  enableTwoFactor as enableTwoFactorApi,
  regenerateRecoveryCodes as regenerateRecoveryCodesApi,
  requestEmailVerification,
  requestPhoneVerification,
  type AuthenticatorSetup,
  type UserProfile,
} from "@/lib/api";
import {
  TWO_FACTOR_ORDER,
  buildTwoFactorMethod,
  extractTwoFactorFactors,
  formatTwoFactorFactorLabel,
  formatTwoFactorMethodLabel,
  type TwoFactorFactor,
} from "@/lib/two-factor";

function formatTimestamp(value?: number | null) {
  if (!value) {
    return "Not recorded yet";
  }
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type Props = {
  profile: Partial<UserProfile>;
  onProfileChange: (profile: Partial<UserProfile>) => void;
};

export function SecurityTwoFactorCard({ onProfileChange, profile }: Props) {
  const [selectedFactors, setSelectedFactors] = useState<TwoFactorFactor[]>(["EMAIL"]);
  const [hydratedFactors, setHydratedFactors] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [authenticatorSetup, setAuthenticatorSetup] = useState<AuthenticatorSetup | null>(null);
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (hydratedFactors) {
      return;
    }
    const nextFactors = extractTwoFactorFactors(profile.twoFactorMethod);
    if (nextFactors.length > 0 && profile.twoFactorEnabled) {
      setSelectedFactors(nextFactors);
    }
    if (profile.email !== undefined || profile.username !== undefined || profile.userId !== undefined) {
      setHydratedFactors(true);
    }
  }, [hydratedFactors, profile.email, profile.twoFactorEnabled, profile.twoFactorMethod, profile.userId, profile.username]);

  const selectedMethod = useMemo(() => buildTwoFactorMethod(selectedFactors), [selectedFactors]);
  const selectedMethodLabel = useMemo(
    () => (selectedFactors.length > 0 ? formatTwoFactorMethodLabel(selectedMethod) : "No factor selected"),
    [selectedFactors.length, selectedMethod],
  );

  const usesEmail = selectedFactors.includes("EMAIL");
  const usesPhone = selectedFactors.includes("PHONE");
  const usesAuthenticator = selectedFactors.includes("AUTHENTICATOR");
  const usesPin = selectedFactors.includes("PIN");

  const channelReady = useMemo(
    () => (!usesEmail || Boolean(profile.emailVerified)) && (!usesPhone || Boolean(profile.phoneVerified)),
    [profile.emailVerified, profile.phoneVerified, usesEmail, usesPhone],
  );

  const needsAuthenticatorSetup = usesAuthenticator && !Boolean(profile.authenticatorEnabled);
  const needsPinSetup = usesPin && !Boolean(profile.pinChallengeEnabled);

  const methodHint = useMemo(() => {
    if (selectedFactors.length === 0) {
      return "Turn on at least one factor before saving 2-step settings.";
    }

    const notes = [`Every sign-in will require ${selectedMethodLabel.toLowerCase()}.`];
    if (usesAuthenticator && !profile.authenticatorEnabled) {
      notes.push("Prepare the authenticator QR code and confirm one live TOTP code.");
    }
    if (usesPin && !profile.pinChallengeEnabled) {
      notes.push("Set a 4 to 8 digit security PIN before enabling.");
    }
    return notes.join(" ");
  }, [profile.authenticatorEnabled, selectedFactors.length, selectedMethodLabel, usesAuthenticator, usesPin]);

  const canEnable =
    currentPassword.trim().length >= 8 &&
    selectedFactors.length > 0 &&
    channelReady &&
    (!needsAuthenticatorSetup || (Boolean(authenticatorSetup) && /^\d{6}$/.test(authenticatorCode.trim()))) &&
    (!needsPinSetup || /^\d{4,8}$/.test(pinCode.trim()));

  const toggleFactor = (factor: TwoFactorFactor) => {
    setSelectedFactors((current) => {
      const next = current.includes(factor) ? current.filter((item) => item !== factor) : [...current, factor];
      const selected = new Set(next);
      return TWO_FACTOR_ORDER.filter((item) => selected.has(item));
    });
  };

  const prepareSelectedFactors = async () => {
    if (selectedFactors.length === 0) {
      toast.error("Turn on at least one factor first.");
      return;
    }

    setIsBusy(true);
    try {
      const prepared: string[] = [];

      if (usesAuthenticator && !profile.authenticatorEnabled && !authenticatorSetup) {
        const response = await beginAuthenticatorSetup();
        setAuthenticatorSetup(response.setup);
        onProfileChange(response.profile);
        prepared.push("authenticator setup");
      }

      if (usesEmail && !profile.emailVerified) {
        await requestEmailVerification();
        prepared.push("email code");
      }
      if (usesPhone && !profile.phoneVerified) {
        await requestPhoneVerification();
        prepared.push("phone code");
      }
      if (usesPin && !profile.pinChallengeEnabled) {
        prepared.push("pin");
      }

      if (prepared.length === 0) {
        toast.success("Selected factors are already ready. Enter your current password and save.");
      } else {
        toast.success(`Preparation complete for ${prepared.join(", ")}.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to prepare selected 2-step factors.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleEnable = async () => {
    if (selectedFactors.length === 0) {
      toast.error("Turn on at least one factor before enabling.");
      return;
    }
    if (!currentPassword.trim()) {
      toast.error("Enter your current password first.");
      return;
    }

    setIsBusy(true);
    try {
      if (usesEmail && !profile.emailVerified) {
        if (!/^\d{6}$/.test(emailOtp.trim())) {
          throw new Error("Enter the 6-digit email verification code first.");
        }
        const updated = await confirmEmailVerification(emailOtp.trim());
        onProfileChange(updated);
      }

      if (usesPhone && !profile.phoneVerified) {
        if (!/^\d{6}$/.test(phoneOtp.trim())) {
          throw new Error("Enter the 6-digit phone verification code first.");
        }
        const updated = await confirmPhoneVerification(phoneOtp.trim());
        onProfileChange(updated);
      }

      if (needsAuthenticatorSetup && !authenticatorSetup) {
        throw new Error("Prepare the authenticator QR code first.");
      }
      if (needsAuthenticatorSetup && !/^\d{6}$/.test(authenticatorCode.trim())) {
        throw new Error("Enter the live 6-digit authenticator code.");
      }

      if (needsPinSetup && !/^\d{4,8}$/.test(pinCode.trim())) {
        throw new Error("Enter a 4 to 8 digit security PIN.");
      }

      const response = await enableTwoFactorApi({
        method: selectedMethod,
        currentPassword: currentPassword.trim(),
        authenticatorCode: usesAuthenticator && authenticatorCode.trim() ? authenticatorCode.trim() : undefined,
        pinCode: usesPin && pinCode.trim() ? pinCode.trim() : undefined,
      });

      onProfileChange(response.profile);
      setRecoveryCodes(response.recoveryCodes ?? []);
      setAuthenticatorCode("");
      setEmailOtp("");
      setPhoneOtp("");
      setPinCode("");
      setRecoveryCode("");
      setAuthenticatorSetup(null);
      toast.success(response.message ?? `2-step verification enabled with ${formatTwoFactorMethodLabel(selectedMethod)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to enable 2-step verification.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!currentPassword.trim()) {
      toast.error("Enter your current password to disable 2-step verification.");
      return;
    }

    setIsBusy(true);
    try {
      const response = await disableTwoFactorApi({ currentPassword: currentPassword.trim() });
      onProfileChange(response.profile);
      setAuthenticatorSetup(null);
      setAuthenticatorCode("");
      setPinCode("");
      setRecoveryCode("");
      setRecoveryCodes([]);
      setSelectedFactors(extractTwoFactorFactors(response.profile.twoFactorMethod));
      toast.success(response.message ?? "2-step verification disabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disable 2-step verification.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    if (!currentPassword.trim()) {
      toast.error("Enter your current password before regenerating recovery codes.");
      return;
    }
    if (!authenticatorCode.trim() && !recoveryCode.trim()) {
      toast.error("Enter a current authenticator code or one existing recovery code.");
      return;
    }

    setIsBusy(true);
    try {
      const response = await regenerateRecoveryCodesApi({
        currentPassword: currentPassword.trim(),
        authenticatorCode: authenticatorCode.trim() || undefined,
        recoveryCode: recoveryCode.trim() || undefined,
      });
      onProfileChange(response.profile);
      setRecoveryCodes(response.recoveryCodes ?? []);
      setRecoveryCode("");
      toast.success(response.message ?? "Recovery codes regenerated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to regenerate recovery codes.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <ShieldCheck className="h-5 w-5 text-gray-700" />
        Security & 2FA
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Configure each factor separately. Turn on only what you want, and combine factors in any order.
      </p>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-4 rounded-[24px] border border-gray-200 bg-gray-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">2-step factors</p>
              <p className="mt-1 text-xs text-gray-500">Switch each factor on or off, then prepare and save.</p>
            </div>
            <button
              type="button"
              onClick={() => void prepareSelectedFactors()}
              disabled={isBusy}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-60"
            >
              Prepare selected factors
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {TWO_FACTOR_ORDER.map((factor) => {
              const checked = selectedFactors.includes(factor);
              const Icon = factor === "EMAIL" ? Mail : factor === "PHONE" ? Smartphone : factor === "AUTHENTICATOR" ? ShieldCheck : KeyRound;
              const ready =
                factor === "EMAIL"
                  ? Boolean(profile.emailVerified)
                  : factor === "PHONE"
                    ? Boolean(profile.phoneVerified)
                    : factor === "AUTHENTICATOR"
                      ? Boolean(profile.authenticatorEnabled)
                      : Boolean(profile.pinChallengeEnabled);

              return (
                <label
                  key={factor}
                  className={`cursor-pointer rounded-2xl border px-4 py-3 transition ${
                    checked ? "border-gray-900 bg-white shadow-[0_12px_22px_rgba(15,23,42,0.06)]" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFactor(factor)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-gray-900"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Icon className="h-4 w-4" />
                        {formatTwoFactorFactorLabel(factor)}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{ready ? "Ready" : "Needs setup"}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">{selectedMethodLabel}</p>
          <p className="mt-1">{methodHint}</p>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-gray-900">Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
            placeholder="Enter current password"
          />
        </label>

        {usesEmail ? (
          <div className="grid gap-3 rounded-[24px] border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Email factor</p>
                <p className="mt-1 text-xs text-gray-500">
                  {profile.emailVerified
                    ? "Email is already verified and can be used immediately."
                    : "Prepare and confirm a real email OTP before enabling this factor."}
                </p>
              </div>
              {profile.emailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : null}
            </div>
            {!profile.emailVerified ? (
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">Email OTP</span>
                <input
                  value={emailOtp}
                  onChange={(event) => setEmailOtp(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="Enter 6-digit email code"
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {usesPhone ? (
          <div className="grid gap-3 rounded-[24px] border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Phone factor</p>
                <p className="mt-1 text-xs text-gray-500">
                  {profile.phoneVerified
                    ? "Phone is already verified and can be used immediately."
                    : "Prepare and confirm a real phone OTP before enabling this factor."}
                </p>
              </div>
              {profile.phoneVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : null}
            </div>
            {!profile.phoneVerified ? (
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">Phone OTP</span>
                <input
                  value={phoneOtp}
                  onChange={(event) => setPhoneOtp(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="Enter 6-digit phone code"
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {usesAuthenticator ? (
          <div className="grid gap-4 rounded-[24px] border border-gray-200 bg-gray-50 p-5 lg:grid-cols-[180px_minmax(0,1fr)]">
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-4">
              {authenticatorSetup ? (
                <QRCodeSVG value={authenticatorSetup.otpAuthUrl} size={132} includeMargin />
              ) : (
                <div className="text-center text-sm text-gray-500">
                  {profile.authenticatorEnabled
                    ? "Authenticator is already configured for this account."
                    : "Prepare selected factors to generate an authenticator QR code."}
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Authenticator app (TOTP)</p>
                <p className="mt-1 text-xs text-gray-500">
                  Scan the QR code with Google Authenticator, 1Password, Authy, Microsoft Authenticator, or any TOTP app.
                </p>
              </div>
              {authenticatorSetup ? (
                <>
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">Secret</p>
                    <p className="mt-2 break-all font-mono text-xs">{authenticatorSetup.secret}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={authenticatorSetup.otpAuthUrl}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      Open authenticator link
                    </a>
                    <span className="text-xs text-gray-500">Issuer: {authenticatorSetup.issuer}</span>
                  </div>
                </>
              ) : null}
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {needsAuthenticatorSetup ? "Authenticator code" : "Authenticator code (optional)"}
                </span>
                <input
                  value={authenticatorCode}
                  onChange={(event) => setAuthenticatorCode(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                  placeholder="Enter live 6-digit TOTP code"
                />
              </label>
            </div>
          </div>
        ) : null}

        {usesPin ? (
          <div className="grid gap-3 rounded-[24px] border border-gray-200 bg-gray-50 p-5">
            <div>
              <p className="text-sm font-semibold text-gray-900">Security PIN / passcode</p>
              <p className="mt-1 text-xs text-gray-500">
                {profile.pinChallengeEnabled
                  ? "A PIN is already configured. Enter a new one only if you want to update it."
                  : "Choose a real 4 to 8 digit PIN. It is hashed and verified server-side."}
              </p>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-900">{needsPinSetup ? "New PIN" : "New PIN (optional)"}</span>
              <input
                type="password"
                value={pinCode}
                onChange={(event) => setPinCode(event.target.value.replace(/[^\d]/g, "").slice(0, 8))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
                placeholder="Enter 4 to 8 digit PIN"
              />
            </label>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleEnable()}
            disabled={isBusy || !canEnable}
            className="rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isBusy ? "Saving..." : profile.twoFactorEnabled ? "Update 2-step factors" : "Enable 2-step"}
          </button>
          <button
            type="button"
            onClick={() => void handleDisable()}
            disabled={isBusy || !profile.twoFactorEnabled}
            className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 disabled:opacity-60"
          >
            Disable 2-step
          </button>
          {selectedFactors.length === 0 ? (
            <p className="text-xs text-amber-700">Turn on at least one factor before saving.</p>
          ) : null}
          {!channelReady && (usesEmail || usesPhone) ? (
            <p className="text-xs text-amber-700">Verify all selected email/phone channels before enabling.</p>
          ) : null}
        </div>

        {profile.authenticatorEnabled || recoveryCodes.length > 0 ? (
          <div className="grid gap-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Recovery codes</p>
                <p className="mt-1 text-xs text-emerald-800">
                  Remaining on account: {profile.recoveryCodesRemaining ?? recoveryCodes.length}. Regenerating codes requires your
                  current password and either a live authenticator code or one existing recovery code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleRegenerateRecoveryCodes()}
                disabled={isBusy || !profile.authenticatorEnabled}
                className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-60"
              >
                Regenerate recovery codes
              </button>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-emerald-900">Existing recovery code</span>
              <input
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
                className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none"
                placeholder="Optional recovery code"
              />
            </label>
            {recoveryCodes.length > 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-sm font-semibold text-emerald-900">New recovery codes</p>
                <p className="mt-1 text-xs text-gray-500">Save these now. They are only shown once after generation.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {recoveryCodes.map((code) => (
                    <div
                      key={code}
                      className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Current status: {profile.twoFactorEnabled ? `Enabled (${formatTwoFactorMethodLabel(profile.twoFactorMethod)})` : "Disabled"}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Selected in form: {selectedMethodLabel}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Authenticator ready: {profile.authenticatorEnabled ? "Yes" : "No"} ({formatTimestamp(profile.authenticatorVerifiedAt)})
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            PIN ready: {profile.pinChallengeEnabled ? "Yes" : "No"} ({formatTimestamp(profile.securityPinUpdatedAt)})
          </div>
        </div>
      </div>
    </section>
  );
}
