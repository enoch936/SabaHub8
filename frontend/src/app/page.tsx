"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";

type AuthMode = "login" | "register";

type FormState = {
  fullName: string;
  email: string;
  password: string;
  remember: boolean;
  agree: boolean;
};

type Status = {
  type: "idle" | "success" | "error";
  message: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultFormState: FormState = {
  fullName: "",
  email: "",
  password: "",
  remember: false,
  agree: false,
};

function validate(mode: AuthMode, state: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (mode === "register" && !state.fullName.trim()) {
    errors.fullName = "Name is required";
  }

  if (!emailPattern.test(state.email.trim())) {
    errors.email = "Enter a valid email";
  }

  if (state.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (mode === "register" && !state.agree) {
    errors.agree = "You must accept the terms";
  }

  return errors;
}

function AuthCard({ mode }: { mode: AuthMode }) {
  const [form, setForm] = useState<FormState>(() => ({ ...defaultFormState }));
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [showPassword, setShowPassword] = useState(false);

  const heading = mode === "login" ? "Login — WorkHub" : "Register — WorkHub";
  const subheading =
    mode === "login"
      ? "Welcome back. Access your workspace securely."
      : "Create a new workspace account in seconds.";

  const ctaLabel = mode === "login" ? "Login" : "Register";

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setStatus({ type: "idle", message: "" });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(mode, form);

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setStatus({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setStatus({
      type: "success",
      message:
        mode === "login"
          ? "Login request ready to be sent. Replace with your API call."
          : "Registration request ready. Replace with your API call.",
    });
  };

  const infoNote = useMemo(() => {
    if (mode === "login") {
      return "Use a strong password and avoid sharing credentials.";
    }
    return "We respect your data. Keep credentials unique to this workspace.";
  }, [mode]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 px-8 py-10 shadow-[0_22px_70px_rgba(15,23,42,0.12)] backdrop-blur-sm">
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sky-100/60 blur-3xl" aria-hidden />
      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-100/60 blur-3xl" aria-hidden />

      <div className="relative mb-8 flex items-center gap-4">
        <div className="relative h-14 w-14 rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-100">
          <Image src="/auth-illustration.svg" alt="WorkHub" fill sizes="56px" className="object-contain" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">WorkHub</p>
          <h2 className="text-2xl font-semibold text-slate-900">{heading}</h2>
          <p className="text-sm text-slate-600">{subheading}</p>
        </div>
      </div>

      <form className="relative space-y-4" onSubmit={handleSubmit} noValidate>
        {mode === "register" && (
          <Field
            label="Full Name"
            name="fullName"
            value={form.fullName}
            onChange={(value) => handleChange("fullName", value)}
            error={errors.fullName}
            autoComplete="name"
          />
        )}

        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(value) => handleChange("email", value)}
          error={errors.email}
          autoComplete="email"
        />

        <Field
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(value) => handleChange("password", value)}
          error={errors.password}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={mode === "login" ? form.remember : form.agree}
              onChange={(event) =>
                mode === "login"
                  ? handleChange("remember", event.target.checked)
                  : handleChange("agree", event.target.checked)
              }
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-200"
            />
            <span>
              {mode === "login"
                ? "Remember me"
                : "I agree to Terms & Conditions"}
            </span>
          </label>

          {mode === "login" && (
            <a className="font-semibold text-sky-700 hover:text-sky-800" href="#">
              Forgot password?
            </a>
          )}
        </div>
        {errors.agree && (
          <p className="text-sm text-rose-600" role="alert">
            {errors.agree}
          </p>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          {ctaLabel}
        </button>

        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="h-px flex-1 bg-slate-200" aria-hidden />
            <span>Continue with</span>
            <span className="h-px flex-1 bg-slate-200" aria-hidden />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <SocialButton label="Google" />
            <SocialButton label="GitHub" />
            <SocialButton label="LinkedIn" />
          </div>
        </div>

        <p className="pt-3 text-sm text-slate-500">{infoNote}</p>

        {status.message && (
          <p
            className={`text-sm font-semibold ${
              status.type === "success" ? "text-emerald-600" : "text-rose-600"
            }`}
            role="status"
            aria-live="polite"
          >
            {status.message}
          </p>
        )}
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  suffix,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  suffix?: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-800">
      <span>{label}</span>
      <div
        className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition focus-within:ring-2 focus-within:ring-sky-200 ${
          error ? "border-rose-400" : "border-slate-200"
        }`}
      >
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          placeholder={label}
          required
        />
        {suffix}
      </div>
      {error && (
        <span className="text-sm text-rose-600" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

function SocialButton({ label }: { label: string }) {
  const iconLetter = label.slice(0, 1);
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-sky-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
        {iconLetter}
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-white px-4 py-12 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-10 top-16 h-48 w-48 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute right-10 bottom-16 h-48 w-48 rounded-full bg-indigo-100 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col gap-10">
        <header className="mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-700">WorkHub Access</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome</h1>
          <p className="mt-3 text-base text-slate-600">
            Choose an option to continue.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="/login"
            className="flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            Login
          </a>
          <a
            href="/register"
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-sm transition hover:border-sky-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
