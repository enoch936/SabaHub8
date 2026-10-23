"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert, Box, Button, Card, CardContent, Container,
  IconButton, InputAdornment, Stack, TextField, Typography,
} from "@mui/material";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <Box sx={{ minHeight: "100vh", py: 8, bgcolor: "var(--background)" }}>
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 4,
            bgcolor: "var(--surface-solid)",
            border: "1px solid var(--border)",
            boxShadow: "var(--glass-shadow)",
            backdropFilter: "blur(24px)",
            color: "var(--foreground)",
          }}
        >
          <CardContent>
            <Typography variant="h4" fontWeight={800} sx={{ color: "var(--foreground)" }}>Reset Password</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "var(--foreground-muted)" }}>
              Set a new password for your account.
            </Typography>

            <Stack spacing={2} component="form" onSubmit={onSubmit}>
              <TextField type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
              <TextField
                type={showPassword ? "text" : "password"}
                label="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((c) => !c)} edge="end" size="small">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword((c) => !c)} edge="end" size="small">
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
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
