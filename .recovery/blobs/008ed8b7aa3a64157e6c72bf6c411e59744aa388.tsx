"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
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

type AdminSidebarLink = {
  key: string;
  label: string;
  caption: string;
  href: string;
  icon: ReactNode;
};

const adminHierarchy = [
  {
    key: "platform-control",
    label: "Platform Control",
    summary: "Runtime switches, uptime orchestration, and platform recovery operations.",
    href: "/admin/platform-control",
    icon: <PrecisionManufacturingRoundedIcon fontSize="small" />,
    children: ["Administer Platform", "Feature Flags", "Uptime Operations", "Disaster Recovery"],
  },
  {
    key: "security-governance",
    label: "Security Governance",
    summary: "Threat operations, risk baselines, incident handling, and trust controls.",
    href: "/admin/security-governance",
    icon: <SecurityRoundedIcon fontSize="small" />,
    children: ["Threat Monitoring", "Incident Response", "Risk Controls", "Security Baselines"],
  },
  {
    key: "user-role",
    label: "User & Role Management",
    summary: "Identity lifecycle, access policies, and internal permission controls.",
    href: "/admin/domain/user-role-management",
    icon: <ManageAccountsRoundedIcon fontSize="small" />,
    children: ["Users", "Roles", "Access Policies", "Permissions Audit"],
  },
  {
    key: "marketplace",
    label: "Marketplace Moderation",
    summary: "Marketplace integrity, disputes, policy violations, and trust review.",
    href: "/admin/domain/content-moderation-marketplace-governance",
    icon: <GavelRoundedIcon fontSize="small" />,
    children: ["Content Review", "Policy Violations", "Dispute Handling", "Trust Signals"],
  },
  {
    key: "ai-governance",
    label: "AI Governance",
    summary: "Model safety, prompt quality, rollout control, and AI compliance.",
    href: "/admin/domain/ai-governance-model-management",
    icon: <SmartToyRoundedIcon fontSize="small" />,
    children: ["Model Registry", "Prompt Safety", "Bias Monitoring", "Model Rollback"],
  },
  {
    key: "analytics",
    label: "Analytics & Reporting",
    summary: "Executive intelligence, funnel reporting, and platform forecasting.",
    href: "/admin/domain/analytics-platform-insights",
    icon: <InsightsRoundedIcon fontSize="small" />,
    children: ["KPI Dashboards", "Executive Reports", "Funnel Analytics", "Forecasts"],
  },
  {
    key: "tenant",
    label: "Tenant Management",
    summary: "Tenant provisioning, quota strategy, and isolation governance.",
    href: "/admin/domain/multi-tenant-platform-management",
    icon: <ApartmentRoundedIcon fontSize="small" />,
    children: ["Tenant Provisioning", "Isolation Policies", "Quota Controls", "Tenant Health"],
  },
  {
    key: "financial",
    label: "Financial Monitoring",
    summary: "Revenue oversight, settlement controls, and payment anomaly review.",
    href: "/admin/domain/payment-financial-oversight",
    icon: <AccountBalanceWalletRoundedIcon fontSize="small" />,
    children: ["Revenue Overview", "Billing Alerts", "Payment Failures", "Settlement Checks"],
  },
  {
    key: "support",
    label: "Operational Support",
    summary: "Escalation workflows, SLA tracking, and support operations.",
    href: "/admin/domain/support-operational-management",
    icon: <SupportAgentRoundedIcon fontSize="small" />,
    children: ["Ticket Queue", "Escalation Matrix", "SLA Tracking", "Support Analytics"],
  },
  {
    key: "infra-monitoring",
    label: "Infrastructure Monitoring",
    summary: "Service health, latency visibility, and operational telemetry.",
    href: "/admin/domain/system-monitoring-health-management",
    icon: <MonitorHeartRoundedIcon fontSize="small" />,
    children: ["Service Health", "Latency & Errors", "Capacity Metrics", "Alert Center"],
  },
  {
    key: "devops",
    label: "DevOps & Deployment",
    summary: "Release management, environment readiness, and rollback posture.",
    href: "/admin/domain/devops-infrastructure-management",
    icon: <HubRoundedIcon fontSize="small" />,
    children: ["Release Pipeline", "Deployment Windows", "Rollback Plans", "Environment Config"],
  },
  {
    key: "api",
    label: "API Integration",
    summary: "Gateway controls, external integrations, partner keys, and webhook delivery.",
    href: "/admin/domain/api-integration-management",
    icon: <ApiRoundedIcon fontSize="small" />,
    children: ["API Gateway", "Rate Limits", "Partner Keys", "Webhook Delivery"],
  },
  {
    key: "compliance",
    label: "Compliance & Privacy",
    summary: "Data governance, consent posture, and audit-readiness controls.",
    href: "/admin/domain/platform-governance",
    icon: <PolicyRoundedIcon fontSize="small" />,
    children: ["Data Retention", "Consent Management", "Audit Readiness", "Regulatory Reports"],
  },
];

