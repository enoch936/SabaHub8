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
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { HealthIndicator } from "./SystemStatus";
import { NotificationCenter } from "../NotificationCenter";
import { useNotifications } from "@/lib/notifications";

interface NavbarProps {
  onThemeToggle?: () => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
  onToggleSidebar?: () => void;
  notificationCount?: number;
  user?: { name: string; avatar?: string };
  isDarkMode?: boolean;
  systemStatus?: "operational" | "degraded" | "critical";
}

export function AdminNavbar({
  onThemeToggle,
  onLogout,
  onSearch,
  onToggleSidebar,
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

  return (
    <Box sx={{ width: "100%", height: 68 }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          height: 68,
          backgroundColor: "var(--surface)",
          backdropFilter: "blur(var(--glass-blur))",
          borderBottom: `1px solid var(--border)`,
          zIndex: (themeValue) => themeValue.zIndex.drawer + 1,
          color: "var(--foreground)",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          {/* Left section - Context/Search */}
          <Stack direction="row" spacing={1} alignItems="center" flex={1}>
            <IconButton
              onClick={onToggleSidebar}
              sx={{ display: { lg: "none" }, ml: -0.5 }}
              color="inherit"
            >
              <MenuRoundedIcon />
            </IconButton>
            <Box sx={{ maxWidth: 360, width: "100%", display: { xs: "none", sm: "block" } }}>
              <TextField
                fullWidth
                placeholder="Quick Search (⌘K)"
                size="small"
                onChange={(e) => onSearch?.(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchRoundedIcon sx={{ mr: 1, color: "text.secondary", fontSize: 18 }} />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: alpha(theme.palette.text.primary, 0.03),
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: alpha(theme.palette.divider, 0.1) },
                    "&.Mui-focused fieldset": { borderColor: "var(--primary)" },
                  },
                }}
              />
            </Box>
          </Stack>

          {/* Right section - Status, Actions, User */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* System Status */}
            <Box sx={{ display: { xs: "none", md: "block" }, mr: 1 }}>
              <HealthIndicator 
                status={systemStatus as any} 
                label={systemStatus.toUpperCase()} 
              />
            </Box>

            {/* AI Assistant */}
            <Tooltip title="AI Assistant">
              <IconButton 
                size="small"
                sx={{ 
                  width: 40, height: 40, borderRadius: "12px",
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  color: "var(--secondary)",
                  "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.15) }
                }}
              >
                <SmartToyRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                size="small"
                onClick={(e) => setNotificationAnchor(e.currentTarget)}
                sx={{ 
                  width: 40, height: 40, borderRadius: "12px",
                  border: `1px solid var(--border)`,
                  "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.04) }
                }}
              >
                <Badge badgeContent={notificationCount} color="error">
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
              PaperProps={{ sx: { width: 400, borderRadius: "20px", mt: 1.5, overflow: "hidden" } }}
            >
              <NotificationCenter
                notifications={notifications as any[]}
                onMarkAsRead={markRead}
                onClearAll={markAllRead}
                onMarkAllRead={markAllRead}
              />
            </Popover>

            {/* Help */}
            <Tooltip title="Help & Docs">
              <IconButton 
                size="small"
                sx={{ 
                  width: 40, height: 40, borderRadius: "12px",
                  "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.04) }
                }}
              >
                <HelpOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: "center", mx: 0.5, opacity: 0.1 }} />

            {/* Theme Toggle */}
            <IconButton 
              size="small" 
              onClick={onThemeToggle}
              sx={{ width: 40, height: 40, borderRadius: "12px" }}
            >
              {isDarkMode ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
            </IconButton>

            {/* User Dropdown */}
            <Box 
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{ 
                ml: 1, p: 0.5, borderRadius: "14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 1.5,
                transition: "all 0.2s",
                "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.04) }
              }}
            >
              <Avatar 
                src={user?.avatar} 
                sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: "var(--primary)" }}
              >
                {user?.name?.charAt(0) || "A"}
              </Avatar>
              <Box sx={{ display: { xs: "none", lg: "block" } }}>
                <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1 }}>{user?.name || "Admin"}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>Super Admin</Typography>
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
