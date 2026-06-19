"use client";

import type { ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  BriefcaseBusiness,
  ClipboardList,
  FilePlus2,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  OctagonAlert,
  Radio,
  Settings,
  Share2,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { WorkspaceRole } from "@/lib/role-mode";
import { workspaceRoutes } from "@/lib/workspace-routes";

export type WorkspaceNavItem = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  roles?: WorkspaceRole[];
};

export type WorkspaceNavSection = {
  id: string;
  label: string;
  items: WorkspaceNavItem[];
};

export const WORKSPACE_NAV_SECTIONS: WorkspaceNavSection[] = [
  {
    id: "core",
    label: "Workspace",
    items: [
      {
        id: "dashboard",
        label: "Home",
        href: workspaceRoutes.home,
        icon: <LayoutDashboard size={18} />,
      },
      {
        id: "jobs",
        label: "Jobs",
        href: workspaceRoutes.jobs,
        icon: <BriefcaseBusiness size={18} />,
      },
      {
        id: "talent",
        label: "Talent",
        href: workspaceRoutes.talent,
        icon: <UsersRound size={18} />,
      },
      {
        id: "post-job",
        label: "Post Job",
        href: workspaceRoutes.createJob,
        icon: <FilePlus2 size={18} />,
        roles: ["EMPLOYER"],
      },
      {
        id: "projects",
        label: "My Content",
        href: workspaceRoutes.projects,
        icon: <FilePlus2 size={18} />,
        roles: ["FREELANCER"],
      },
      {
        id: "messages",
        label: "Messages",
        href: "/chat",
        icon: <MessageSquare size={18} />,
      },
      {
        id: "streaming",
        label: "Streaming",
        href: workspaceRoutes.stream,
        icon: <Radio size={18} />,
      },
      {
        id: "social",
        label: "Social",
        href: workspaceRoutes.social,
        icon: <Share2 size={18} />,
      },
      {
        id: "ai-service",
        label: "AI Service",
        href: workspaceRoutes.assistant,
        icon: <BrainCircuit size={18} />,
      },
      {
        id: "proposals",
        label: "Proposals",
        href: workspaceRoutes.proposals,
        icon: <ClipboardList size={18} />,
      },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    items: [
      {
        id: "contracts",
        label: "Contracts",
        href: workspaceRoutes.contracts,
        icon: <FolderKanban size={18} />,
      },
      {
        id: "disputes",
        label: "Disputes",
        href: workspaceRoutes.disputes,
        icon: <OctagonAlert size={18} />,
      },
      {
        id: "wallet",
        label: "Wallet",
        href: workspaceRoutes.wallet,
        icon: <WalletCards size={18} />,
      },
      {
        id: "analytics",
        label: "Analytics",
        href: workspaceRoutes.analytics,
        icon: <Activity size={18} />,
      },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      {
        id: "team",
        label: "Team",
        href: workspaceRoutes.team,
        icon: <BriefcaseBusiness size={18} />,
        roles: ["EMPLOYER"],
      },
      {
        id: "profile",
        label: "Profile",
        href: workspaceRoutes.profile,
        icon: <UserRound size={18} />,
      },
      {
        id: "reviews",
        label: "Reviews",
        href: workspaceRoutes.reviews,
        icon: <BadgeCheck size={18} />,
      },
      {
        id: "settings",
        label: "Settings",
        href: workspaceRoutes.settings,
        icon: <Settings size={18} />,
      },
    ],
  },
];

export function getWorkspaceSections(role: WorkspaceRole) {
  return WORKSPACE_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}

export function isWorkspaceNavItemActive(pathname: string, href: string) {
  if (!href) return false;
  if (href === workspaceRoutes.home) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getWorkspaceSurfaceLabel(pathname: string) {
  if (pathname === workspaceRoutes.home) return "Home";
  if (pathname === "/chat") return "Messages";
  if (pathname === workspaceRoutes.stream || pathname.startsWith(`${workspaceRoutes.stream}/`)) {
    return "Streaming";
  }
  if (pathname === workspaceRoutes.assistant || pathname.startsWith(`${workspaceRoutes.assistant}/`)) {
    return "AI Service";
  }
  if (pathname === workspaceRoutes.social || pathname.startsWith(`${workspaceRoutes.social}/`)) {
    return "Social";
  }
  if (pathname === workspaceRoutes.proposals || pathname.startsWith(`${workspaceRoutes.proposals}/`)) {
    return "Proposals";
  }
  if (pathname === workspaceRoutes.disputes || pathname.startsWith(`${workspaceRoutes.disputes}/`)) {
    return "Disputes";
  }
  if (pathname === workspaceRoutes.createJob || pathname.startsWith(`${workspaceRoutes.createJob}/`)) {
    return "Post Job";
  }
  if (pathname === workspaceRoutes.projects || pathname.startsWith(`${workspaceRoutes.projects}/`)) {
    return "My Content";
  }

  const segments = pathname.split("/").filter(Boolean);
  const tail = segments.at(-1);

  if (!tail) return "Home";
  if (tail === "jobs") return "Jobs";

  return tail
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
