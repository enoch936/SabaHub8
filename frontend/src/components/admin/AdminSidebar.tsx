"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Box,
  Stack,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  adminNavigationGroups,
  adminOverviewItem,
  itemMatches,
  type AdminActiveContext,
  type AdminNavigationGroup,
} from "@/lib/admin/navigation";

type ModerationSidebarBadges = {
  platformControlAlerts: number;
  securityAlerts: number;
  flaggedJobs: number;
  openDisputes: number;
  unpublishedPolicyUpdates: number;
  jobs: number;
  proposals: number;
  unreadMessages: number;
  total: number;
};

type AdminSidebarProps = {
  activeContext: AdminActiveContext;
  expandedParents: Record<string, boolean>;
  focusedGroup: AdminNavigationGroup;
  isDarkMode: boolean;
  moderationBadges: ModerationSidebarBadges;
  pathname: string;
  role: string | null | undefined;
  sectionQuery: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onFocusGroup: (groupKey: string) => void;
  onNavigate: (href: string) => void;
  onToggleParent: (itemKey: string) => void;
  user?: { name: string; email: string; avatar?: string };
};

function getItemBadgeValue(itemKey: string, moderationBadges: ModerationSidebarBadges) {
  switch (itemKey) {
    case "platform-control": return moderationBadges.platformControlAlerts;
    case "security-governance": return moderationBadges.securityAlerts;
    case "jobs-management": return moderationBadges.jobs;
    case "proposals": return moderationBadges.proposals;
    case "content-moderation": return moderationBadges.flaggedJobs + moderationBadges.openDisputes + moderationBadges.unpublishedPolicyUpdates;
    case "dispute-resolution": return moderationBadges.openDisputes;
    case "chat-operations": return moderationBadges.unreadMessages;
    default: return 0;
  }
}

function AdminSidebarItem({ 
  badgeValue, 
  href, 
  icon, 
  label, 
  onClick, 
  selected, 
  accent,
  collapsed 
}: {
  badgeValue: number;
  href: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  selected: boolean;
  accent?: string;
  collapsed?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const selectionColor = accent || "#6366F1";
  
  return (
    <Tooltip title={collapsed ? label : ""} placement="right">
      <ListItemButton
        component={Link}
        href={href}
        selected={selected}
        onClick={onClick}
        className="motion-card body-text"
        sx={{
          minHeight: 44,
          px: collapsed ? 1.5 : 2,
          py: 1,
          mb: 0.5,
          borderRadius: "14px",
          justifyContent: collapsed ? "center" : "flex-start",
          color: selected ? selectionColor : "text.primary",
          bgcolor: selected ? alpha(selectionColor, isDark ? 0.16 : 0.08) : "transparent",
          border: selected ? `1px solid ${alpha(selectionColor, 0.3)}` : "1px solid transparent",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": { 
            bgcolor: alpha(selectionColor, isDark ? 0.12 : 0.04),
            transform: collapsed ? "scale(1.1)" : "translateX(4px)",
          },
        }}
      >
        <ListItemIcon sx={{ 
          minWidth: collapsed ? 0 : 34, 
          color: selected ? selectionColor : alpha(theme.palette.text.primary, 0.6),
          transition: "all 0.3s" 
        }}>
          {icon}
        </ListItemIcon>

        {!collapsed && (
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontSize: 13.5,
              fontWeight: selected ? 700 : 500,
              color: selected ? selectionColor : "text.primary",
              noWrap: true
            }}
            sx={{ my: 0 }}
          />
        )}

        {badgeValue > 0 && !collapsed && (
          <Box
            sx={{
              minWidth: 20,
              height: 20,
              px: 0.7,
              borderRadius: "8px",
              display: "grid",
              placeItems: "center",
              bgcolor: selected ? selectionColor : alpha(theme.palette.error.main, 0.1),
              color: selected ? "#fff" : theme.palette.error.main,
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {badgeValue > 99 ? "99+" : badgeValue}
          </Box>
        )}
      </ListItemButton>
    </Tooltip>
  );
}

