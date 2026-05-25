import { useQuery } from "@tanstack/react-query";
import { adminAnalyticsWorkspace, adminPlatformControl } from "../api";

export function useAdminDashboard(days = 30) {
  return useQuery({
    queryKey: ["admin-dashboard", days],
    queryFn: async () => {
      const [analytics, platform] = await Promise.all([
        adminAnalyticsWorkspace(days),
        adminPlatformControl()
      ]);
      return { analytics, platform };
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}
