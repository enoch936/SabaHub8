"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AppBar,
  Box,
  Chip,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemIcon,
  ListItemButton,
  ListItemText,
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
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 28%), radial-gradient(560px 220px at 100% 0%, rgba(15,76,129,0.14), transparent 72%)",
            pointerEvents: "none",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: 1,
            background: "linear-gradient(180deg, rgba(15,76,129,0.2), rgba(15,76,129,0.04))",
            pointerEvents: "none",
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 2.2,
            pb: 1.6,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                color: "common.white",
                background: "linear-gradient(145deg, #082032 0%, #0f4c81 60%, #1b9aaa 100%)",
                boxShadow: "0 14px 30px rgba(8,32,50,0.32)",
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

        <Box sx={{ px: 1.25, pb: 1.1, position: "relative", zIndex: 1 }}>
          <ListItemButton
            component={Link}
            href="/admin"
            selected={pathname === "/admin"}
            sx={{
              borderRadius: 3,
              mb: 0.8,
              py: 1.05,
              px: 1.25,
              position: "relative",
              overflow: "hidden",
              bgcolor: pathname === "/admin" ? "rgba(4,56,115,0.16)" : "rgba(255,255,255,0.72)",
              border: "1px solid",
              borderColor: pathname === "/admin" ? "rgba(4,56,115,0.3)" : "rgba(148,163,184,0.18)",
              transition: "all 180ms ease",
              "&:hover": { bgcolor: "rgba(4,56,115,0.08)" },
              "&.Mui-selected": {
                bgcolor: "rgba(4,56,115,0.18)",
                boxShadow: "0 12px 28px rgba(4,56,115,0.12)",
              },
              "&.Mui-selected:hover": { bgcolor: "rgba(4,56,115,0.18)" },
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  pathname === "/admin"
                    ? "linear-gradient(90deg, rgba(15,76,129,0.14), rgba(27,154,170,0.08) 58%, transparent)"
                    : "transparent",
                pointerEvents: "none",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2.25,
                  display: "grid",
                  placeItems: "center",
                  color: pathname === "/admin" ? "primary.main" : "text.secondary",
                  bgcolor: pathname === "/admin" ? "rgba(255,255,255,0.86)" : "rgba(248,250,252,0.96)",
                  border: "1px solid",
                  borderColor: pathname === "/admin" ? "rgba(15,76,129,0.18)" : "rgba(148,163,184,0.14)",
                }}
              >
                <DashboardRoundedIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Command Center"
              secondary="Cross-platform overview, alerts, and control-plane signals"
              primaryTypographyProps={{ fontWeight: pathname === "/admin" ? 900 : 700, fontSize: 14 }}
              secondaryTypographyProps={{ fontSize: 12, color: "text.secondary" }}
            />
            <Chip
              label="Live"
              size="small"
              sx={{
                height: 22,
                fontWeight: 800,
                bgcolor: "rgba(15,76,129,0.08)",
                color: "#0f4c81",
                border: "1px solid rgba(15,76,129,0.12)",
              }}
            />
          </ListItemButton>
        </Box>

        <Divider />

        <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 1.1, position: "relative", zIndex: 1 }}>
          {adminNavigationGroups.map((group) => (
            <Box
              key={group.key}
              sx={{
                mb: 1.05,
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha(group.accent, 0.16),
                bgcolor: alpha("#ffffff", 0.54),
                background: `linear-gradient(180deg, ${alpha(group.accent, 0.08)} 0%, rgba(255,255,255,0.62) 22%, rgba(255,255,255,0.52) 100%)`,
                backdropFilter: "blur(10px)",
                boxShadow: `0 16px 30px ${alpha(group.accent, 0.08)}`,
                overflow: "hidden",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  px: 1.15,
                  pt: 1,
                  pb: 0.7,
                  borderBottom: `1px solid ${alpha(group.accent, 0.08)}`,
                  background: `linear-gradient(90deg, ${alpha(group.accent, 0.08)}, transparent 72%)`,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      fontWeight: 900,
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      color: group.accent,
                      textTransform: "uppercase",
                      lineHeight: 1.1,
                    }}
                  >
                    {group.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {group.items.length} modules
                  </Typography>
                </Box>
                <Chip
                  label={group.items.length}
                  size="small"
                  sx={{
                    minWidth: 30,
                    height: 22,
                    fontWeight: 900,
                    bgcolor: alpha(group.accent, 0.1),
                    color: group.accent,
                    border: `1px solid ${alpha(group.accent, 0.16)}`,
                  }}
                />
              </Stack>

              <List dense sx={{ px: 0.6, py: 0.7 }}>
                {group.items.map((item) => {
                  const itemSelected = itemMatches(pathname, sectionQuery, item);
                  const isExpanded = expandedParents[item.key];
                  const hasChildren = Boolean(item.children?.length);

                  return (
                    <Box key={item.key}>
                      <Stack direction="row" spacing={0.45} alignItems="stretch">
                        <ListItemButton
                          onClick={() => router.push(item.href)}
                          selected={itemSelected}
                          sx={{
                            flex: 1,
                            borderRadius: 2.6,
                            mb: 0.34,
                            py: 0.95,
                            px: 1,
                            position: "relative",
                            alignItems: "flex-start",
                            bgcolor: itemSelected ? alpha(group.accent, 0.12) : "rgba(255,255,255,0.56)",
                            border: "1px solid",
                            borderColor: itemSelected ? alpha(group.accent, 0.22) : "rgba(148,163,184,0.12)",
                            transition: "all 180ms ease",
                            "&:hover": {
                              bgcolor: alpha(group.accent, 0.08),
                              borderColor: alpha(group.accent, 0.2),
                              transform: "translateX(1px)",
                            },
                            "&.Mui-selected": {
                              bgcolor: alpha(group.accent, 0.14),
                              boxShadow: `0 12px 24px ${alpha(group.accent, 0.12)}`,
                            },
                            "&.Mui-selected:hover": {
                              bgcolor: alpha(group.accent, 0.16),
                            },
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              left: 0,
                              top: 10,
                              bottom: 10,
                              width: 3,
                              borderRadius: "0 999px 999px 0",
                              bgcolor: itemSelected ? group.accent : "transparent",
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, mt: 0.2 }}>
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 2.2,
                                display: "grid",
                                placeItems: "center",
                                color: itemSelected ? group.accent : "text.secondary",
                                bgcolor: itemSelected ? alpha(group.accent, 0.12) : "rgba(248,250,252,0.96)",
                                border: "1px solid",
                                borderColor: itemSelected ? alpha(group.accent, 0.24) : "rgba(148,163,184,0.14)",
                                boxShadow: itemSelected ? `0 10px 18px ${alpha(group.accent, 0.12)}` : "none",
                              }}
                            >
                              {item.icon}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            secondary={item.description}
                            primaryTypographyProps={{
                              fontWeight: itemSelected ? 900 : 700,
                              fontSize: 14,
                              lineHeight: 1.2,
                              color: itemSelected ? group.accent : "text.primary",
                            }}
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
                              mr: 0.12,
                              color: itemSelected ? group.accent : "text.secondary",
                              bgcolor: isExpanded ? alpha(group.accent, 0.1) : "rgba(255,255,255,0.48)",
                              border: `1px solid ${isExpanded ? alpha(group.accent, 0.18) : "rgba(148,163,184,0.12)"}`,
                              boxShadow: isExpanded ? `0 8px 18px ${alpha(group.accent, 0.1)}` : "none",
                              "&:hover": {
                                bgcolor: alpha(group.accent, 0.12),
                              },
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
                              ml: 3.7,
                              mb: 0.5,
                              pl: 1.05,
                              pr: 0.3,
                              position: "relative",
                              "&::before": {
                                content: '""',
                                position: "absolute",
                                left: 0,
                                top: 4,
                                bottom: 4,
                                width: 1,
                                background: `linear-gradient(180deg, ${alpha(group.accent, 0.26)}, ${alpha(group.accent, 0.06)})`,
                              },
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
                                    mb: 0.2,
                                    py: 0.52,
                                    px: 0.9,
                                    transition: "all 160ms ease",
                                    bgcolor: childSelected ? alpha(group.accent, 0.1) : "transparent",
                                    "&:hover": { bgcolor: alpha(group.accent, 0.07) },
                                    "&.Mui-selected": {
                                      bgcolor: alpha(group.accent, 0.12),
                                    },
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <Box
                                      sx={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 1.8,
                                        display: "grid",
                                        placeItems: "center",
                                        color: childSelected ? group.accent : "text.secondary",
                                        bgcolor: childSelected ? alpha(group.accent, 0.12) : "rgba(248,250,252,0.96)",
                                        border: "1px solid",
                                        borderColor: childSelected ? alpha(group.accent, 0.22) : "rgba(148,163,184,0.12)",
                                      }}
                                    >
                                      {child.icon}
                                    </Box>
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={child.label}
                                    primaryTypographyProps={{
                                      fontSize: 12.5,
                                      fontWeight: childSelected ? 800 : 600,
                                      lineHeight: 1.2,
                                      color: childSelected ? group.accent : "text.primary",
                                    }}
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
            </Box>
          ))}
        </Box>

        <Divider />
        <Box sx={{ p: 1.1, position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              borderRadius: 3,
              p: 1.25,
              color: "common.white",
              background: "linear-gradient(145deg, #082032 0%, #0f4c81 55%, #1b9aaa 100%)",
              boxShadow: "0 18px 34px rgba(8,32,50,0.24)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
              <Typography variant="overline" sx={{ letterSpacing: "0.14em", opacity: 0.82, lineHeight: 1 }}>
                SECURE SESSION
              </Typography>
              <Chip
                label={role || "ADMIN"}
                size="small"
                sx={{
                  height: 22,
                  fontWeight: 900,
                  bgcolor: "rgba(255,255,255,0.18)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              />
            </Stack>
            <Typography variant="subtitle2" fontWeight={900}>
              Enterprise workspace active
            </Typography>
            <Typography variant="caption" sx={{ display: "block", opacity: 0.84, lineHeight: 1.4 }}>
              Navigation tuned for executive oversight, operational control, and platform systems management.
            </Typography>
          </Box>
        </Box>
      </Box>
    ),
    [expandedParents, pathname, role, router, sectionQuery],
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
