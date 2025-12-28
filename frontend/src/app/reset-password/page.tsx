"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("Password updated. You can now login.");
    } catch {
      setStatus("Failed to reset password.");
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Reset password</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input type="password" className="w-full rounded border p-2" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Reset</button>
      </form>
      {status && <p className="mt-3 text-slate-700">{status}</p>}
    </main>
  );
}
