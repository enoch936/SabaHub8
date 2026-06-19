"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AccountCircle,
  ChecklistRounded,
  CloseRounded,
  Forum,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
  Logout,
  Menu as MenuIcon,
  Notifications,
  Search,
  Settings,
  VideoCameraFront,
  Wallet,
} from "@mui/icons-material";
import RoleModeSwitch from "@/components/RoleModeSwitch";
import LandingMegaMenu from "@/components/landing/LandingMegaMenu";
import { ThemeIconButton } from "@/components/mui/ThemeToggle";
import { WORKSPACE_HEADER_HEIGHT } from "@/components/workspace-shell";
import { getWorkspaceSurfaceLabel } from "@/components/workspace/navigation/workspace-nav";
import { getNotificationHref } from "@/lib/notificationRoutes";
import { getNotificationMessage, getNotificationTitle } from "@/lib/notificationPresentation";
import { useNotifications } from "@/lib/notifications";
import { useSession } from "@/lib/session";
import { workspaceRoutes } from "@/lib/workspace-routes";

export default function WorkspaceTopbar({
  isDesktop = false,
  isSidebarOpen = false,
  onMenuToggle,
  onProfileCompletionOpen,
  hasIncompleteProfileCompletion = false,
  profileCompletionPercent = 0,
}: {
  isDesktop?: boolean;
  isSidebarOpen?: boolean;
  onMenuToggle?: () => void;
  onProfileCompletionOpen?: () => void;
  hasIncompleteProfileCompletion?: boolean;
  profileCompletionPercent?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);

  const role = useSession((s) => s.role);
  const fullName = useSession((s) => s.fullName);
  const username = useSession((s) => s.username);
  const email = useSession((s) => s.email);
  const profilePictureUrl = useSession((s) => s.profilePictureUrl);
  const clear = useSession((s) => s.clear);
  const notifications = useNotifications((s) => s.items);
  const unread = useNotifications((s) => s.unread);
  const markRead = useNotifications((s) => s.markRead);
  const markAllRead = useNotifications((s) => s.markAllRead);

  const profileHref = role === "ADMIN" ? "/admin" : workspaceRoutes.settings;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const safeName = hasMounted ? fullName : "";
  const safeUsername = hasMounted ? username : "";
  const safeEmail = hasMounted ? email : "";
  const safeProfilePictureUrl = hasMounted ? profilePictureUrl : "";
  const displayName = safeName || safeUsername || safeEmail || "Workspace User";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const surfaceLabel = useMemo(() => getWorkspaceSurfaceLabel(pathname), [pathname]);
  const roleLabel = role === "ADMIN" ? "administrator" : role === "EMPLOYER" ? "employer" : "freelancer";
  const menuTooltip = isDesktop
    ? (isSidebarOpen ? "Hide sidebar" : "Show sidebar")
    : (isSidebarOpen ? "Hide sidebar" : "Show sidebar");
  const menuAriaLabel = menuTooltip;
  const menuIcon = isDesktop ? (
    isSidebarOpen ? <KeyboardDoubleArrowLeft /> : <KeyboardDoubleArrowRight />
  ) : isSidebarOpen ? (
    <CloseRounded />
  ) : (
    <MenuIcon />
  );

  const notificationItems = useMemo(
    () =>
      notifications.slice(0, 8).map((item) => ({
        id: item.id,
        href: getNotificationHref(item),
        title: getNotificationTitle(item),
        message: getNotificationMessage(item),
        time: item.createdAt ? new Date(item.createdAt).toISOString() : "No timestamp",
      })),
    [notifications],
  );

  const handleLogout = () => {
    clear();
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        height: WORKSPACE_HEADER_HEIGHT,
        justifyContent: "center",
        bgcolor: "transparent",
        boxShadow: "none",
        borderBottom: "none",
        zIndex: (theme) => theme.zIndex.drawer + 2,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: `${WORKSPACE_HEADER_HEIGHT}px !important`,
          px: { xs: 1.25, md: 2.5 },
        }}
      >
        <Box
          sx={{
            mx: "auto",
            width: "min(100%, 1440px)",
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.75, md: 1 },
            borderRadius: "24px",
            px: { xs: 1, md: 1.5 },
            py: 0.75,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <Tooltip title={menuTooltip}>
            <IconButton
              onClick={onMenuToggle}
              aria-label={menuAriaLabel}
              className="soft-click"
              sx={{
                width: 42,
                height: 42,
                borderRadius: "14px",
                bgcolor: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              {menuIcon}
            </IconButton>
          </Tooltip>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flexShrink: 0 }}>
            <Box
              sx={{
                display: "grid",
                width: 38,
                height: 38,
                borderRadius: "15px",
                bgcolor: "#111827",
                color: "#ffffff",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
              }}
            >
              SH
            </Box>
            <Box sx={{ display: { xs: "none", sm: "block" }, minWidth: 0 }}>
              <Typography
                sx={{ fontSize: "0.84rem", fontWeight: 700, lineHeight: 1.1, color: "var(--foreground)" }}
                noWrap
              >
                SabaHub
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  color: "var(--foreground-muted)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
                noWrap
              >
                {surfaceLabel}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: { xs: "none", md: "block" }, ml: 1 }}>
            <LandingMegaMenu />
          </Box>

          <TextField
            size="small"
            placeholder="Search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            sx={{
              display: { xs: "none", md: "block" },
              flex: 1,
              maxWidth: 620,
              "& .MuiOutlinedInput-root": {
                borderRadius: "18px",
                bgcolor: "var(--surface)",
                minHeight: 44,
                pr: 0.5,
                boxShadow: "var(--shadow-soft)",
                "& fieldset": { borderColor: "var(--border)" },
                "&:hover fieldset": { borderColor: "var(--border)" },
                "&.Mui-focused fieldset": { borderColor: "var(--border)" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ display: { xs: "none", lg: "block" } }}>
              <RoleModeSwitch variant="pill" />
            </Box>

            <ThemeIconButton
              size="small"
              sx={{
                width: 42,
                height: 42,
                borderRadius: "14px",
                bgcolor: "var(--surface)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                "&:hover": { bgcolor: "var(--accent)" },
              }}
            />

            <Tooltip title="Create Reel">
              <IconButton
                component={Link}
                href="/social/reels"
                className="soft-click"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "14px",
                  bgcolor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "#ec4899",
                  "&:hover": { bgcolor: "rgba(236,72,153,0.1)" },
                }}
              >
                <VideoCameraFront />
              </IconButton>
            </Tooltip>

            <Tooltip title="Messages">
              <IconButton
                component={Link}
                href="/chat"
                className="soft-click"
                sx={{
                width: 42,
                height: 42,
                borderRadius: "14px",
                bgcolor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
                <Forum />
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton
                onClick={(event) => setNotifAnchor(event.currentTarget)}
                className="soft-click"
                sx={{
                width: 42,
                height: 42,
                borderRadius: "14px",
                bgcolor: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
                <Badge badgeContent={unread > 99 ? "99+" : unread} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
                <Typography
                  sx={{ fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.2, color: "var(--foreground)" }}
                  noWrap
                >
                  {displayName}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: "var(--foreground-muted)",
                    textTransform: "capitalize",
                    lineHeight: 1.2,
                  }}
                  noWrap
                >
                  {roleLabel}
                </Typography>
              </Box>

              <IconButton
                onClick={(event) => setUserAnchor(event.currentTarget)}
                sx={{
                  p: 0,
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                }}
              >
                <Avatar
                  src={safeProfilePictureUrl || undefined}
                  sx={{ width: 38, height: 38, fontWeight: 700, color: "#ffffff", background: "#111111" }}
                >
                  {avatarLetter}
                </Avatar>
              </IconButton>
            </Stack>
          </Box>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            width: { xs: "calc(100vw - 24px)", sm: 360 },
            maxWidth: "calc(100vw - 24px)",
            borderRadius: 3,
            boxShadow: "var(--shadow-soft)",
            border: "1px solid var(--border)",
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Notifications
          </Typography>
          {unread > 0 ? (
            <Typography
              component="button"
              type="button"
              onClick={() => void markAllRead()}
              sx={{
                border: 0,
                background: "transparent",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                p: 0,
              }}
              className="hover-underline"
            >
              Mark all read
            </Typography>
          ) : null}
        </Box>
        <Divider />
        {notificationItems.length ? (
          notificationItems.map((item) => (
            <MenuItem
              key={item.id}
              onClick={async () => {
                await markRead(item.id);
                setNotifAnchor(null);
                router.push(item.href);
              }}
              sx={{
                alignItems: "flex-start",
                py: 1.25,
                gap: 1,
                "&:hover": { bgcolor: "var(--accent)" },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", whiteSpace: "normal" }}>
                  {item.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {item.time}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <Box sx={{ px: 1.5, py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet.
            </Typography>
          </Box>
        )}
      </Menu>

      <Menu
        anchorEl={userAnchor}
        open={Boolean(userAnchor)}
        onClose={() => setUserAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: 3,
            boxShadow: "var(--shadow-soft)",
            border: "1px solid var(--border)",
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1.25 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {safeName || "Workspace User"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {safeEmail || "Signed in"}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 1.5, py: 1.25, display: { xs: "block", lg: "none" } }}>
          <RoleModeSwitch variant="button" />
        </Box>
        <Divider sx={{ display: { xs: "block", lg: "none" } }} />
        <MenuItem component={Link} href={profileHref} onClick={() => setUserAnchor(null)}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        {role === "FREELANCER" && onProfileCompletionOpen ? (
          <MenuItem
            onClick={() => {
              setUserAnchor(null);
              onProfileCompletionOpen();
            }}
          >
            <ListItemIcon>
              <ChecklistRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Profile completion"
              secondary={
                hasIncompleteProfileCompletion
                  ? `${profileCompletionPercent}% complete`
                  : "Open progress panel"
              }
            />
          </MenuItem>
        ) : null}
        <MenuItem component={Link} href={workspaceRoutes.wallet} onClick={() => setUserAnchor(null)}>
          <ListItemIcon>
            <Wallet fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Wallet" />
        </MenuItem>
        <MenuItem component={Link} href={workspaceRoutes.settings} onClick={() => setUserAnchor(null)}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setUserAnchor(null);
            handleLogout();
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
