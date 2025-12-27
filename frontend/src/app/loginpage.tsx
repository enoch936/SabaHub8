"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";
import { isAuthenticated } from "@/lib/auth";

type FormState = {
  email: string;
  password: string;
  remember: boolean;
};

type Status = {
  type: "idle" | "success" | "error";
  message: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultFormState: FormState = {
  email: "",
  password: "",
  remember: false,
};

function validate(state: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (!emailPattern.test(state.email.trim())) {
    errors.email = "Enter a valid email";
  }

  if (state.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  return errors;
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

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => ({ ...defaultFormState }));
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setStatus({ type: "idle", message: "" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(form);

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setStatus({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    try {
      const response = await fetch(`/api/auth-proxy/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus({
          type: "error",
          message: data?.error ?? data?.message ?? "Login failed",
        });
        return;
      }

      // Expected backend response: { token, user: { email, fullName, roles } }
      if (data?.token) {
        localStorage.setItem("auth_token", data.token);
        setStatus({ type: "success", message: "Logged in successfully. Redirecting..." });
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
        return;
      }

      setStatus({ type: "error", message: "Login failed - no token received" });
    } catch {
      setStatus({ type: "error", message: "Network error. Backend not reachable." });
    }
  };

  const infoNote = useMemo(
    () => "Use a strong password and avoid sharing credentials.",
    [],
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-white px-4 py-12 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-10 top-16 h-48 w-48 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute right-10 bottom-16 h-48 w-48 rounded-full bg-indigo-100 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-700">WorkHub Access</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Login</h1>
          <p className="mt-3 text-base text-slate-600">Welcome back. Access your workspace securely.</p>
        </header>

        <section className="mx-auto w-full max-w-lg relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 px-8 py-10 shadow-[0_22px_70px_rgba(15,23,42,0.12)] backdrop-blur-sm">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sky-100/60 blur-3xl" aria-hidden />
          <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-100/60 blur-3xl" aria-hidden />

          <div className="relative mb-8 flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-100">
              <Image src="/auth-illustration.svg" alt="WorkHub" fill sizes="56px" className="object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">WorkHub</p>
              <h2 className="text-2xl font-semibold text-slate-900">Login — WorkHub</h2>
              <p className="text-sm text-slate-600">Enter your email and password to continue.</p>
            </div>
          </div>

          <form className="relative space-y-4" onSubmit={handleSubmit} noValidate>
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
              autoComplete="current-password"
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
                  checked={form.remember}
                  onChange={(event) => handleChange("remember", event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-200"
                />
                <span>Remember me</span>
              </label>

              <a className="font-semibold text-sky-700 hover:text-sky-800" href="#">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              Login
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

            <p className="pt-2 text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <a className="font-semibold text-sky-700 hover:text-sky-800" href="/register">
                Register
              </a>
            </p>

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
      </div>
    </div>
  );
}
