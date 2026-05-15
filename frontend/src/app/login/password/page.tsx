"use client";

import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, TimerReset } from "lucide-react";
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
  readLoginDraft,
  saveLoginDraft,
  saveLoginTwoFactorDraft,
} from "@/lib/auth-flow";
import { markProfileCompletionPrompt } from "@/lib/profile-completion";
import { normalizeTwoFactorMethod } from "@/lib/two-factor";

const steps = [
  {
    label: "Identity",
    detail: "Review your account.",
    status: "complete" as const,
    href: "/login",
  },
  {
    label: "Password",
    detail: "Enter your password.",
    status: "current" as const,
  },
];

const metrics = [
  { value: "1", label: "password step" },
  { value: "Fast", label: "open workspace" },
  { value: "Secure", label: "sign in" },
];

const securityNotes = [
  {
    title: "One focused step",
    detail: "Enter your password and continue.",
    icon: LockKeyhole,
  },
  {
    title: "Recovery nearby",
    detail: "Password reset is easy to reach.",
    icon: TimerReset,
  },
  {
    title: "Account check",
    detail: "Review the account before you sign in.",
    icon: ShieldCheck,
  },
];

type StatusState =
  | {
      tone: "error" | "success";
      message: string;
    }
  | null;

export default function LoginPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      const token = localStorage.getItem("auth_token");
      router.replace(resolveWorkspaceRouteFromToken(token));
      return;
    }

    const draft = readLoginDraft();
    if (!draft.identifier.trim()) {
      router.replace("/login");
      return;
    }

    setIdentifier(draft.identifier);
    setRemember(draft.remember);
    setReady(true);
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setStatus({ tone: "error", message: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);
    setStatus(null);
    saveLoginDraft({ identifier, remember });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus({ tone: "error", message: data?.error ?? data?.message ?? "Login failed." });
        setLoading(false);
        return;
      }

      if (data?.requiresTwoFactor && data?.challengeId) {
        saveLoginTwoFactorDraft({
          challengeId: String(data.challengeId),
          method: normalizeTwoFactorMethod(typeof data.twoFactorMethod === "string" ? data.twoFactorMethod : "EMAIL"),
          identifier,
        });
        setStatus({ tone: "success", message: "Password verified. Enter your 2-step code to continue." });
        setLoading(false);
        startTransition(() => router.push("/login/challenge"));
        return;
      }

      if (!data?.token) {
        setStatus({ tone: "error", message: "Login succeeded, but no token or challenge was returned." });
        setLoading(false);
        return;
      }

      localStorage.setItem("auth_token", data.token);
      markProfileCompletionPrompt("login");
      clearLoginDraft();
      clearLoginTwoFactorDraft();
      setStatus({ tone: "success", message: "Signed in successfully. Opening your workspace..." });
      window.setTimeout(() => {
        startTransition(() => router.push(resolveWorkspaceRouteFromToken(data.token)));
      }, 350);
    } catch {
      setStatus({ tone: "error", message: "Network error. Backend not reachable." });
      setLoading(false);
    }
  };

  const hero = (
    <div className="space-y-5">
      <div className={authFlowStyles.metricGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} className={authFlowStyles.metricCard}>
            <div className="text-2xl font-bold tracking-[-0.04em] text-slate-950">{metric.value}</div>
            <div className="mt-2 text-sm text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {securityNotes.map((item) => (
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

      <div className={authFlowStyles.summaryCard}>
        <div className={authFlowStyles.summaryLabel}>Signing in as</div>
        <div className={authFlowStyles.summaryValue}>{ready ? identifier : "Loading your access step..."}</div>
      </div>
    </div>
  );

  return (
    <AuthFlowShell
      stageLabel="Login"
      title="Enter your password"
      description="Enter your password to continue."
      steps={steps}
      hero={hero}
    >
      <div className="flex h-full flex-col">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Step 2 of 3
          </div>
          <h2 className={clsx(authFlowStyles.displayHeading, "mt-5 text-2xl font-bold tracking-[-0.04em] text-slate-950 md:text-3xl")}>
            Enter your password
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Your account is selected. Enter the password to continue.
          </p>
        </div>

        {!ready ? (
          <div className="mt-6">
            <AuthStatusBanner tone="info" message="Loading your sign-in details..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className={authFlowStyles.summaryCard}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={authFlowStyles.summaryLabel}>Account</div>
                  <div className={authFlowStyles.summaryValue}>{identifier}</div>
                </div>
                <Link href="/login" className={authFlowStyles.textLink}>
                  Edit
                </Link>
              </div>
            </div>

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
              autoComplete="current-password"
              placeholder="Enter your password"
              autoFocus
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

            <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => {
                  const nextRemember = event.target.checked;
                  setRemember(nextRemember);
                  saveLoginDraft({ identifier, remember: nextRemember });
                }}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
              />
              Remember me on this device
            </label>

            {status ? <AuthStatusBanner tone={status.tone} message={status.message} /> : null}

            <button
              type="submit"
              className={clsx(authFlowStyles.buttonBase, authFlowStyles.primaryButton)}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Open workspace"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className={clsx(authFlowStyles.buttonBase, authFlowStyles.secondaryButton)}
                onClick={() => {
                  saveLoginDraft({ identifier, remember });
                  startTransition(() => router.push("/login"));
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <Link href="/forgot-password" className={authFlowStyles.textLink}>
                Forgot password?
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthFlowShell>
  );
}
