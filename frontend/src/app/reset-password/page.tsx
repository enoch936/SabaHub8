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
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
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
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Reset Password</h1>
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
          className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      {status && <p className="mt-4 rounded bg-green-50 p-3 text-green-700 text-sm">{status}</p>}
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-red-700 text-sm">❌ {error}</p>}
    </main>
  );
}
