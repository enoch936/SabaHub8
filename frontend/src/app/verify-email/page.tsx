"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default function VerifyEmailPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Verifying...");
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

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
        setOk(true);
      } catch {
        setStatus("Invalid or expired verification link.");
        setOk(false);
      }
    }
    if (token) run();
    else {
      setStatus("Missing verification token.");
      setOk(false);
    }
  }, [token]);

  return (
    <Box sx={{ minHeight: "100vh", py: 8, bgcolor: "transparent" }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h4" fontWeight={800}>Verify Email</Typography>
              <Alert severity={ok === null ? "info" : ok ? "success" : "error"}>{status}</Alert>
              <Button component={Link} href="/login" variant="outlined">Go to login</Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
