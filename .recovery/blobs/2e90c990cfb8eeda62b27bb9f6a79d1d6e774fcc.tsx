"use client";

import type { ReactNode } from "react";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import ApiRoundedIcon from "@mui/icons-material/ApiRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import SettingsEthernetRoundedIcon from "@mui/icons-material/SettingsEthernetRounded";
import SettingsBackupRestoreRoundedIcon from "@mui/icons-material/SettingsBackupRestoreRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";

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
  accent: string;
  items: AdminHierarchyItem[];
};

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    key: "executive",
    label: "Executive",
    accent: "#0f4c81",
    items: [
      {
        key: "platform-control",
        label: "Platform Control",
        href: "/admin/platform-control",
        icon: <PrecisionManufacturingRoundedIcon fontSize="small" />,
        description: "Release control, runtime guardrails, and recovery execution.",
        children: [
          {
            key: "runtime-controls",
            label: "Runtime Controls",
            href: "/admin/platform-control",
            section: "runtime-controls",
            icon: <SettingsEthernetRoundedIcon fontSize="small" />,
          },
          {
            key: "recovery-operations",
            label: "Recovery Operations",
            href: "/admin/platform-control",
            section: "recovery-operations",
            icon: <SettingsBackupRestoreRoundedIcon fontSize="small" />,
          },
        ],
      },
      {
        key: "security-governance",
        label: "Security Governance",
        href: "/admin/security-governance",
        icon: <SecurityRoundedIcon fontSize="small" />,
        description: "Threat posture, access enforcement, and security response.",
        children: [
          {
            key: "threat-monitoring",
            label: "Threat Monitoring",
            href: "/admin/security-governance",
            section: "threat-monitoring",
            icon: <ManageSearchRoundedIcon fontSize="small" />,
          },
          {
            key: "policy-enforcement",
            label: "Policy Enforcement",
            href: "/admin/security-governance",
            section: "policy-enforcement",
            icon: <GppGoodRoundedIcon fontSize="small" />,
          },
        ],
      },
      {
        key: "analytics",
        label: "Analytics & Reporting",
        href: "/admin/analytics",
        icon: <InsightsRoundedIcon fontSize="small" />,
        description: "Executive reporting, funnel analysis, and operating intelligence.",
      },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    accent: "#0f766e",
    items: [
      {
        key: "users-access",
        label: "Users & Access",
        href: "/admin/users",
        icon: <ManageAccountsRoundedIcon fontSize="small" />,
        description: "User directory, role governance, and tenant access posture.",
        children: [
          {
            key: "role-governance",
            label: "Role Governance",
            href: "/admin/domain/user-role-management",
            icon: <ManageAccountsRoundedIcon fontSize="small" />,
          },
          {
            key: "tenant-management",
            label: "Tenant Management",
            href: "/admin/domain/multi-tenant-platform-management",
            icon: <ApartmentRoundedIcon fontSize="small" />,
          },
        ],
      },
      {
        key: "marketplace-operations",
        label: "Marketplace Operations",
        href: "/admin/jobs",
        icon: <WorkRoundedIcon fontSize="small" />,
        description: "Jobs, proposals, disputes, and moderated marketplace flow.",
        children: [
          {
            key: "proposal-pipeline",
            label: "Proposal Pipeline",
            href: "/admin/proposals",
            icon: <DescriptionRoundedIcon fontSize="small" />,
          },
          {
            key: "content-review",
            label: "Content Review",
            href: "/admin/content",
            icon: <ArticleRoundedIcon fontSize="small" />,
          },
          {
            key: "dispute-resolution",
            label: "Dispute Resolution",
            href: "/admin/disputes",
            icon: <ReportProblemRoundedIcon fontSize="small" />,
          },
        ],
      },
      {
        key: "revenue-risk",
        label: "Revenue & Risk",
        href: "/admin/transactions",
        icon: <AccountBalanceWalletRoundedIcon fontSize="small" />,
        description: "Transaction review, financial exposure, and payout oversight.",
        children: [
          {
            key: "financial-oversight",
            label: "Financial Oversight",
            href: "/admin/domain/payment-financial-oversight",
            icon: <ReceiptLongRoundedIcon fontSize="small" />,
          },
        ],
      },
      {
        key: "chat-operations",
        label: "Chat Operations",
        href: "/admin/chat",
        icon: <ChatRoundedIcon fontSize="small" />,
        description: "Conversation oversight, operational coordination, and escalation flow.",
      },
    ],
  },
  {
    key: "platform",
    label: "Platform Systems",
    accent: "#9a6700",
    items: [
      {
        key: "ai-operations",
        label: "AI Operations",
        href: "/admin/ai-models",
        icon: <SmartToyRoundedIcon fontSize="small" />,
        description: "Model lifecycle, release control, and recommendation governance.",
        children: [
          {
            key: "ai-governance",
            label: "AI Governance Workspace",
            href: "/admin/domain/ai-governance-model-management",
            icon: <SmartToyRoundedIcon fontSize="small" />,
          },
        ],
      },
      {
        key: "infrastructure",
        label: "Infrastructure",
        href: "/admin/domain/system-monitoring-health-management",
        icon: <MonitorHeartRoundedIcon fontSize="small" />,
        description: "Service health, deployment systems, and integration reliability.",
        children: [
          {
            key: "devops-deployments",
            label: "DevOps & Deployments",
            href: "/admin/domain/devops-infrastructure-management",
            icon: <HubRoundedIcon fontSize="small" />,
          },
          {
            key: "api-integrations",
            label: "API & Integrations",
            href: "/admin/domain/api-integration-management",
            icon: <ApiRoundedIcon fontSize="small" />,
          },
        ],
      },
      {
        key: "audit-compliance",
        label: "Audit & Compliance",
        href: "/admin/audit-logs",
        icon: <PolicyRoundedIcon fontSize="small" />,
        description: "Audit trail review, governance policy, and privacy controls.",
        children: [
          {
            key: "compliance-workspace",
            label: "Compliance Workspace",
            href: "/admin/domain/platform-governance",
            icon: <PolicyRoundedIcon fontSize="small" />,
          },
        ],
      },
    ],
  },
];

export const adminHierarchy: AdminHierarchyItem[] = adminNavigationGroups.flatMap((group) => group.items);

export function createInitialExpandedParents() {
  return Object.fromEntries(adminHierarchy.map((item) => [item.key, true])) as Record<string, boolean>;
}

export function toBranchKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
