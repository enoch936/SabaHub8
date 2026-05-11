"use client";

import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useEffect, useState } from "react";
import { ArrowRight, KeyRound, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import {
  AuthFlowShell,
  AuthTextField,
  authFlowStyles,
} from "@/components/auth/AuthFlowShell";
import { isAuthenticated, resolveWorkspaceRouteFromToken } from "@/lib/auth";
import { readLoginDraft, saveLoginDraft } from "@/lib/auth-flow";

const steps = [
  {
    label: "Identity",
    detail: "Enter your email or username.",
    status: "current" as const,
  },
  {
    label: "Password",
    detail: "Enter your password.",
    status: "upcoming" as const,
  },
];

const metrics = [
  { value: "2", label: "steps" },
  { value: "Fast", label: "sign in" },
  { value: "Role", label: "routing" },
];

const highlights = [
  {
    title: "Start with identity",
    detail: "Enter your email or username first.",
    icon: Sparkles,
  },
  {
    title: "Open the right workspace",
    detail: "Each role lands in the correct area after sign in.",
    icon: Workflow,
  },
  {
    title: "Keep security simple",
    detail: "Password stays on its own step.",
    icon: ShieldCheck,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      const token = localStorage.getItem("auth_token");
      router.replace(resolveWorkspaceRouteFromToken(token));
      return;
    }

    const draft = readLoginDraft();
    if (draft.identifier) {
      setIdentifier(draft.identifier);
    }
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (identifier.trim().length < 3) {
      setError("Enter the email or username you use to sign in.");
      return;
    }

    saveLoginDraft({ identifier: identifier.trim(), remember: readLoginDraft().remember });
    startTransition(() => router.push("/login/password"));
  };

  return (
    <AuthFlowShell
      stageLabel="Login"
      title="Sign in"
      description="Simple two-step sign in."
      steps={steps}
      hero={
        <div className="space-y-5">
          <div className={authFlowStyles.metricGrid}>
            {metrics.map((metric) => (
              <div key={metric.label} className={authFlowStyles.metricCard}>
                <div className="text-3xl font-bold tracking-[-0.04em] text-slate-950">{metric.value}</div>
                <div className="mt-2 text-sm text-slate-500">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {highlights.map((item) => (
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

          <div className={authFlowStyles.quoteCard}>
            <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Why it helps</div>
            <div className="mt-3 text-lg font-semibold leading-8 text-slate-950">
              Short steps are easier to scan.
            </div>
          </div>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Step 1 of 2
          </div>
          <h2 className={clsx(authFlowStyles.displayHeading, "mt-5 text-3xl font-bold tracking-[-0.04em] text-slate-950 md:text-4xl")}>
            Start with your account
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            Use your email or username.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <AuthTextField
            label="Email or username"
            type="text"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              if (error) {
                setError("");
              }
            }}
            placeholder="you@company.com or sabahub_handle"
            autoComplete="username"
            autoFocus
            error={error}
          />

          <button type="submit" className={clsx(authFlowStyles.buttonBase, authFlowStyles.primaryButton)}>
            Continue to password
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className={clsx(authFlowStyles.summaryCard, "mt-6")}>
          <div className="flex items-start gap-3">
            <div className={authFlowStyles.featureIcon}>
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-950">Next step</div>
              <div className="mt-1 text-sm leading-7 text-slate-500">
                Password is next.
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-sm leading-7 text-slate-500">
          New to SabaHub?{" "}
          <Link href="/register" className={authFlowStyles.textLink}>
            Create an account
          </Link>
        </p>
      </div>
    </AuthFlowShell>
  );
}
