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
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";

import { GlassCard, GlassCardHeader } from "./GlassCard";
import SoftButton from "@/components/mui/SoftButton";
import SoftTextField from "@/components/mui/SoftTextField";

export default function AdminSettingsWorkspace() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState({
    platformName: "SabaHub",
    supportEmail: "support@sabahub.com",
    registrationEnabled: true,
    mfaRequired: false,
    publicProfilesEnabled: true,
    defaultLanguage: "en",
    maintenanceMode: false,
  });

  const handleSave = () => {
    setLoading(true);
    setSuccess(false);
    // Mock save operation
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontSize: '12px', fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.15em', mb: 1 }}>
          System Configuration
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.04em' }}>
            Admin Settings
          </Typography>
          <SoftButton
            variant="contained"
            startIcon={<SaveRoundedIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </SoftButton>
        </Stack>
      </Box>

      {success && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Global settings updated successfully. Changes will propagate within 60 seconds.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard sx={{ height: '100%' }}>
            <GlassCardHeader 
              title="Platform Branding" 
              subtitle="Configure the visual identity and primary contact info" 
              icon={<PaletteRoundedIcon />}
            />
            <Box p={3}>
              <Stack spacing={2.5}>
                <SoftTextField
                  label="Platform Display Name"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  fullWidth
                />
                <SoftTextField
                  label="Support Contact Email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  fullWidth
                />
                <SoftTextField
                  label="Default Language"
                  value={settings.defaultLanguage}
                  onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                  fullWidth
                />
              </Stack>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard sx={{ height: '100%' }}>
            <GlassCardHeader 
              title="Access & Policy" 
              subtitle="Control registration and security requirements" 
              icon={<SecurityRoundedIcon />}
            />
            <Box p={3}>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.registrationEnabled} 
                      onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })} 
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800}>Allow New Registrations</Typography>
                      <Typography variant="caption" color="text.secondary">Toggle public sign-up flow on/off</Typography>
                    </Box>
                  }
                />
                <Divider />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.mfaRequired} 
                      onChange={(e) => setSettings({ ...settings, mfaRequired: e.target.checked })} 
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800}>Enforce MFA</Typography>
                      <Typography variant="caption" color="text.secondary">Require 2FA for all administrative accounts</Typography>
                    </Box>
                  }
                />
                <Divider />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.publicProfilesEnabled} 
                      onChange={(e) => setSettings({ ...settings, publicProfilesEnabled: e.target.checked })} 
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800}>Public Profiles</Typography>
                      <Typography variant="caption" color="text.secondary">Allow profiles to be indexed by search engines</Typography>
                    </Box>
                  }
                />
              </Stack>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <GlassCard sx={{ border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
            <GlassCardHeader 
              title="Danger Zone" 
              subtitle="High-impact system operations" 
              icon={<SettingsSuggestRoundedIcon color="error" />}
            />
            <Box p={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight={900} color="error.main">Maintenance Mode</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Take the platform offline for all non-admin users. This will show a maintenance page on all routes.
                  </Typography>
                </Box>
                <SoftButton variant="outlined" color="error" sx={{ fontWeight: 800 }}>
                  Enable Maintenance Mode
                </SoftButton>
              </Stack>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
