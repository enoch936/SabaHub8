"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("Reset email sent if account exists.");
    } catch {
      setStatus("Failed to submit.");
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Forgot password</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input className="w-full rounded border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Send reset email</button>
      </form>
      {status && <p className="mt-3 text-slate-700">{status}</p>}
    </main>
  );
}
