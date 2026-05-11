"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppBar, Box, Chip, CircularProgress, Drawer, IconButton, Stack, Toolbar, Typography, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AdminSidebar from "@/components/admin/AdminSidebar";
import SoftButton from "@/components/mui/SoftButton";
import { ThemeIconButton } from "@/components/mui/ThemeToggle";
import {
  adminListContent,
  adminListJobs,
  adminListProposals,
  adminPlatformControl,
  adminSecurityGovernance,
  listDisputes,
  listThreads,
  me,
} from "@/lib/api";
import {
  adminHierarchy,
  adminNavigationGroups,
  createInitialExpandedParents,
  itemMatches,
  resolveActiveAdminContext,
} from "@/lib/admin/navigation";
import { isTokenUsable, logout } from "@/lib/auth";
import { normalizeRoleList } from "@/lib/role-mode";
import { bootstrapSession, useSession } from "@/lib/session";

const DRAWER_WIDTH = 320;

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

const emptyModerationBadges: ModerationSidebarBadges = {
  platformControlAlerts: 0,
  securityAlerts: 0,
  flaggedJobs: 0,
  openDisputes: 0,
  unpublishedPolicyUpdates: 0,
  jobs: 0,
  proposals: 0,
  unreadMessages: 0,
  total: 0,
};

