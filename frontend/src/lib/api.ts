import axios from "axios";

// Use Next.js API proxy for all environments
// The proxy is configured in route.ts to forward to backend at localhost:8080
const API_BASE = "/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => {
    // Normalize empty responses
    if (r && (r.status === 204 || r.data === "")) {
      r.data = null;
    }
    return r;
  },
  (error) => {
    const status = error?.response?.status;
    // Reject only for network unreachable or true server errors
    const networkUnreachable = !error?.response;
    if (networkUnreachable || (typeof status === "number" && status >= 500)) {
      return Promise.reject(error);
    }
    
    // Always reject PATCH/PUT for settings - we need to know if it failed
    const method = error.config?.method?.toUpperCase();
    if (method === "PATCH" || method === "PUT") {
      return Promise.reject(error);
    }
    
    // Reject 403 Forbidden (authorization error)
    if (status === 403) {
      return Promise.reject(error);
    }
    
    // For other statuses (e.g., 4xx), resolve with empty payload
    const emptyResponse = {
      data: error?.response?.data ?? null,
      status: typeof status === "number" ? status : 0,
      statusText: error?.response?.statusText ?? "EMPTY",
      headers: error?.response?.headers ?? {},
      config: error.config,
      request: error.request,
    } as typeof error.response;

    // Optionally handle 401 navigation without throwing
    if (status === 401 && typeof window !== "undefined") {
      // window.location.href = "/login";
    }

    return Promise.resolve(emptyResponse);
  }
);

export type Page<T> = {
  items: T[];
  total: number;
};

// Auth
export async function login(input: { email: string; password: string }) {
  const { data } = await api.post("/auth/login", input);
  return data as { token: string; email: string; fullName: string };
}

export async function register(input: { email: string; password: string; fullName: string }) {
  const { data } = await api.post("/auth/register", input);
  return data as { token: string; email: string; fullName: string };
}

export async function logoutApi() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Ignore errors - client logout still proceeds
  }
}

// User Settings & Profile
export type UserProfile = {
  bio?: string;
  profilePictureUrl?: string;
  location?: string;
  timezone?: string;
  phoneNumber?: string;
  language?: string;
  skills?: string[];
  certifications?: string[];
  expertise?: string;
  yearsOfExperience?: number;
  portfolioUrls?: string[];
  completedProjects?: number;
  averageRating?: number;
  totalReviews?: number;
  hourlyRate?: string;
  availability?: string;
  preferredCategories?: string[];
  openToOpportunities?: boolean;
  paymentMethod?: string;
  taxId?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  hideProfile?: boolean;
  showEarnings?: boolean;
  preferredLanguage?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  identityVerified?: boolean;
  identityVerificationMethod?: string;
  identityVerifiedAt?: number;
  profileViewsCount?: number;
  proposalsSentCount?: number;
  contractsCompletedCount?: number;
  totalEarnings?: number;
  successRate?: number;
};

export async function getUserSettings() {
  const { data } = await api.get("/user/settings");
  return data as UserProfile;
}

export async function updateUserSettings(profile: Partial<UserProfile>) {
  const { data } = await api.patch("/user/settings", profile);
  return data as UserProfile;
}

export async function verifyPhone() {
  const { data } = await api.post("/user/settings/verify-phone");
  return data;
}

export async function requestPhoneVerification() {
  const { data } = await api.post("/user/settings/verify-phone/request");
  return data as { message?: string; success?: boolean };
}

export async function confirmPhoneVerification(otpCode: string) {
  const { data } = await api.post("/user/settings/verify-phone/confirm", { otpCode });
  return data as UserProfile;
}

export async function requestEmailVerification() {
  const { data } = await api.post("/user/settings/verify-email/request");
  return data as { message?: string; success?: boolean };
}

export async function confirmEmailVerification(otpCode: string) {
  const { data } = await api.post("/user/settings/verify-email/confirm", { otpCode });
  return data as UserProfile;
}

export async function verifyIdentity(method: string) {
  const { data } = await api.post("/user/settings/verify-identity", {}, { params: { method } });
  return data;
}

export async function getPublicProfile(userId: string) {
  const { data } = await api.get(`/user/settings/public/${userId}`);
  return data as UserProfile;
}

export async function me() {
  const { data } = await api.get("/auth/me");
  return data as { email: string; fullName: string; roles: string[] };
}

