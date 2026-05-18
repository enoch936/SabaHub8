"use client";

import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Building2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import {
  AuthFlowShell,
  authFlowStyles,
} from "@/components/auth/AuthFlowShell";
import { isAuthenticated, resolveWorkspaceRouteFromToken } from "@/lib/auth";
import {
  type AuthRole,
  readRegisterDraft,
  saveRegisterDraft,
} from "@/lib/auth-flow";

const steps = [
  {
    label: "Path",
    detail: "Choose the kind of workspace you want to open.",
    status: "current" as const,
  },
  {
    label: "Profile",
    detail: "Add the team and identity details behind the account.",
    status: "upcoming" as const,
  },
  {
    label: "Security",
    detail: "Set credentials before we send verification.",
    status: "upcoming" as const,
  },
  {
    label: "Verification",
    detail: "Confirm the OTP and activate your workspace.",
    status: "upcoming" as const,
  },
];

const metrics = [
  { value: "4", label: "guided stages" },
  { value: "OTP", label: "activation flow" },
  { value: "Role", label: "tailored onboarding" },
];

const roleCards = [
  {
    role: "FREELANCER" as const,
    title: "Freelancer workspace",
    detail: "Build your profile, win work, and manage delivery from one command center.",
    bullets: ["Portfolio-first journey", "Contract and payout visibility", "Client-ready identity setup"],
    icon: UserRound,
  },
  {
    role: "EMPLOYER" as const,
    title: "Employer workspace",
    detail: "Create a hiring hub for sourcing talent, managing contracts, and approving milestones.",
    bullets: ["Hiring-focused setup", "Team and contractor visibility", "Operational payment controls"],
    icon: Building2,
  },
];

const highlights = [
  {
    title: "Choose a path first",
    detail: "Start with the workspace that fits you.",
    icon: Sparkles,
  },
  {
    title: "Role-led setup",
    detail: "Freelancers and employers start from the right flow.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Security included",
    detail: "Verification stays part of the setup.",
    icon: ShieldCheck,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<AuthRole>("FREELANCER");

  useEffect(() => {
    if (isAuthenticated()) {
      const token = localStorage.getItem("auth_token");
      router.replace(resolveWorkspaceRouteFromToken(token));
      return;
    }

    const draft = readRegisterDraft();
    if (draft.role === "EMPLOYER" || draft.role === "FREELANCER") {
      setRole(draft.role);
    }
  }, [router]);

  return (
    <AuthFlowShell
      stageLabel="Sign up"
      title="Choose your workspace"
      description="Pick the setup that fits you."
      steps={steps}
      hero={
        <div className="space-y-3">
          <div className={authFlowStyles.metricGrid}>
            {metrics.map((metric) => (
              <div key={metric.label} className={authFlowStyles.metricCard}>
                <div className="text-xl font-bold text-slate-950">{metric.value}</div>
                <div className="mt-0.5 text-[0.68rem] font-medium leading-4 text-slate-500">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className={authFlowStyles.featureCard}>
                <div className={authFlowStyles.featureIcon}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-950">{item.title}</div>
                  <div className="mt-0.5 text-[0.68rem] leading-4 text-slate-500">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={authFlowStyles.quoteCard}>
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">Why it helps</div>
            <div className="mt-1.5 text-sm font-semibold leading-5 text-slate-950">
              Pick the right path before adding details.
            </div>
          </div>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Step 1 of 4
          </div>
          <h2 className={clsx(authFlowStyles.displayHeading, "mt-5 text-2xl font-bold tracking-[-0.04em] text-slate-950 md:text-3xl")}>
            Choose your SabaHub path
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Pick the workspace you want to open first.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          {roleCards.map((item) => (
            <button
              key={item.role}
              type="button"
              className={clsx(
                authFlowStyles.choiceCard,
                role === item.role && authFlowStyles.choiceCardSelected,
              )}
              onClick={() => setRole(item.role)}
            >
              <div className="flex items-start gap-4">
                <div className={authFlowStyles.featureIcon}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-base font-semibold text-slate-950">{item.title}</div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {item.role.toLowerCase()}
                    </div>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.bullets.map((bullet) => (
                      <span
                        key={bullet}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {bullet}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className={clsx(authFlowStyles.buttonBase, authFlowStyles.primaryButton)}
            onClick={() => {
              const draft = readRegisterDraft();
              saveRegisterDraft({ ...draft, role });
              startTransition(() => router.push("/register/profile"));
            }}
          >
            Continue to profile
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="text-sm leading-7 text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className={authFlowStyles.textLink}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </AuthFlowShell>
  );
}
