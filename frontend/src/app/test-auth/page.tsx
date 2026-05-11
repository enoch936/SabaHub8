"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { bootstrapSession } from "@/lib/session";
import { api } from "@/lib/api";

export default function TestAuthPage() {
  const [token, setToken] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bootstrapSession();
    const storedToken = localStorage.getItem("auth_token");
    setToken(storedToken);
  }, []);

  const testSaveSettings = async () => {
    setLoading(true);
    setTestResult("Testing...");

    try {
      const response = await api.patch("/user/settings", {
        bio: `Test bio from test page - ${new Date().toISOString()}`,
      });
      setTestResult(`SUCCESS\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      const errorMsg = error?.response?.data || error?.message || "Unknown error";
      setTestResult(`FAILED\n${JSON.stringify(errorMsg, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 3, background: "linear-gradient(180deg, #f6f8fb 0%, #ffffff 45%)", minHeight: "100vh" }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={800}>Authentication & Settings Test</Typography>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Token Status</Typography>
              {token ? (
                <Stack spacing={1}>
                  <Alert severity="success">Token exists</Alert>
                  <Box component="pre" sx={{ m: 0, p: 1.5, fontSize: 12, bgcolor: "grey.100", borderRadius: 1, overflowX: "auto" }}>
                    {token.substring(0, 100)}...
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Token loaded from current session storage.
                  </Typography>
                </Stack>
              ) : (
                <Alert severity="error">No token found. Reload page.</Alert>
              )}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Test Settings Save</Typography>
              <Button variant="contained" onClick={testSaveSettings} disabled={loading || !token}>
                {loading ? "Testing..." : "Test PATCH /api/user/settings"}
              </Button>
              {testResult ? (
                <Box component="pre" sx={{ mt: 1.5, mb: 0, p: 1.5, fontSize: 12, bgcolor: "grey.100", borderRadius: 1, overflowX: "auto", whiteSpace: "pre-wrap" }}>
                  {testResult}
                </Box>
              ) : null}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Instructions</Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">1. Check that token exists above.</Typography>
                <Typography variant="body2">2. Click "Test PATCH /api/user/settings".</Typography>
                <Typography variant="body2">3. If you see SUCCESS, the system is working.</Typography>
                <Typography variant="body2">4. If you see FAILED, inspect browser console/network.</Typography>
                <Typography variant="body2">
                  5. Go to <Link href="/jobs/settings" underline="hover">/jobs/settings</Link> to test the real page.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
