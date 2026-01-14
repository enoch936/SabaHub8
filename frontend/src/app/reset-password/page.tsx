"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      setStatus("Password updated. Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
        <img src="/images/backgrounds/aurora-blur.svg" alt="Aurora" className="h-full w-full object-cover opacity-80" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <img src="/images/backgrounds/geo-light-grid.svg" alt="Grid" className="h-full w-full object-cover opacity-55" />
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Account recovery</p>
          <h1 className="mt-2 text-3xl font-bold">Reset Password</h1>
          <p className="mt-2 text-sm text-cyan-100/80">Set a strong password after confirming your email.</p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/85 p-6 shadow-[0_22px_70px_rgba(8,47,73,0.35)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500" aria-hidden />
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sky-300/30 blur-3xl" aria-hidden />
          <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-300/30 blur-3xl" aria-hidden />

          <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input
            type="email"
            className="w-full rounded border border-gray-300 p-2"
            placeholder="your@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            className="w-full rounded border border-gray-300 p-2"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            className="w-full rounded border border-gray-300 p-2"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      {status && <p className="mt-4 rounded bg-emerald-50 p-3 text-emerald-700 text-sm">{status}</p>}
      {error && <p className="mt-4 rounded bg-rose-50 p-3 text-rose-700 text-sm">❌ {error}</p>}
        </div>
      </div>
    </main>
  );
}
