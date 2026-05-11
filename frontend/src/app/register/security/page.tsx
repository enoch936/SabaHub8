"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import {
  AuthFlowShell,
  AuthStatusBanner,
  AuthTextField,
  authFlowStyles,
} from "@/components/auth/AuthFlowShell";
import { isAuthenticated, resolveWorkspaceRouteFromToken } from "@/lib/auth";
import {
  createUniqueId,
  hasRegisterProfile,
  readRegisterDraft,
  saveRegisterDraft,
} from "@/lib/auth-flow";

type StatusState =
  | {
      tone: "error" | "success";
      message: string;
    }
  | null;

const steps = [
  {
    label: "Path",
    detail: "The workspace type is locked in for this journey.",
    status: "complete" as const,
    href: "/register",
  },
  {
    label: "Profile",
    detail: "Identity details are already saved.",
    status: "complete" as const,
    href: "/register/profile",
  },
  {
    label: "Security",
    detail: "Create credentials and trigger OTP delivery.",
    status: "current" as const,
  },
  {
    label: "Verification",
    detail: "Use the code we send to activate the account.",
    status: "upcoming" as const,
  },
];

const securityHighlights = [
  {
    title: "Focused password setup",
    detail: "Create your password in one step.",
    icon: LockKeyhole,
  },
  {
    title: "Send the code at the right time",
    detail: "Request verification after profile and password are ready.",
    icon: Sparkles,
  },
  {
    title: "Clear final flow",
    detail: "Security and verification stay separate.",
    icon: ShieldCheck,
  },
];

export default function RegisterSecurityPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [summary, setSummary] = useState({
    role: "",
    email: "",
    username: "",
    country: "",
    location: "",
    timezone: "",
    verificationMethod: "EMAIL" as "EMAIL" | "PHONE",
    phoneCountryCode: "+251",
    phoneNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      const token = localStorage.getItem("auth_token");
      router.replace(resolveWorkspaceRouteFromToken(token));
      return;
    }

    const draft = readRegisterDraft();
    if (!hasRegisterProfile(draft)) {
      router.replace("/register/profile");
      return;
    }

    setSummary({
      role: draft.role,
      email: draft.email,
      username: draft.username,
      country: draft.country,
      location: draft.location,
      timezone: draft.timezone,
      verificationMethod: draft.verificationMethod || "EMAIL",
      phoneCountryCode: draft.phoneCountryCode || "+251",
      phoneNumber: draft.phoneNumber,
      firstName: draft.firstName,
      middleName: draft.middleName,
      lastName: draft.lastName,
    });
    setPassword(draft.password);
    setConfirmPassword(draft.confirmPassword);
    setReady(true);
  }, [router]);

  const uniqueId = useMemo(() => createUniqueId(summary.username), [summary.username]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setStatus({ tone: "error", message: "Password must be at least 8 characters." });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ tone: "error", message: "Passwords do not match." });
      return;
    }

    const draft = readRegisterDraft();
    saveRegisterDraft({ ...draft, password, confirmPassword });

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/otp/request-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: summary.email,
          phoneNumber: summary.phoneNumber,
          phoneCountryCode: summary.phoneCountryCode,
          country: summary.country,
          location: summary.location,
          timezone: summary.timezone,
          verificationMethod: summary.verificationMethod,
          firstName: summary.firstName,
          middleName: summary.middleName,
          lastName: summary.lastName,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus({ tone: "error", message: data?.message ?? "Failed to send OTP." });
        setLoading(false);
        return;
      }

      const challengeId = data?.data?.challengeId;
      if (!challengeId || typeof challengeId !== "string") {
        setStatus({ tone: "error", message: "Verification request succeeded, but no challenge ID was returned." });
        setLoading(false);
        return;
      }

      saveRegisterDraft({ ...draft, password, confirmPassword, registrationChallengeId: challengeId });

      setStatus({ tone: "success", message: "Verification code sent. Continue to the OTP page." });
      window.setTimeout(() => {
        startTransition(() => router.push("/register/verify"));
      }, 350);
    } catch {
      setStatus({ tone: "error", message: "Network error while requesting verification." });
      setLoading(false);
    }
  };

  return (
    <AuthFlowShell
      stageLabel="Sign up"
      title="Set your password"
      description="Create credentials and request the verification code."
      steps={steps}
      hero={
        <div className="space-y-5">
          <div className={authFlowStyles.summaryCard}>
            <div className={authFlowStyles.summaryGrid}>
              <div>
                <div className={authFlowStyles.summaryLabel}>Role</div>
                <div className={authFlowStyles.summaryValue}>{ready ? summary.role : "Loading..."}</div>
              </div>
              <div>
                <div className={authFlowStyles.summaryLabel}>Unique ID</div>
                <div className={authFlowStyles.summaryValue}>{ready ? `@${uniqueId}` : "Loading..."}</div>
              </div>
              <div>
                <div className={authFlowStyles.summaryLabel}>Email</div>
                <div className={authFlowStyles.summaryValue}>{ready ? summary.email : "Loading..."}</div>
              </div>
              <div>
                <div className={authFlowStyles.summaryLabel}>Phone</div>
                <div className={authFlowStyles.summaryValue}>{ready ? (summary.phoneNumber || "Optional") : "Loading..."}</div>
              </div>
              <div>
                <div className={authFlowStyles.summaryLabel}>Location</div>
                <div className={authFlowStyles.summaryValue}>{ready ? (summary.location || "Not set") : "Loading..."}</div>
              </div>
              <div>
                <div className={authFlowStyles.summaryLabel}>Verification method</div>
                <div className={authFlowStyles.summaryValue}>{ready ? (summary.verificationMethod === "PHONE" ? "Phone OTP" : "Email OTP") : "Loading..."}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {securityHighlights.map((item) => (
              <div key={item.title} className={authFlowStyles.featureCard}>
                <div className={authFlowStyles.featureIcon}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-950">{item.title}</div>
                  <div className="mt-1 text-sm leading-7 text-slate-500">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Step 3 of 4
          </div>
          <h2 className={clsx(authFlowStyles.displayHeading, "mt-5 text-3xl font-bold tracking-[-0.04em] text-slate-950 md:text-4xl")}>
            Set your account security
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            Once your password is ready, we&apos;ll send the code and move you to verification.
          </p>
        </div>

        {!ready ? (
          <div className="mt-8">
            <AuthStatusBanner tone="info" message="Loading your security step..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <AuthTextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (status?.tone === "error") {
                  setStatus(null);
                }
              }}
              autoComplete="new-password"
              autoFocus
              hint="Use at least 8 characters."
              suffix={
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-1 text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <AuthTextField
              label="Confirm password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (status?.tone === "error") {
                  setStatus(null);
                }
              }}
              autoComplete="new-password"
              suffix={
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-1 text-slate-500 transition-colors hover:text-slate-900"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {status ? <AuthStatusBanner tone={status.tone} message={status.message} /> : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className={clsx(authFlowStyles.buttonBase, authFlowStyles.secondaryButton)}
                onClick={() => startTransition(() => router.push("/register/profile"))}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="submit"
                className={clsx(authFlowStyles.buttonBase, authFlowStyles.primaryButton)}
                disabled={loading}
              >
                {loading ? "Sending code..." : "Send OTP and continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthFlowShell>
  );
}
