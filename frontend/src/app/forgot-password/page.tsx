"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

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

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/otp/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phoneNumber, firstName: "User" }),
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      setStatus("OTP sent to your email and phone.");
      setStep("otp-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request reset");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmailOTP(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/otp/verify-email-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode: emailOTP }),
      });
      if (!res.ok) throw new Error("Invalid email OTP");
      setStatus("Email verified. Now verify SMS.");
      setStep("otp-sms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifySMSOTP(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/otp/verify-sms-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otpCode: smsOTP }),
      });
      if (!res.ok) throw new Error("Invalid SMS OTP");
      setStatus("SMS verified. Set your new password.");
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "SMS verification failed");
    } finally {
      setLoading(false);
    }
  }

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
      const res = await fetch(`/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      setStatus("Password reset successful. Redirecting to login...");
      setStep("success");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", py: 8, background: "#ffffff" }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={800}>Reset Password</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Verify your code, then choose a new password.
            </Typography>

            {step === "email" ? (
              <Stack spacing={2} component="form" onSubmit={requestReset}>
                <TextField type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
                <TextField type="tel" label="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required fullWidth />
                <Button type="submit" variant="contained" disabled={loading}>{loading ? "Sending..." : "Send Verification Codes"}</Button>
              </Stack>
            ) : null}

            {step === "otp-email" ? (
              <Stack spacing={2} component="form" onSubmit={verifyEmailOTP}>
                <TextField label="Email OTP" value={emailOTP} onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, "").slice(0, 6))} required fullWidth />
                <Button type="submit" variant="contained" disabled={loading || emailOTP.length !== 6}>{loading ? "Verifying..." : "Verify Email OTP"}</Button>
              </Stack>
            ) : null}

            {step === "otp-sms" ? (
              <Stack spacing={2} component="form" onSubmit={verifySMSOTP}>
                <TextField label="SMS OTP" value={smsOTP} onChange={(e) => setSmsOTP(e.target.value.replace(/\D/g, "").slice(0, 6))} required fullWidth />
                <Button type="submit" variant="contained" disabled={loading || smsOTP.length !== 6}>{loading ? "Verifying..." : "Verify SMS OTP"}</Button>
              </Stack>
            ) : null}

            {step === "reset" ? (
              <Stack spacing={2} component="form" onSubmit={resetPassword}>
                <TextField type="password" label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required fullWidth />
                <TextField type="password" label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required fullWidth />
                <Button type="submit" variant="contained" color="success" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</Button>
              </Stack>
            ) : null}

            {step === "success" ? <Alert severity="success">Password reset successful. Redirecting to login...</Alert> : null}
            {status ? <Alert severity="info" sx={{ mt: 2 }}>{status}</Alert> : null}
            {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}

            <Button href="/login" size="small" sx={{ mt: 2 }}>Back to Login</Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
