"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress, useMediaQuery, Breadcrumbs, Link as MuiLink, Typography, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { CommandPalette } from "@/components/admin/CommandPalette";
import BottomNavigation from "@/components/BottomNavigation";
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

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 80;

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
  const sessionUser = useSession((s) => s.user);
  const role = useSession((s) => s.role);
  const clearSession = useSession((s) => s.clear);
  const hydrateFromUser = useSession((s) => s.hydrateFromUser);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const isDarkMode = theme.palette.mode === "dark";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(createInitialExpandedParents);
  const [focusedGroupKey, setFocusedGroupKey] = useState<string | null>(null);
  const [moderationBadges, setModerationBadges] = useState<ModerationSidebarBadges>(emptyModerationBadges);

  const activeContext = useMemo(() => resolveActiveAdminContext(pathname, sectionQuery), [pathname, sectionQuery]);
  
  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: "Admin", href: "/admin" }];
    if (activeContext.group) crumbs.push({ label: activeContext.group.label, href: "#" });
    if (activeContext.item) crumbs.push({ label: activeContext.item.label, href: activeContext.item.href });
    if (activeContext.child) crumbs.push({ label: activeContext.child.label, href: activeContext.child.href });
    return crumbs;
  }, [activeContext]);

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
        if (!cancelled) setAuthReady(true);
      } catch {
        if (!cancelled) {
          clearSession();
          localStorage.removeItem("auth_token");
          router.replace("/login");
        }
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, [clearSession, hydrateFromUser, router]);

  useEffect(() => {
    let cancelled = false;
    const loadModerationBadges = async () => {
      if (!authReady) return;
      const results = await Promise.allSettled([
        adminPlatformControl(), adminSecurityGovernance(), adminListJobs(),
        adminListProposals(), listDisputes(), adminListContent(), listThreads()
      ]);
      if (cancelled) return;
      
      const [platform, security, jobs, proposals, disputes, content, threads] = results.map(r => r.status === "fulfilled" ? r.value : []);
      
      setModerationBadges({
        platformControlAlerts: platform?.alerts?.length || 0,
        securityAlerts: security?.alerts?.length || 0,
        flaggedJobs: jobs?.filter(isLikelyFlaggedJob).length || 0,
        openDisputes: disputes?.filter((d: any) => ["OPEN", "INVESTIGATING"].includes(d.status?.toUpperCase())).length || 0,
        unpublishedPolicyUpdates: content?.filter((c: any) => c.status?.toUpperCase() === "DRAFT").length || 0,
        jobs: jobs?.length || 0,
        proposals: proposals?.length || 0,
        unreadMessages: threads?.reduce((t: number, th: any) => t + (th.unreadCount || 0), 0) || 0,
        total: 0
      });
    };
    void loadModerationBadges();
    return () => { cancelled = true; };
  }, [authReady]);

  const onLogout = () => {
    clearSession();
    logout();
    router.replace("/login");
  };

  if (!authReady) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0B1120" }}>
        <CircularProgress size={32} thickness={5} sx={{ color: "#6366F1" }} />
      </Box>
    );
  }

  const currentSidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box sx={{ 
      display: "flex", 
      minHeight: "100vh", 
      bgcolor: "var(--background)",
      overflowY: "auto"
    }}>
      <CommandPalette />
      <Box
        component="aside"
        sx={{
          width: currentSidebarWidth,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: (themeValue) => themeValue.zIndex.drawer + 2,
          bgcolor: "var(--surface)",
          backdropFilter: "blur(var(--glass-blur))",
          borderRight: `1px solid var(--border)`,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowY: "auto",
          display: { xs: "none", lg: "block" }
        }}
      >
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          moderationBadges={moderationBadges}
          pathname={pathname}
          sectionQuery={sectionQuery}
          activeContext={activeContext}
          expandedParents={expandedParents}
          focusedGroup={activeContext.group ?? adminNavigationGroups[0]}
          isDarkMode={isDarkMode}
          role={role}
          onFocusGroup={setFocusedGroupKey}
          onNavigate={(href) => router.push(href)}
          onToggleParent={(key) => setExpandedParents(p => ({ ...p, [key]: !p[key] }))}
          user={{ 
            name: sessionUser?.firstName ? `${sessionUser.firstName} ${sessionUser.lastName}` : "Admin",
            email: sessionUser?.email || "admin@sabahub.com",
            avatar: sessionUser?.avatarUrl
          }}
        />
      </Box>

      <Box sx={{ 
        flexGrow: 1, 
        width: { xs: "100%", lg: `calc(100% - ${currentSidebarWidth}px)` },
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh"
      }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 10, bgcolor: "var(--background)" }}>
          <AdminNavbar
            isDarkMode={isDarkMode}
            notificationCount={moderationBadges.unreadMessages}
            user={{ 
              name: sessionUser?.firstName || "Admin",
              avatar: sessionUser?.avatarUrl
            }}
            onThemeToggle={() => {
              const currentTheme = document.documentElement.getAttribute('data-theme');
              const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
              document.documentElement.setAttribute('data-theme', nextTheme);
              document.documentElement.classList.toggle('dark');
              localStorage.setItem('sabahub-theme', nextTheme);
            }}
            onLogout={onLogout}
          />
        </Box>

        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 3, md: 5, xl: 6 },
            overflowY: "auto"
          }}
        >
          <Box sx={{ mb: 5 }}>
            <Breadcrumbs 
              separator={<NavigateNextIcon sx={{ fontSize: 14, opacity: 0.4 }} />} 
              sx={{ 
                mb: 1.5, 
                "& .MuiBreadcrumbs-li": { 
                  fontSize: 11, 
                  fontWeight: 800, 
                  opacity: 0.5, 
                  textTransform: "uppercase", 
                  letterSpacing: "0.1em" 
                } 
              }}
            >
              {breadcrumbs.map((crumb, idx) => (
                <MuiLink 
                  key={idx} 
                  underline="hover" 
                  color="inherit" 
                  href={crumb.href}
                  sx={{ 
                    display: "flex", 
                    alignItems: "center",
                    cursor: crumb.href === "#" ? "default" : "pointer"
                  }}
                >
                  {crumb.label}
                </MuiLink>
              ))}
            </Breadcrumbs>
            
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" className="section-title" sx={{ 
                  fontSize: { xs: 28, md: 36 }, 
                  letterSpacing: "-0.03em",
                  color: "text.primary" 
                }}>
                  {activeContext.child?.label || activeContext.item?.label || "Command Center"}
                </Typography>
                <Typography variant="body1" className="body-text" sx={{ 
                  mt: 0.75, 
                  opacity: 0.6, 
                  fontSize: { xs: 14, md: 16 },
                  maxWidth: 600
                }}>
                  {activeContext.item?.description || "Manage and monitor your enterprise operations."}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            {children}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: { lg: 'none' } }}>
        <BottomNavigation />
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
