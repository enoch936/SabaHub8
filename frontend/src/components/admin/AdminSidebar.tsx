"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  adminNavigationGroups,
  adminOverviewItem,
  itemMatches,
  type AdminActiveContext,
  type AdminNavigationGroup,
} from "@/lib/admin/navigation";

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

type AdminSidebarProps = {
  activeContext: AdminActiveContext;
  expandedParents: Record<string, boolean>;
  focusedGroup: AdminNavigationGroup;
  isDarkMode: boolean;
  moderationBadges: ModerationSidebarBadges;
  pathname: string;
  role: string | null | undefined;
  sectionQuery: string | null;
  onFocusGroup: (groupKey: string) => void;
  onNavigate: (href: string) => void;
  onToggleParent: (itemKey: string) => void;
};

function getItemBadgeValue(itemKey: string, moderationBadges: ModerationSidebarBadges) {
  switch (itemKey) {
    case "platform-control":
      return moderationBadges.platformControlAlerts;
    case "security-governance":
      return moderationBadges.securityAlerts;
    case "jobs-management":
      return moderationBadges.jobs;
    case "proposals":
      return moderationBadges.proposals;
    case "content-moderation":
      return moderationBadges.flaggedJobs + moderationBadges.openDisputes + moderationBadges.unpublishedPolicyUpdates;
    case "dispute-resolution":
      return moderationBadges.openDisputes;
    case "chat-operations":
      return moderationBadges.unreadMessages;
    default:
      return 0;
  }
}

function formatBadgeValue(value: number) {
  if (value > 999) {
    return "999+";
  }
  if (value > 99) {
    return "99+";
  }
  return String(value);
}

type AdminSidebarItemProps = {
  badgeValue: number;
  href: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  selected: boolean;
};

function AdminSidebarItem({ badgeValue, href, icon, label, onClick, selected }: AdminSidebarItemProps) {
  const theme = useTheme();
  const selectionColor = theme.palette.mode === "dark" ? "#93c5fd" : "#2563eb";
  const selectedBackground = theme.palette.mode === "dark" ? alpha(selectionColor, 0.18) : alpha(selectionColor, 0.1);
  const hoverBackground = theme.palette.mode === "dark" ? alpha(selectionColor, 0.12) : alpha(selectionColor, 0.06);
  const badgeBackground = theme.palette.mode === "dark" ? alpha("#ffffff", 0.08) : alpha("#0f172a", 0.05);
  const badgeColor = selected ? selectionColor : alpha(theme.palette.text.primary, 0.78);

  return (
    <ListItemButton
      component={Link}
      href={href}
      selected={selected}
      onClick={onClick}
      sx={{
        minHeight: 48,
        px: 1.35,
        py: 0.95,
        borderRadius: 2.5,
        alignItems: "center",
        color: selected ? selectionColor : "text.primary",
        bgcolor: selected ? selectedBackground : "transparent",
        "&:hover": { bgcolor: selected ? selectedBackground : hoverBackground },
        "&.Mui-selected:hover": { bgcolor: selectedBackground },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 34,
          color: selected ? selectionColor : alpha(theme.palette.text.primary, 0.68),
        }}
      >
        {icon}
      </ListItemIcon>

      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: 14,
          fontWeight: selected ? 700 : 500,
          lineHeight: 1.15,
          color: selected ? selectionColor : "text.primary",
        }}
        sx={{ my: 0 }}
      />

      {badgeValue > 0 ? (
        <Box
          sx={{
            minWidth: 26,
            height: 26,
            px: 0.9,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            bgcolor: selected ? alpha(selectionColor, 0.14) : badgeBackground,
            color: badgeColor,
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {formatBadgeValue(badgeValue)}
        </Box>
      ) : null}
    </ListItemButton>
  );
}

type AdminSidebarSectionProps = {
  children: ReactNode;
  title: string;
};

function AdminSidebarSection({ children, title }: AdminSidebarSectionProps) {
  const theme = useTheme();

  return (
    <Box>
      <Typography
        sx={{
          px: 1.35,
          mb: 1.05,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: alpha(theme.palette.text.primary, 0.62),
          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>
      <List disablePadding sx={{ display: "grid", gap: 0.5 }}>
        {children}
      </List>
    </Box>
  );
}

export default function AdminSidebar({
  moderationBadges,
  pathname,
  sectionQuery,
  onFocusGroup,
}: AdminSidebarProps) {
  const theme = useTheme();
  const overviewSelected = pathname === adminOverviewItem.href;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        bgcolor: theme.palette.background.paper,
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
      }}
    >
      <Box sx={{ px: 1.6, py: 2 }}>
        <AdminSidebarSection title="Overview">
          <AdminSidebarItem
            badgeValue={0}
            href={adminOverviewItem.href}
            icon={<adminOverviewItem.icon size={18} />}
            label={adminOverviewItem.label}
            selected={overviewSelected}
          />
        </AdminSidebarSection>

        {adminNavigationGroups.map((group) => (
          <Box key={group.key} sx={{ mt: 2.15 }}>
            <Divider sx={{ mb: 2.15 }} />
            <AdminSidebarSection title={group.label}>
              {group.items.map((item) => (
                <AdminSidebarItem
                  key={item.key}
                  badgeValue={getItemBadgeValue(item.key, moderationBadges)}
                  href={item.href}
                  icon={<item.icon size={18} />}
                  label={item.label}
                  onClick={() => onFocusGroup(group.key)}
                  selected={itemMatches(pathname, sectionQuery, item)}
                />
              ))}
            </AdminSidebarSection>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
