"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setupWebPush } from "@/lib/webPush";
import { KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BottomNavigation from "@/components/BottomNavigation";
import ProfileCompletionSidebar from "@/components/workspace/profile/ProfileCompletionSidebar";
import WorkspaceRightRail from "@/components/workspace/shell/WorkspaceRightRail";
import WorkspaceSidebar from "@/components/workspace/shell/WorkspaceSidebar";
import WorkspaceTopbar from "@/components/workspace/shell/WorkspaceTopbar";
import {
  WORKSPACE_HEADER_HEIGHT,
  WORKSPACE_RIGHT_RAIL_WIDTH,
  WORKSPACE_SIDEBAR_WIDTH,
} from "@/components/workspace-shell";
import { isTokenUsable } from "@/lib/auth";
import { me } from "@/lib/api";
import { useChatInbox } from "@/lib/chatInbox";
import { useNotifications } from "@/lib/notifications";
import {
  clearProfileCompletionPrompt,
  fetchProfileCompletionSummary,
  readProfileCompletionPrompt,
  type ProfileCompletionSummary,
} from "@/lib/profile-completion";
import {
  getRoleFallbackRoute,
  isRoleAllowedOnPath,
  normalizeRoleList,
} from "@/lib/role-mode";
import { bootstrapSession, useSession } from "@/lib/session";

const RIGHT_RAIL_STORAGE_KEY = "workspace:right-rail-open";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const showRightRail = useMediaQuery(theme.breakpoints.up("xl"));
  const connectInbox = useChatInbox((s) => s.connect);
  const connectNotifications = useNotifications((s) => s.connect);
  const role = useSession((s) => s.role);
  const clearSession = useSession((s) => s.clear);
  const hydrateFromUser = useSession((s) => s.hydrateFromUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightRailOpen, setRightRailOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profileCompletionLoading, setProfileCompletionLoading] = useState(false);
  const [profileCompletionOpen, setProfileCompletionOpen] = useState(false);
  const [profileCompletionSummary, setProfileCompletionSummary] = useState<ProfileCompletionSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      bootstrapSession();
      const token = localStorage.getItem("auth_token");
      if (!isTokenUsable(token)) {
        clearSession();
        localStorage.removeItem("auth_token");
        router.replace("/login");
        return;
      }

      try {
        const currentUser = await me();
        const normalizedRoles = normalizeRoleList(currentUser.roles);
        hydrateFromUser(currentUser);

        if (normalizedRoles.includes("ADMIN")) {
          router.replace("/admin");
          return;
        }

        if (!cancelled) {
          setAuthReady(true);
          void connectNotifications();
          void connectInbox();
          void setupWebPush();
        }
      } catch {
        if (!cancelled) {
          clearSession();
          localStorage.removeItem("auth_token");
          router.replace("/login");
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [clearSession, connectInbox, connectNotifications, hydrateFromUser, router]);

  useEffect(() => {
    if (!authReady || !role) return;
    if (!isRoleAllowedOnPath(pathname, role)) {
      router.replace(getRoleFallbackRoute(role));
    }
  }, [authReady, pathname, role, router]);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    if (!showRightRail) {
      setRightRailOpen(false);
      return;
    }
    const stored = window.localStorage.getItem(RIGHT_RAIL_STORAGE_KEY);
    setRightRailOpen(stored === null ? true : stored === "1");
  }, [showRightRail]);

  useEffect(() => {
    if (!authReady || role !== "FREELANCER") {
      if (authReady && role && role !== "FREELANCER") {
        clearProfileCompletionPrompt();
      }
      setProfileCompletionSummary(null);
      setProfileCompletionLoading(false);
      setProfileCompletionOpen(false);
      return;
    }

    let cancelled = false;
    const shouldForceOpen = Boolean(readProfileCompletionPrompt());

    const loadProfileCompletion = async () => {
      setProfileCompletionLoading(true);
      try {
        const summary = await fetchProfileCompletionSummary();
        if (cancelled) {
          return;
        }
        setProfileCompletionSummary(summary);
        if (shouldForceOpen && !summary.complete) {
          setProfileCompletionOpen(true);
        }
      } catch {
        if (!cancelled) {
          setProfileCompletionSummary(null);
        }
      } finally {
        if (!cancelled) {
          setProfileCompletionLoading(false);
          if (shouldForceOpen) {
            clearProfileCompletionPrompt();
          }
        }
      }
    };

    void loadProfileCompletion();

    return () => {
      cancelled = true;
    };
  }, [authReady, pathname, role]);

  const toggleRightRail = () => {
    setRightRailOpen((current) => {
      const next = !current;
      window.localStorage.setItem(RIGHT_RAIL_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const desktopSidebarWidth = isDesktop && sidebarOpen ? WORKSPACE_SIDEBAR_WIDTH : 0;
  const desktopRightRailWidth = showRightRail && rightRailOpen ? WORKSPACE_RIGHT_RAIL_WIDTH : 0;

  const isSocialPath = pathname.startsWith("/social") || pathname.includes("/jobs/social");

  if (!authReady) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--background)",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (isSocialPath) {
    return <div className="h-screen w-screen overflow-hidden">{children}</div>;
  }

  return (
    <Box
      sx={{
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <WorkspaceTopbar
        isDesktop={isDesktop}
        isSidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen((current) => !current)}
        onProfileCompletionOpen={
          role === "FREELANCER" ? () => setProfileCompletionOpen(true) : undefined
        }
        profileCompletionPercent={profileCompletionSummary?.percent ?? 0}
        hasIncompleteProfileCompletion={Boolean(profileCompletionSummary && !profileCompletionSummary.complete)}
      />
      <WorkspaceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen((current) => !current)}
      />
      <WorkspaceRightRail isOpen={rightRailOpen} />
      <ProfileCompletionSidebar
        open={profileCompletionOpen}
        loading={profileCompletionLoading}
        summary={profileCompletionSummary}
        onClose={() => setProfileCompletionOpen(false)}
      />

      {showRightRail ? (
        <Tooltip title={rightRailOpen ? "Hide right sidebar" : "Show right sidebar"}>
          <IconButton
            onClick={toggleRightRail}
            aria-label={rightRailOpen ? "Hide right sidebar" : "Show right sidebar"}
            sx={{
              position: "fixed",
              top: `calc(${WORKSPACE_HEADER_HEIGHT}px + 14px)`,
              right: rightRailOpen ? `${WORKSPACE_RIGHT_RAIL_WIDTH + 12}px` : "12px",
              zIndex: (muiTheme) => muiTheme.zIndex.appBar + 1,
              width: 36,
              height: 36,
              borderRadius: "12px",
              bgcolor: "rgba(255,255,255,0.94)",
              border: "1px solid var(--glass-border)",
              background: "linear-gradient(145deg, var(--glass-strong), var(--glass-subtle))",
              backdropFilter: "blur(20px) saturate(1.3)",
              boxShadow: "var(--shadow-soft)",
              transition: "right 220ms ease",
              "&:hover": {
                bgcolor: "var(--surface-elevated)",
              },
            }}
          >
            {rightRailOpen ? <KeyboardDoubleArrowRight fontSize="small" /> : <KeyboardDoubleArrowLeft fontSize="small" />}
          </IconButton>
        </Tooltip>
      ) : null}

      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          boxSizing: "border-box",
          pt: `${WORKSPACE_HEADER_HEIGHT}px`,
          pb: { xs: "72px", lg: 0 },
          ml: { lg: `${desktopSidebarWidth}px` },
          mr: { xl: `${desktopRightRailWidth}px` },
          width: {
            lg: `calc(100% - ${desktopSidebarWidth}px)`,
            xl: `calc(100% - ${desktopSidebarWidth}px - ${desktopRightRailWidth}px)`,
          },
          transition: "margin-left 220ms ease, margin-right 220ms ease, width 220ms ease",
          background: "transparent",
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 }, position: "relative", zIndex: 1 }}>{children}</Box>
      </Box>
      <BottomNavigation />
    </Box>
  );
}
