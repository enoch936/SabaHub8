import type { NextConfig } from "next";

// We serve API routes from the App Router (e.g., /api/auth-proxy/*), so we
// do not need a global rewrite here. Removing the rewrite ensures the local
// API handlers run instead of being bypassed.
const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      { source: "/dashboard", destination: "/jobs", permanent: true },
      { source: "/dashboard/jobs/new", destination: "/jobs/post", permanent: true },
      { source: "/dashboard/jobs", destination: "/jobs/manage", permanent: true },
      { source: "/dashboard/jobs/:id", destination: "/jobs/manage/:id", permanent: true },
      { source: "/dashboard/analytics", destination: "/jobs/analytics", permanent: true },
      { source: "/dashboard/wallet", destination: "/jobs/wallet", permanent: true },
      { source: "/dashboard/settings", destination: "/jobs/settings", permanent: true },
      { source: "/dashboard/notifications", destination: "/jobs/notifications", permanent: true },
      { source: "/dashboard/contracts/:id", destination: "/jobs/contracts/:id", permanent: true },
      { source: "/dashboard/contracts", destination: "/jobs/contracts", permanent: true },
      { source: "/dashboard/proposals", destination: "/jobs/proposals", permanent: true },
      { source: "/dashboard/content", destination: "/jobs/help", permanent: true },
      { source: "/dashboard/content/admin", destination: "/admin/content", permanent: true },
      { source: "/dashboard/ai", destination: "/jobs/assistant", permanent: true },
      { source: "/dashboard/disputes", destination: "/admin/disputes", permanent: true },
      { source: "/dashboard/disputes/admin", destination: "/admin/disputes", permanent: true },
      { source: "/dashboard/analytics/audit-logs", destination: "/admin/audit-logs", permanent: true },
      { source: "/find-jobs", destination: "/jobs", permanent: true },
      { source: "/employer", destination: "/jobs", permanent: true },
      { source: "/employer/dashboard", destination: "/jobs", permanent: true },
      { source: "/employer/analytics", destination: "/jobs/analytics", permanent: true },
      { source: "/employer/contracts/create", destination: "/jobs/contracts", permanent: true },
      { source: "/employer/freelancers", destination: "/jobs", permanent: true },
      { source: "/employer/my-jobs", destination: "/jobs/manage", permanent: true },
      { source: "/employer/post-project", destination: "/jobs/post", permanent: true },
      { source: "/employer/proposals", destination: "/jobs/proposals", permanent: true },
      { source: "/employer/proposals/:projectId", destination: "/jobs/proposals/:projectId", permanent: true },
      { source: "/freelancer", destination: "/jobs", permanent: true },
      { source: "/freelancer/dashboard", destination: "/jobs", permanent: true },
      { source: "/freelancer/applications", destination: "/jobs/proposals", permanent: true },
      { source: "/freelancer/earnings", destination: "/jobs/wallet", permanent: true },
      { source: "/freelancer/gigs", destination: "/jobs/projects", permanent: true },
      { source: "/freelancer/profile", destination: "/jobs/settings", permanent: true },
      { source: "/freelancer/projects/search", destination: "/jobs", permanent: true },
      { source: "/freelancer/time-tracker", destination: "/jobs/contracts", permanent: true },
    ];
  },
};

export default nextConfig;
