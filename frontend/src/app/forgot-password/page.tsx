"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "otp-email" | "otp-sms" | "reset" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailOTP, setEmailOTP] = useState("");
  const [smsOTP, setSmsOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  // Step 1: Request password reset OTP
  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/otp/request-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phoneNumber,
          firstName: "User",
        }),
      });

      if (!res.ok) throw new Error("Failed to send OTP");

      setStatus("OTP sent to your email and phone!");
      setStep("otp-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request reset");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify email OTP
  async function verifyEmailOTP(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/otp/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode: emailOTP }),
      });

      if (!res.ok) throw new Error("Invalid email OTP");

      setStatus("Email verified! Now verify SMS.");
      setStep("otp-sms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email verification failed");
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Verify SMS OTP
  async function verifySMSOTP(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/otp/verify-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode: smsOTP }),
      });

      if (!res.ok) throw new Error("Invalid SMS OTP");

      setStatus("SMS verified! Now reset your password.");
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "SMS verification failed");
    } finally {
      setLoading(false);
    }
  }

  // Step 4: Reset password
  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword }),
      });

      if (!res.ok) throw new Error("Failed to reset password");

      setStatus("Password reset successful! Redirecting to login...");
      setStep("success");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Reset Password</h1>

      {/* Step 1: Email and Phone */}
      {step === "email" && (
        <form className="space-y-4" onSubmit={requestReset}>
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
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              className="w-full rounded border border-gray-300 p-2"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Verification Codes"}
          </button>
        </form>
      )}

      {/* Step 2: Email OTP */}
      {step === "otp-email" && (
        <form className="space-y-4" onSubmit={verifyEmailOTP}>
          <p className="text-sm text-gray-600">
            Check your email for a 6-digit verification code
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">Email OTP Code</label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 p-2 text-center text-2xl tracking-widest"
              placeholder="000000"
              value={emailOTP}
              onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || emailOTP.length !== 6}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify Email OTP"}
          </button>
        </form>
      )}

      {/* Step 3: SMS OTP */}
      {step === "otp-sms" && (
        <form className="space-y-4" onSubmit={verifySMSOTP}>
          <p className="text-sm text-gray-600">
            Check your phone for a 6-digit verification code
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">SMS OTP Code</label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 p-2 text-center text-2xl tracking-widest"
              placeholder="000000"
              value={smsOTP}
              onChange={(e) => setSmsOTP(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || smsOTP.length !== 6}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify SMS OTP"}
          </button>
        </form>
      )}

      {/* Step 4: Reset Password */}
      {step === "reset" && (
        <form className="space-y-4" onSubmit={resetPassword}>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              className="w-full rounded border border-gray-300 p-2"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
      )}

      {/* Success Message */}
      {step === "success" && (
        <div className="rounded bg-green-50 p-4 text-center">
          <p className="text-green-700 font-semibold">✅ Password reset successful!</p>
          <p className="text-green-600 text-sm mt-2">Redirecting to login...</p>
        </div>
      )}

      {/* Status Messages */}
      {status && (
        <div className="mt-4 rounded bg-blue-50 p-3 text-blue-700 text-sm">
          {status}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Back to Login Link */}
      <div className="mt-6 text-center">
        <a href="/login" className="text-blue-600 hover:underline text-sm">
          Back to Login
        </a>
      </div>
    </main>
  );
}
