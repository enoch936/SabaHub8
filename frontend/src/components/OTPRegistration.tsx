"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type Step = "registration" | "otp-verification";

export default function OTPRegistration() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("registration");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [otpData, setOtpData] = useState({ emailOTP: "", smsOTP: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d{0,6}$/.test(value)) setOtpData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber) {
        setMessage({ type: "error", text: "Please fill all fields." });
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: "error", text: "Passwords do not match." });
        setLoading(false);
        return;
      }
      if (formData.password.length < 8) {
        setMessage({ type: "error", text: "Password must be at least 8 characters." });
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/otp/request-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: formData.firstName, email: formData.email, phoneNumber: formData.phoneNumber }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "OTP sent to your email and phone." });
        setCurrentStep("otp-verification");
      } else {
        setMessage({ type: "error", text: data.message || "Failed to send OTP." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!otpData.emailOTP) {
      setMessage({ type: "error", text: "Please enter email OTP." });
      return false;
    }
    const response = await fetch("/api/auth/otp/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, otpCode: otpData.emailOTP }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage({ type: "error", text: data.message || "Invalid email OTP." });
      return false;
    }
    return true;
  };

  const handleVerifySMSOTP = async () => {
    if (!otpData.smsOTP) {
      setMessage({ type: "error", text: "Please enter SMS OTP." });
      return false;
    }
    const response = await fetch("/api/auth/otp/verify-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, otpCode: otpData.smsOTP }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage({ type: "error", text: data.message || "Invalid SMS OTP." });
      return false;
    }
    return true;
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const emailVerified = await handleVerifyEmailOTP();
      if (!emailVerified) {
        setLoading(false);
        return;
      }
      const smsVerified = await handleVerifySMSOTP();
      if (!smsVerified) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/register-with-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, emailOTP: otpData.emailOTP, smsOTP: otpData.smsOTP }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Registration successful. Redirecting to login..." });
        setTimeout(() => router.push("/login"), 1200);
      } else {
        setMessage({ type: "error", text: data.message || "Registration failed." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred during registration." });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: formData.firstName, email: formData.email, phoneNumber: formData.phoneNumber }),
      });
      const data = await response.json();
      if (response.ok) setMessage({ type: "success", text: "OTP resent successfully." });
      else setMessage({ type: "error", text: data.message || "Failed to resend OTP." });
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", py: 8, background: "linear-gradient(145deg, #eff6ff 0%, #e0e7ff 100%)" }}>
      <Container maxWidth="sm">
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight={800}>SabaHub</Typography>
                <Typography variant="body2" color="text.secondary">Secure Registration</Typography>
              </Box>

              {message ? <Alert severity={message.type}>{message.text}</Alert> : null}

              {currentStep === "registration" ? (
                <Stack component="form" onSubmit={handleRequestOTP} spacing={1.5}>
                  <Grid container spacing={1.25}>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField name="firstName" label="First Name" value={formData.firstName} onChange={handleFormChange} required fullWidth /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField name="lastName" label="Last Name" value={formData.lastName} onChange={handleFormChange} required fullWidth /></Grid>
                  </Grid>
                  <TextField name="email" type="email" label="Email Address" value={formData.email} onChange={handleFormChange} required fullWidth />
                  <TextField name="phoneNumber" label="Phone Number" value={formData.phoneNumber} onChange={handleFormChange} required fullWidth />
                  <TextField name="password" type="password" label="Password" value={formData.password} onChange={handleFormChange} required fullWidth />
                  <TextField name="confirmPassword" type="password" label="Confirm Password" value={formData.confirmPassword} onChange={handleFormChange} required fullWidth />
                  <Button type="submit" variant="contained" disabled={loading}>{loading ? "Sending OTP..." : "Continue & Send OTP"}</Button>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <TextField
                    name="emailOTP"
                    label="Email OTP"
                    value={otpData.emailOTP}
                    onChange={handleOTPChange}
                    inputProps={{ maxLength: 6, inputMode: "numeric" }}
                    fullWidth
                  />
                  <TextField
                    name="smsOTP"
                    label="SMS OTP"
                    value={otpData.smsOTP}
                    onChange={handleOTPChange}
                    inputProps={{ maxLength: 6, inputMode: "numeric" }}
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    color="success"
                    disabled={loading || otpData.emailOTP.length !== 6 || otpData.smsOTP.length !== 6}
                    onClick={handleCompleteRegistration}
                  >
                    {loading ? "Verifying..." : "Complete Registration"}
                  </Button>
                  <Button variant="text" onClick={handleResendOTP} disabled={loading}>Resend OTP</Button>
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => {
                      setCurrentStep("registration");
                      setOtpData({ emailOTP: "", smsOTP: "" });
                    }}
                  >
                    Back to Registration
                  </Button>
                </Stack>
              )}

              <Typography variant="body2" color="text.secondary" textAlign="center">
                Already have an account? <a href="/login">Login here</a>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
