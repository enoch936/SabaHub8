"use client";

import type { ReactNode } from "react";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import VideoLibraryRoundedIcon from "@mui/icons-material/VideoLibraryRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import OutlinedFlagRoundedIcon from "@mui/icons-material/OutlinedFlagRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import SettingsEthernetRoundedIcon from "@mui/icons-material/SettingsEthernetRounded";
import SettingsBackupRestoreRoundedIcon from "@mui/icons-material/SettingsBackupRestoreRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import ApiRoundedIcon from "@mui/icons-material/ApiRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";

const primaryIconSx = { fontSize: 18 };
const secondaryIconSx = { fontSize: 16 };

export type AdminHierarchyChild = {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
  section?: string;
};

export type AdminHierarchyItem = {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
  description: string;
  children?: AdminHierarchyChild[];
};

export type AdminNavigationGroup = {
  key: string;
  label: string;
  shortLabel: string;
  accent: string;
  icon: ReactNode;
  summary: string;
  items: AdminHierarchyItem[];
};

export type AdminActiveContext = {
  group: AdminNavigationGroup | null;
  item: AdminHierarchyItem | null;
  child: AdminHierarchyChild | null;
};

export const adminOverviewItem: AdminHierarchyItem = {
  key: "dashboard",
  label: "Dashboard",
  href: "/admin",
  icon: <HomeRoundedIcon sx={primaryIconSx} />,
  description: "Executive overview, live posture, and operational status.",
};

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    key: "executive",
    label: "Executive",
    shortLabel: "EX",
    accent: "#2f5bd1",
    icon: <BarChartRoundedIcon sx={primaryIconSx} />,
    summary: "Strategic platform control, security governance, and reporting.",
    items: [
      {
        key: "platform-control",
        label: "Platform Control",
        href: "/admin/platform-control",
        icon: <BoltRoundedIcon sx={primaryIconSx} />,
        description: "Platform controls, runtime actions, recovery operations, and infrastructure access.",
        children: [
          {
            key: "runtime-controls",
            label: "Runtime Controls",
            href: "/admin/platform-control",
            section: "runtime-controls",
            icon: <SettingsEthernetRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "recovery-operations",
            label: "Recovery Operations",
            href: "/admin/platform-control",
            section: "recovery-operations",
            icon: <SettingsBackupRestoreRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "platform-administration",
            label: "Platform Administration",
            href: "/admin/domain/platform-administration",
            icon: <BoltRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "system-monitoring-health-management",
            label: "System Monitoring",
            href: "/admin/monitoring",
            icon: <MonitorHeartRoundedIcon sx={secondaryIconSx} />,
          },

          {
            key: "devops-infrastructure",
            label: "DevOps & Infrastructure",
            href: "/admin/domain/devops-infrastructure-management",
            icon: <HubRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "api-integrations",
            label: "API Integrations",
            href: "/admin/domain/api-integration-management",
            icon: <ApiRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "data-operations",
            label: "Data Operations",
            href: "/admin/domain/data-management",
            icon: <StorageRoundedIcon sx={secondaryIconSx} />,
          },
        ],
      },
      {
        key: "security-governance",
        label: "Security Governance",
        href: "/admin/security-governance",
        icon: <ShieldRoundedIcon sx={primaryIconSx} />,
        description: "Security posture, threat monitoring, and compliance enforcement.",
        children: [
          {
            key: "threat-monitoring",
            label: "Threat Monitoring",
            href: "/admin/security-governance",
            section: "threat-monitoring",
            icon: <ShieldRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "policy-enforcement",
            label: "Policy Enforcement",
            href: "/admin/security-governance",
            section: "policy-enforcement",
            icon: <FactCheckRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "security-monitoring-compliance",
            label: "Security Monitoring & Compliance",
            href: "/admin/domain/security-monitoring-compliance",
            icon: <ShieldRoundedIcon sx={secondaryIconSx} />,
          },
        ],
      },
      {
        key: "analytics-reporting",
        label: "Analytics & Reporting",
        href: "/admin/analytics",
        icon: <BarChartRoundedIcon sx={primaryIconSx} />,
        description: "Operational analytics, reporting, and executive insights.",
        children: [
          {
            key: "analytics-platform-insights",
            label: "Analytics Platform Insights",
            href: "/admin/domain/analytics-platform-insights",
            icon: <BarChartRoundedIcon sx={secondaryIconSx} />,
          },
        ],
      },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    shortLabel: "OP",
    accent: "#0f766e",
    icon: <WorkOutlineRoundedIcon sx={primaryIconSx} />,
    summary: "Marketplace operations, financial controls, moderation, and communications.",
    items: [
      {
        key: "users-access",
        label: "Users & Access",
        href: "/admin/users",
        icon: <GroupsRoundedIcon sx={primaryIconSx} />,
        description: "User directory, access control, verification, and role administration.",
        children: [
          {
            key: "identity-operations",
            label: "Identity Operations",
            href: "/admin/identity",
            icon: <VerifiedUserRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "role-governance",
            label: "Role Governance",
            href: "/admin/domain/user-role-management",
            icon: <ManageAccountsRoundedIcon sx={secondaryIconSx} />,
          },
        ],
      },
      {
        key: "tenant-management",
        label: "Tenant Management",
        href: "/admin/tenants",
        icon: <ApartmentRoundedIcon sx={primaryIconSx} />,
        description: "Tenant lifecycle, environments, and operational isolation.",
        children: [
          {
            key: "multi-tenant-platform-management",
            label: "Multi-Tenant Platform Management",
            href: "/admin/domain/multi-tenant-platform-management",
            icon: <ApartmentRoundedIcon sx={secondaryIconSx} />,
          },
        ],
      },
      {
        key: "workspace-management",
        label: "Workspace Management",
        href: "/admin/workspaces",
        icon: <BusinessCenterRoundedIcon sx={primaryIconSx} />,
        description: "User organization directory, team health, and workspace-level audits.",
      },
      {
        key: "jobs-management",
        label: "Jobs Management",
        href: "/admin/jobs",
        icon: <WorkOutlineRoundedIcon sx={primaryIconSx} />,
        description: "Job queues, publishing oversight, and listing reviews.",
      },
      {
        key: "media-management",
        label: "Media & Assets",
        href: "/admin/media",
        icon: <VideoLibraryRoundedIcon sx={primaryIconSx} />,
        description: "Cloud storage analytics, file distribution, and global asset management.",
      },
      {
        key: "proposals",
        label: "Proposals",
        href: "/admin/proposals",
        icon: <DescriptionRoundedIcon sx={primaryIconSx} />,
        description: "Proposal pipeline review, approvals, and intervention.",
        children: [
          {
            key: "proposal-pipeline",
            label: "Proposal Pipeline",
            href: "/admin/domain/proposal-pipeline",
            icon: <DescriptionRoundedIcon sx={secondaryIconSx} />,
          },
        ],
      },
      {
        key: "content-moderation",
        label: "Content Moderation",
        href: "/admin/content-moderation",
        icon: <OutlinedFlagRoundedIcon sx={primaryIconSx} />,
        description: "Marketplace trust and safety, policy review, and moderation queues.",
        children: [
          {
            key: "content-review",
            label: "Content Review",
            href: "/admin/content",
            icon: <OutlinedFlagRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "content-moderation-marketplace-governance",
            label: "Marketplace Governance",
            href: "/admin/domain/content-moderation-marketplace-governance",
            icon: <OutlinedFlagRoundedIcon sx={secondaryIconSx} />,
          },
        ],
      },
      {
        key: "dispute-resolution",
        label: "Dispute Resolution",
        href: "/admin/disputes",
        icon: <ReportProblemRoundedIcon sx={primaryIconSx} />,
        description: "Dispute investigations, resolution workflows, and escalation handling.",
      },
      {
        key: "financial-operations",
        label: "Financial Operations",
        href: "/admin/financial-operations",
        icon: <AttachMoneyRoundedIcon sx={primaryIconSx} />,
        description: "Payments, transactions, withdrawals, and financial oversight.",
        children: [
          {
            key: "transactions",
            label: "Transaction Queue",
            href: "/admin/transactions",
            icon: <ReceiptLongRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "payment-financial-oversight",
            label: "Financial Oversight",
            href: "/admin/domain/payment-financial-oversight",
            icon: <AttachMoneyRoundedIcon sx={secondaryIconSx} />,
          },
        ],
      },
      {
        key: "chat-operations",
        label: "Chat & Support",
        href: "/admin/chat-moderation",
        icon: <ChatBubbleOutlineRoundedIcon sx={primaryIconSx} />,
        description: "Support ticket management, user moderation, and chat oversight.",
      },
      {
        key: "notification-center",
        label: "Notification Center",
        href: "/admin/notifications",
        icon: <CampaignRoundedIcon sx={primaryIconSx} />,
        description: "System announcements, broadcast logs, and delivery channel oversight.",
      },
    ],
  },
  {
    key: "platform",
    label: "Platform Systems",
    shortLabel: "PS",
    accent: "#8b5e34",
    icon: <PsychologyRoundedIcon sx={primaryIconSx} />,
    summary: "AI governance, audit trails, and platform compliance systems.",
    items: [
      {
        key: "ai-operations",
        label: "AI Operations",
        href: "/admin/ai-models",
        icon: <PsychologyRoundedIcon sx={primaryIconSx} />,
        description: "Model lifecycle, dataset controls, and AI governance operations.",
        children: [
          {
            key: "ai-usage-analytics",
            label: "AI Usage",
            href: "/admin/ai-usage",
            icon: <TrendingUpRoundedIcon sx={secondaryIconSx} />,
          },
          {
            key: "ai-governance-model-management",
            label: "AI Governance",
            href: "/admin/domain/ai-governance-model-management",
            icon: <PsychologyRoundedIcon sx={secondaryIconSx} />,
          },
        ],
      },
      {
        key: "audit-compliance",
        label: "Audit & Compliance",
        href: "/admin/audit-logs",
        icon: <FactCheckRoundedIcon sx={primaryIconSx} />,
        description: "Audit trails, governance reviews, and compliance controls.",
        children: [
          {
            key: "platform-governance",
            label: "Platform Governance",
            href: "/admin/domain/platform-governance",
            icon: <FactCheckRoundedIcon sx={secondaryIconSx} />,
          },
        ],
      },
      {
        key: "admin-settings",
        label: "Admin Settings",
        href: "/admin/settings",
        icon: <SettingsSuggestRoundedIcon sx={primaryIconSx} />,
        description: "Global platform configuration, branding, and registration policies.",
      },
    ],
  },
];

