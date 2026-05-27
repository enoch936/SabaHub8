/**
 * Modern Premium Admin Navbar Component
 * Strictly follows enterprise styling: 18px blur, specific palette
 */

"use client";

import { useState } from "react";
import {
  AppBar,
  Box,
  Stack,
  TextField,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Avatar,
  Tooltip,
  useTheme,
  alpha,
  Popover,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { HealthIndicator } from "./SystemStatus";
import { NotificationCenter } from "../NotificationCenter";
import { useNotifications } from "@/lib/notifications";

interface NavbarProps {
  onThemeToggle?: () => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
  notificationCount?: number;
  user?: { name: string; avatar?: string };
  isDarkMode?: boolean;
  systemStatus?: "operational" | "degraded" | "critical";
}

export function AdminNavbar({
  onThemeToggle,
  onLogout,
  onSearch,
  notificationCount = 0,
  user,
  isDarkMode = true,
  systemStatus = "operational",
}: NavbarProps) {
  const theme = useTheme();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  
  const notifications = useNotifications((s) => s.items);
  const markRead = useNotifications((s) => s.markRead);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const dismiss = useNotifications((s) => s.dismiss);

  return (
    <Box sx={{ width: "100%", height: "var(--navbar-height)" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          height: "var(--navbar-height)",
          backgroundColor: "var(--surface)",
          backdropFilter: "blur(var(--glass-blur))",
          borderBottom: `1px solid var(--border)`,
          zIndex: (themeValue) => themeValue.zIndex.drawer + 1, 
          color: "var(--foreground)",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 5 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          {/* Left section - Context/Search */}
          <Stack direction="row" spacing={4} alignItems="center" flex={1}>
            <Box sx={{ maxWidth: 520, width: "100%", display: { xs: "none", sm: "block" } }}>
              <TextField
                fullWidth
                placeholder="Search resources, users, or commands... (⌘K)"
                size="small"
                onChange={(e) => onSearch?.(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchRoundedIcon sx={{ mr: 2, color: "var(--primary)", fontSize: 22, opacity: 0.8 }} />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "18px",
                    bgcolor: "var(--glass-gray)",
                    height: 48,
                    fontSize: 14,
                    fontWeight: 500,
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover": { bgcolor: "var(--glass-gray-hover)" },
                    "&:hover fieldset": { borderColor: alpha(theme.palette.divider, 0.1) },
                    "&.Mui-focused": { bgcolor: "var(--surface)", boxShadow: "0 0 0 4px var(--primary-glow)" },
                    "&.Mui-focused fieldset": { borderColor: "var(--primary)" },
                    transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                  },
                }}
              />
            </Box>
          </Stack>

          {/* Right section - Status, Actions, User */}
          <Stack direction="row" spacing={2.5} alignItems="center">
            {/* System Status */}
            <Box sx={{ display: { xs: "none", md: "block" }, mr: 1.5 }}>
              <HealthIndicator 
                status={systemStatus as any} 
                label={systemStatus.toUpperCase()} 
              />
            </Box>

            {/* AI Assistant */}
            <Tooltip title="Neural Insights">
              <IconButton 
                size="small"
                sx={{ 
                  width: 48, height: 48, borderRadius: "16px",
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  color: "var(--secondary)",
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                  "&:hover": { 
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    transform: "translateY(-3px)",
                    boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.2)}`
                  },
                  transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
                }}
              >
                <SmartToyRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Intelligence Center">
              <IconButton 
                size="small"
                onClick={(e) => setNotificationAnchor(e.currentTarget)}
                sx={{ 
                  width: 48, height: 48, borderRadius: "16px",
                  border: `1px solid var(--border)`,
                  bgcolor: "var(--glass-gray)",
                  "&:hover": { 
                    bgcolor: "var(--glass-gray-hover)",
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.05)"
                  },
                  transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
                }}
              >
                <Badge 
                  badgeContent={notificationCount} 
                  color="error"
                  sx={{ "& .MuiBadge-badge": { fontWeight: 900, fontSize: 11, minWidth: 20, height: 20, border: "2px solid var(--surface)" } }}
                >
                  <NotificationsRoundedIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Popover
              open={Boolean(notificationAnchor)}
              anchorEl={notificationAnchor}
              onClose={() => setNotificationAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{ paper: { sx: { 
                width: 440, 
                borderRadius: "28px", 
                mt: 2.5, 
                overflow: "hidden",
                boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.25), 0 0 1px rgba(0,0,0,0.1)",
                border: "1px solid var(--border)"
              }}}}
            >
              <NotificationCenter
                notifications={notifications as any[]}
                onMarkAsRead={markRead}
                onClearAll={markAllRead}
                onDismiss={dismiss}
              />
            </Popover>

            {/* Theme Toggle */}
            <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton 
                size="small"
                onClick={onThemeToggle}
                sx={{ 
                  width: 48, height: 48, borderRadius: "16px",
                  border: `1px solid var(--border)`,
                  bgcolor: "var(--glass-gray)",
                  color: isDarkMode ? "var(--accent)" : "var(--warning)",
                  "&:hover": { 
                    bgcolor: "var(--glass-gray-hover)",
                    transform: "translateY(-3px) scale(1.05)",
                    boxShadow: isDarkMode 
                      ? "0 8px 20px rgba(6, 182, 212, 0.15)"
                      : "0 8px 20px rgba(245, 158, 11, 0.15)"
                  },
                  transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
                }}
              >
                {isDarkMode ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ height: 32, alignSelf: "center", mx: 1.5, opacity: 0.1 }} />

            {/* User Dropdown */}
            <Box 
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{ 
                p: 0.75, pr: 2.5, borderRadius: "20px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 2,
                transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                border: "1px solid transparent",
                bgcolor: alpha(theme.palette.text.primary, 0.02),
                "&:hover": { 
                  bgcolor: "var(--glass-gray-hover)",
                  borderColor: "var(--border)",
                  transform: "translateY(-1px)"
                }
              }}
            >
              <Avatar 
                src={user?.avatar} 
                sx={{ 
                  width: 42, height: 42, borderRadius: "14px", 
                  bgcolor: "var(--primary)",
                  boxShadow: "0 6px 16px var(--primary-glow)",
                  fontWeight: 900
                }}
              >
                {user?.name?.charAt(0) || "A"}
              </Avatar>
              <Box sx={{ display: { xs: "none", lg: "block" } }}>
                <Typography variant="body2" fontWeight={900} sx={{ lineHeight: 1.1, fontSize: 14 }}>{user?.name || "Admin User"}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.6, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}>Super Admin</Typography>
              </Box>
            </Box>
          </Stack>
        </Box>


        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={() => setUserMenuAnchor(null)}
          PaperProps={{ 
            sx: { 
              borderRadius: "14px", mt: 1.5, minWidth: 220, 
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              border: `1px solid var(--border)`,
              p: 1
            } 
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={800}>{user?.name || "Admin User"}</Typography>
            <Typography variant="caption" color="text.secondary">admin@sabahub.com</Typography>
          </Box>
          <Divider sx={{ my: 1, opacity: 0.05 }} />
          <MenuItem onClick={() => setUserMenuAnchor(null)} sx={{ borderRadius: "10px", py: 1 }}>
            <SettingsRoundedIcon sx={{ mr: 1.5, fontSize: 20, opacity: 0.6 }} />
            <Typography variant="body2" fontWeight={500}>Account Settings</Typography>
          </MenuItem>
          <MenuItem onClick={() => setUserMenuAnchor(null)} sx={{ borderRadius: "10px", py: 1 }}>
            <Box sx={{ mr: 1.5, fontSize: 20 }}>🛡️</Box>
            <Typography variant="body2" fontWeight={500}>Security Center</Typography>
          </MenuItem>
          <Divider sx={{ my: 1, opacity: 0.05 }} />
          <MenuItem 
            onClick={() => { setUserMenuAnchor(null); onLogout?.(); }}
            sx={{ borderRadius: "10px", py: 1, color: "var(--error)" }}
          >
            <LogoutRoundedIcon sx={{ mr: 1.5, fontSize: 20 }} />
            <Typography variant="body2" fontWeight={700}>Sign Out</Typography>
          </MenuItem>
        </Menu>
      </AppBar>
    </Box>
  );
}