// Jobs
export type Job = {
  id: string;
  title: string;
  description: string;
  overviewText?: string;
  employerId?: string;
  budget?: { min?: number; max?: number; currency?: string };
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  engagementType?: string;
  deliverableType?: string;
  deliverableScopes?: string[];
  workLocation?: string;
  pricingModel?: string;
  rateBreakdown?: Record<string, number>;
  slaDeliveryDays?: number;
  maxConcurrentProjects?: number;
  includedRevisionRounds?: number;
  qualityStandards?: string[];
  requiredFormats?: string[];
  minYearsExperience?: number;
  requiredSkills?: string[];
  requiredTools?: string[];
  requiredQualifications?: string[];
  preferredExperience?: string[];
  requiresPortfolio?: boolean;
  requiresReferences?: boolean;
  minReferenceCount?: number;
  requiresNDA?: boolean;
  requiresBGCheck?: boolean;
  requiresInsurance?: boolean;
  complianceRequirements?: string[];
  dataClassifications?: string[];
  pilotProjectRequired?: boolean;
  pilotProjectScope?: string;
  pilotEstimatedHours?: number;
  preferredVendorOpportunity?: boolean;
  minimumMonthlyCommitment?: number;
  contractTermMonths?: number;
  rateStabilityGuarantee?: boolean;
  categoryId?: string;
  skills?: string[];
  industry?: string[];
  teamSize?: string[];
  companyName?: string;
  closingDate?: string;
  evaluationProcess?: string;
  applicationGuidelineUrls?: string[];
  sampleDocumentUrls?: string[];
  sampleImageUrls?: string[];
  sampleVideoUrls?: string[];
  sampleAudioUrls?: string[];
  isEnterpriseOnly?: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

type RawPagePayload<T> = {
  content?: T[];
  items?: T[];
  totalElements?: number;
  total?: number;
  number?: number;
  page?: number;
  size?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  pageable?: {
    pageNumber?: number;
    pageSize?: number;
  };
};

function toFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizePage<T>(
  payload: RawPagePayload<T> | T[] | null | undefined,
  fallbackPage: number,
  fallbackSize: number
): PaginatedResult<T> {
  const page = Math.max(0, fallbackPage);
  const size = Math.max(1, fallbackSize);

  if (Array.isArray(payload)) {
    const total = payload.length;
    const totalPages = total > 0 ? Math.ceil(total / size) : 0;
    return {
      items: payload,
      total,
      page,
      size,
      totalPages,
      hasPrevious: page > 0,
      hasNext: page + 1 < totalPages,
    };
  }

  const raw = (payload && typeof payload === "object" ? payload : {}) as RawPagePayload<T>;
  const items = Array.isArray(raw.content) ? raw.content : Array.isArray(raw.items) ? raw.items : [];

  const resolvedSize = Math.max(
    1,
    toFiniteNumber(raw.size, toFiniteNumber(raw.pageable?.pageSize, size))
  );
  const resolvedPage = Math.max(
    0,
    toFiniteNumber(raw.number, toFiniteNumber(raw.page, toFiniteNumber(raw.pageable?.pageNumber, page)))
  );
  const total = Math.max(0, toFiniteNumber(raw.totalElements, toFiniteNumber(raw.total, items.length)));
  const totalPages = Math.max(0, toFiniteNumber(raw.totalPages, total > 0 ? Math.ceil(total / resolvedSize) : 0));

  const hasPrevious = typeof raw.first === "boolean" ? !raw.first : resolvedPage > 0;
  const hasNext = typeof raw.last === "boolean" ? !raw.last : resolvedPage + 1 < totalPages;

  return {
    items,
    total,
    page: resolvedPage,
    size: resolvedSize,
    totalPages,
    hasPrevious,
    hasNext,
  };
}

export async function listOpenJobsPage(options?: { page?: number; size?: number }) {
  const page = Math.max(0, options?.page ?? 0);
  const size = Math.max(1, options?.size ?? 20);

  const { data } = await api.get("/jobs/browse/open", {
    params: { page, size },
  });

  return normalizePage<Job>(data as RawPagePayload<Job> | Job[] | null | undefined, page, size);
}

export async function listJobs() {
  const response = await listOpenJobsPage({ page: 0, size: 20 });
  return response.items;
}

export async function getJob(id: string) {
  const { data } = await api.get(`/jobs/${id}`);
  return data as Job;
}

export async function createJob(job: Partial<Job>) {
  const { data } = await api.post("/jobs", job);
  return data as Job;
}

async function uploadMediaFile(endpoint: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(endpoint, formData);
  return data?.url as string | undefined;
}

async function uploadMediaFiles(endpoint: string, files: File[]) {
  if (!files.length) return [] as string[];
  const uploads = await Promise.all(files.map((file) => uploadMediaFile(endpoint, file)));
  return uploads.filter((url): url is string => Boolean(url));
}

export async function uploadJobSampleDocuments(files: File[]) {
  return uploadMediaFiles("/media/upload/report", files);
}

export async function uploadJobSampleImages(files: File[]) {
  return uploadMediaFiles("/media/upload/gallery-image", files);
}

export async function uploadJobSampleVideos(files: File[]) {
  return uploadMediaFiles("/media/upload/promo-video", files);
}

export async function uploadJobSampleAudio(files: File[]) {
  return uploadMediaFiles("/media/upload/audio-content", files);
}

export async function uploadProfileImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/user/settings/avatar", formData);
  if (response.status >= 400) {
    const message =
      typeof response.data === "string"
        ? response.data
        : response.data?.message || "Failed to upload avatar.";
    throw new Error(message);
  }
  const { data } = response;
  return (data?.profilePictureUrl as string | undefined) ?? (data?.url as string | undefined);
}

