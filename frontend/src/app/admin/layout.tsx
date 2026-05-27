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
  const sessionEmail = useSession((s) => s.email);
  const sessionFullName = useSession((s) => s.fullName);
  const sessionProfilePicture = useSession((s) => s.profilePictureUrl);
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
        // Force active role to ADMIN when in admin layout
        useSession.getState().setRole("ADMIN");
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
        platformControlAlerts: (platform as any)?.alerts?.length || 0,
        securityAlerts: (security as any)?.alerts?.length || 0,
        flaggedJobs: (jobs as any)?.filter?.(isLikelyFlaggedJob).length || 0,
        openDisputes: (disputes as any)?.filter?.((d: any) => ["OPEN", "INVESTIGATING"].includes(d.status?.toUpperCase())).length || 0,
        unpublishedPolicyUpdates: (content as any)?.filter?.((c: any) => c.status?.toUpperCase() === "DRAFT").length || 0,
        jobs: (jobs as any)?.length || 0,
        proposals: (proposals as any)?.length || 0,
        unreadMessages: (threads as any)?.reduce?.((t: number, th: any) => t + (th.unreadCount || 0), 0) || 0,
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
      height: "100vh", 
      width: "100vw",
      bgcolor: "var(--background)",
      overflow: "hidden",
      position: "relative"
    }}>
      <CommandPalette />
      
      {/* Fixed Sidebar for Enterprise Feel */}
      <Box
        component="aside"
        className="sidebar-transition"
        sx={{
          width: currentSidebarWidth,
          flexShrink: 0,
          height: "100vh",
          zIndex: (themeValue) => themeValue.zIndex.drawer + 2,
          bgcolor: "var(--surface)",
          backdropFilter: "blur(var(--glass-blur))",
          borderRight: `1px solid var(--border)`,
          display: { xs: "none", lg: "block" },
          position: "relative",
          overflow: "visible"
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
            name: sessionFullName || "Admin",
            email: sessionEmail || "admin@sabahub.com",
            avatar: sessionProfilePicture
          }}
        />
      </Box>

      {/* Main Content Area */}
      <Box sx={{ 
        flexGrow: 1, 
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Navbar is sticky at the top of this container */}
        <Box sx={{ 
          flexShrink: 0, 
          zIndex: 10,
          position: "sticky",
          top: 0,
          width: "100%"
        }}>
          <AdminNavbar
            isDarkMode={isDarkMode}
            notificationCount={moderationBadges.unreadMessages}
            user={{ 
              name: sessionFullName || "Admin",
              avatar: sessionProfilePicture
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

        {/* Scrollable Main View */}
        <Box 
          component="main" 
          className="custom-scrollbar"
          sx={{ 
            flexGrow: 1,
            p: { xs: 2, sm: 4, md: 6, xl: 8 },
            pb: { xs: 10, lg: 8 },
            bgcolor: "transparent",
            overflowX: "hidden"
          }}
        >
          <Box sx={{ mb: 6, maxWidth: 1600, mx: "auto", width: "100%" }}>
            <Breadcrumbs 
              separator={<NavigateNextIcon sx={{ fontSize: 14, opacity: 0.4 }} />} 
              sx={{ 
                mb: 2, 
                "& .MuiBreadcrumbs-li": { 
                  fontSize: 12, 
                  fontWeight: 800, 
                  opacity: 0.5, 
                  textTransform: "uppercase", 
                  letterSpacing: "0.12em" 
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
            
            <Stack direction="row" spacing={3} alignItems="flex-end" justifyContent="space-between">
              <Box>
                <Typography variant="h3" className="section-title" sx={{ 
                  fontSize: { xs: 32, md: 48 }, 
                  fontWeight: 900,
                  letterSpacing: "-0.05em",
                  color: "text.primary",
                  lineHeight: 1
                }}>
                  {activeContext.child?.label || activeContext.item?.label || "Command Center"}
                </Typography>
                <Typography variant="body1" className="body-text" sx={{ 
                  mt: 2, 
                  opacity: 0.7, 
                  fontSize: { xs: 16, md: 20 },
                  maxWidth: 800,
                  fontWeight: 600,
                  lineHeight: 1.6
                }}>
                  {activeContext.item?.description || "Monitor and orchestrate your enterprise workspace with real-time analytics and global moderation tools."}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ 
            maxWidth: 1600, 
            mx: "auto", 
            width: "100%",
            animation: "fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
            "@keyframes fadeIn": {
              from: { opacity: 0, transform: "translateY(20px)" },
              to: { opacity: 1, transform: "translateY(0)" }
            }
          }}>
            {children}
          </Box>
        </Box>
      </Box>


      {/* Mobile Navigation */}
      <Box sx={{ 
        display: { lg: 'none' }, 
        position: "fixed", 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100,
        bgcolor: "var(--surface)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)"
      }}>
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
