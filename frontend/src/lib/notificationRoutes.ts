"use client";

import type { NotificationItem } from "./notifications";
import { normalizeLegacyWorkspaceRoute, workspaceRoutes } from "./workspace-routes";

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function getNotificationHref(notification: NotificationItem): string {
  const payload = notification.payload && typeof notification.payload === "object" ? notification.payload : {};

  const explicitRoute = readString(payload.route);
  const threadId = readString(payload.threadId);
  const contractId = readString(payload.contractId);
  const jobId = readString(payload.jobId || payload.projectId);
  const proposalId = readString(payload.proposalId);

  if (threadId) {
    return `/chat?threadId=${encodeURIComponent(threadId)}`;
  }

  if (contractId) {
    return workspaceRoutes.contractDetail(contractId);
  }

  if (proposalId && jobId) {
    return `${workspaceRoutes.proposalQueue(jobId)}?proposalId=${encodeURIComponent(proposalId)}`;
  }

  if (jobId) {
    if (notification.type === "PROPOSAL_SUBMITTED") {
      return workspaceRoutes.proposalQueue(jobId);
    }

    if (notification.type === "JOB_PUBLISHED") {
      return workspaceRoutes.manageJobDetail(jobId);
    }
  }

  if (explicitRoute) {
    return normalizeLegacyWorkspaceRoute(explicitRoute);
  }

  return workspaceRoutes.notifications;
}
