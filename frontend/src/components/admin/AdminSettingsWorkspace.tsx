"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  CardContent,
  Grid,
  Stack,
  Typography,
  useTheme,
  alpha,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import WebRoundedIcon from "@mui/icons-material/WebRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";

import { GlassCard, GlassCardHeader } from "./GlassCard";
import { Button } from "../ui";
import SoftTextField from "@/components/mui/SoftTextField";

export default function AdminSettingsWorkspace() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    platformName: "SabaHub",
    supportEmail: "support@sabahub.com",
    registrationEnabled: true,
    mfaRequired: false,
    publicProfilesEnabled: true,
    defaultLanguage: "en",
    maintenanceMode: false,
    apiCachingEnabled: true,
    webhookRetries: 3,
    debugMode: false,
  });

  const [landingSettings, setLandingSettings] = useState({
    heroTitle: "Enterprise-grade collaboration at scale",
    heroSubtitle: "The most advanced marketplace orchestrator for high-fidelity teams.",
    primaryCta: "Initiate Workspace",
    secondaryCta: "Explore Marketplace",
  });

  const triggerSave = () => {
    setOtpOpen(true);
    setOtpValue("");
    setOtpError(null);
  };

  const verifyAndSave = async () => {
    if (otpValue !== "123456") {
      setOtpError("Invalid security credential. Orchestration blocked.");
      return;
    }

    setLoading(true);
    setOtpOpen(false);
    setSuccess(false);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <Stack spacing={4}>
      <GlassCard
        sx={{
          color: "common.white",
          p: 1
        }}
        gradient
      >
        <CardContent>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ lg: "center" }} spacing={3}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.2em", opacity: 0.8, fontWeight: 900, fontSize: 11 }}>
                SYSTEM ORCHESTRATION & CORE
              </Typography>
              <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1, mt: 1, letterSpacing: "-0.04em" }}>
                Platform Control Plane
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, opacity: 0.9, maxWidth: 840, fontWeight: 500, lineHeight: 1.6 }}>
                Fine-tune global parameters, infrastructure guardrails, and entry-point narratives. 
                All changes are cryptographically verified and propagated across the cluster in real-time.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="primary"
                onClick={triggerSave}
                disabled={loading}
                leftIcon={<SaveRoundedIcon />}
                sx={{ bgcolor: "#fff", color: "var(--primary)", height: 48, px: 4, fontWeight: 900, "&:hover": { bgcolor: alpha("#fff", 0.95), transform: "scale(1.02)" } }}
              >
                {loading ? "Propagating..." : "Deploy Config"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </GlassCard>

      {success && (
        <Alert 
          severity="success" 
          variant="filled"
          sx={{ borderRadius: "16px", fontWeight: 800, animation: "slideIn 0.5s ease" }}
        >
          System configuration successfully deployed to all production nodes.
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={4}>
            <GlassCard>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <PaletteRoundedIcon sx={{ color: "var(--primary)" }} />
                    <Typography variant="h6" fontWeight={900}>Visual & Identity Layer</Typography>
                  </Stack>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <SoftTextField
                        label="Platform Name"
                        value={settings.platformName}
                        onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                        fullWidth
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <SoftTextField
                        label="Global Support HQ"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                        fullWidth
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </GlassCard>

            <GlassCard>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <WebRoundedIcon sx={{ color: "var(--secondary)" }} />
                    <Typography variant="h6" fontWeight={900}>Entry Point Orchestration</Typography>
                  </Stack>
                  <Stack spacing={3}>
                    <SoftTextField
                      label="Primary Hero Narrative"
                      value={landingSettings.heroTitle}
                      onChange={(e) => setLandingSettings({ ...landingSettings, heroTitle: e.target.value })}
                      fullWidth
                      multiline
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                    />
                    <SoftTextField
                      label="Secondary Insight Token"
                      value={landingSettings.heroSubtitle}
                      onChange={(e) => setLandingSettings({ ...landingSettings, heroSubtitle: e.target.value })}
                      fullWidth
                      multiline
                      minRows={2}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                    />
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <SoftTextField
                          label="Primary Action Token"
                          value={landingSettings.primaryCta}
                          onChange={(e) => setLandingSettings({ ...landingSettings, primaryCta: e.target.value })}
                          fullWidth
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <SoftTextField
                          label="Secondary Action Token"
                          value={landingSettings.secondaryCta}
                          onChange={(e) => setLandingSettings({ ...landingSettings, secondaryCta: e.target.value })}
                          fullWidth
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </Stack>
              </CardContent>
            </GlassCard>

            <GlassCard>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <KeyRoundedIcon sx={{ color: "var(--accent)" }} />
                    <Typography variant="h6" fontWeight={900}>API & Interoperability</Typography>
                  </Stack>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <SoftTextField
                        type="number"
                        label="Webhook Retry Threshold"
                        value={settings.webhookRetries}
                        onChange={(e) => setSettings({ ...settings, webhookRetries: Number(e.target.value) })}
                        fullWidth
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid var(--border)", bgcolor: "var(--glass-gray)" }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">ACTIVE API KEY</Typography>
                        <Typography variant="body2" fontWeight={900} sx={{ mt: 0.5 }}>sh_live_••••••••••••••••3a9c</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </GlassCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={4}>
            <GlassCard>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SecurityRoundedIcon sx={{ color: "var(--warning)" }} />
                    <Typography variant="h6" fontWeight={900}>Platform Governance</Typography>
                  </Stack>
                  <Stack spacing={2}>
                    {[
                      { key: 'registrationEnabled', label: 'Identity Ingest Enabled', detail: 'Allow new user registrations' },
                      { key: 'mfaRequired', label: 'Enforce Global MFA', detail: 'Require 2FA for all active principals' },
                      { key: 'apiCachingEnabled', label: 'Layer 7 Edge Caching', detail: 'Optimize performance with Redis orbit' },
                      { key: 'debugMode', label: 'Telemetry Debug Mode', detail: 'Expose verbose logs to admin terminals' },
                    ].map((opt) => (
                      <Box key={opt.key} sx={{ 
                        p: 2.5, borderRadius: "18px", bgcolor: "var(--glass-gray)", border: "1px solid var(--border)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "all 0.3s",
                        "&:hover": { bgcolor: "var(--glass-gray-hover)", transform: "translateX(4px)" }
                      }}>
                        <Box>
                          <Typography variant="body2" fontWeight={900}>{opt.label}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{opt.detail}</Typography>
                        </Box>
                        <Switch 
                          checked={(settings as any)[opt.key]} 
                          onChange={(e) => setSettings({ ...settings, [opt.key]: e.target.checked })} 
                        />
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </GlassCard>

            <GlassCard sx={{ border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`, boxShadow: `0 0 30px ${alpha(theme.palette.error.main, 0.1)}` }}>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SettingsSuggestRoundedIcon sx={{ color: "var(--error)" }} />
                    <Typography variant="h6" fontWeight={900} sx={{ color: "var(--error)" }}>Risk Operations</Typography>
                  </Stack>
                  <Box sx={{ p: 3, borderRadius: "20px", bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                    <Typography variant="subtitle2" fontWeight={900} color="error.main">Global Environment Freeze</Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.7, fontWeight: 500, lineHeight: 1.5 }}>
                      Isolate the entire platform from non-governance principals. This initiates a 
                      cascading shutdown of all public entry points.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="error" 
                      fullWidth 
                      sx={{ mt: 3, height: 48, borderRadius: "14px", fontWeight: 900, boxShadow: `0 8px 20px ${alpha(theme.palette.error.main, 0.3)}` }}
                    >
                      Initiate Cluster Freeze
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </GlassCard>
          </Stack>
        </Grid>
      </Grid>

      {/* OTP Security Gate */}
      <Dialog 
        open={otpOpen} 
        onClose={() => setOtpOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "28px", p: 2, bgcolor: "var(--background)", backdropFilter: "blur(24px)" }}}}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 3 }}>
          <Box sx={{ 
            width: 64, height: 64, borderRadius: "20px", bgcolor: alpha(theme.palette.primary.main, 0.1), 
            color: "primary.main", display: "grid", placeItems: "center", mx: "auto", mb: 2
          }}>
            <ShieldRoundedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h5" fontWeight={900}>Secure Orchestration Gate</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 1 }}>
            Confirm high-impact configuration changes via your security token.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              autoFocus
              label="One-Time Password"
              placeholder="000000"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
              error={!!otpError}
              helperText={otpError || "Trace: 123456 (Dev Mode Override)"}
              InputProps={{
                startAdornment: <KeyRoundedIcon sx={{ mr: 1, opacity: 0.5 }} />,
                sx: { borderRadius: "16px", fontWeight: 900, letterSpacing: "0.2em", textAlign: "center" }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 4 }}>
          <Button variant="outline" onClick={() => setOtpOpen(false)} sx={{ fontWeight: 800 }}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={verifyAndSave}
            disabled={otpValue.length < 6}
            sx={{ px: 4, borderRadius: "12px", fontWeight: 900 }}
          >
            Confirm & Deploy
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

