"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AppBar,
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemIcon,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ThemeToggle from "@/components/mui/ThemeToggle";
import SoftButton from "@/components/mui/SoftButton";
import {
  adminHierarchy,
  adminNavigationGroups,
  type AdminHierarchyChild,
  type AdminHierarchyItem,
  createInitialExpandedParents,
} from "@/lib/admin/navigation";
import { bootstrapSession, useSession } from "@/lib/session";

const DEFAULT_DRAWER_WIDTH = 280;
const MIN_DRAWER_WIDTH = 240;
const MAX_DRAWER_WIDTH = 380;

function routeMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function childMatches(pathname: string, sectionQuery: string | null, child: AdminHierarchyChild) {
  if (child.section) {
    return routeMatches(pathname, child.href) && sectionQuery === child.section;
  }
  return routeMatches(pathname, child.href);
}

function itemMatches(pathname: string, sectionQuery: string | null, item: AdminHierarchyItem) {
  return routeMatches(pathname, item.href) || (item.children ?? []).some((child) => childMatches(pathname, sectionQuery, child));
}

function childHref(child: AdminHierarchyChild) {
  if (child.section) {
    return `${child.href}?section=${child.section}`;
  }
  return child.href;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionQuery = searchParams.get("section");
  const role = useSession((s) => s.role);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(createInitialExpandedParents);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem("admin_sidebar_width");
    if (!saved) {
      return;
    }

    const parsed = Number(saved);
    if (Number.isFinite(parsed)) {
      setSidebarWidth(Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, parsed)));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("admin_sidebar_width", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    const currentParent = adminHierarchy.find((item) => itemMatches(pathname, sectionQuery, item));
    if (currentParent) {
      setExpandedParents((prev) => ({ ...prev, [currentParent.key]: true }));
    }
  }, [pathname, sectionQuery]);

  useEffect(() => {
    // Always start with full-page workspace; user can open sidebar on demand.
    setSidebarOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    bootstrapSession();
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.replace("/forbidden");
    }
  }, [role, router]);

  useEffect(() => {
    // Always return to full-page workspace on route changes.
    setSidebarOpen(false);
  }, [pathname]);

  const onLogout = () => {
    localStorage.removeItem("auth_token");
    router.replace("/login");
  };

  const drawer = useMemo(
    () => (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.4,
                display: "grid",
                placeItems: "center",
                color: "common.white",
                background: "linear-gradient(145deg, #082032 0%, #0f4c81 60%, #1b9aaa 100%)",
                boxShadow: "0 10px 24px rgba(8,32,50,0.28)",
              }}
            >
              <AdminPanelSettingsRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.16em", lineHeight: 1 }}>
                SABAHUB CONTROL PLANE
              </Typography>
              <Typography variant="subtitle1" fontWeight={900}>
                Admin Console
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Enterprise operations, security, and platform systems
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ px: 1.25, pb: 1 }}>
          <ListItemButton
            component={Link}
            href="/admin"
            selected={pathname === "/admin"}
            sx={{
              borderRadius: 3,
              mb: 0.8,
              py: 1,
              px: 1.25,
              bgcolor: pathname === "/admin" ? "rgba(4,56,115,0.14)" : "rgba(255,255,255,0.68)",
              border: "1px solid",
              borderColor: pathname === "/admin" ? "rgba(4,56,115,0.3)" : "rgba(148,163,184,0.18)",
              transition: "all 180ms ease",
              "&:hover": { bgcolor: "rgba(4,56,115,0.08)" },
              "&.Mui-selected": {
                bgcolor: "rgba(4,56,115,0.18)",
                boxShadow: "0 12px 28px rgba(4,56,115,0.12)",
              },
              "&.Mui-selected:hover": { bgcolor: "rgba(4,56,115,0.18)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: pathname === "/admin" ? "primary.main" : "text.secondary" }}>
              <DashboardRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Command Center"
              secondary="Cross-platform overview, alerts, and control-plane signals"
              primaryTypographyProps={{ fontWeight: pathname === "/admin" ? 900 : 700, fontSize: 14 }}
              secondaryTypographyProps={{ fontSize: 12, color: "text.secondary" }}
            />
          </ListItemButton>
        </Box>

        <Divider />

        <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 1.1 }}>
          {adminNavigationGroups.map((group) => (
            <List
              key={group.key}
              dense
              subheader={
                <ListSubheader
                  component="div"
                  sx={{
                    bgcolor: "transparent",
                    px: 1,
                    py: 0.55,
                    fontWeight: 900,
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: "text.secondary",
                    textTransform: "uppercase",
                    lineHeight: 1.2,
                  }}
                >
                  {group.label}
                </ListSubheader>
              }
              sx={{ mb: 0.6 }}
            >
              {group.items.map((item) => {
                const itemSelected = itemMatches(pathname, sectionQuery, item);
                const isExpanded = expandedParents[item.key];
                const hasChildren = Boolean(item.children?.length);

                return (
                  <Box key={item.key}>
                    <Stack direction="row" spacing={0.4} alignItems="stretch">
                      <ListItemButton
                        onClick={() => router.push(item.href)}
                        selected={itemSelected}
                        sx={{
                          flex: 1,
                          borderRadius: 2.5,
                          mb: 0.28,
                          py: 0.9,
                          px: 1,
                          alignItems: "flex-start",
                          transition: "all 180ms ease",
                          "&:hover": { bgcolor: "rgba(4,56,115,0.08)" },
                          "&.Mui-selected": {
                            bgcolor: "rgba(4,56,115,0.16)",
                            boxShadow: "inset 3px 0 0 #043873",
                          },
                          "&.Mui-selected:hover": { bgcolor: "rgba(4,56,115,0.18)" },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, mt: 0.2, color: itemSelected ? "primary.main" : "text.secondary" }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          secondary={item.description}
                          primaryTypographyProps={{ fontWeight: itemSelected ? 900 : 700, fontSize: 14, lineHeight: 1.2 }}
                          secondaryTypographyProps={{ fontSize: 11.5, lineHeight: 1.3, color: "text.secondary", sx: { mt: 0.25 } }}
                        />
                      </ListItemButton>

                      {hasChildren ? (
                        <IconButton
                          size="small"
                          aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setExpandedParents((prev) => ({ ...prev, [item.key]: !prev[item.key] }));
                          }}
                          sx={{
                            alignSelf: "center",
                            color: itemSelected ? "primary.main" : "text.secondary",
                            bgcolor: isExpanded ? "rgba(4,56,115,0.08)" : "transparent",
                          }}
                        >
                          {isExpanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                        </IconButton>
                      ) : null}
                    </Stack>

                    {hasChildren ? (
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List
                          dense
                          disablePadding
                          sx={{
                            ml: 3.6,
                            mb: 0.45,
                            pl: 1,
                            borderLeft: "1px solid rgba(4,56,115,0.14)",
                          }}
                        >
                          {item.children?.map((child) => {
                            const childSelected = childMatches(pathname, sectionQuery, child);

                            return (
                              <ListItemButton
                                key={child.key}
                                component={Link}
                                href={childHref(child)}
                                selected={childSelected}
                                sx={{
                                  borderRadius: 2,
                                  mb: 0.18,
                                  py: 0.5,
                                  px: 0.9,
                                  transition: "all 160ms ease",
                                  "&:hover": { bgcolor: "rgba(4,56,115,0.07)" },
                                  "&.Mui-selected": {
                                    bgcolor: "rgba(4,56,115,0.14)",
                                  },
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 28, color: childSelected ? "primary.main" : "text.secondary" }}>
                                  {child.icon}
                                </ListItemIcon>
                                <ListItemText
                                  primary={child.label}
                                  primaryTypographyProps={{ fontSize: 12.5, fontWeight: childSelected ? 800 : 600, lineHeight: 1.2 }}
                                />
                              </ListItemButton>
                            );
                          })}
                        </List>
                      </Collapse>
                    ) : null}
                  </Box>
                );
              })}
            </List>
          ))}
        </Box>
      </Box>
    ),
    [expandedParents, pathname, router, sectionQuery],
  );

  return (
    <Box
      className="sheet-shell"
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        background:
          "radial-gradient(1000px 420px at -10% -10%, rgba(4,56,115,0.2), transparent 64%), radial-gradient(760px 340px at 110% 0%, rgba(3,27,78,0.2), transparent 65%), linear-gradient(180deg, rgba(236,243,253,0.92) 0%, rgba(230,239,251,0.9) 100%)",
      }}
    >
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(12px)",
          bgcolor: (t) => alpha(t.palette.background.paper, t.palette.mode === "light" ? 0.95 : 0.88),
          boxShadow: "0 6px 18px rgba(3,27,78,0.12)",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton onClick={() => setSidebarOpen((prev) => !prev)} edge="start" aria-label={sidebarOpen ? "Hide menu" : "Show menu"}>
            <MenuRoundedIcon />
          </IconButton>

          {isDesktop ? (
            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ border: "1px solid", borderColor: "divider", borderRadius: 999, px: 0.6, py: 0.2 }}>
              <IconButton
                size="small"
                aria-label="Decrease sidebar width"
                onClick={() => setSidebarWidth((prev) => Math.max(MIN_DRAWER_WIDTH, prev - 20))}
              >
                <RemoveRoundedIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 54, textAlign: "center" }}>
                {sidebarWidth}px
              </Typography>
              <IconButton
                size="small"
                aria-label="Increase sidebar width"
                onClick={() => setSidebarWidth((prev) => Math.min(MAX_DRAWER_WIDTH, prev + 20))}
              >
                <AddRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          ) : null}

          <Stack sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              Admin Control Plane
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Executive oversight • Operations • Security • Platform systems
            </Typography>
          </Stack>

          <ThemeToggle />
          <SoftButton onClick={onLogout} variant="contained" color="error" size="small">
            Logout
          </SoftButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex" }}>
        <Drawer
          variant={isDesktop ? "persistent" : "temporary"}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: sidebarWidth,
              boxSizing: "border-box",
              top: 64,
              height: "calc(100vh - 64px)",
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: (t) => alpha(t.palette.background.paper, t.palette.mode === "light" ? 0.93 : 0.86),
              background:
                "linear-gradient(175deg, rgba(255,255,255,0.96) 0%, rgba(238,246,255,0.92) 60%, rgba(230,241,255,0.9) 100%), radial-gradient(700px 240px at 0% 0%, rgba(4,56,115,0.14), transparent 70%)",
              backdropFilter: "blur(12px)",
              boxShadow: "10px 0 32px rgba(4,56,115,0.2)",
              overflowX: "hidden",
            },
          }}
        >
          {drawer}
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: isDesktop && sidebarOpen ? `${sidebarWidth}px` : 0,
            p: 0,
            width: "100%",
            maxWidth: "100%",
            transition: "margin-left 220ms ease, padding 180ms ease",
          }}
        >
          <Toolbar />
          <Box
            sx={{
              borderRadius: 0,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: (t) => alpha(t.palette.background.paper, t.palette.mode === "light" ? 0.88 : 0.72),
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(240,247,255,0.86) 100%), radial-gradient(1000px 320px at 100% -20%, rgba(4,56,115,0.1), transparent 66%)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 14px 34px rgba(2,22,56,0.12)",
              p: { xs: 0.5, md: 0.8 },
              minHeight: "calc(100vh - 64px)",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
