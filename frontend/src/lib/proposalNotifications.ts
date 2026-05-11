"use client";

import type { NotificationItem } from "./notifications";
import type { WorkspaceRole } from "./role-mode";

const EMPLOYER_PROPOSAL_TYPES = new Set(["PROPOSAL_SUBMITTED"]);
const FREELANCER_PROPOSAL_TYPES = new Set(["PROPOSAL_ACCEPTED", "PROPOSAL_REJECTED", "PROPOSAL_CANCELLED"]);

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function isProposalNotificationForRole(notification: NotificationItem, role: WorkspaceRole) {
  const type = readString(notification.type).toUpperCase();
  if (!type) {
    return false;
  }

  return role === "EMPLOYER"
    ? EMPLOYER_PROPOSAL_TYPES.has(type)
    : FREELANCER_PROPOSAL_TYPES.has(type);
}

export function countUnreadProposalNotifications(items: NotificationItem[], role: WorkspaceRole) {
  return items.filter((item) => !item.read && isProposalNotificationForRole(item, role)).length;
}

export function hasUnreadProposalNotificationForProposal(
  items: NotificationItem[],
  proposalId: string | undefined,
  role: WorkspaceRole,
) {
  if (role !== "FREELANCER" || !proposalId) {
    return false;
  }

  return items.some((item) => {
    if (item.read || !isProposalNotificationForRole(item, role)) {
      return false;
    }
    return readString(item.payload?.proposalId) === proposalId;
  });
}
