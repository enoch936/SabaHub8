export const workspaceRoutes = {
  home: "/dashboard",
  jobs: "/jobs",
  social: "/social/feed",
  stream: "/jobs/stream",
  manageJobs: "/jobs/manage",
  createJob: "/jobs/post",
  analytics: "/jobs/analytics",
  wallet: "/jobs/wallet",
  profile: "/jobs/profile",
  settings: "/jobs/settings",
  settingsContact: "/jobs/settings/contact",
  settingsVerify: "/jobs/settings/verify",
  notifications: "/jobs/notifications",
  contracts: "/jobs/contracts",
  disputes: "/jobs/disputes",
  proposals: "/jobs/proposals",
  help: "/jobs/help",
  assistant: "/jobs/assistant",
  talent: "/jobs/talent",
  projects: "/jobs/projects",
  team: "/jobs/team",
  reviews: "/jobs/reviews",
  earnings: "/jobs/wallet",
  publicJobDetail: (jobId: string) => `/jobs/${encodeURIComponent(jobId)}`,
  manageJobDetail: (jobId: string) => `/jobs/manage/${encodeURIComponent(jobId)}`,
  contractDetail: (contractId: string) => `/jobs/contracts/${encodeURIComponent(contractId)}`,
  proposalQueue: (projectId: string) => `/jobs/proposals/${encodeURIComponent(projectId)}`,
  publicProfile: (kind: "employer" | "freelancer", id: string) =>
    `/jobs/profiles/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`,
} as const;

export function normalizeLegacyWorkspaceRoute(path: string): string {
  if (!path.trim()) {
    return path;
  }

  let pathname = path;
  let search = "";

  try {
    const url = new URL(path, "http://localhost");
    pathname = url.pathname;
    search = url.search;
  } catch {
    return path;
  }

  let destination = pathname;

  if (pathname === workspaceRoutes.home) {
    destination = workspaceRoutes.home;
  }

  return `${destination}${search}`;
}
