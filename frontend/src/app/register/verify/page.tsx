"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import {
  AuthFlowShell,
  AuthStatusBanner,
  AuthTextField,
  authFlowStyles,
} from "@/components/auth/AuthFlowShell";
import { isAuthenticated, resolveWorkspaceRouteFromToken } from "@/lib/auth";
import {
  clearLoginDraft,
  clearRegisterDraft,
  createUniqueId,
  hasRegisterSecurity,
  readRegisterDraft,
  saveRegisterDraft,
} from "@/lib/auth-flow";
import { markProfileCompletionPrompt } from "@/lib/profile-completion";

type StatusState =
  | {
      tone: "error" | "success" | "info";
      message: string;
    }
  | null;

const steps = [
  {
    label: "Path",
    detail: "Role selection is complete.",
    status: "complete" as const,
    href: "/register",
  },
  {
    label: "Profile",
    detail: "Identity details are already stored.",
    status: "complete" as const,
    href: "/register/profile",
  },
  {
    label: "Security",
    detail: "Credentials are set and the code has been requested.",
    status: "complete" as const,
    href: "/register/security",
  },
  {
    label: "Verification",
    detail: "Confirm the OTP to activate the account.",
    status: "current" as const,
  },
];

export default function RegisterVerifyPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [emailOTP, setEmailOTP] = useState("");
  const [smsOTP, setSmsOTP] = useState("");
  const [draft, setDraft] = useState({
    role: "",
    email: "",
    username: "",
    country: "",
    location: "",
    timezone: "",
    verificationMethod: "EMAIL" as "EMAIL" | "PHONE",
    registrationChallengeId: "",
    phoneCountryCode: "+251",
    phoneNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    password: "",
  });

  useEffect(() => {
    if (isAuthenticated()) {
      const token = localStorage.getItem("auth_token");
      router.replace(resolveWorkspaceRouteFromToken(token));
      return;
    }

    const storedDraft = readRegisterDraft();
    if (!hasRegisterSecurity(storedDraft)) {
      router.replace("/register/security");
      return;
    }

    setDraft({
      role: storedDraft.role,
      email: storedDraft.email,
      username: storedDraft.username,
      country: storedDraft.country,
      location: storedDraft.location,
      timezone: storedDraft.timezone,
      verificationMethod: storedDraft.verificationMethod || "EMAIL",
      registrationChallengeId: storedDraft.registrationChallengeId,
      phoneCountryCode: storedDraft.phoneCountryCode || "+251",
      phoneNumber: storedDraft.phoneNumber,
      firstName: storedDraft.firstName,
      middleName: storedDraft.middleName,
      lastName: storedDraft.lastName,
      password: storedDraft.password,
    });
    setReady(true);
  }, [router]);

  const uniqueId = useMemo(() => createUniqueId(draft.username), [draft.username]);
  const requiresSmsVerification = useMemo(() => draft.verificationMethod === "PHONE", [draft.verificationMethod]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (requiresSmsVerification && smsOTP.length !== 6) {
      setStatus({ tone: "error", message: "Enter the 6-digit code from SMS." });
      return;
    }

    if (!requiresSmsVerification && emailOTP.length !== 6) {
      setStatus({ tone: "error", message: "Enter the 6-digit code from your email." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      if (!draft.registrationChallengeId.trim()) {
        setStatus({ tone: "error", message: "Verification challenge is missing. Request a fresh code and try again." });
        setLoading(false);
        return;
      }

      if (requiresSmsVerification) {
        const verifySmsResponse = await fetch("/api/auth/otp/verify-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId: draft.registrationChallengeId,
            phoneNumber: draft.phoneNumber,
            otpCode: smsOTP,
          }),
        });

        const verifySmsData = await verifySmsResponse.json().catch(() => null);
        if (!verifySmsResponse.ok) {
          setStatus({ tone: "error", message: verifySmsData?.message ?? "Invalid SMS verification code." });
          setLoading(false);
          return;
        }
      } else {
        const verifyResponse = await fetch("/api/auth/otp/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId: draft.registrationChallengeId,
            email: draft.email,
            otpCode: emailOTP,
          }),
        });

        const verifyData = await verifyResponse.json().catch(() => null);
        if (!verifyResponse.ok) {
          setStatus({ tone: "error", message: verifyData?.message ?? "Invalid verification code." });
          setLoading(false);
          return;
        }
      }

      const registerResponse = await fetch("/api/auth/otp/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: draft.email,
          username: uniqueId,
          password: draft.password,
          role: draft.role,
          firstName: draft.firstName,
          middleName: draft.middleName,
          lastName: draft.lastName,
          country: draft.country,
          location: draft.location,
          timezone: draft.timezone,
          verificationMethod: draft.verificationMethod,
          challengeId: draft.registrationChallengeId,
          phoneCountryCode: draft.phoneCountryCode,
          phoneNumber: draft.phoneNumber,
        }),
      });

      const registerData = await registerResponse.json().catch(() => null);
      if (!registerResponse.ok) {
        setStatus({
          tone: "error",
          message: registerData?.message ?? registerData?.error ?? "Registration failed.",
        });
        setLoading(false);
        return;
      }

      if (!registerData?.token) {
        setStatus({ tone: "error", message: "Registration succeeded, but no token was returned." });
        setLoading(false);
        return;
      }

      localStorage.setItem("auth_token", registerData.token);
      markProfileCompletionPrompt("register");
      clearRegisterDraft();
      clearLoginDraft();
      setStatus({ tone: "success", message: "Account created. Opening your workspace..." });
      window.setTimeout(() => {
        startTransition(() => router.push(resolveWorkspaceRouteFromToken(registerData.token)));
      }, 350);
    } catch {
      setStatus({ tone: "error", message: "Network error while verifying your code." });
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!ready) {
      return;
    }

    setLoading(true);
    setStatus({ tone: "info", message: "Requesting a fresh verification code..." });

    try {
      const response = await fetch("/api/auth/otp/request-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: draft.registrationChallengeId,
          email: draft.email,
          phoneNumber: draft.phoneNumber,
          phoneCountryCode: draft.phoneCountryCode,
          country: draft.country,
          location: draft.location,
          timezone: draft.timezone,
          firstName: draft.firstName,
          middleName: draft.middleName,
          lastName: draft.lastName,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus({ tone: "error", message: data?.message ?? "Failed to resend the code." });
        setLoading(false);
        return;
      }

      const challengeId = data?.data?.challengeId;
      if (challengeId && typeof challengeId === "string") {
        const currentDraft = readRegisterDraft();
        saveRegisterDraft({ ...currentDraft, registrationChallengeId: challengeId });
        setDraft((current) => ({ ...current, registrationChallengeId: challengeId }));
      }

      setStatus({ tone: "success", message: "A fresh verification code has been sent." });
    } catch {
      setStatus({ tone: "error", message: "Network error while resending the code." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFlowShell
      stageLabel="Sign up"
      title="Verify your account"
      description="Enter the code to finish setup."
      steps={steps}
      hero={
        <div className="space-y-5">
          <div className={authFlowStyles.summaryCard}>
            <div className={authFlowStyles.summaryGrid}>
              <div>
                <div className={authFlowStyles.summaryLabel}>Email</div>
                <div className={authFlowStyles.summaryValue}>{ready ? draft.email : "Loading..."}</div>
              </div>
              <div>
                <div className={authFlowStyles.summaryLabel}>Unique ID</div>
                <div className={authFlowStyles.summaryValue}>{ready ? `@${uniqueId}` : "Loading..."}</div>
              </div>
              <div>
                <div className={authFlowStyles.summaryLabel}>Role</div>
                <div className={authFlowStyles.summaryValue}>{ready ? draft.role : "Loading..."}</div>
              </div>
              <div>
                <div className={authFlowStyles.summaryLabel}>Phone</div>
                <div className={authFlowStyles.summaryValue}>{ready ? (draft.phoneNumber || "Optional") : "Loading..."}</div>
              </div>
              <div>
                <div className={authFlowStyles.summaryLabel}>Location</div>
                <div className={authFlowStyles.summaryValue}>{ready ? (draft.location || "Not set") : "Loading..."}</div>
              </div>
              <div>
                <div className={authFlowStyles.summaryLabel}>Verification method</div>
                <div className={authFlowStyles.summaryValue}>{ready ? (requiresSmsVerification ? "Phone OTP" : "Email OTP") : "Loading..."}</div>
              </div>
            </div>
          </div>

          <div className={authFlowStyles.featureCard}>
            <div className={authFlowStyles.featureIcon}>
              <MailCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-950">Check your {requiresSmsVerification ? "phone" : "email"}</div>
              <div className="mt-1 text-sm leading-7 text-slate-500">
                Use the code we just sent.
              </div>
            </div>
          </div>

          <div className={authFlowStyles.featureCard}>
            <div className={authFlowStyles.featureIcon}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-950">Security before activation</div>
              <div className="mt-1 text-sm leading-7 text-slate-500">
                Your profile and password are already set.
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Step 4 of 4
          </div>
          <h2 className={clsx(authFlowStyles.displayHeading, "mt-5 text-3xl font-bold tracking-[-0.04em] text-slate-950 md:text-4xl")}>
            Verify and activate your account
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            Enter the verification code from your selected channel to complete registration.
          </p>
        </div>

        {!ready ? (
          <div className="mt-8">
            <AuthStatusBanner tone="info" message="Loading your verification step..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            {!requiresSmsVerification ? (
              <AuthTextField
                label="6-digit email OTP"
                inputMode="numeric"
                value={emailOTP}
                onChange={(event) => {
                  setEmailOTP(event.target.value.replace(/\D/g, "").slice(0, 6));
                  if (status?.tone === "error") {
                    setStatus(null);
                  }
                }}
                autoFocus
                placeholder="123456"
                hint={`Code sent to ${draft.email}`}
              />
            ) : null}

            {requiresSmsVerification ? (
              <AuthTextField
                label="6-digit SMS OTP"
                inputMode="numeric"
                value={smsOTP}
                onChange={(event) => {
                  setSmsOTP(event.target.value.replace(/\D/g, "").slice(0, 6));
                  if (status?.tone === "error") {
                    setStatus(null);
                  }
                }}
                placeholder="123456"
                hint={`Code sent to ${draft.phoneNumber}`}
                autoFocus
              />
            ) : null}

            {status ? <AuthStatusBanner tone={status.tone} message={status.message} /> : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className={clsx(authFlowStyles.buttonBase, authFlowStyles.secondaryButton)}
                onClick={() => startTransition(() => router.push("/register/security"))}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="submit"
                className={clsx(authFlowStyles.buttonBase, authFlowStyles.primaryButton)}
                disabled={loading || (requiresSmsVerification ? smsOTP.length !== 6 : emailOTP.length !== 6)}
              >
                {loading ? "Verifying..." : "Verify and create account"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              className={clsx(authFlowStyles.buttonBase, authFlowStyles.ghostButton, "self-start")}
              onClick={resendCode}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Resend code
            </button>
          </form>
        )}
      </div>
    </AuthFlowShell>
  );
}
