"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck, Smartphone } from "lucide-react";
import {
  AuthFlowShell,
  AuthStatusBanner,
  AuthTextField,
  authFlowStyles,
} from "@/components/auth/AuthFlowShell";
import { isAuthenticated, resolveWorkspaceRouteFromToken } from "@/lib/auth";
import {
  clearLoginDraft,
  clearLoginTwoFactorDraft,
  readLoginTwoFactorDraft,
} from "@/lib/auth-flow";
import { markProfileCompletionPrompt } from "@/lib/profile-completion";
import {
  extractTwoFactorFactors,
  formatTwoFactorMethodLabel,
  normalizeTwoFactorMethod,
  usesAuthenticatorFactor,
  usesEmailFactor,
  usesPhoneFactor,
  usesPinFactor,
} from "@/lib/two-factor";

const steps = [
  {
    label: "Identity",
    detail: "Account selected.",
    status: "complete" as const,
    href: "/login",
  },
  {
    label: "Password",
    detail: "Password verified.",
    status: "complete" as const,
    href: "/login/password",
  },
  {
    label: "Verification",
    detail: "Confirm selected factors.",
    status: "current" as const,
  },
];

type StatusState =
  | {
      tone: "error" | "success" | "info";
      message: string;
    }
  | null;

function buildIntroCopy(method: string) {
  const factors = extractTwoFactorFactors(method);
  if (factors.length === 0) {
    return "We could not determine your 2-step setup. Go back and try signing in again.";
  }
  if (factors.length === 1 && factors[0] === "EMAIL") {
    return "We sent a one-time code to your email. Enter it to finish login.";
  }
  if (factors.length === 1 && factors[0] === "PHONE") {
    return "We sent a one-time code to your phone. Enter it to finish login.";
  }
  if (factors.length === 1 && factors[0] === "AUTHENTICATOR") {
    return "Open your authenticator app and enter the current 6-digit code. You can also use a recovery code.";
  }
  if (factors.length === 1 && factors[0] === "PIN") {
    return "Enter the security PIN / passcode you configured in settings to finish login.";
  }
  return `Complete all required checks: ${formatTwoFactorMethodLabel(method).toLowerCase()}.`;
}

function buildResendLabel(method: string) {
  const email = usesEmailFactor(method);
  const phone = usesPhoneFactor(method);
  if (email && phone) {
    return "Resend email and phone codes";
  }
  if (email) {
    return "Resend email code";
  }
  return "Resend phone code";
}

