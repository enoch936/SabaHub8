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
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import ApiRoundedIcon from "@mui/icons-material/ApiRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ThemeToggle from "@/components/mui/ThemeToggle";
import SoftButton from "@/components/mui/SoftButton";
import { bootstrapSession, useSession } from "@/lib/session";

const DEFAULT_DRAWER_WIDTH = 280;
const MIN_DRAWER_WIDTH = 240;
const MAX_DRAWER_WIDTH = 380;

const adminHierarchy = [
  {
    key: "platform-control",
    label: "Platform Control",
    href: "/admin/platform-control",
    icon: <PrecisionManufacturingRoundedIcon fontSize="small" />,
    children: ["Administer Platform", "Feature Flags", "Uptime Operations", "Disaster Recovery"],
  },
  {
    key: "security-governance",
    label: "Security Governance",
    href: "/admin/security-governance",
    icon: <SecurityRoundedIcon fontSize="small" />,
    children: ["Threat Monitoring", "Incident Response", "Risk Controls", "Security Baselines"],
  },
  {
    key: "user-role",
    label: "User & Role Management",
    href: "/admin/domain/user-role-management",
    icon: <ManageAccountsRoundedIcon fontSize="small" />,
    children: ["Users", "Roles", "Access Policies", "Permissions Audit"],
  },
  {
    key: "marketplace",
    label: "Marketplace Moderation",
    href: "/admin/domain/content-moderation-marketplace-governance",
    icon: <GavelRoundedIcon fontSize="small" />,
    children: ["Content Review", "Policy Violations", "Dispute Handling", "Trust Signals"],
  },
  {
    key: "ai-governance",
    label: "AI Governance",
    href: "/admin/domain/ai-governance-model-management",
    icon: <SmartToyRoundedIcon fontSize="small" />,
    children: ["Model Registry", "Prompt Safety", "Bias Monitoring", "Model Rollback"],
  },
  {
    key: "analytics",
    label: "Analytics & Reporting",
    href: "/admin/domain/analytics-platform-insights",
    icon: <InsightsRoundedIcon fontSize="small" />,
    children: ["KPI Dashboards", "Executive Reports", "Funnel Analytics", "Forecasts"],
  },
  {
    key: "tenant",
    label: "Tenant Management",
    href: "/admin/domain/multi-tenant-platform-management",
    icon: <ApartmentRoundedIcon fontSize="small" />,
    children: ["Tenant Provisioning", "Isolation Policies", "Quota Controls", "Tenant Health"],
  },
  {
    key: "financial",
    label: "Financial Monitoring",
    href: "/admin/domain/payment-financial-oversight",
    icon: <AccountBalanceWalletRoundedIcon fontSize="small" />,
    children: ["Revenue Overview", "Billing Alerts", "Payment Failures", "Settlement Checks"],
  },
  {
    key: "support",
    label: "Operational Support",
    href: "/admin/domain/support-operational-management",
    icon: <SupportAgentRoundedIcon fontSize="small" />,
    children: ["Ticket Queue", "Escalation Matrix", "SLA Tracking", "Support Analytics"],
  },
  {
    key: "infra-monitoring",
    label: "Infrastructure Monitoring",
    href: "/admin/domain/system-monitoring-health-management",
    icon: <MonitorHeartRoundedIcon fontSize="small" />,
    children: ["Service Health", "Latency & Errors", "Capacity Metrics", "Alert Center"],
  },
  {
    key: "devops",
    label: "DevOps & Deployment",
    href: "/admin/domain/devops-infrastructure-management",
    icon: <HubRoundedIcon fontSize="small" />,
    children: ["Release Pipeline", "Deployment Windows", "Rollback Plans", "Environment Config"],
  },
  {
    key: "api",
    label: "API Integration",
    href: "/admin/domain/api-integration-management",
    icon: <ApiRoundedIcon fontSize="small" />,
    children: ["API Gateway", "Rate Limits", "Partner Keys", "Webhook Delivery"],
  },
  {
    key: "compliance",
    label: "Compliance & Privacy",
    href: "/admin/domain/platform-governance",
    icon: <PolicyRoundedIcon fontSize="small" />,
    children: ["Data Retention", "Consent Management", "Audit Readiness", "Regulatory Reports"],
  },
];

const compatibilityLinks = [
  { href: "/admin/users", label: "Users (Legacy Route)", icon: <GroupRoundedIcon fontSize="small" /> },
  { href: "/admin/jobs", label: "Jobs (Legacy Route)", icon: <WorkRoundedIcon fontSize="small" /> },
  { href: "/admin/proposals", label: "Proposals (Legacy Route)", icon: <DescriptionRoundedIcon fontSize="small" /> },
  { href: "/admin/transactions", label: "Transactions (Legacy Route)", icon: <ReceiptLongRoundedIcon fontSize="small" /> },
  { href: "/admin/content", label: "Content (Legacy Route)", icon: <ArticleRoundedIcon fontSize="small" /> },
  { href: "/admin/disputes", label: "Disputes (Legacy Route)", icon: <ReportProblemRoundedIcon fontSize="small" /> },
  { href: "/admin/analytics", label: "Analytics (Legacy Route)", icon: <QueryStatsRoundedIcon fontSize="small" /> },
  { href: "/admin/audit-logs", label: "Audit Logs (Legacy Route)", icon: <PolicyRoundedIcon fontSize="small" /> },
  { href: "/admin/chat", label: "Chat (Legacy Route)", icon: <ChatRoundedIcon fontSize="small" /> },
  { href: "/admin/ai-models", label: "AI Models (Legacy Route)", icon: <SmartToyRoundedIcon fontSize="small" /> },
];

const toBranchKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(adminHierarchy.map((item) => [item.key, true])) as Record<string, boolean>,
  );

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
    const currentParent = adminHierarchy.find((item) => pathname.startsWith(item.href));
    if (currentParent) {
      setExpandedParents((prev) => ({ ...prev, [currentParent.key]: true }));
    }
  }, [pathname]);

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
                width: 34,
                height: 34,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                color: "common.white",
                bgcolor: "#043873",
              }}
            >
              <AdminPanelSettingsRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                Enterprise Admin
              </Typography>
              <Typography variant="caption" color="text.secondary">
                SaaS Platform Control
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <List
          dense
          subheader={
            <ListSubheader component="div" sx={{ bgcolor: "transparent", fontWeight: 800 }}>
              Core Domains
            </ListSubheader>
          }
          sx={{ px: 1, pb: 0 }}
        >
          <ListItemButton
            component={Link}
            href="/admin"
            selected={pathname === "/admin"}
            sx={{
              borderRadius: 2,
              mb: 0.3,
              py: 0.55,
              transition: "all 180ms ease",
              "&:hover": { bgcolor: "rgba(4,56,115,0.08)" },
              "&.Mui-selected": {
                bgcolor: "rgba(4,56,115,0.2)",
                boxShadow: "inset 3px 0 0 #043873",
              },
              "&.Mui-selected:hover": { bgcolor: "rgba(4,56,115,0.18)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: pathname === "/admin" ? "primary.main" : "text.secondary" }}>
              <DashboardRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Command Center" primaryTypographyProps={{ fontWeight: pathname === "/admin" ? 800 : 500 }} />
          </ListItemButton>

          {adminHierarchy.map((parent) => {
            const parentSelected = pathname === parent.href || pathname.startsWith(`${parent.href}/`);
            const isExpanded = expandedParents[parent.key];

            return (
              <Box key={parent.key}>
                <ListItemButton
                  onClick={() => setExpandedParents((prev) => ({ ...prev, [parent.key]: !prev[parent.key] }))}
                  selected={parentSelected}
                  sx={{
                    borderRadius: 2,
                    mb: 0.3,
                    py: 0.55,
                    transition: "all 180ms ease",
                    "&:hover": { bgcolor: "rgba(4,56,115,0.08)" },
                    "&.Mui-selected": {
                      bgcolor: "rgba(4,56,115,0.2)",
                      boxShadow: "inset 3px 0 0 #043873",
                    },
                    "&.Mui-selected:hover": { bgcolor: "rgba(4,56,115,0.18)" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: parentSelected ? "primary.main" : "text.secondary" }}>{parent.icon}</ListItemIcon>
                  <ListItemText primary={parent.label} primaryTypographyProps={{ fontWeight: parentSelected ? 800 : 500 }} />
                  {isExpanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                </ListItemButton>

                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List dense disablePadding>
                    <ListItemButton
                      component={Link}
                      href={parent.href}
                      selected={pathname === parent.href}
                      sx={{
                        borderRadius: 2,
                        mb: 0.15,
                        ml: 1.8,
                        py: 0.45,
                        transition: "all 160ms ease",
                        "&:hover": { bgcolor: "rgba(4,56,115,0.07)" },
                        "&.Mui-selected": {
                          bgcolor: "rgba(4,56,115,0.16)",
                          boxShadow: "inset 2px 0 0 #043873",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 30, color: pathname === parent.href ? "primary.main" : "text.secondary" }}>
                        <FolderRoundedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Overview" primaryTypographyProps={{ fontSize: 13, fontWeight: pathname === parent.href ? 700 : 500 }} />
                    </ListItemButton>

                    {parent.children.map((child) => {
                      const childKey = toBranchKey(child);
                      const childSelected = pathname.startsWith(parent.href) && sectionQuery === childKey;

                      return (
                        <ListItemButton
                          key={childKey}
                          component={Link}
                          href={`${parent.href}?section=${childKey}`}
                          selected={childSelected}
                          sx={{
                            borderRadius: 2,
                            mb: 0.15,
                            ml: 1.8,
                            py: 0.45,
                            transition: "all 160ms ease",
                            "&:hover": { bgcolor: "rgba(4,56,115,0.07)" },
                            "&.Mui-selected": {
                              bgcolor: "rgba(4,56,115,0.16)",
                              boxShadow: "inset 2px 0 0 #043873",
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 30, color: childSelected ? "primary.main" : "text.secondary" }}>
                            <InsertDriveFileOutlinedIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={child} primaryTypographyProps={{ fontSize: 13, fontWeight: childSelected ? 700 : 500 }} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          })}
        </List>

        <Divider sx={{ my: 1 }} />

        <List
          dense
          subheader={
            <ListSubheader component="div" sx={{ bgcolor: "transparent", fontWeight: 800 }}>
              Compatibility Routes
            </ListSubheader>
          }
          sx={{ px: 1, pb: 2, overflowY: "auto" }}
        >
          {compatibilityLinks.map((item) => (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              sx={{
                borderRadius: 2,
                mb: 0.22,
                py: 0.5,
                transition: "all 180ms ease",
                "&:hover": { bgcolor: "rgba(4,56,115,0.08)" },
                "&.Mui-selected": {
                  bgcolor: "rgba(4,56,115,0.2)",
                  boxShadow: "inset 3px 0 0 #043873",
                },
                "&.Mui-selected:hover": { bgcolor: "rgba(4,56,115,0.18)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: pathname === item.href || pathname.startsWith(`${item.href}/`) ? "primary.main" : "text.secondary" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: pathname === item.href || pathname.startsWith(`${item.href}/`) ? 700 : 500 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    ),
    [pathname, sectionQuery, expandedParents],
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
              Admin Command Center
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Infrastructure • Security • Governance • AI • Finance • DevOps
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
