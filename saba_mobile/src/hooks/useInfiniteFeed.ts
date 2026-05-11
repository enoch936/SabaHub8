import { useInfiniteQuery } from "@tanstack/react-query";
import { listMarketplaceFreelancers, listOpenJobsPage } from "../api/jobs";

export function useInfiniteFeed() {
  const jobsQuery = useInfiniteQuery({
    queryKey: ["feed", "jobs"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => listOpenJobsPage({ page: pageParam, size: 20 }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });

  const freelancersQuery = useInfiniteQuery({
    queryKey: ["feed", "freelancers"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => listMarketplaceFreelancers({ page: pageParam, size: 20 }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });

  return {
    jobsQuery,
    freelancersQuery,
  };
}