export default function AdminSidebar({
  moderationBadges,
  pathname,
  sectionQuery,
  collapsed = false,
  onToggleCollapse,
  onFocusGroup,
  user,
}: AdminSidebarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [workspaceAnchor, setWorkspaceAnchor] = useState<null | HTMLElement>(null);

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%",
      transition: "width 0.3s ease",
    }}>
      {/* Header: Logo & Workspace */}
      <Box sx={{ p: 2, mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={collapsed ? 0 : 1.5} justifyContent={collapsed ? "center" : "flex-start"}>
          <Box sx={{ 
            width: 36, 
            height: 36, 
            borderRadius: "10px", 
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: 900,
            fontSize: 20,
            flexShrink: 0
          }}>
            S
          </Box>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={800} noWrap>SabaHub Admin</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", opacity: 0.7 }}>Enterprise v1.0</Typography>
            </Box>
          )}
        </Stack>

        {!collapsed && (
          <Box
            onClick={(e) => setWorkspaceAnchor(e.currentTarget)}
            sx={{ 
              mt: 2.5, 
              p: 1.25, 
              borderRadius: "12px", 
              bgcolor: alpha(theme.palette.text.primary, 0.04),
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.07) }
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
                <Typography variant="caption" fontWeight={700}>Main Workspace</Typography>
              </Stack>
              <UnfoldMoreRoundedIcon sx={{ fontSize: 16, opacity: 0.5 }} />
            </Stack>
          </Box>
        )}
      </Box>

      {/* Sidebar Search */}
      {!collapsed && (
        <Box sx={{ px: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, opacity: 0.5 }} />
                </InputAdornment>
              ),
            }}
            sx={{ 
              "& .MuiOutlinedInput-root": { 
                borderRadius: "12px",
                bgcolor: alpha(theme.palette.text.primary, 0.03),
                "& fieldset": { borderColor: "transparent" },
                "&:hover fieldset": { borderColor: alpha(theme.palette.divider, 0.1) },
              }
            }}
          />
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ 
        flex: 1, 
        overflowY: "auto", 
        px: 1.5,
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { borderRadius: 10, bgcolor: alpha(theme.palette.text.primary, 0.05) }
      }}>
        <Box sx={{ mb: 3 }}>
          {!collapsed && <Typography variant="caption" sx={{ px: 2, mb: 1, display: "block", fontWeight: 800, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em" }}>Operations</Typography>}
          <AdminSidebarItem
            badgeValue={0}
            href={adminOverviewItem.href}
            icon={adminOverviewItem.icon}
            label={adminOverviewItem.label}
            selected={pathname === adminOverviewItem.href}
            collapsed={collapsed}
          />
        </Box>

        {adminNavigationGroups.map((group) => (
          <Box key={group.key} sx={{ mb: 3 }}>
            {!collapsed && <Typography variant="caption" sx={{ px: 2, mb: 1, display: "block", fontWeight: 800, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{group.label}</Typography>}
            {group.items.map((item) => (
              <AdminSidebarItem
                key={item.key}
                badgeValue={getItemBadgeValue(item.key, moderationBadges)}
                href={item.href}
                icon={item.icon}
                label={item.label}
                accent={group.accent}
                onClick={() => onFocusGroup(group.key)}
                selected={itemMatches(pathname, sectionQuery, item)}
                collapsed={collapsed}
              />
            ))}
          </Box>
        ))}
      </Box>

      {/* Footer: User Profile & Collapse */}
      <Box sx={{ p: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}` }}>
        {!collapsed && (
          <Box sx={{ 
            p: 1.5, 
            borderRadius: "14px", 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            mb: 1
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar src={user?.avatar} sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: theme.palette.primary.main }}>{user?.name?.charAt(0)}</Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{user?.name || "Admin User"}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", opacity: 0.7 }}>{user?.email || "admin@sabahub.com"}</Typography>
              </Box>
            </Stack>
          </Box>
        )}

        <Stack direction="row" alignItems="center" justifyContent={collapsed ? "center" : "space-between"} spacing={1}>
          {!collapsed && (
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" sx={{ color: "text.secondary" }}><NotificationsRoundedIcon fontSize="small" /></IconButton>
              <IconButton size="small" sx={{ color: "text.secondary" }}><SettingsRoundedIcon fontSize="small" /></IconButton>
            </Stack>
          )}
          <IconButton 
            size="small" 
            onClick={onToggleCollapse}
            sx={{ 
              borderRadius: "10px", 
              bgcolor: alpha(theme.palette.text.primary, 0.04),
              "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.08) }
            }}
          >
            {collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
          </IconButton>
        </Stack>
      </Box>

      <Menu
        anchorEl={workspaceAnchor}
        open={Boolean(workspaceAnchor)}
        onClose={() => setWorkspaceAnchor(null)}
        PaperProps={{ sx: { borderRadius: "12px", mt: 1, minWidth: 200, boxShadow: theme.shadows[10] } }}
      >
        <MenuItem onClick={() => setWorkspaceAnchor(null)}>Main Workspace</MenuItem>
        <MenuItem onClick={() => setWorkspaceAnchor(null)}>Operations HQ</MenuItem>
        <Divider />
        <MenuItem onClick={() => setWorkspaceAnchor(null)}>+ Create Workspace</MenuItem>
      </Menu>
    </Box>
  );
}