export async function listEmployerJobs() {
  const { data } = await api.get("/employer/jobs");
  return data as Job[];
}

export type FeaturedFreelancerReview = {
  id: string;
  quote: string;
  name: string;
  role: string;
  rating: number;
  reviewCount: number;
  avatarUrl?: string | null;
};

export async function listFeaturedFreelancerReviews(limit = 3) {
  try {
    const { data } = await api.get("/freelancer/featured-reviews", { params: { limit } });
    if (!Array.isArray(data)) return [] as FeaturedFreelancerReview[];

    return data
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => ({
        id: typeof item.id === "string" ? item.id : "",
        quote: typeof item.quote === "string" ? item.quote : "",
        name: typeof item.name === "string" ? item.name : "Verified Freelancer",
        role: typeof item.role === "string" ? item.role : "Freelancer",
        rating: typeof item.rating === "number" ? item.rating : 0,
        reviewCount: typeof item.reviewCount === "number" ? item.reviewCount : 0,
        avatarUrl: typeof item.avatarUrl === "string" ? item.avatarUrl : undefined,
      }))
      .filter((item) => Boolean(item.id));
  } catch {
    return [] as FeaturedFreelancerReview[];
  }
}

// Proposals
export type Proposal = {
  id: string;
  jobId: string;
  freelancerId?: string;
  coverLetter: string;
  bidAmount: number;
  timelineDays: number;
  status: string;
};

export async function submitProposal(jobId: string, body: { coverLetter: string; bidAmount: number; timelineDays: number }) {
  const { data } = await api.post(`/jobs/${jobId}/proposals`, body);
  return data as Proposal;
}

export async function listJobProposals(jobId: string) {
  const { data } = await api.get(`/employer/jobs/${jobId}/proposals`);
  return data as Proposal[];
}

export async function acceptProposal(proposalId: string) {
  const { data } = await api.post(`/employer/proposals/${proposalId}/accept`);
  return data as any; // Contract
}

// Contracts
export type Contract = {
  id: string;
  jobId: string;
  employerId: string;
  freelancerId: string;
  status: string;
  escrow?: { totalHeld?: number; currency?: string };
};

export async function listContracts() {
  const { data } = await api.get("/contracts");
  return data as Contract[];
}

export async function getContract(id: string) {
  const { data } = await api.get(`/contracts/${id}`);
  return data as Contract;
}

export async function deliverContract(id: string, input: { note?: string; deliveryAssetId?: string }) {
  const { data } = await api.post(`/contracts/${id}/deliver`, input);
  return data as Contract;
}

export async function completeContract(id: string) {
  const { data } = await api.post(`/contracts/${id}/complete`);
  return data as Contract;
}