const executiveLinks: AdminSidebarLink[] = [
  {
    key: "command-center",
    label: "Command Center",
    caption: "Executive overview, live metrics, queues, and platform health.",
    href: "/admin",
    icon: <DashboardRoundedIcon fontSize="small" />,
  },
  {
    key: "platform-control",
    label: "Platform Control",
    caption: "Feature flags, uptime operations, and recovery controls.",
    href: "/admin/platform-control",
    icon: <PrecisionManufacturingRoundedIcon fontSize="small" />,
  },
  {
    key: "security-governance",
    label: "Security Governance",
    caption: "Threat monitoring, incident response, and trust posture.",
    href: "/admin/security-governance",
    icon: <SecurityRoundedIcon fontSize="small" />,
  },
  {
    key: "analytics",
    label: "Analytics Hub",
    caption: "Reporting, funnels, and executive performance views.",
    href: "/admin/analytics",
    icon: <QueryStatsRoundedIcon fontSize="small" />,
  },
];

const operationsLinks: AdminSidebarLink[] = [
  {
    key: "users",
    label: "Users & Access",
    caption: "Accounts, identity checks, roles, and suspension actions.",
    href: "/admin/users",
    icon: <GroupRoundedIcon fontSize="small" />,
  },
  {
    key: "jobs",
    label: "Jobs & Supply",
    caption: "Marketplace supply, job status review, and publishing control.",
    href: "/admin/jobs",
    icon: <WorkRoundedIcon fontSize="small" />,
  },
  {
    key: "proposals",
    label: "Proposals Pipeline",
    caption: "Marketplace submissions, review queues, and conversion flow.",
    href: "/admin/proposals",
    icon: <DescriptionRoundedIcon fontSize="small" />,
  },
  {
    key: "transactions",
    label: "Payments & Wallets",
    caption: "Transactions, local top-ups, and manual financial review.",
    href: "/admin/transactions",
    icon: <ReceiptLongRoundedIcon fontSize="small" />,
  },
  {
    key: "disputes",
    label: "Disputes & Trust",
    caption: "Dispute resolution, fraud pressure, and escalation handling.",
    href: "/admin/disputes",
    icon: <ReportProblemRoundedIcon fontSize="small" />,
  },
  {
    key: "content",
    label: "Content Governance",
    caption: "Moderation inventory, policies, and editorial administration.",
    href: "/admin/content",
    icon: <ArticleRoundedIcon fontSize="small" />,
  },
  {
    key: "chat",
    label: "Chat Oversight",
    caption: "Internal messaging visibility and conversation administration.",
    href: "/admin/chat",
    icon: <ChatRoundedIcon fontSize="small" />,
  },
];

