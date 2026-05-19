"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from "@mui/material";

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
    <Box sx={{ minHeight: "100vh", py: 8, background: "transparent" }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={800}>Reset Password</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set a new password for your account.
            </Typography>

            <Stack spacing={2} component="form" onSubmit={onSubmit}>
              <TextField type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
              <TextField type="password" label="New password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
              <TextField type="password" label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required fullWidth />
              <Button type="submit" variant="contained" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</Button>
            </Stack>

            {status ? <Alert severity="success" sx={{ mt: 2 }}>{status}</Alert> : null}
            {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