export default function LoginChallengePage() {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState("");
  const [method, setMethod] = useState("EMAIL");
  const [identifier, setIdentifier] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      const token = localStorage.getItem("auth_token");
      router.replace(resolveWorkspaceRouteFromToken(token));
      return;
    }

    const draft = readLoginTwoFactorDraft();
    if (!draft.challengeId.trim()) {
      router.replace("/login/password");
      return;
    }

    setChallengeId(draft.challengeId);
    setMethod(normalizeTwoFactorMethod(draft.method, "EMAIL"));
    setIdentifier(draft.identifier);
    setReady(true);
  }, [router]);

  const methodUsesEmail = usesEmailFactor(method);
  const methodUsesPhone = usesPhoneFactor(method);
  const methodUsesAuthenticator = usesAuthenticatorFactor(method);
  const methodUsesPin = usesPinFactor(method);
  const selectedFactors = useMemo(() => extractTwoFactorFactors(method), [method]);
  const supportsResend = methodUsesEmail || methodUsesPhone;
  const introCopy = buildIntroCopy(method);
  const methodSummary = formatTwoFactorMethodLabel(method);

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedFactors.length === 0) {
      setStatus({ tone: "error", message: "Invalid verification challenge. Please sign in again." });
      return;
    }

    if (methodUsesEmail && emailOtp.trim().length < 6) {
      setStatus({ tone: "error", message: "Enter the 6-digit email verification code." });
      return;
    }
    if (methodUsesPhone && phoneOtp.trim().length < 6) {
      setStatus({ tone: "error", message: "Enter the 6-digit phone verification code." });
      return;
    }
    if (methodUsesAuthenticator && authenticatorCode.trim().length < 6 && !recoveryCode.trim()) {
      setStatus({ tone: "error", message: "Enter a 6-digit authenticator code or a recovery code." });
      return;
    }
    if (methodUsesPin && !/^\d{4,8}$/.test(pinCode.trim())) {
      setStatus({ tone: "error", message: "Enter the 4 to 8 digit security PIN." });
      return;
    }

    const payload: Record<string, string> = { challengeId };
    if (methodUsesEmail) {
      payload.emailOtp = emailOtp.trim();
    }
    if (methodUsesPhone) {
      payload.phoneOtp = phoneOtp.trim();
    }
    if (methodUsesAuthenticator && authenticatorCode.trim()) {
      payload.authenticatorCode = authenticatorCode.trim();
    }
    if (methodUsesPin) {
      payload.pinCode = pinCode.trim();
    }
    if (methodUsesAuthenticator && recoveryCode.trim()) {
      payload.recoveryCode = recoveryCode.trim();
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/login/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus({ tone: "error", message: data?.error ?? data?.message ?? "Verification failed." });
        setLoading(false);
        return;
      }

      if (!data?.token) {
        setStatus({ tone: "error", message: "Verification succeeded, but no token was returned." });
        setLoading(false);
        return;
      }

      localStorage.setItem("auth_token", data.token);
      markProfileCompletionPrompt("login");
      clearLoginTwoFactorDraft();
      clearLoginDraft();
      setStatus({ tone: "success", message: "Verification complete. Opening your workspace..." });

      window.setTimeout(() => {
        startTransition(() => router.push(resolveWorkspaceRouteFromToken(data.token)));
      }, 350);
    } catch {
      setStatus({ tone: "error", message: "Network error while verifying your code." });
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!challengeId || !supportsResend) {
      return;
    }
    setResending(true);
    try {
      const response = await fetch("/api/auth/login/2fa/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus({ tone: "error", message: data?.error ?? data?.message ?? "Unable to resend code." });
        return;
      }
      setStatus({ tone: "success", message: "Verification code sent again." });
    } catch {
      setStatus({ tone: "error", message: "Network error while requesting a new code." });
    } finally {
      setResending(false);
    }
  };

  const heroIcon =
    methodUsesPhone && !methodUsesEmail && !methodUsesAuthenticator && !methodUsesPin ? (
      <Smartphone className="h-5 w-5" />
    ) : methodUsesEmail && !methodUsesPhone && !methodUsesAuthenticator && !methodUsesPin ? (
      <Mail className="h-5 w-5" />
    ) : (
      <ShieldCheck className="h-5 w-5" />
    );

  return (
    <AuthFlowShell
      stageLabel="Login"
      title="Enter your verification code"
      description="One step left."
      steps={steps}
      hero={
        <div className="space-y-4">
          <div className={authFlowStyles.featureCard}>
            <div className={authFlowStyles.featureIcon}>{heroIcon}</div>
            <div>
              <div className="text-base font-semibold text-slate-950">Verification factors</div>
              <div className="mt-1 text-sm leading-7 text-slate-500">
                {`Using ${methodSummary.toLowerCase()} for ${identifier || "your account"}.`}
              </div>
            </div>
          </div>

          <div className={authFlowStyles.featureCard}>
            <div className={authFlowStyles.featureIcon}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-950">Security check</div>
              <div className="mt-1 text-sm leading-7 text-slate-500">
                Finish every required factor to open your workspace.
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Step 3 of 3
          </div>
          <h2 className={clsx(authFlowStyles.displayHeading, "mt-5 text-3xl font-bold tracking-[-0.04em] text-slate-950 md:text-4xl")}>
            Complete verification
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-600">{introCopy}</p>
        </div>

        {!ready ? (
          <div className="mt-8">
            <AuthStatusBanner tone="info" message="Loading your verification challenge..." />
          </div>
        ) : (
          <form onSubmit={submitCode} className="mt-8 flex flex-col gap-5">
            {methodUsesEmail ? (
              <AuthTextField
                label="Email OTP"
                type="text"
                value={emailOtp}
                onChange={(event) => {
                  setEmailOtp(event.target.value);
                  if (status?.tone === "error") {
                    setStatus(null);
                  }
                }}
                autoComplete="one-time-code"
                placeholder="Enter email code"
                autoFocus
              />
            ) : null}

            {methodUsesPhone ? (
              <AuthTextField
                label="Phone OTP"
                type="text"
                value={phoneOtp}
                onChange={(event) => {
                  setPhoneOtp(event.target.value);
                  if (status?.tone === "error") {
                    setStatus(null);
                  }
                }}
                autoComplete="one-time-code"
                placeholder="Enter phone code"
                autoFocus={!methodUsesEmail}
              />
            ) : null}

            {methodUsesAuthenticator ? (
              <>
                <AuthTextField
                  label="Authenticator code"
                  type="text"
                  value={authenticatorCode}
                  onChange={(event) => {
                    setAuthenticatorCode(event.target.value);
                    if (status?.tone === "error") {
                      setStatus(null);
                    }
                  }}
                  autoComplete="one-time-code"
                  placeholder="Enter 6-digit authenticator code"
                  autoFocus={!methodUsesEmail && !methodUsesPhone}
                />
                <AuthTextField
                  label="Recovery code"
                  type="text"
                  value={recoveryCode}
                  onChange={(event) => {
                    setRecoveryCode(event.target.value);
                    if (status?.tone === "error") {
                      setStatus(null);
                    }
                  }}
                  autoComplete="off"
                  placeholder="Optional recovery code"
                />
              </>
            ) : null}

            {methodUsesPin ? (
              <AuthTextField
                label="Security PIN / passcode"
                type="password"
                value={pinCode}
                onChange={(event) => {
                  setPinCode(event.target.value.replace(/[^\d]/g, "").slice(0, 8));
                  if (status?.tone === "error") {
                    setStatus(null);
                  }
                }}
                autoComplete="current-password"
                placeholder="Enter your security PIN"
                autoFocus={!methodUsesEmail && !methodUsesPhone && !methodUsesAuthenticator}
              />
            ) : null}

            {status ? <AuthStatusBanner tone={status.tone} message={status.message} /> : null}

            <button
              type="submit"
              className={clsx(authFlowStyles.buttonBase, authFlowStyles.primaryButton)}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify and continue"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className={clsx(authFlowStyles.buttonBase, authFlowStyles.secondaryButton)}
                onClick={() => startTransition(() => router.push("/login/password"))}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {supportsResend ? (
                <button
                  type="button"
                  onClick={() => void resendCode()}
                  disabled={resending || loading}
                  className={authFlowStyles.textLink}
                >
                  {resending ? "Sending new code..." : buildResendLabel(method)}
                </button>
              ) : (
                <span className="text-sm text-slate-500">
                  {methodUsesPin && methodUsesAuthenticator
                    ? "Enter your authenticator or recovery code, and your PIN."
                    : methodUsesAuthenticator
                      ? "Use the latest code from your authenticator app (or recovery code)."
                      : "Use the security PIN you set in settings."}
                </span>
              )}
            </div>

            <p className="text-sm text-slate-500">
              Wrong factors? Update your 2-step setup in{" "}
              <Link href="/jobs/settings" className={authFlowStyles.textLink}>
                settings
              </Link>{" "}
              after you sign in.
            </p>
          </form>
        )}
      </div>
    </AuthFlowShell>
  );
}