const systemsLinks: AdminSidebarLink[] = [
  {
    key: "audit",
    label: "Audit Logs",
    caption: "Governance evidence, compliance history, and change traceability.",
    href: "/admin/audit-logs",
    icon: <PolicyRoundedIcon fontSize="small" />,
  },
  {
    key: "ai-models",
    label: "AI Models",
    caption: "Model inventory, governance posture, and AI administration.",
    href: "/admin/ai-models",
    icon: <SmartToyRoundedIcon fontSize="small" />,
  },
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
    () => {
      const isActive = (href: string) =>
        href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

      const renderLinkItem = (item: AdminSidebarLink) => {
        const selected = isActive(item.href);

        return (
          <ListItemButton
            key={item.key}
            component={Link}
            href={item.href}
            selected={selected}
            sx={{
              borderRadius: 2.4,
              alignItems: "flex-start",
              mb: 0.5,
              px: 1.1,
              py: 0.9,
              transition: "all 180ms ease",
              "&:hover": { bgcolor: "rgba(4,56,115,0.08)" },
              "&.Mui-selected": {
                bgcolor: "rgba(4,56,115,0.15)",
                boxShadow: "inset 3px 0 0 #043873",
              },
              "&.Mui-selected:hover": { bgcolor: "rgba(4,56,115,0.18)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, pt: 0.25, color: selected ? "primary.main" : "text.secondary" }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              secondary={item.caption}
              primaryTypographyProps={{ fontWeight: selected ? 800 : 700, fontSize: 14 }}
              secondaryTypographyProps={{ fontSize: 12, color: "text.secondary", sx: { mt: 0.15, lineHeight: 1.45 } }}
            />
          </ListItemButton>
        );
      };

      const renderSection = (title: string, caption: string, items: AdminSidebarLink[]) => (
        <Box sx={{ mb: 1.8 }}>
          <Box sx={{ px: 1, pb: 0.8 }}>
            <Typography variant="overline" fontWeight={900} sx={{ letterSpacing: "0.08em", color: "text.secondary" }}>
              {title}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              {caption}
            </Typography>
          </Box>
          <List dense disablePadding>
            {items.map(renderLinkItem)}
          </List>
        </Box>
      );

      return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, pb: 1.25 }}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.4,
                  display: "grid",
                  placeItems: "center",
                  color: "common.white",
                  background: "linear-gradient(135deg, #043873 0%, #0ea5e9 100%)",
                  boxShadow: "0 12px 22px rgba(4,56,115,0.24)",
                }}
              >
                <AdminPanelSettingsRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Administration
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Governance, operations, and platform control
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ px: 1.5, pb: 1.5 }}>
            <Box
              sx={{
                borderRadius: 3,
                p: 1.4,
                color: "common.white",
                background:
                  "linear-gradient(135deg, rgba(4,56,115,0.98) 0%, rgba(11,91,209,0.94) 48%, rgba(14,165,233,0.9) 100%)",
                boxShadow: "0 18px 36px rgba(4,56,115,0.24)",
              }}
            >
              <Typography variant="overline" fontWeight={900} sx={{ opacity: 0.84 }}>
                ADMIN WORKSPACE
              </Typography>
              <Typography variant="subtitle1" fontWeight={900}>
                Professional Navigation
              </Typography>
              <Typography variant="caption" sx={{ display: "block", opacity: 0.88, mt: 0.35, lineHeight: 1.5 }}>
                Executive command, operational queues, and domain suites organized by responsibility.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", px: 1.25, pb: 2 }}>
            {renderSection("Executive", "Command, analytics, and top-level control surfaces.", executiveLinks)}
            {renderSection("Operations", "Daily workflows and active marketplace queues.", operationsLinks)}

            <Box sx={{ mb: 1.8 }}>
              <Box sx={{ px: 1, pb: 0.8 }}>
                <Typography variant="overline" fontWeight={900} sx={{ letterSpacing: "0.08em", color: "text.secondary" }}>
                  Domain Suites
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Specialized workspaces for platform, compliance, AI, and infrastructure teams.
                </Typography>
              </Box>

              <List dense disablePadding>
                {adminHierarchy.map((parent) => {
                  const parentSelected = isActive(parent.href);
                  const isExpanded = expandedParents[parent.key];

                  return (
                    <Box key={parent.key} sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => setExpandedParents((prev) => ({ ...prev, [parent.key]: !prev[parent.key] }))}
                        selected={parentSelected}
                        sx={{
                          borderRadius: 2.4,
                          alignItems: "flex-start",
                          px: 1.1,
                          py: 0.9,
                          transition: "all 180ms ease",
                          "&:hover": { bgcolor: "rgba(4,56,115,0.08)" },
                          "&.Mui-selected": {
                            bgcolor: "rgba(4,56,115,0.15)",
                            boxShadow: "inset 3px 0 0 #043873",
                          },
                          "&.Mui-selected:hover": { bgcolor: "rgba(4,56,115,0.18)" },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 34, pt: 0.25, color: parentSelected ? "primary.main" : "text.secondary" }}>
                          {parent.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={parent.label}
                          secondary={parent.summary}
                          primaryTypographyProps={{ fontWeight: parentSelected ? 800 : 700, fontSize: 14 }}
                          secondaryTypographyProps={{ fontSize: 12, color: "text.secondary", sx: { mt: 0.15, lineHeight: 1.45 } }}
                        />
                        {isExpanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                      </ListItemButton>

                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List dense disablePadding sx={{ mt: 0.35 }}>
                          <ListItemButton
                            component={Link}
                            href={parent.href}
                            selected={pathname === parent.href}
                            sx={{
                              borderRadius: 2,
                              mb: 0.15,
                              ml: 2.1,
                              py: 0.55,
                              transition: "all 160ms ease",
                              "&:hover": { bgcolor: "rgba(4,56,115,0.07)" },
                              "&.Mui-selected": {
                                bgcolor: "rgba(4,56,115,0.12)",
                                boxShadow: "inset 2px 0 0 #043873",
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 30, color: pathname === parent.href ? "primary.main" : "text.secondary" }}>
                              <FolderRoundedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Workspace Overview"
                              primaryTypographyProps={{ fontSize: 13, fontWeight: pathname === parent.href ? 700 : 500 }}
                            />
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
                                  ml: 2.1,
                                  py: 0.55,
                                  transition: "all 160ms ease",
                                  "&:hover": { bgcolor: "rgba(4,56,115,0.07)" },
                                  "&.Mui-selected": {
                                    bgcolor: "rgba(4,56,115,0.12)",
                                    boxShadow: "inset 2px 0 0 #043873",
                                  },
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 30, color: childSelected ? "primary.main" : "text.secondary" }}>
                                  <InsertDriveFileOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={child}
                                  primaryTypographyProps={{ fontSize: 13, fontWeight: childSelected ? 700 : 500 }}
                                />
                              </ListItemButton>
                            );
                          })}
                        </List>
                      </Collapse>
                    </Box>
                  );
                })}
              </List>
            </Box>

            {renderSection("Systems", "Auditability, model control, and supporting administration surfaces.", systemsLinks)}
          </Box>
        </Box>
      );
    },
    [expandedParents, pathname, sectionQuery],
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