export const adminHierarchy: AdminHierarchyItem[] = adminNavigationGroups.flatMap((group) => group.items);

export function routeMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function childMatches(pathname: string, sectionQuery: string | null, child: AdminHierarchyChild) {
  if (child.section) {
    return routeMatches(pathname, child.href) && sectionQuery === child.section;
  }

  return routeMatches(pathname, child.href);
}

export function itemMatches(pathname: string, sectionQuery: string | null, item: AdminHierarchyItem) {
  return routeMatches(pathname, item.href) || (item.children ?? []).some((child) => childMatches(pathname, sectionQuery, child));
}

export function resolveActiveAdminContext(pathname: string, sectionQuery: string | null): AdminActiveContext {
  if (pathname === adminOverviewItem.href) {
    return { group: null, item: adminOverviewItem, child: null };
  }

  for (const group of adminNavigationGroups) {
    for (const item of group.items) {
      const matchedChild = item.children?.find((child) => childMatches(pathname, sectionQuery, child)) ?? null;

      if (matchedChild || routeMatches(pathname, item.href)) {
        return { group, item, child: matchedChild };
      }
    }
  }

  const fallbackItem = adminHierarchy.find((item) => itemMatches(pathname, sectionQuery, item)) ?? null;
  return { group: null, item: fallbackItem, child: null };
}

export function createInitialExpandedParents() {
  return Object.fromEntries(adminHierarchy.map((item) => [item.key, true])) as Record<string, boolean>;
}

export function toBranchKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
