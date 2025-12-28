"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus(data?.error || "Registration failed");
        return;
      }
      if (data?.token) {
        localStorage.setItem("auth_token", data.token);
        router.push("/dashboard");
      } else {
        setStatus("No token returned");
      }
    } catch {
      setStatus("Network error");
    }
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-2xl font-bold">Register</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input className="w-full rounded border p-2" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="w-full rounded border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full rounded border p-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="rounded bg-sky-600 px-4 py-2 text-white">Create account</button>
        {status && <p className="text-rose-600">{status}</p>}
      </form>
    </main>
  );
}