function isLikelyFlaggedJob(job: { title?: string | null; description?: string | null; status?: string | null }) {
  const status = (job.status ?? "").toUpperCase();
  const combined = `${job.title ?? ""} ${job.description ?? ""}`.toLowerCase();
  const suspicious = ["scam", "fraud", "fake", "crypto giveaway", "guaranteed return"];
  return status === "OPEN" && suspicious.some((term) => combined.includes(term));
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionQuery = searchParams.get("section");
  const role = useSession((s) => s.role);
  const clearSession = useSession((s) => s.clear);
  const hydrateFromUser = useSession((s) => s.hydrateFromUser);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const isDarkMode = theme.palette.mode === "dark";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(createInitialExpandedParents);
  const [focusedGroupKey, setFocusedGroupKey] = useState<string | null>(null);
  const [moderationBadges, setModerationBadges] = useState<ModerationSidebarBadges>(emptyModerationBadges);

  const activeContext = useMemo(() => resolveActiveAdminContext(pathname, sectionQuery), [pathname, sectionQuery]);
  const activeAccent = activeContext.group?.accent ?? "#18283b";
  const activeLabel = activeContext.child?.label ?? activeContext.item?.label ?? "Admin";
  const activeDescription = activeContext.child
    ? activeContext.item?.description ?? "Admin tools."
    : activeContext.item?.description ?? "Operations and controls";
  const liveStatusLabel = moderationBadges.total > 0 ? `${moderationBadges.total} live alerts` : "Nominal";
  const focusedGroup = useMemo(
    () => adminNavigationGroups.find((group) => group.key === focusedGroupKey) ?? activeContext.group ?? adminNavigationGroups[0],
    [activeContext.group, focusedGroupKey],
  );
  const activeGroupLabel = pathname === "/admin" ? "Overview" : activeContext.group?.label ?? focusedGroup.label;

  useEffect(() => {
    const currentParent = adminHierarchy.find((item) => itemMatches(pathname, sectionQuery, item));
    if (currentParent) {
      setExpandedParents((prev) => ({ ...prev, [currentParent.key]: true }));
    }
  }, [pathname, sectionQuery]);

  useEffect(() => {
    if (activeContext.group?.key) {
      setFocusedGroupKey(activeContext.group.key);
    }
  }, [activeContext.group?.key]);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

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

        if (!normalizedRoles.includes("ADMIN")) {
          router.replace("/forbidden");
          return;
        }

        if (!cancelled) {
          setAuthReady(true);
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
  }, [clearSession, hydrateFromUser, router]);

  useEffect(() => {
    if (!authReady || !role) {
      return;
    }

    if (role !== "ADMIN") {
      router.replace("/forbidden");
    }
  }, [authReady, role, router]);

  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop, pathname]);

  useEffect(() => {
    let cancelled = false;

    const loadModerationBadges = async () => {
      if (!authReady) {
        return;
      }

      const [
        platformControlResult,
        securityGovernanceResult,
        jobsResult,
        proposalsResult,
        disputesResult,
        contentResult,
        threadsResult,
      ] = await Promise.allSettled([
        adminPlatformControl(),
        adminSecurityGovernance(),
        adminListJobs(),
        adminListProposals(),
        listDisputes(),
        adminListContent(),
        listThreads(),
      ]);

      if (cancelled) {
        return;
      }

      const jobs = jobsResult.status === "fulfilled" ? jobsResult.value : [];
      const disputes = disputesResult.status === "fulfilled" ? disputesResult.value : [];
      const content = contentResult.status === "fulfilled" ? contentResult.value : [];
      const proposals = proposalsResult.status === "fulfilled" ? proposalsResult.value : [];
      const threads = threadsResult.status === "fulfilled" ? threadsResult.value : [];
      const platformControlAlerts = platformControlResult.status === "fulfilled" ? platformControlResult.value.alerts.length : 0;
      const securityAlerts = securityGovernanceResult.status === "fulfilled" ? securityGovernanceResult.value.alerts.length : 0;

      const flaggedJobs = jobs.filter((job) => isLikelyFlaggedJob(job)).length;
      const openDisputes = disputes.filter((dispute) => {
        const status = (dispute.status ?? "").toUpperCase();
        return status === "OPEN" || status === "INVESTIGATING";
      }).length;
      const unpublishedPolicyUpdates = content.filter((item) => (item.status ?? "").toUpperCase() === "DRAFT").length;
      const unreadMessages = threads.reduce((total, thread) => total + Math.max(0, Number(thread.unreadCount ?? 0)), 0);

      setModerationBadges({
        platformControlAlerts,
        securityAlerts,
        flaggedJobs,
        openDisputes,
        unpublishedPolicyUpdates,
        jobs: jobs.length,
        proposals: proposals.length,
        unreadMessages,
        total: platformControlAlerts + securityAlerts + flaggedJobs + openDisputes + unpublishedPolicyUpdates + unreadMessages,
      });
    };

    void loadModerationBadges();

    return () => {
      cancelled = true;
    };
  }, [authReady]);

  const onLogout = () => {
    clearSession();
    logout();
    router.replace("/login");
  };

  if (!authReady) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: (themeValue) => themeValue.palette.background.default,
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box
      className="sheet-shell"
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        bgcolor: (t) => (t.palette.mode === "light" ? "#f8f8f6" : t.palette.background.default),
      }}
    >
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: theme.palette.background.paper,
          boxShadow: `0 10px 30px ${alpha("#07101d", isDarkMode ? 0.22 : 0.05)}`,
        }}
      >
        <Toolbar
          sx={{
            gap: 1,
            px: { xs: 1, sm: 1.25 },
            py: { xs: 0.5, sm: 0 },
            minHeight: { xs: "64px !important", sm: "60px !important" },
          }}
        >
          <IconButton
            onClick={() => setSidebarOpen((prev) => !prev)}
            edge="start"
            aria-label={sidebarOpen ? "Hide menu" : "Show menu"}
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: alpha(activeAccent, isDarkMode ? 0.16 : 0.05),
              boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
            }}
          >
            <MenuRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mb: 0.25 }}>
              <Chip
                label={activeGroupLabel}
                size="small"
                sx={{
                  height: 20,
                  borderRadius: 999,
                  bgcolor: alpha(activeAccent, isDarkMode ? 0.2 : 0.08),
                  color: activeAccent,
                  border: "1px solid",
                  borderColor: alpha(activeAccent, isDarkMode ? 0.34 : 0.14),
                  ".MuiChip-label": { px: 0.9, fontSize: 9.8, fontWeight: 800, letterSpacing: "0.04em" },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.4 }}>
                {activeLabel}
              </Typography>
            </Stack>
            <Typography variant="subtitle2" fontWeight={900} sx={{ fontSize: 13.8, lineHeight: 1.08 }}>
              Admin
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.2 }}>
              {activeDescription}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
            <Chip
              label={liveStatusLabel}
              size="small"
              color={moderationBadges.total > 0 ? "warning" : "success"}
              variant={moderationBadges.total > 0 ? "filled" : "outlined"}
              sx={{ height: 22, ".MuiChip-label": { px: 1, fontSize: 10.2, fontWeight: 800 } }}
            />
            <Chip
              label={role ?? "ADMIN"}
              size="small"
              variant="outlined"
              sx={{
                height: 22,
                borderColor: alpha(activeAccent, isDarkMode ? 0.32 : 0.16),
                ".MuiChip-label": { px: 1, fontSize: 10.2, fontWeight: 700 },
              }}
            />
          </Stack>

          <ThemeIconButton
            size="small"
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: alpha(activeAccent, isDarkMode ? 0.16 : 0.05),
              border: "1px solid",
              borderColor: alpha(activeAccent, isDarkMode ? 0.34 : 0.14),
              "&:hover": { bgcolor: alpha(activeAccent, isDarkMode ? 0.22 : 0.08) },
            }}
          />

          <SoftButton
            onClick={onLogout}
            variant="outlined"
            color="error"
            size="small"
            sx={{
              px: { xs: 1.15, sm: 1.6 },
              minWidth: { xs: "auto", sm: 94 },
              borderRadius: 2.6,
            }}
          >
            Logout
          </SoftButton>
        </Toolbar>
      </AppBar>

      <Box>
        <Drawer
          variant={isDesktop ? "persistent" : "temporary"}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              top: { xs: 64, sm: 60 },
              height: { xs: "calc(100vh - 64px)", sm: "calc(100vh - 60px)" },
              bgcolor: theme.palette.background.paper,
              boxShadow: "none",
              overflowX: "hidden",
            },
          }}
        >
          <AdminSidebar
            activeContext={activeContext}
            expandedParents={expandedParents}
            focusedGroup={focusedGroup}
            isDarkMode={isDarkMode}
            moderationBadges={moderationBadges}
            pathname={pathname}
            role={role}
            sectionQuery={sectionQuery}
            onFocusGroup={setFocusedGroupKey}
            onNavigate={(href) => router.push(href)}
            onToggleParent={(itemKey) => {
              setExpandedParents((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
            }}
          />
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: isDesktop && sidebarOpen ? `${DRAWER_WIDTH}px` : 0,
            width: `calc(100% - ${isDesktop && sidebarOpen ? DRAWER_WIDTH : 0}px)`,
            p: 0,
            maxWidth: "100%",
            transition: "margin-left 220ms ease, width 220ms ease",
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 64, sm: 60 } }} />
          <Box
            sx={{
              minHeight: { xs: "calc(100vh - 64px)", sm: "calc(100vh - 60px)" },
              overflowX: "hidden",
              position: "relative",
            }}
          >
            <Box sx={{ position: "relative", zIndex: 1, px: { xs: 1.5, md: 2.5 }, py: { xs: 1.25, md: 2 } }}>
              {children}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
