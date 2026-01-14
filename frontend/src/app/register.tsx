"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "form" | "otp";
type Role = "FREELANCER" | "EMPLOYER";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<Role>("FREELANCER");
  const [emailOTP, setEmailOTP] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  async function requestOTP(e: FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (password.length < 8) {
      setStatus("Password must be at least 8 characters");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (password !== confirmPassword) {
      setStatus("Passwords do not match");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/otp/request-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phoneNumber,
          firstName,
          middleName,
          lastName,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus(data?.message || "Failed to send OTP");
        setLoading(false);
        return;
      }
      setStatus("OTP sent! Check your email or SMS.");
      setStep("otp");
    } catch {
      setStatus("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndRegister(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    
    try {
      // Step 1: Verify email OTP
      const verifyRes = await fetch(`/api/auth/otp/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode: emailOTP }),
      });
      
      if (!verifyRes.ok) {
        setStatus("Invalid OTP code");
        setLoading(false);
        return;
      }

      // Step 2: Complete registration with role
      const registerRes = await fetch(`/api/auth/otp/complete-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          firstName,
          middleName,
          lastName,
          phoneNumber,
        }),
      });
      
      const data = await registerRes.json().catch(() => null);
      
      if (!registerRes.ok) {
        setStatus(data?.message || data?.error || "Registration failed");
        setLoading(false);
        return;
      }
      
      if (data?.token) {
        localStorage.setItem("auth_token", data.token);
        router.push("/dashboard");
      } else {
        setStatus("Registration successful but no token returned");
      }
    } catch {
      setStatus("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate min-h-[calc(100dvh-80px)] overflow-hidden bg-slate-950 px-6 py-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
        <img src="/images/backgrounds/aurora-blur.svg" alt="Aurora" className="h-full w-full object-cover opacity-70" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <img src="/images/backgrounds/geo-light-grid.svg" alt="Grid" className="h-full w-full object-cover opacity-50" />
      </div>

      <div className="relative mx-auto flex max-w-5xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl border border-white/20 bg-white/85 shadow-[0_22px_70px_rgba(8,47,73,0.28)] backdrop-blur">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative hidden min-h-[580px] md:block">
              <img src="/images/banners/sabahub-collab-2.png" alt="Register" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-sky-600/40 to-indigo-800/60" />
              <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Private beta
                </div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight">Join SabaHub</h2>
                <p className="text-sm text-white/90">Create your account to hire talent or find your next project.</p>
              </div>
            </div>

            <div className={`p-6 md:p-8 ${step === "form" ? "animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}`}>
              <h1 className="mb-2 text-2xl font-bold tracking-tight">Create your account</h1>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">It only takes a minute. We will send a verification code to your email{phoneNumber ? " and phone" : ""}.</p>

              <form className={`space-y-4 ${shake ? "animate-shake" : ""}`} onSubmit={requestOTP}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-sky-100 transition focus:border-sky-400 focus:ring"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    aria-label="First name"
                  />
                  <input
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-sky-100 transition focus:border-sky-400 focus:ring"
                    placeholder="Middle name (optional)"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    aria-label="Middle name"
                  />
                  <input
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-sky-100 transition focus:border-sky-400 focus:ring"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    aria-label="Last name"
                  />
                </div>

                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-sky-100 transition focus:border-sky-400 focus:ring"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label="Email address"
                />

                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-sky-100 transition focus:border-sky-400 focus:ring"
                  placeholder="Phone number (optional)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  aria-label="Phone number"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="password"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-sky-100 transition focus:border-sky-400 focus:ring"
                    placeholder="Password (min 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    aria-label="Password"
                  />
                  <input
                    type="password"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-sky-100 transition focus:border-sky-400 focus:ring"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                    aria-label="Confirm password"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-800">I am a:</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition ${role === "FREELANCER" ? "border-sky-500 bg-sky-50" : "border-slate-300 hover:border-slate-400"}`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="role"
                          value="FREELANCER"
                          checked={role === "FREELANCER"}
                          onChange={(e) => setRole(e.target.value as Role)}
                          aria-label="Freelancer"
                        />
                        <span>Freelancer</span>
                      </div>
                      <span className="text-xs text-gray-500">Sell services</span>
                    </label>
                    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition ${role === "EMPLOYER" ? "border-sky-500 bg-sky-50" : "border-slate-300 hover:border-slate-400"}`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="role"
                          value="EMPLOYER"
                          checked={role === "EMPLOYER"}
                          onChange={(e) => setRole(e.target.value as Role)}
                          aria-label="Employer"
                        />
                        <span>Employer</span>
                      </div>
                      <span className="text-xs text-gray-500">Post jobs</span>
                    </label>
                  </div>
                </div>

                <button
                  className="w-full rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-sky-700 hover:shadow-md disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Sending code..." : "Continue"}
                </button>
                {status && <p className="text-center text-sm font-medium text-rose-600">{status}</p>}
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account? <a href="/login" className="font-medium text-sky-600 hover:underline">Sign in</a>
              </p>
            </div>

            <div className={`p-6 md:p-8 ${step === "otp" ? "animate-in fade-in slide-in-from-left-4 duration-300" : "hidden"}`}>
              <h1 className="mb-2 text-2xl font-bold tracking-tight">Verify your email</h1>
              <p className="mb-6 text-sm text-gray-600">
                Enter the 6-digit code sent to <span className="font-medium text-gray-700">{email}</span>{phoneNumber ? " (and SMS if provided)" : ""}.
              </p>

              <form className="space-y-4" onSubmit={verifyAndRegister}>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="h-12 w-full rounded-lg border border-slate-300 bg-white text-center text-xl tracking-widest text-slate-900 outline-none ring-sky-100 transition focus:border-sky-400 focus:ring"
                      value={emailOTP[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 1);
                        const next = (emailOTP.slice(0, i) + val + emailOTP.slice(i + 1)).slice(0, 6);
                        setEmailOTP(next);
                        const inputs = document.querySelectorAll<HTMLInputElement>("[data-otp]");
                        if (val && inputs[i + 1]) inputs[i + 1].focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !emailOTP[i] && i > 0) {
                          const inputs = document.querySelectorAll<HTMLInputElement>("[data-otp]");
                          inputs[i - 1]?.focus();
                        }
                      }}
                      data-otp
                      aria-label={`OTP digit ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  className="w-full rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-sky-700 hover:shadow-md disabled:opacity-50"
                  disabled={loading || emailOTP.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm text-gray-700 hover:underline"
                    onClick={() => setStep("form")}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="text-sm text-sky-600 hover:underline"
                    onClick={requestOTP}
                  >
                    Resend code
                  </button>
                </div>

                {status && <p className="text-center text-sm font-medium text-rose-600">{status}</p>}
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .animate-in { animation: in 300ms ease both; }
        @keyframes in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-shake { animation: shake 500ms ease; }
        @keyframes shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px);} 30%, 50%, 70% { transform: translateX(-4px);} 40%, 60% { transform: translateX(4px);} }
      `}</style>
    </main>
  );
}
