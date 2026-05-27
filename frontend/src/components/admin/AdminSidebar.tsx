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
        className="glass-gray-hover"
        sx={{
          minHeight: 52,
          px: collapsed ? 1.5 : 2.5,
          py: 1.5,
          mb: 1,
          borderRadius: "18px",
          justifyContent: collapsed ? "center" : "flex-start",
          color: selected ? selectionColor : "text.primary",
          bgcolor: selected ? alpha(selectionColor, isDark ? 0.15 : 0.08) : "transparent",
          border: selected ? `1px solid ${alpha(selectionColor, 0.3)}` : "1px solid transparent",
          transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          "&:hover": { 
            bgcolor: "var(--glass-gray-hover)",
            transform: collapsed ? "scale(1.1)" : "translateX(8px)",
            "& .MuiListItemIcon-root": { color: selectionColor, transform: "scale(1.1)" }
          },
        }}
      >
        <ListItemIcon sx={{ 
          minWidth: collapsed ? 0 : 40, 
          color: selected ? selectionColor : alpha(theme.palette.text.primary, 0.45),
          transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)" 
        }}>
          {icon}
        </ListItemIcon>

        {!collapsed && (
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontSize: 15,
              fontWeight: selected ? 800 : 600,
              color: selected ? selectionColor : "text.primary",
              noWrap: true,
              letterSpacing: "-0.02em"
            }}
            sx={{ my: 0 }}
          />
        )}

        {badgeValue > 0 && !collapsed && (
          <Box
            sx={{
              minWidth: 24,
              height: 24,
              px: 1,
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              bgcolor: selected ? selectionColor : alpha(theme.palette.error.main, 0.1),
              color: selected ? "#fff" : theme.palette.error.main,
              fontSize: 11,
              fontWeight: 900,
              boxShadow: selected ? `0 8px 16px ${alpha(selectionColor, 0.4)}` : "none"
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
      bgcolor: "transparent"
    }}>
      {/* Header: Logo & Workspace */}
      <Box sx={{ p: 3, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={collapsed ? 0 : 2} justifyContent={collapsed ? "center" : "flex-start"}>
          <Box sx={{ 
            width: 44, 
            height: 44, 
            borderRadius: "14px", 
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: 900,
            fontSize: 24,
            flexShrink: 0,
            boxShadow: "0 8px 20px rgba(79, 70, 229, 0.3)"
          }}>
            S
          </Box>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={900} noWrap sx={{ letterSpacing: "-0.04em" }}>SabaHub</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", opacity: 0.6, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 10 }}>Enterprise OS</Typography>
            </Box>
          )}
        </Stack>

        {!collapsed && (
          <Box
            onClick={(e) => setWorkspaceAnchor(e.currentTarget)}
            sx={{ 
              mt: 4, 
              p: 1.5, 
              borderRadius: "16px", 
              bgcolor: "var(--glass-gray)",
              border: `1px solid var(--border)`,
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              "&:hover": { 
                bgcolor: "var(--glass-gray-hover)",
                transform: "translateY(-2px)",
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box className="pulse-glow" sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10B981" }} />
                <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: "0.02em" }}>Operational HQ</Typography>
              </Stack>
              <UnfoldMoreRoundedIcon sx={{ fontSize: 18, opacity: 0.4 }} />
            </Stack>
          </Box>
        )}
      </Box>

      {/* Sidebar Search */}
      {!collapsed && (
        <Box sx={{ px: 3, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search Admin..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 20, opacity: 0.4 }} />
                </InputAdornment>
              ),
            }}
            sx={{ 
              "& .MuiOutlinedInput-root": { 
                borderRadius: "14px",
                bgcolor: "var(--glass-gray)",
                "& fieldset": { borderColor: "transparent" },
                "&:hover": { bgcolor: "var(--glass-gray-hover)" },
                "&.Mui-focused": { bgcolor: "var(--surface)" },
              }
            }}
          />
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ 
        flex: 1, 
        overflowY: "auto", 
        px: 2,
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { borderRadius: 10, bgcolor: "var(--glass-gray-hover)" }
      }}>
        <Box sx={{ mb: 4 }}>
          {!collapsed && <Typography variant="caption" sx={{ px: 2, mb: 1.5, display: "block", fontWeight: 900, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: 11 }}>Governance</Typography>}
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
          <Box key={group.key} sx={{ mb: 4 }}>
            {!collapsed && <Typography variant="caption" sx={{ px: 2, mb: 1.5, display: "block", fontWeight: 900, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: 11 }}>{group.label}</Typography>}
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
      <Box sx={{ p: 2, borderTop: `1px solid var(--border)` }}>
        {!collapsed && (
          <Box sx={{ 
            p: 2, 
            borderRadius: "18px", 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            mb: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar 
                src={user?.avatar} 
                sx={{ 
                  width: 38, 
                  height: 38, 
                  borderRadius: "12px", 
                  bgcolor: "var(--primary)",
                  boxShadow: "0 4px 12px var(--primary-glow)"
                }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800} noWrap sx={{ letterSpacing: "-0.01em" }}>{user?.name || "Admin User"}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", opacity: 0.6, fontWeight: 700 }}>Super Administrator</Typography>
              </Box>
            </Stack>
          </Box>
        )}

        <Stack direction="row" alignItems="center" justifyContent={collapsed ? "center" : "space-between"} spacing={1}>
          {!collapsed && (
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" sx={{ color: "text.secondary", "&:hover": { color: "var(--primary)" } }}><NotificationsRoundedIcon fontSize="small" /></IconButton>
              <IconButton size="small" sx={{ color: "text.secondary", "&:hover": { color: "var(--primary)" } }}><SettingsRoundedIcon fontSize="small" /></IconButton>
            </Stack>
          )}
          <IconButton 
            size="small" 
            onClick={onToggleCollapse}
            sx={{ 
              width: 36,
              height: 36,
              borderRadius: "12px", 
              bgcolor: "var(--glass-gray)",
              border: `1px solid var(--border)`,
              "&:hover": { bgcolor: "var(--glass-gray-hover)", transform: "scale(1.05)" },
              transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
            }}
          >
            {collapsed ? <ChevronRightRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
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
