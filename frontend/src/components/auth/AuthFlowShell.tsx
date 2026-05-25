"use client";

import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { ThemeIconButton } from "@/components/mui/ThemeToggle";
import styles from "./AuthFlow.module.css";

export type AuthStep = {
  label: string;
  detail: string;
  status: "complete" | "current" | "upcoming";
  href?: string;
};

type AuthFlowShellProps = {
  stageLabel: string;
  title: string;
  description: string;
  steps: AuthStep[];
  hero: ReactNode;
  children: ReactNode;
};

type AuthTextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: ReactNode;
};

type AuthStatusBannerProps = {
  tone: "error" | "success" | "info";
  message: string;
};

const revealUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
});

export function AuthFlowShell({
  stageLabel,
  title,
  description,
  steps,
  hero,
  children,
}: AuthFlowShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.shapeOne} aria-hidden="true" />
      <div className={styles.shapeTwo} aria-hidden="true" />
      <div className={styles.orbOne} aria-hidden="true" />
      <div className={styles.orbTwo} aria-hidden="true" />

      <div className={styles.navShell}>
        <motion.nav
          className={clsx(styles.glassPanel, "rounded-[1.65rem] px-4 py-4 md:px-6")}
          initial={{ y: -90 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.42 }}
        >
          <div className="flex items-center justify-between gap-6">
            <BrandLogo size="sm" />
            <div className="flex items-center gap-3">
              <ThemeIconButton
                size="small"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  bgcolor: "var(--surface)",
                  color: "var(--foreground)",
                  "&:hover": { bgcolor: "var(--accent)" },
                }}
              />

              <div className="hidden items-center gap-6 md:flex">
                <Link
                  href="/"
                  className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  Home
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className={clsx(styles.buttonBase, styles.primaryButton, "px-4 py-3 text-sm")}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </motion.nav>
      </div>

      <main className="relative px-6 pb-16 pt-32 md:pt-36">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <motion.section className={clsx(styles.glassPanel, styles.sidePanel)} {...revealUp()}>
            <span className={styles.stageBadge}>{stageLabel}</span>
            <h1
              className={clsx(
                styles.displayHeading,
                "mt-5 text-4xl font-bold leading-[0.98] tracking-[-0.05em] text-slate-950 md:text-5xl",
              )}
            >
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">{description}</p>

            <div className={styles.stepRail}>
              {steps.map((step, index) => {
                const card = (
                  <div
                    className={clsx(
                      styles.stepCard,
                      step.status === "current" && styles.stepCurrent,
                      step.status === "complete" && styles.stepComplete,
                    )}
                  >
                    <span className={styles.stepDot}>
                      {step.status === "complete" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{step.label}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-500">{step.detail}</div>
                    </div>
                  </div>
                );

                if (step.href && step.status !== "upcoming") {
                  return (
                    <Link key={step.label} href={step.href} className={styles.stepLink}>
                      {card}
                    </Link>
                  );
                }

                return <div key={step.label}>{card}</div>;
              })}
            </div>

            <div className="mt-6">{hero}</div>
          </motion.section>

          <motion.section className={clsx(styles.glassPanel, styles.formPanel)} {...revealUp(0.1)}>
            {children}
          </motion.section>
        </div>
      </main>
    </div>
  );
}

export function AuthTextField({
  label,
  hint,
  error,
  prefix,
  suffix,
  className,
  ...props
}: AuthTextFieldProps) {
  return (
    <label className={styles.fieldset}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.inputWrap}>
        {prefix ? <span className={styles.inputPrefix}>{prefix}</span> : null}
        <input
          {...props}
          className={clsx(
            styles.input,
            prefix && styles.inputWithPrefix,
            suffix && styles.inputWithSuffix,
            error && styles.inputError,
            className,
          )}
        />
        {suffix ? <span className={styles.inputSuffix}>{suffix}</span> : null}
      </span>
      {error ? <span className={styles.fieldError}>{error}</span> : hint ? <span className={styles.fieldHint}>{hint}</span> : null}
    </label>
  );
}

export function AuthStatusBanner({ tone, message }: AuthStatusBannerProps) {
  return (
    <div
      className={clsx(
        styles.statusBanner,
        tone === "error" && styles.statusError,
        tone === "success" && styles.statusSuccess,
        tone === "info" && styles.statusInfo,
      )}
    >
      {message}
    </div>
  );
}

export { styles as authFlowStyles };
