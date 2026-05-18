"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  Card,
  CardContent,
} from "@mui/material";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import LockIcon from "@mui/icons-material/Lock";
import {
  adminBootstrapGetStatus,
  adminBootstrapInitialize,
  type AdminBootstrapStatus,
  type AdminBootstrapInitializeResponse,
} from "@/lib/api";
import SoftButton from "@/components/mui/SoftButton";

type SetupStep = "status-check" | "setup-form" | "success" | "already-initialized";

export function AdminBootstrapSetup() {
  const [step, setStep] = useState<SetupStep>("status-check");
  const [status, setStatus] = useState<AdminBootstrapStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Success state
  const [successResponse, setSuccessResponse] = useState<AdminBootstrapInitializeResponse | null>(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusResult = await adminBootstrapGetStatus();
      setStatus(statusResult);

      if (statusResult.initialized) {
        setStep("already-initialized");
      } else {
        setStep("setup-form");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check admin system status";
      setError(message);
      setStep("setup-form"); // Still show form, might be API issue
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const validateForm = useCallback((): string | null => {
    if (!email.trim()) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address";
    }
    if (!fullName.trim()) {
      return "Full name is required";
    }
    if (fullName.trim().length < 2) {
      return "Full name must be at least 2 characters";
    }
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  }, [email, fullName, password, confirmPassword]);

  const handleSubmit = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await adminBootstrapInitialize({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
      });

      setSuccessResponse(response);
      setStep("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize admin user";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, email, fullName, password]);

  if (loading && step === "status-check") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  // Already initialized
  if (step === "already-initialized") {
    return (
      <Card sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <CheckCircleOutlinedIcon sx={{ fontSize: 48, color: "success.main" }} />
            <div>
              <Typography variant="h5" component="div" fontWeight="600">
                System Already Initialized
              </Typography>
              <Typography color="textSecondary" variant="body2">
                Admin system is ready to use
              </Typography>
            </div>
          </Box>

          {status && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" mb={1}>
                System Status
              </Typography>
              <Typography variant="body1" mb={1}>
                <strong>Total Admins:</strong> {status.totalAdmins}
              </Typography>
              <Typography variant="body1" mb={2}>
                <strong>Status:</strong> {status.systemStatus}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {status.message}
              </Typography>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            To promote additional users to admin, use the User Management workspace or contact an existing admin.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (step === "success" && successResponse) {
    return (
      <Card sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <CheckCircleOutlinedIcon sx={{ fontSize: 48, color: "success.main" }} />
            <div>
              <Typography variant="h5" component="div" fontWeight="600">
                Admin Initialized Successfully!
              </Typography>
              <Typography color="textSecondary" variant="body2">
                Your admin account is ready
              </Typography>
            </div>
          </Box>

          <Paper sx={{ p: 2, mb: 2, bgcolor: "info.lighter" }}>
            <Typography variant="subtitle2" fontWeight="600" mb={1}>
              Admin Account Details
            </Typography>
            <Typography variant="body2" mb={1}>
              <strong>Email:</strong> {successResponse.email}
            </Typography>
            <Typography variant="body2" mb={1}>
              <strong>Name:</strong> {successResponse.fullName}
            </Typography>
            <Typography variant="body2">
              <strong>User ID:</strong> {successResponse.userId}
            </Typography>
          </Paper>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="600" mb={1}>
              Important Security Steps:
            </Typography>
            <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
              <li>
                <Typography variant="body2">MFA setup is required on your first login</Typography>
              </li>
              <li>
                <Typography variant="body2">Your password has been securely hashed</Typography>
              </li>
              <li>
                <Typography variant="body2">All actions are logged for audit purposes</Typography>
              </li>
            </ul>
          </Alert>

          <Alert severity="success" sx={{ mb: 3 }}>
            {successResponse.message}
          </Alert>

          <Typography variant="body2" color="textSecondary" mb={2}>
            You now have full platform administration access. Please log in with your credentials to proceed.
          </Typography>

          <SoftButton
            variant="contained"
            fullWidth
            onClick={() => {
              // Redirect to login or refresh page
              window.location.href = "/login";
            }}
          >
            Go to Login
          </SoftButton>
        </CardContent>
      </Card>
    );
  }

  // Setup form
  return (
    <Card sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <CardContent>
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <SecurityIcon sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h5" component="div" fontWeight="600">
              Initialize Admin Account
            </Typography>
          </Box>
          <Typography color="textSecondary" variant="body2">
            Set up your first administrator account for the system
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Stack spacing={2} mb={3}>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            fullWidth
            disabled={submitting}
            helperText="Your admin login email"
          />

          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Administrator"
            fullWidth
            disabled={submitting}
            helperText="Your full name for audit logs"
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            fullWidth
            disabled={submitting}
            helperText="Minimum 8 characters"
          />

          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            fullWidth
            disabled={submitting}
            error={password !== confirmPassword && confirmPassword.length > 0}
            helperText={
              password !== confirmPassword && confirmPassword.length > 0
                ? "Passwords do not match"
                : "Re-enter your password"
            }
          />
        </Stack>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="600" mb={1}>
            Security Notice:
          </Typography>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
            <li>
              <Typography variant="body2">Your password will be securely hashed</Typography>
            </li>
            <li>
              <Typography variant="body2">MFA will be required after initialization</Typography>
            </li>
            <li>
              <Typography variant="body2">All initialization events are audited</Typography>
            </li>
            <li>
              <Typography variant="body2">This is a one-time setup operation</Typography>
            </li>
          </ul>
        </Alert>

        <Stack direction="row" gap={2}>
          <SoftButton
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <LockIcon />}
          >
            {submitting ? "Initializing..." : "Initialize Admin Account"}
          </SoftButton>
        </Stack>
      </CardContent>
    </Card>
  );
}
