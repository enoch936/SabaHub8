import type { Job, MarketplaceFreelancer } from "../types/models";
import { api, unwrapResponse } from "./client";

type RawPagePayload<T> = {
  content?: T[];
  items?: T[];
  totalElements?: number;
  total?: number;
  number?: number;
  page?: number;
  size?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
  hasNext: boolean;
};

function normalizePage<T>(raw: RawPagePayload<T> | T[] | null | undefined, page: number, size: number): PaginatedResult<T> {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      page,
      size,
      total: raw.length,
      hasNext: false,
    };
  }
  const data = raw ?? {};
  const items = Array.isArray(data.content) ? data.content : Array.isArray(data.items) ? data.items : [];
  const total = typeof data.totalElements === "number" ? data.totalElements : typeof data.total === "number" ? data.total : items.length;
  const currentPage = typeof data.number === "number" ? data.number : typeof data.page === "number" ? data.page : page;
  return {
    items,
    page: currentPage,
    size,
    total,
    hasNext: (currentPage + 1) * size < total,
  };
}

export async function listOpenJobsPage(options?: { page?: number; size?: number; q?: string }) {
  const page = Math.max(0, options?.page ?? 0);
  const size = Math.max(1, options?.size ?? 20);
  const params: Record<string, string | number> = { page, size };
  if (options?.q) {
    params.q = options.q;
  }
  const response = await api.get("/jobs/browse/open", { params });
  return normalizePage<Job>(unwrapResponse(response, "Unable to load jobs"), page, size);
}

export async function listV2JobsPage(options?: { page?: number; size?: number; status?: string }) {
  const page = Math.max(0, options?.page ?? 0);
  const size = Math.max(1, options?.size ?? 20);
  const params: Record<string, string | number> = { page, size };
  if (options?.status) {
    params.status = options.status;
  }
  const response = await api.get("/v2/jobs", { params });
  return normalizePage<Job>(unwrapResponse(response, "Unable to load jobs"), page, size);
}

export async function listMarketplaceFreelancers(options?: { page?: number; size?: number }) {
  const page = Math.max(0, options?.page ?? 0);
  const size = Math.max(1, options?.size ?? 20);
  const response = await api.get("/freelancer/discover", {
    params: { page, size },
  });
  return normalizePage<MarketplaceFreelancer>(
    unwrapResponse(response, "Unable to load freelancer discovery"),
    page,
    size,
  );
}

export async function listMyGigs() {
  const response = await api.get("/gigs/mine");
  const data = unwrapResponse(response, "Unable to load your gigs");
  return Array.isArray(data) ? data : [];
}

export async function listMyProjectPosts() {
  const response = await api.get("/freelancer/project-posts/mine");
  const data = unwrapResponse(response, "Unable to load your project posts");
  return Array.isArray(data) ? data : [];
}
