import type { NextConfig } from "next";

// We serve API routes from the App Router (e.g., /api/auth-proxy/*), so we
// do not need a global rewrite here. Removing the rewrite ensures the local
// API handlers run instead of being bypassed.
const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default nextConfig;