// Wallet / Payments
export type WalletTransaction = {
  id: string;
  provider?: string | null;
  direction?: "IN" | "OUT" | null;
  status?: string | null;
  reason?: string | null;
  amount?: number | null;
  currency?: string | null;
  referenceId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type WalletSnapshot = {
  userId?: string | null;
  balance: number;
  availableBalance?: number;
  currency: string;
  escrowHeld?: number;
  pendingPayouts?: number;
  holds?: number;
  pendingLocalTopups?: number;
  entries?: Record<string, unknown>[];
  transactions?: WalletTransaction[];
};

export async function getWallet() {
  const { data } = await api.get(`/wallet`);
  return data as WalletSnapshot;
}

export async function initChapa(input: { amount: number; currency?: string }, idempotencyKey?: string) {
  const { data } = await api.post(`/payments/chapa/init`, input, { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined });
  return data as { transactionId: string } & Record<string, any>;
}

export async function localTopupRequest(input: { amount: number; currency?: string; referenceId?: string }, idempotencyKey?: string) {
  const { data } = await api.post(`/payments/local/request`, input, { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined });
  return data as { transactionId: string; status?: string; message?: string };
}

export async function internalWalletTransfer(
  input: { recipient: string; amount: number; currency?: string; note?: string },
  idempotencyKey?: string
) {
  const { data } = await api.post(`/payments/internal/transfer`, input, {
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
  return data as {
    ok: boolean;
    transferReference: string;
    transactionId: string;
    amount: number;
    currency: string;
    senderBalanceAfter: number;
    recipient: { id: string; email: string; fullName?: string };
    idempotent?: boolean;
  };
}

export type PendingLocalTopup = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  providerRef?: string;
  status: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export async function listPendingLocalTopups(options?: { page?: number; size?: number }) {
  const { data } = await api.get(`/admin/payments/local/pending`, {
    params: { page: options?.page ?? 0, size: options?.size ?? 20 },
  });
  return data as {
    content: PendingLocalTopup[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

export async function adminReviewLocal(
  input: { transactionId: string; approved?: boolean; note?: string },
  idempotencyKey?: string
) {
  const { data } = await api.post(`/admin/payments/local/verify`, input, {
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
  return data as { ok: boolean; status?: string; walletCredited?: boolean; idempotent?: boolean };
}

export async function adminVerifyLocal(input: { transactionId: string }, idempotencyKey?: string) {
  return adminReviewLocal({ transactionId: input.transactionId, approved: true }, idempotencyKey);
}

// Escrow
export async function escrowFund(input: { contractId: string; amount: number; currency?: string }) {
  const { data } = await api.post(`/escrow/fund`, input);
  return data as Contract;
}

export async function escrowRelease(input: { contractId: string; amount: number; platformFeeAmount?: number }) {
  const { data } = await api.post(`/escrow/release`, input);
  return data as Contract;
}

export async function escrowRefund(input: { contractId: string; amount: number }) {
  const { data } = await api.post(`/escrow/refund`, input);
  return data as Contract;
}

// Assets
export type Asset = {
  id: string;
  url: string;
  scope: string;
  resourceType: string;
  mimeType?: string;
  size?: number;
};

export async function listAssets() {
  const { data } = await api.get(`/assets`);
  return data as Asset[];
}

export async function getAsset(id: string) {
  const { data } = await api.get(`/assets/${id}`);
  return data as Asset;
}

export async function uploadSignature(params: Record<string, any>) {
  const { data } = await api.post(`/assets/signature`, params);
  return data as any;
}

export async function saveAssetMetadata(body: { scope: string; title?: string; secureUrl: string; publicId: string; resourceType?: string; mimeType?: string; size?: number }) {
  const { data } = await api.post(`/assets`, body);
  return data as Asset;
}

export async function deleteAsset(id: string) {
  const { data } = await api.delete(`/assets/${id}`);
  return data as { ok: boolean };
}

// Chat
export type ChatThread = { id: string; participantIds: string[]; lastMessageAt?: string };
export type ChatMessage = { id: string; threadId: string; senderId: string; type: "TEXT" | "ASSET"; text?: string; assetId?: string; createdAt?: string };

export async function listThreads() {
  const { data } = await api.get(`/chat/threads`);
  return data as ChatThread[];
}

export async function createThread(participantIds: string[]) {
  const { data } = await api.post(`/chat/threads`, { participantIds });
  return data as ChatThread;
}

export async function listMessages(threadId: string) {
  const { data } = await api.get(`/chat/threads/${threadId}/messages`);
  return data as ChatMessage[];
}

export async function sendMessage(threadId: string, message: { type: "TEXT" | "ASSET"; text?: string; assetId?: string }) {
  const { data } = await api.post(`/chat/threads/${threadId}/messages`, message);
  return data as ChatMessage;
}

// Disputes
export type Dispute = { id: string; contractId: string; status: string; reason?: string };

export async function openDispute(input: { contractId: string; reason?: string; evidenceAssetIds?: string[] }) {
  const { data } = await api.post(`/disputes`, input);
  return data as Dispute;
}

export async function listDisputes() {
  const { data } = await api.get(`/disputes`);
  return data as Dispute[];
}

export async function adminPatchDispute(id: string, body: { status?: string; adminNote?: string }) {
  const { data } = await api.patch(`/admin/disputes/${id}`, body);
  return data as Dispute;
}

// Content
export type ContentItem = { id: string; type: string; title: string; body: string; status: string };

export async function listContent(type = "FAQ") {
  const { data } = await api.get(`/content`, { params: { type } });
  return data as ContentItem[];
}

export async function adminCreateContent(item: Partial<ContentItem>) {
  const { data } = await api.post(`/admin/content`, item);
  return data as ContentItem;
}

export async function adminUpdateContent(id: string, patch: Partial<ContentItem>) {
  const { data } = await api.patch(`/admin/content/${id}`, patch);
  return data as ContentItem;
}

// Admin Users
export type AppUser = { id: string; email: string; fullName: string; roles: string[]; suspended?: boolean; documentsVerified?: boolean };

export async function adminListUsers() {
  const { data } = await api.get(`/admin/users`);
  return data as AppUser[];
}

export async function adminPatchUser(id: string, patch: Partial<AppUser>) {
  const { data } = await api.patch(`/admin/users/${id}`, patch);
  return data as AppUser;
}

// Admin Jobs
export async function adminListJobs(status?: string) {
  const { data } = await api.get(`/admin/jobs`, { params: status ? { status } : undefined });
  return data as Job[];
}

export async function adminPatchJob(id: string, patch: Partial<Job>) {
  const { data } = await api.patch(`/admin/jobs/${id}`, patch);
  return data as Job;
}

// Admin Proposals
export async function adminListProposals(status?: string) {
  const { data } = await api.get(`/admin/proposals`, { params: status ? { status } : undefined });
  return data as Proposal[];
}

export async function adminPatchProposal(id: string, patch: Partial<Proposal>) {
  const { data } = await api.patch(`/admin/proposals/${id}`, patch);
  return data as Proposal;
}

// Admin Analytics
export async function adminAnalyticsSummary() {
  const { data } = await api.get(`/admin/analytics/summary`);
  return data as { users: number; jobs: number; revenue: number; disputesOpen: number };
}

export async function adminAnalyticsDaily() {
  const { data } = await api.get(`/admin/analytics/daily`);
  return data as { dates: string[]; users: number[]; jobs: number[]; revenue: number[] };
}

// Admin Announcements
export async function adminBroadcast(message: string) {
  const { data } = await api.post(`/admin/announcements`, { message });
  return data as { ok: boolean };
}
// User Search
/**
 * Get user by ID (primary search method)
 * Every user has a unique MongoDB ID that can be searched
 */
export async function getUserById(userId: string) {
  const { data } = await api.get(`/users/${userId}`);
  return data as AppUser;
}

/**
 * Search user by email
 * Returns single user if found
 */
export async function searchUserByEmail(email: string) {
  const { data } = await api.get(`/users/search/email`, { params: { email } });
  return data as AppUser;
}

/**
 * Search users by name (partial match)
 * Returns array of matching users (max 20 results)
 */
export async function searchUsersByName(name: string) {
  const { data } = await api.get(`/users/search/name`, { params: { name } });
  return data as { query: string; results: AppUser[]; count: number };
}

/**
 * List all users (limited to 100 by default)
 * Useful for admin panels and user discovery
 */
export async function listAllUsers(limit = 100) {
  const { data } = await api.get(`/users/list`, { params: { limit } });
  return data as { total: number; users: AppUser[] };
}
