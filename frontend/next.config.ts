import type { NextConfig } from "next";

// We serve API routes from the App Router (e.g., /api/auth-proxy/*), so we
// do not need a global rewrite here. Removing the rewrite ensures the local
// API handlers run instead of being bypassed.
const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      { source: "/dashboard/jobs/new", destination: "/jobs/post", permanent: false },
      { source: "/dashboard/jobs", destination: "/jobs/manage", permanent: false },
      { source: "/dashboard/jobs/:id", destination: "/jobs/manage/:id", permanent: false },
      { source: "/dashboard/analytics", destination: "/jobs/analytics", permanent: false },
      { source: "/dashboard/wallet", destination: "/jobs/wallet", permanent: false },
      { source: "/dashboard/settings", destination: "/jobs/settings", permanent: false },
      { source: "/dashboard/notifications", destination: "/jobs/notifications", permanent: false },
      { source: "/dashboard/contracts/:id", destination: "/jobs/contracts/:id", permanent: false },
      { source: "/dashboard/contracts", destination: "/jobs/contracts", permanent: false },
      { source: "/dashboard/proposals", destination: "/jobs/proposals", permanent: false },
      { source: "/dashboard/content", destination: "/jobs/help", permanent: false },
      { source: "/dashboard/content/admin", destination: "/admin/content", permanent: false },
      { source: "/dashboard/ai", destination: "/jobs/assistant", permanent: false },
      { source: "/dashboard/disputes", destination: "/admin/disputes", permanent: false },
      { source: "/dashboard/disputes/admin", destination: "/admin/disputes", permanent: false },
      { source: "/dashboard/analytics/audit-logs", destination: "/admin/audit-logs", permanent: false },
      { source: "/find-jobs", destination: "/jobs", permanent: false },
      { source: "/employer", destination: "/dashboard", permanent: false },
      { source: "/employer/dashboard", destination: "/dashboard", permanent: false },
      { source: "/employer/analytics", destination: "/jobs/analytics", permanent: false },
      { source: "/employer/contracts/create", destination: "/jobs/contracts", permanent: false },
      { source: "/employer/freelancers", destination: "/jobs", permanent: false },
      { source: "/employer/my-jobs", destination: "/jobs/manage", permanent: false },
      { source: "/employer/post-project", destination: "/jobs/post", permanent: false },
      { source: "/employer/proposals", destination: "/jobs/proposals", permanent: false },
      { source: "/employer/proposals/:projectId", destination: "/jobs/proposals/:projectId", permanent: false },
      { source: "/freelancer", destination: "/dashboard", permanent: false },
      { source: "/freelancer/dashboard", destination: "/dashboard", permanent: false },
      { source: "/freelancer/applications", destination: "/jobs/proposals", permanent: false },
      { source: "/freelancer/earnings", destination: "/jobs/wallet", permanent: false },
      { source: "/freelancer/gigs", destination: "/jobs/projects", permanent: false },
      { source: "/freelancer/profile", destination: "/jobs/settings", permanent: false },
      { source: "/freelancer/projects/search", destination: "/jobs", permanent: false },
      { source: "/freelancer/time-tracker", destination: "/jobs/contracts", permanent: false },
      { source: "/social/messages", destination: "/chat", permanent: false },
    ];
  },
};

export default nextConfig;
