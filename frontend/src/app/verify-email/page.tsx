"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const [status, setStatus] = useState<string>("Verifying…");

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error("failed");
        setStatus("Email verified. You can now login.");
      } catch {
        setStatus("Invalid or expired verification link.");
      }
    }
    if (token) run();
  }, [token]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Verify email</h1>
      <p>{status}</p>
      <a href="/login" className="mt-4 inline-block rounded border border-slate-300 px-4 py-2">Go to login</a>
    </main>
  );
}
