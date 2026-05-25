import axios, { type AxiosResponse } from "axios";
import { ACTIVE_ROLE_STORAGE_KEY } from "./role-mode";
import { getSessionContextHeaders } from "./session-context";
import type { WalletCurrencyCode } from "./types";

// Use Next.js API proxy for all environments
// The proxy is configured in route.ts to forward to backend at localhost:8080
const API_BASE = "/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    const activeRole = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
    const sessionHeaders = await getSessionContextHeaders();
    for (const [header, value] of Object.entries(sessionHeaders)) {
      if (value) {
        config.headers[header] = value;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (activeRole) {
        config.headers["X-Active-Role"] = activeRole;
      }
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
      if (typeof error?.message === "string") {
        error.message = readApiErrorMessage(error?.response?.data, error.message);
      }
      return Promise.reject(error);
    }
    
    // Always reject PATCH/PUT for settings - we need to know if it failed
    const method = error.config?.method?.toUpperCase();
    if (method === "PATCH" || method === "PUT") {
      return Promise.reject(error);
    }
    
    // Reject 403 Forbidden (authorization error)
    if (status === 403) {
      if (typeof error?.message === "string") {
        error.message = readApiErrorMessage(error?.response?.data, "Forbidden");
      }
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readApiErrorMessage(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  const message = record?.message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  const error = record?.error;
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return fallback;
}

function unwrapResponse<T>(response: AxiosResponse<T>, fallback: string): T {
  if (response.status >= 400) {
    throw new Error(readApiErrorMessage(response.data, fallback));
  }
  return response.data;
}

// Auth
export async function login(input: { identifier: string; password: string }) {
  const { data } = await api.post("/auth/login", input);
  return data as { token: string; email: string; username?: string; fullName: string };
}

export async function register(input: {
  email: string;
  username?: string;
  password: string;
  fullName: string;
  country?: string;
  location?: string;
  timezone?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
}) {
  const { data } = await api.post("/auth/register", input);
  return data as { token: string; email: string; username?: string; fullName: string };
}

export async function logoutApi() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Ignore errors - client logout still proceeds
  }
}

export type ActiveSession = {
  jti: string;
  device: string;
  platform?: string;
  browser?: string;
  deviceType?: string;
  deviceId?: string;
  ip: string;
  userAgent: string;
  location?: string;
  timezone?: string;
  language?: string;
  viewport?: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  current: boolean;
};

export async function listActiveSessions() {
  const response = await api.get("/auth/sessions");
  return unwrapResponse(response, "Unable to load active sessions") as { sessions: ActiveSession[]; count: number };
}

export async function revokeSession(jti: string) {
  const response = await api.post(`/auth/sessions/${encodeURIComponent(jti)}/revoke`);
  return unwrapResponse(response, "Unable to sign out that device") as { ok: boolean };
}

export async function revokeOtherSessions() {
  const response = await api.post("/auth/sessions/revoke-others");
  return unwrapResponse(response, "Unable to sign out other devices") as { ok: boolean; revoked: number };
}

export type WorkspaceTeamRole = "ADMIN" | "RECRUITER" | "VIEWER";

export type WorkspaceTeamMember = {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  teamRole: WorkspaceTeamRole;
  joinedAt: string;
};

export type WorkspaceTeamActivity = {
  id: string;
  action: "joined" | "role_changed" | "removed";
  memberName: string;
  detail?: string;
  timestamp: string;
};

export type WorkspaceTeam = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: WorkspaceTeamMember[];
  activities: WorkspaceTeamActivity[];
};

export async function getWorkspaceTeam() {
  const response = await api.get("/employer/workspace/team");
  return unwrapResponse(response, "Unable to load team") as WorkspaceTeam;
}

export async function inviteWorkspaceTeamMember(input: {
  email: string;
  role: WorkspaceTeamRole;
}) {
  const response = await api.post("/employer/workspace/team/members/invite", input);
  return unwrapResponse(response, "Unable to invite team member") as WorkspaceTeamMember;
}

export async function updateWorkspaceTeamMemberRole(userId: string, role: WorkspaceTeamRole) {
  const response = await api.patch(`/employer/workspace/team/members/${encodeURIComponent(userId)}/role`, { role });
  return unwrapResponse(response, "Unable to update role") as WorkspaceTeamMember;
}

export async function removeWorkspaceTeamMember(userId: string) {
  const response = await api.delete(`/employer/workspace/team/members/${encodeURIComponent(userId)}`);
  return unwrapResponse(response, "Unable to remove member") as { success: boolean };
}

export type WorkspaceReview = {
  id: string;
  contractId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  targetId: string;
  rating: number;
  comment: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  verified?: boolean;
  isVerified?: boolean;
  createdAt: string;
  tags: string[];
};

export async function listWorkspaceReviews() {
  const response = await api.get("/workspace/reviews");
  return unwrapResponse(response, "Unable to load reviews") as WorkspaceReview[];
}

export async function createWorkspaceReview(input: {
  contractId?: string;
  targetId?: string;
  rating: number;
  comment: string;
  tags?: string[];
}) {
  const response = await api.post("/workspace/reviews", input);
  return unwrapResponse(response, "Unable to submit review") as WorkspaceReview;
}

export type WorkspaceProfileTrustSignals = {
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  businessVerified: boolean;
  paymentVerified: boolean;
  documentsVerified: boolean;
  kycVerified: boolean;
  kycStatus?: string | null;
};

export type WorkspaceProfileStats = {
  completedContracts?: number | null;
  activeContracts?: number | null;
  totalJobsPosted?: number | null;
  totalHires?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  totalSpent?: number | null;
  totalEarnings?: number | null;
  successRate?: number | null;
  jobSuccessScore?: number | null;
};

export type WorkspaceProfilePortfolioItem = {
  id?: string;
  title?: string;
  description?: string;
  images?: string[];
  projectUrl?: string;
  technologies?: string[];
  testimonial?: string;
  completedAt?: string;
};

export type WorkspaceProfileReview = {
  id?: string;
  contractId?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  rating?: number;
  comment?: string;
  sentiment?: string;
  verified?: boolean;
  createdAt?: string;
  tags?: string[];
};

export type WorkspaceProfilePublishedProject = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  deliveryDays?: number;
  thumbnailUrl?: string;
  sampleImageUrls?: string[];
  sampleVideoUrls?: string[];
  sampleDocumentUrls?: string[];
  publishedAt?: string;
};

export type WorkspaceProfilePublishedGig = {
  id?: string;
  title?: string;
  description?: string;
  skills?: string[];
  price?: number;
  currency?: string;
  deliveryDays?: number;
  thumbnailUrl?: string;
  sampleImageUrls?: string[];
  sampleVideoUrls?: string[];
  sampleDocumentUrls?: string[];
  publishedAt?: string;
};

export type WorkspaceProfilePublishedStory = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  technologies?: string[];
  imageUrls?: string[];
  projectUrl?: string;
  publishedAt?: string;
};

export type WorkspaceProfileSummary = {
  kind: "EMPLOYER" | "FREELANCER";
  id: string;
  userId?: string;
  displayName: string;
  headline?: string | null;
  about?: string | null;
  avatarUrl?: string | null;
  coverImage?: string | null;
  location?: string | null;
  timezone?: string | null;
  website?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  availability?: string | null;
  hourlyRate?: number | null;
  currency?: string | null;
  memberSince?: string | null;
  badges?: string[];
  skills?: string[];
  categories?: string[];
  languages?: string[];
  trust: WorkspaceProfileTrustSignals;
  stats: WorkspaceProfileStats;
  portfolio?: WorkspaceProfilePortfolioItem[];
  reviews?: WorkspaceProfileReview[];
  publishedProjects?: WorkspaceProfilePublishedProject[];
  publishedGigs?: WorkspaceProfilePublishedGig[];
  publishedStories?: WorkspaceProfilePublishedStory[];
};

export type EmployerWorkspaceProfile = {
  id: string;
  userId?: string;
  companyName?: string | null;
  companyWebsite?: string | null;
  companyLogo?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  taxId?: string | null;
  registrationNumber?: string | null;
  paymentType?: string | null;
  paymentAccountId?: string | null;
  paymentCurrency?: string | null;
  memberSince?: string | null;
  badges?: string[];
  trust: WorkspaceProfileTrustSignals;
  stats: WorkspaceProfileStats;
  reviews?: WorkspaceProfileReview[];
};

export type EmployerProfileUpdateInput = {
  companyName?: string;
  companyWebsite?: string;
  companyLogo?: string;
  industry?: string;
  employeeCount?: number;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  registrationNumber?: string;
  paymentType?: string;
  paymentAccountId?: string;
  paymentCurrency?: string;
};

export async function getFreelancerPublicProfile(id: string) {
  const response = await api.get(`/workspace/profiles/freelancers/${encodeURIComponent(id)}`);
  return unwrapResponse(response, "Unable to load freelancer profile") as WorkspaceProfileSummary;
}

export async function getEmployerPublicProfile(id: string) {
  const response = await api.get(`/workspace/profiles/employers/${encodeURIComponent(id)}`);
  return unwrapResponse(response, "Unable to load employer profile") as WorkspaceProfileSummary;
}

export async function getEmployerWorkspaceProfile() {
  const response = await api.get("/workspace/profiles/employer/me");
  return unwrapResponse(response, "Unable to load employer profile") as EmployerWorkspaceProfile;
}

export async function updateEmployerWorkspaceProfile(input: EmployerProfileUpdateInput) {
  const response = await api.put("/workspace/profiles/employer/me", input);
  return unwrapResponse(response, "Unable to save employer profile") as EmployerWorkspaceProfile;
}

// User Settings & Profile
export type UserProfile = {
  userId?: string;
  username?: string;
  email?: string;
  bio?: string;
  profilePictureUrl?: string;
  country?: string;
  location?: string;
  timezone?: string;
  phoneCountryCode?: string;
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
  twoFactorEnabled?: boolean;
  twoFactorMethod?: string;
  authenticatorEnabled?: boolean;
  authenticatorVerifiedAt?: number;
  pinChallengeEnabled?: boolean;
  securityPinUpdatedAt?: number;
  recoveryCodesRemaining?: number;
  recoveryCodesGeneratedAt?: number;
  identityVerified?: boolean;
  identityVerificationMethod?: string;
  identityVerifiedAt?: number;
  profileViewsCount?: number;
  proposalsSentCount?: number;
  contractsCompletedCount?: number;
  totalEarnings?: number;
  successRate?: number;
};

export type TaxonomySuggestion = {
  type: string;
  category: string;
  subcategory: string;
  skills: string[];
  expertise_level: "beginner" | "intermediate" | "expert" | null;
  confidence: number;
  is_new_category: boolean;
  suggested_new_category: {
    parent: string;
    name: string;
    reason: string;
    trend_score: number;
  };
  normalization: {
    merged_terms: string[];
    standardized_skills: string[];
  };
  recommendations: {
    suggested_categories: string[];
    related_skills: string[];
    profile_improvements: string[];
  };
};

export async function getUserSettings() {
  const { data } = await api.get("/user/settings");
  return data as UserProfile;
}

export async function updateUserSettings(profile: Partial<UserProfile>) {
  const { data } = await api.patch("/user/settings", profile);
  return data as UserProfile;
}

export async function updateUserContact(input: { email: string; phoneCountryCode?: string; phoneNumber?: string }) {
  const { data } = await api.patch("/user/settings/contact", input);
  return data as { profile: UserProfile; token: string; message?: string };
}

export async function suggestUserSettingsTaxonomy(profile: Partial<UserProfile>) {
  const { data } = await api.post("/user/settings/taxonomy/suggest", profile);
  return data as TaxonomySuggestion;
}

export async function suggestCurrentUserProfileTaxonomy() {
  const { data } = await api.get("/user/settings/taxonomy/profile");
  return data as TaxonomySuggestion;
}

export async function verifyPhone() {
  const { data } = await api.post("/user/settings/verify-phone");
  return data;
}

export async function requestPhoneVerification() {
  const response = await api.post("/user/settings/verify-phone/request");
  return unwrapResponse(response, "Failed to request phone verification code.") as { message?: string; success?: boolean };
}

export async function confirmPhoneVerification(otpCode: string) {
  const response = await api.post("/user/settings/verify-phone/confirm", { otpCode });
  return unwrapResponse(response, "Phone verification failed.") as UserProfile;
}

export async function verifyIdentity(method: string) {
  const response = await api.post("/user/settings/verify-identity", null, {
    params: { method },
  });
  return unwrapResponse(response, "Failed to start identity verification.") as string;
}

export async function requestEmailVerification() {
  const response = await api.post("/user/settings/verify-email/request");
  return unwrapResponse(response, "Failed to request email verification code.") as { message?: string; success?: boolean };
}

export async function confirmEmailVerification(otpCode: string) {
  const response = await api.post("/user/settings/verify-email/confirm", { otpCode });
  return unwrapResponse(response, "Email verification failed.") as UserProfile;
}

export type AuthenticatorSetup = {
  secret: string;
  otpAuthUrl: string;
  issuer: string;
  accountName: string;
};

export async function beginAuthenticatorSetup() {
  const response = await api.post("/user/settings/2fa/authenticator/setup");
  return unwrapResponse(response, "Failed to prepare authenticator setup.") as {
    success: boolean;
    setup: AuthenticatorSetup;
    profile: UserProfile;
  };
}

export async function enableTwoFactor(input: {
  method: string;
  currentPassword: string;
  authenticatorCode?: string;
  pinCode?: string;
}) {
  const response = await api.post("/user/settings/2fa/enable", input);
  return unwrapResponse(response, "Failed to enable 2-step verification.") as {
    success: boolean;
    profile: UserProfile;
    recoveryCodes: string[];
    message?: string;
  };
}

export async function disableTwoFactor(input: { currentPassword: string }) {
  const response = await api.post("/user/settings/2fa/disable", input);
  return unwrapResponse(response, "Failed to disable 2-step verification.") as {
    success: boolean;
    profile: UserProfile;
    message?: string;
  };
}

export async function regenerateRecoveryCodes(input: {
  currentPassword: string;
  authenticatorCode?: string;
  recoveryCode?: string;
}) {
  const response = await api.post("/user/settings/2fa/recovery-codes/regenerate", input);
  return unwrapResponse(response, "Failed to regenerate recovery codes.") as {
    success: boolean;
    profile: UserProfile;
    recoveryCodes: string[];
    message?: string;
  };
}

export async function getPublicProfile(userId: string) {
  const { data } = await api.get(`/user/settings/public/${userId}`);
  return data as UserProfile;
}

export async function me() {
  const response = await api.get("/auth/me");
  const data = unwrapResponse(response, "Unable to verify your session");
  const record = asRecord(data);
  if (!record || typeof record.id !== "string" || !record.id.trim()) {
    throw new Error("Unable to verify your session");
  }
  return data as {
    id: string;
    email: string;
    username?: string;
    fullName: string;
    profilePictureUrl?: string | null;
    roles: string[];
  };
}

// Jobs
export type Job = {
  id: string;
  title: string;
  description: string;
  overviewText?: string;
  employerId?: string;
  employerName?: string;
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
  employer?: {
    companyName?: string;
    fullName?: string;
    name?: string;
  };
  employerProfile?: {
    companyName?: string;
  };
  postedByName?: string;
  posterName?: string;
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

export type ListOpenJobsPageOptions = {
  page?: number;
  size?: number;
  q?: string;
  categoryId?: string;
  budgetBand?: string;
  experienceBand?: string;
  mediaFilter?: string;
  openOnly?: boolean;
  sortBy?: string;
  skills?: string[];
};

export async function listOpenJobsPage(options?: ListOpenJobsPageOptions) {
  const page = Math.max(0, options?.page ?? 0);
  const size = Math.max(1, options?.size ?? 20);

  const params: Record<string, string | number | boolean> = { page, size };
  if (options?.q) params.q = options.q;
  if (options?.categoryId) params.categoryId = options.categoryId;
  if (options?.budgetBand) params.budgetBand = options.budgetBand;
  if (options?.experienceBand) params.experienceBand = options.experienceBand;
  if (options?.mediaFilter) params.mediaFilter = options.mediaFilter;
  if (options?.openOnly) params.openOnly = true;
  if (options?.sortBy) params.sortBy = options.sortBy;
  if (options?.skills?.length) params.skills = options.skills.join(",");

  const { data } = await api.get("/jobs/browse/open", {
    params,
  });

  return normalizePage<Job>(data as RawPagePayload<Job> | Job[] | null | undefined, page, size);
}

type SeedMarketplaceJobPayload = {
  title: string;
  description: string;
  overviewText?: string;
  employerId?: string;
  status?: "OPEN";
  isEnterpriseOnly?: boolean;
  engagementType: "PROJECT_BASED" | "CONTRACT" | "LONG_TERM_PARTNERSHIP" | "RETAINER";
  deliverableType: "IMAGE_DESIGN" | "VIDEO_PRODUCTION" | "AUDIO_PRODUCTION" | "DOCUMENT_DEVELOPMENT" | "MIXED";
  workLocation?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  pricingModel: "FIXED_PRICE" | "HOURLY" | "RETAINER" | "VOLUME_BASED";
  requiredSkills?: string[];
  skills?: string[];
  industry?: string[];
  companyName?: string;
  minYearsExperience?: number;
  categoryId?: string;
};

const DEFAULT_MARKETPLACE_SEED_JOBS: SeedMarketplaceJobPayload[] = [
  {
    title: "Brand Motion Graphics Package",
    description: "Create a cohesive set of animated brand assets for a product launch campaign.",
    overviewText: "Deliver short logo stings, lower thirds, and polished intro animations for paid and organic channels.",
    employerId: "seed-employer-01",
    status: "OPEN",
    isEnterpriseOnly: false,
    engagementType: "PROJECT_BASED",
    deliverableType: "VIDEO_PRODUCTION",
    workLocation: "Remote",
    budgetMin: 1200,
    budgetMax: 2800,
    currency: "USD",
    pricingModel: "FIXED_PRICE",
    requiredSkills: ["After Effects", "Motion Design", "Branding"],
    skills: ["After Effects", "Motion Design", "Branding"],
    industry: ["SaaS", "Marketing"],
    companyName: "SabaHub Studio",
    minYearsExperience: 3,
    categoryId: "design-creative.motion-interaction-design.motion-graphics",
  },
  {
    title: "Design System UI Kit for B2B Platform",
    description: "Build a scalable UI kit and component library for a finance dashboard product.",
    overviewText: "Create tokens, reusable components, and usage guidelines across desktop and tablet breakpoints.",
    employerId: "seed-employer-02",
    status: "OPEN",
    isEnterpriseOnly: false,
    engagementType: "CONTRACT",
    deliverableType: "IMAGE_DESIGN",
    workLocation: "Hybrid",
    budgetMin: 2500,
    budgetMax: 6000,
    currency: "USD",
    pricingModel: "HOURLY",
    requiredSkills: ["Figma", "Design Systems", "UX"],
    skills: ["Figma", "Design Systems", "UX"],
    industry: ["Finance", "B2B"],
    companyName: "Finorama",
    minYearsExperience: 4,
    categoryId: "design-creative.ux-ui-design.ui-design-systems",
  },
  {
    title: "Document Automation Templates",
    description: "Create reusable contract and reporting templates that teams can edit without design drift.",
    overviewText: "Deliver editable layouts with strong typography, brand compliance, and approval-ready exports.",
    employerId: "seed-employer-03",
    status: "OPEN",
    isEnterpriseOnly: false,
    engagementType: "RETAINER",
    deliverableType: "DOCUMENT_DEVELOPMENT",
    workLocation: "Remote",
    budgetMin: 800,
    budgetMax: 2000,
    currency: "USD",
    pricingModel: "FIXED_PRICE",
    requiredSkills: ["Document Design", "Brand Compliance", "Templates"],
    skills: ["Document Design", "Brand Compliance", "Templates"],
    industry: ["Legal", "Operations"],
    companyName: "DocuCraft",
    minYearsExperience: 2,
    categoryId: "design-creative.graphic-visual-design.document-design-layout",
  },
  {
    title: "Podcast Editing and Audio Mastering",
    description: "Edit and master weekly podcast episodes with a clean, modern sound and consistent loudness.",
    overviewText: "Handle noise cleanup, music beds, ad inserts, and final mastering for distribution platforms.",
    employerId: "seed-employer-04",
    status: "OPEN",
    isEnterpriseOnly: false,
    engagementType: "LONG_TERM_PARTNERSHIP",
    deliverableType: "AUDIO_PRODUCTION",
    workLocation: "Remote",
    budgetMin: 600,
    budgetMax: 1600,
    currency: "USD",
    pricingModel: "RETAINER",
    requiredSkills: ["Audio Editing", "Sound Design", "Podcasting"],
    skills: ["Audio Editing", "Sound Design", "Podcasting"],
    industry: ["Media", "Education"],
    companyName: "WaveCast",
    minYearsExperience: 2,
    categoryId: "media-entertainment.audio-music-production.podcast-production",
  },
  {
    title: "Product Demo Video Series",
    description: "Produce a set of polished short demo videos for newly launched SaaS features.",
    overviewText: "Own scripting, motion treatment, editing, and delivery in multiple aspect ratios for paid campaigns.",
    employerId: "seed-employer-05",
    status: "OPEN",
    isEnterpriseOnly: false,
    engagementType: "PROJECT_BASED",
    deliverableType: "VIDEO_PRODUCTION",
    workLocation: "Remote",
    budgetMin: 3000,
    budgetMax: 9000,
    currency: "USD",
    pricingModel: "FIXED_PRICE",
    requiredSkills: ["Video Editing", "Animation", "Storyboarding"],
    skills: ["Video Editing", "Animation", "Storyboarding"],
    industry: ["SaaS", "Product"],
    companyName: "FlowSuite",
    minYearsExperience: 4,
    categoryId: "media-entertainment.film-video-production.video-editing",
  },
  {
    title: "Mixed Media Launch Campaign",
    description: "Deliver a bundle of launch-week creative assets across social, email, and web placements.",
    overviewText: "Package graphics, short-form videos, and supporting audio cues for a coordinated campaign rollout.",
    employerId: "seed-employer-06",
    status: "OPEN",
    isEnterpriseOnly: false,
    engagementType: "CONTRACT",
    deliverableType: "MIXED",
    workLocation: "Remote",
    budgetMin: 2000,
    budgetMax: 5500,
    currency: "USD",
    pricingModel: "VOLUME_BASED",
    requiredSkills: ["Creative Direction", "Content Production", "Brand Design"],
    skills: ["Creative Direction", "Content Production", "Brand Design"],
    industry: ["E-commerce", "Retail"],
    companyName: "Brightlane",
    minYearsExperience: 3,
    categoryId: "design-creative.creative-direction.creative-strategy",
  },
];

export async function listJobs() {
  const response = await listOpenJobsPage({ page: 0, size: 20 });
  return response.items;
}

export async function getJob(id: string) {
  const { data } = await api.get(`/jobs/${id}`);
  return data as Job;
}

export async function createJob(job: Partial<Job>) {
  const { data } = await api.post("/v2/jobs", job);
  return data as Job;
}

export async function suggestJobTaxonomy(job: Partial<Job>) {
  const { data } = await api.post("/jobs/taxonomy/suggest", job);
  return data as TaxonomySuggestion;
}

export async function deleteJob(id: string) {
  await api.delete(`/jobs/${id}`);
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

export type FreelancerPortfolioItem = {
  id?: string;
  title?: string;
  description?: string;
  images?: string[];
  projectUrl?: string;
  category?: string;
  technologies?: string[];
  completedAt?: string;
  clientName?: string;
  testimonial?: string;
};

export type FreelancerWorkspaceSkill = {
  name?: string;
  level?: string;
  yearsOfExperience?: number;
};

export type FreelancerWorkspaceProfile = {
  id: string;
  userId?: string;
  professionalTitle?: string;
  bio?: string;
  profilePicture?: string;
  coverImage?: string;
  location?: string;
  timezone?: string;
  languages?: string[];
  categories?: string[];
  availability?: string;
  preferredProjectTypes?: string[];
  preferredProjectSizes?: string[];
  preferredIndustries?: string[];
  remoteOnly?: boolean;
  hoursPerWeek?: number;
  hourlyRate?: number;
  currency?: string;
  minimumProjectBudget?: number;
  skills?: FreelancerWorkspaceSkill[];
  portfolio?: FreelancerPortfolioItem[];
};

export async function getMyFreelancerProfile() {
  const { data } = await api.get("/freelancer/profile");
  return data as FreelancerWorkspaceProfile;
}

export type FreelancerProfileUpdateInput = {
  professionalTitle?: string;
  bio?: string;
  profilePicture?: string;
  coverImage?: string;
  location?: string;
  timezone?: string;
  languages?: string[];
  categories?: string[];
  hourlyRate?: number;
  currency?: string;
  minimumProjectBudget?: number;
  availability?: string;
  hoursPerWeek?: number;
  preferredProjectTypes?: string[];
  preferredProjectSizes?: string[];
  remoteOnly?: boolean;
  preferredIndustries?: string[];
  skills?: FreelancerWorkspaceSkill[];
};

export async function createMyFreelancerProfile(input: FreelancerProfileUpdateInput) {
  const { data } = await api.post("/freelancer/register", input);
  return data as FreelancerWorkspaceProfile;
}

export async function updateMyFreelancerProfile(input: FreelancerProfileUpdateInput) {
  const { data } = await api.put("/freelancer/profile", input);
  return data as FreelancerWorkspaceProfile;
}

export type FreelancerProfileSuggestionInput = {
  professionalTitle?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  languages?: string[];
  categories?: string[];
  availability?: string;
  preferredProjectTypes?: string[];
  preferredProjectSizes?: string[];
  preferredIndustries?: string[];
  skills?: Array<{ name?: string; level?: string; yearsOfExperience?: number }>;
};

export async function suggestFreelancerProfileTaxonomy(input: FreelancerProfileSuggestionInput) {
  const { data } = await api.post("/freelancer/profile/taxonomy/suggest", input);
  return data as TaxonomySuggestion;
}

export async function addFreelancerPortfolioItem(input: Partial<FreelancerPortfolioItem>) {
  const { data } = await api.post("/freelancer/portfolio", input);
  return data as FreelancerWorkspaceProfile;
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

export async function listEmployerJobs(options?: { page?: number; size?: number }) {
  const page = Math.max(0, options?.page ?? 0);
  const size = Math.max(1, options?.size ?? 20);
  const { data } = await api.get("/jobs/employer/my-jobs", {
    params: { page, size },
  });
  return normalizePage<Job>(data as RawPagePayload<Job> | Job[] | null | undefined, page, size).items;
}

export async function listTrendingJobs(limit = 10) {
  const { data } = await api.get("/jobs/trending", { params: { limit } });
  return Array.isArray(data) ? (data as Job[]) : ([] as Job[]);
}

export type MarketplaceFreelancer = {
  id: string;
  userId?: string | null;
  name: string;
  title?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  skills: string[];
  hourlyRate?: number | null;
  currency?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  completedProjects?: number | null;
  availability?: string | null;
  location?: string | null;
  languages?: string[];
  certifications?: string[];
  lastActive?: string | null;
  verified?: boolean;
};

export async function listMarketplaceFreelancers(options?: { page?: number; size?: number }) {
  const page = Math.max(0, options?.page ?? 0);
  const size = Math.max(1, options?.size ?? 24);
  const { data } = await api.get("/freelancer/discover", {
    params: { page, size },
  });
  return normalizePage<MarketplaceFreelancer>(
    data as RawPagePayload<MarketplaceFreelancer> | MarketplaceFreelancer[] | null | undefined,
    page,
    size,
  );
}

export type SeedFreelancerReviewsResult = {
  seededCount: number;
  clearedCount: number;
  preview: FeaturedFreelancerReview[];
};

export async function seedMarketplaceJobs(options?: { clear?: boolean }) {
  const response = await api.post("/jobs/seed", DEFAULT_MARKETPLACE_SEED_JOBS, {
    params: { clear: options?.clear ?? false },
  });

  if (response.status >= 400) {
    const message =
      typeof response.data === "string"
        ? response.data
        : response.data?.message || "Failed to seed marketplace jobs.";
    throw new Error(message);
  }

  return Array.isArray(response.data) ? (response.data as Job[]) : ([] as Job[]);
}

export async function seedMarketplaceFreelancers(options?: { count?: number; clear?: boolean }) {
  const response = await api.post("/freelancer/seed/featured-reviews", null, {
    params: {
      count: Math.max(3, options?.count ?? 6),
      clear: options?.clear ?? false,
    },
  });

  if (response.status >= 400) {
    const message =
      typeof response.data === "string"
        ? response.data
        : response.data?.message || "Failed to seed marketplace freelancers.";
    throw new Error(message);
  }

  const data = (response.data ?? {}) as Partial<SeedFreelancerReviewsResult>;
  return {
    seededCount: typeof data.seededCount === "number" ? data.seededCount : 0,
    clearedCount: typeof data.clearedCount === "number" ? data.clearedCount : 0,
    preview: Array.isArray(data.preview) ? data.preview : [],
  } satisfies SeedFreelancerReviewsResult;
}

export async function bootstrapMarketplaceCatalog() {
  const [jobsResult, freelancersResult] = await Promise.allSettled([
    seedMarketplaceJobs(),
    seedMarketplaceFreelancers({ count: 6 }),
  ]);

  return {
    jobsCreated: jobsResult.status === "fulfilled" ? jobsResult.value.length : 0,
    freelancersCreated:
      freelancersResult.status === "fulfilled" ? freelancersResult.value.seededCount : 0,
    createdAny:
      (jobsResult.status === "fulfilled" && jobsResult.value.length > 0) ||
      (freelancersResult.status === "fulfilled" && freelancersResult.value.seededCount > 0),
  };
}

export type WorkspaceBootstrapResult = {
  createdAny: boolean;
  employerSeeded: boolean;
  freelancerSeeded: boolean;
  supportUsersCreated: number;
  employerProfilesCreated: number;
  freelancerProfilesCreated: number;
  jobsCreated: number;
  proposalsCreated: number;
  contractsCreated: number;
};

export async function bootstrapWorkspaceDemoData() {
  const response = await api.post("/workspace/bootstrap");

  if (response.status >= 400) {
    const message =
      typeof response.data === "string"
        ? response.data
        : response.data?.message || "Failed to bootstrap workspace demo data.";
    throw new Error(message);
  }

  const data = (response.data ?? {}) as Partial<WorkspaceBootstrapResult>;
  return {
    createdAny: Boolean(data.createdAny),
    employerSeeded: Boolean(data.employerSeeded),
    freelancerSeeded: Boolean(data.freelancerSeeded),
    supportUsersCreated: typeof data.supportUsersCreated === "number" ? data.supportUsersCreated : 0,
    employerProfilesCreated: typeof data.employerProfilesCreated === "number" ? data.employerProfilesCreated : 0,
    freelancerProfilesCreated: typeof data.freelancerProfilesCreated === "number" ? data.freelancerProfilesCreated : 0,
    jobsCreated: typeof data.jobsCreated === "number" ? data.jobsCreated : 0,
    proposalsCreated: typeof data.proposalsCreated === "number" ? data.proposalsCreated : 0,
    contractsCreated: typeof data.contractsCreated === "number" ? data.contractsCreated : 0,
  } satisfies WorkspaceBootstrapResult;
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
        role: typeof item.role === "string" ? item.role : "",
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
  jobTitle?: string;
  employerId?: string;
  employerName?: string;
  freelancerId?: string;
  freelancerName?: string;
  coverLetter: string;
  bidAmount: number;
  timelineDays: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function submitProposal(jobId: string, body: { coverLetter: string; bidAmount: number; timelineDays: number }) {
  const { data } = await api.post(`/jobs/${jobId}/proposals`, body);
  return data as Proposal;
}

export async function listJobProposals(jobId: string) {
  const { data } = await api.get(`/employer/jobs/${jobId}/proposals`, {
    headers: { "X-Active-Role": "EMPLOYER" },
  });
  return data as Proposal[];
}

export async function acceptProposal(proposalId: string) {
  const { data } = await api.post(`/employer/proposals/${proposalId}/accept`, undefined, {
    headers: { "X-Active-Role": "EMPLOYER" },
  });
  return data as any; // Contract
}

export async function rejectProposal(proposalId: string) {
  const { data } = await api.post(`/employer/proposals/${proposalId}/reject`, undefined, {
    headers: { "X-Active-Role": "EMPLOYER" },
  });
  return data as Proposal;
}

export async function cancelProposal(proposalId: string) {
  const { data } = await api.post(`/employer/proposals/${proposalId}/cancel`, undefined, {
    headers: { "X-Active-Role": "EMPLOYER" },
  });
  return data as Proposal;
}

export type Gig = {
  id: string;
  freelancerId?: string;
  title: string;
  description: string;
  skills?: string[];
  price?: number;
  currency?: string;
  deliveryDays?: number;
  thumbnailUrl?: string;
  sampleImageUrls?: string[];
  sampleVideoUrls?: string[];
  sampleDocumentUrls?: string[];
  active?: boolean;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  flagged?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type FreelancerProjectPost = {
  id: string;
  freelancerId?: string;
  title: string;
  description: string;
  category?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  deliveryDays?: number;
  thumbnailUrl?: string;
  sampleImageUrls?: string[];
  sampleVideoUrls?: string[];
  sampleDocumentUrls?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  flagged?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MarketplaceSearchTalent = {
  freelancerId?: string;
  userId?: string;
  name?: string;
  professionalTitle?: string;
  rating?: number;
  skills?: string[];
  profilePicture?: string;
  coverImage?: string;
  portfolioThumbnailUrl?: string;
  portfolioImageUrls?: string[];
};

export type MarketplaceSearchProjectPost = {
  projectPostId?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title?: string;
  description?: string;
  category?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  deliveryDays?: number;
  thumbnailUrl?: string;
  sampleImageUrls?: string[];
  sampleVideoUrls?: string[];
  sampleDocumentUrls?: string[];
  freelancerId?: string;
  freelancerUserId?: string;
  freelancerName?: string;
};

export type MarketplaceSearchGig = {
  gigId?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title?: string;
  description?: string;
  skills?: string[];
  price?: number;
  currency?: string;
  deliveryDays?: number;
  thumbnailUrl?: string;
  sampleImageUrls?: string[];
  sampleVideoUrls?: string[];
  sampleDocumentUrls?: string[];
  freelancerId?: string;
  freelancerUserId?: string;
  freelancerName?: string;
};

export type MarketplaceSearchStory = {
  storyId?: string;
  status?: "PUBLISHED";
  title?: string;
  description?: string;
  category?: string;
  technologies?: string[];
  imageUrls?: string[];
  projectUrl?: string;
  completedAt?: string;
  freelancerId?: string;
  freelancerUserId?: string;
  freelancerName?: string;
  profilePicture?: string;
};

export type MarketplaceSearchResponse = {
  query: string;
  talents: MarketplaceSearchTalent[];
  projectPosts: MarketplaceSearchProjectPost[];
  gigs: MarketplaceSearchGig[];
  stories: MarketplaceSearchStory[];
  counts: {
    talents: number;
    projectPosts: number;
    gigs: number;
    stories: number;
  };
};

export async function listMyGigs() {
  const { data } = await api.get("/gigs/mine");
  return Array.isArray(data) ? (data as Gig[]) : ([] as Gig[]);
}

export async function createGig(input: Partial<Gig>) {
  const { data } = await api.post("/gigs", input);
  return data as Gig;
}

export async function updateGig(id: string, input: Partial<Gig>) {
  const { data } = await api.put(`/gigs/${id}`, input);
  return data as Gig;
}

export async function deleteGig(id: string) {
  await api.delete(`/gigs/${id}`);
}

export async function listMyProjectPosts() {
  const { data } = await api.get("/freelancer/project-posts/mine");
  return Array.isArray(data) ? (data as FreelancerProjectPost[]) : ([] as FreelancerProjectPost[]);
}

export async function createProjectPost(input: Partial<FreelancerProjectPost>) {
  const { data } = await api.post("/freelancer/project-posts", input);
  return data as FreelancerProjectPost;
}

export async function updateProjectPost(id: string, input: Partial<FreelancerProjectPost>) {
  const { data } = await api.put(`/freelancer/project-posts/${id}`, input);
  return data as FreelancerProjectPost;
}

export async function deleteProjectPost(id: string) {
  await api.delete(`/freelancer/project-posts/${id}`);
}

export async function searchEmployerMarketplace(params?: {
  q?: string;
  limit?: number;
  skill?: string;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  minPrice?: number;
  maxPrice?: number;
  mediaFilter?: "ALL" | "VISUAL" | "VIDEO" | "DOCUMENT";
}) {
  const { data } = await api.get("/employer/marketplace/search", {
    params: {
      q: params?.q ?? "",
      limit: params?.limit ?? 20,
      skill: params?.skill,
      category: params?.category,
      minBudget: params?.minBudget,
      maxBudget: params?.maxBudget,
      minPrice: params?.minPrice,
      maxPrice: params?.maxPrice,
      mediaFilter: params?.mediaFilter,
    },
  });

  const raw = (data ?? {}) as Record<string, unknown>;
  const toStringList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  };

  const toTalent = (item: unknown): MarketplaceSearchTalent => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      freelancerId: typeof row.freelancerId === "string" ? row.freelancerId : undefined,
      userId: typeof row.userId === "string" ? row.userId : undefined,
      name: typeof row.name === "string" ? row.name : undefined,
      professionalTitle: typeof row.professionalTitle === "string" ? row.professionalTitle : undefined,
      rating: typeof row.rating === "number" ? row.rating : undefined,
      skills: toStringList(row.skills),
      profilePicture:
        (typeof row.profilePicture === "string" && row.profilePicture)
        || (typeof row.avatarUrl === "string" && row.avatarUrl)
        || (typeof row.profileImageUrl === "string" && row.profileImageUrl)
        || undefined,
      coverImage:
        (typeof row.coverImage === "string" && row.coverImage)
        || (typeof row.coverImageUrl === "string" && row.coverImageUrl)
        || undefined,
      portfolioThumbnailUrl:
        (typeof row.portfolioThumbnailUrl === "string" && row.portfolioThumbnailUrl)
        || (typeof row.thumbnailUrl === "string" && row.thumbnailUrl)
        || undefined,
      portfolioImageUrls:
        toStringList(row.portfolioImageUrls).length > 0
          ? toStringList(row.portfolioImageUrls)
          : toStringList(row.images),
    };
  };

  const toProjectPost = (item: unknown): MarketplaceSearchProjectPost => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      projectPostId: typeof row.projectPostId === "string" ? row.projectPostId : undefined,
      status: row.status === "DRAFT" || row.status === "PUBLISHED" || row.status === "ARCHIVED" ? row.status : undefined,
      title: typeof row.title === "string" ? row.title : undefined,
      description: typeof row.description === "string" ? row.description : undefined,
      category: typeof row.category === "string" ? row.category : undefined,
      skills: toStringList(row.skills),
      budgetMin: typeof row.budgetMin === "number" ? row.budgetMin : undefined,
      budgetMax: typeof row.budgetMax === "number" ? row.budgetMax : undefined,
      currency: typeof row.currency === "string" ? row.currency : undefined,
      deliveryDays: typeof row.deliveryDays === "number" ? row.deliveryDays : undefined,
      thumbnailUrl:
        (typeof row.thumbnailUrl === "string" && row.thumbnailUrl)
        || (typeof row.coverImageUrl === "string" && row.coverImageUrl)
        || undefined,
      sampleImageUrls:
        toStringList(row.sampleImageUrls).length > 0
          ? toStringList(row.sampleImageUrls)
          : toStringList(row.sampleImages),
      sampleVideoUrls:
        toStringList(row.sampleVideoUrls).length > 0
          ? toStringList(row.sampleVideoUrls)
          : toStringList(row.sampleVideos),
      sampleDocumentUrls:
        toStringList(row.sampleDocumentUrls).length > 0
          ? toStringList(row.sampleDocumentUrls)
          : toStringList(row.sampleDocuments),
      freelancerId: typeof row.freelancerId === "string" ? row.freelancerId : undefined,
      freelancerUserId: typeof row.freelancerUserId === "string" ? row.freelancerUserId : undefined,
      freelancerName: typeof row.freelancerName === "string" ? row.freelancerName : undefined,
    };
  };

  const toGig = (item: unknown): MarketplaceSearchGig => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      gigId: typeof row.gigId === "string" ? row.gigId : undefined,
      status: row.status === "DRAFT" || row.status === "PUBLISHED" || row.status === "ARCHIVED" ? row.status : undefined,
      title: typeof row.title === "string" ? row.title : undefined,
      description: typeof row.description === "string" ? row.description : undefined,
      skills: toStringList(row.skills),
      price: typeof row.price === "number" ? row.price : undefined,
      currency: typeof row.currency === "string" ? row.currency : undefined,
      deliveryDays: typeof row.deliveryDays === "number" ? row.deliveryDays : undefined,
      thumbnailUrl:
        (typeof row.thumbnailUrl === "string" && row.thumbnailUrl)
        || (typeof row.coverImageUrl === "string" && row.coverImageUrl)
        || undefined,
      sampleImageUrls:
        toStringList(row.sampleImageUrls).length > 0
          ? toStringList(row.sampleImageUrls)
          : toStringList(row.sampleImages),
      sampleVideoUrls:
        toStringList(row.sampleVideoUrls).length > 0
          ? toStringList(row.sampleVideoUrls)
          : toStringList(row.sampleVideos),
      sampleDocumentUrls:
        toStringList(row.sampleDocumentUrls).length > 0
          ? toStringList(row.sampleDocumentUrls)
          : toStringList(row.sampleDocuments),
      freelancerId: typeof row.freelancerId === "string" ? row.freelancerId : undefined,
      freelancerUserId: typeof row.freelancerUserId === "string" ? row.freelancerUserId : undefined,
      freelancerName: typeof row.freelancerName === "string" ? row.freelancerName : undefined,
    };
  };

  const toStory = (item: unknown): MarketplaceSearchStory => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      storyId: typeof row.storyId === "string" ? row.storyId : undefined,
      status: row.status === "PUBLISHED" ? row.status : undefined,
      title: typeof row.title === "string" ? row.title : undefined,
      description: typeof row.description === "string" ? row.description : undefined,
      category: typeof row.category === "string" ? row.category : undefined,
      technologies:
        toStringList(row.technologies).length > 0
          ? toStringList(row.technologies)
          : toStringList(row.skills),
      imageUrls:
        toStringList(row.imageUrls).length > 0
          ? toStringList(row.imageUrls)
          : toStringList(row.images),
      projectUrl: typeof row.projectUrl === "string" ? row.projectUrl : undefined,
      completedAt:
        typeof row.completedAt === "string"
          ? row.completedAt
          : typeof row.publishedAt === "string"
            ? row.publishedAt
            : undefined,
      freelancerId: typeof row.freelancerId === "string" ? row.freelancerId : undefined,
      freelancerUserId: typeof row.freelancerUserId === "string" ? row.freelancerUserId : undefined,
      freelancerName: typeof row.freelancerName === "string" ? row.freelancerName : undefined,
      profilePicture: typeof row.profilePicture === "string" ? row.profilePicture : undefined,
    };
  };

  const talentsRaw = Array.isArray(raw.talents) ? raw.talents : [];
  const projectPostsRaw = Array.isArray(raw.projectPosts) ? raw.projectPosts : [];
  const gigsRaw = Array.isArray(raw.gigs) ? raw.gigs : [];
  const storiesRaw = Array.isArray(raw.stories) ? raw.stories : [];

  return {
    query: typeof raw.query === "string" ? raw.query : params?.q ?? "",
    talents: talentsRaw.map(toTalent),
    projectPosts: projectPostsRaw.map(toProjectPost),
    gigs: gigsRaw.map(toGig),
    stories: storiesRaw.map(toStory),
    counts: {
      talents: talentsRaw.length,
      projectPosts: projectPostsRaw.length,
      gigs: gigsRaw.length,
      stories: storiesRaw.length,
    },
  } as MarketplaceSearchResponse;
}

export type DirectoryUser = {
  id: string;
  email?: string;
  username?: string;
  fullName?: string;
  roles: string[];
  online?: boolean;
  createdAt?: string | null;
  lastSeenAt?: string | null;
};

export async function listDirectoryUsers(limit = 100) {
  const { data } = await api.get("/users/list", { params: { limit } });
  return {
    total: typeof data?.total === "number" ? data.total : 0,
    users: Array.isArray(data?.users) ? (data.users as DirectoryUser[]) : ([] as DirectoryUser[]),
  };
}

export async function listMyApplications() {
  const { data } = await api.get("/freelancer/proposals");
  return Array.isArray(data) ? (data as Proposal[]) : ([] as Proposal[]);
}

export type FreelancerWorkspaceMonthlyEarning = {
  month: string;
  amount: number;
  projectCount: number;
};

export type FreelancerWorkspaceAnalytics = {
  totalEarnings: number;
  currentBalance: number;
  pendingBalance: number;
  completedProjects: number;
  activeProjects: number;
  totalProposals: number;
  acceptedProposals: number;
  successRate: number;
  rating: number;
  reviewCount: number;
  jobSuccessScore: number;
  monthlyEarnings: FreelancerWorkspaceMonthlyEarning[];
};

export async function getFreelancerWorkspaceAnalytics() {
  const { data } = await api.get("/freelancer/workspace/analytics");
  return data as FreelancerWorkspaceAnalytics;
}

export type EmployerAnalytics = {
  totalProjectsPosted: number;
  activeProjects: number;
  completedProjects: number;
  totalSpent: number;
  averageRating: number;
  totalHired: number;
  repeatHireRate: number;
  topSkillsRequested: string[];
  spendByCategory: Record<string, number>;
  activityOverTime: Array<{
    date?: string;
    count?: number;
    amount?: number;
  }>;
};

export async function getEmployerAnalytics() {
  const { data } = await api.get("/employer/analytics");
  return (data?.data ?? null) as EmployerAnalytics | null;
}

// Contracts
export async function executeAdminAICommand(command: string) {
  const response = await api.post("/admin/ai/command", { command });
  return unwrapResponse(response, "AI command execution failed") as {
    answer: string;
    confidence: number;
    suggestedActions?: string[];
    engine?: string;
    anomalies?: any[];
    results?: any[];
  };
}

export type Contract = {
  id: string;
  jobId: string;
  employerId: string;
  freelancerId: string;
  status: string;
  jobTitle?: string;
  employerName?: string;
  freelancerName?: string;
  totalAmount?: number;
  paidAmount?: number;
  escrowTotalHeld?: number;
  escrowRequiredAmount?: number;
  currency?: string;
  paymentModel?: string;
  escrowProtectionLevel?: string;
  disputeWindowDays?: number;
  autoReleaseDays?: number;
  requiresEscrow?: boolean;
  adminReviewRequired?: boolean;
  startDate?: string;
  endDate?: string;
  terms?: string | Record<string, unknown>;
  createdAt?: string;
  agreementVersion?: number;
  escrowLockedAt?: string;
  agreementEstablishedAt?: string;
  lastAgreementUpdatedAt?: string;
  signatures?: {
    employerSigned?: boolean;
    employerSignedAt?: string;
    freelancerSigned?: boolean;
    freelancerSignedAt?: string;
    contractHash?: string;
  };
  specification?: string | Record<string, unknown>;
  milestones?: Array<{
    id: string;
    sequence?: number;
    title?: string;
    description?: string;
    deliverables?: string;
    amount?: number;
    dueDate?: string;
    status?: string;
    submittedAt?: string;
    approvedAt?: string;
    releaseDate?: string;
    submissionNote?: string;
    feedbackFromEmployer?: string;
    escrowLocked?: boolean;
    escrowLockedAt?: string;
  }>;
  paymentMilestones?: Array<{
    id: string;
    sequence?: number;
    title?: string;
    description?: string;
    deliverables?: string;
    amount?: number;
    dueDate?: string;
    status?: string;
    submittedAt?: string;
    approvedAt?: string;
    releaseDate?: string;
    submissionNote?: string;
    feedbackFromEmployer?: string;
    escrowLocked?: boolean;
    escrowLockedAt?: string;
  }>;
  escrow?: { totalHeld?: number; currency?: string };
  refundRequest?: {
    id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    note?: string;
    requestedByUserId?: string;
    requestedByRole?: string;
    requestedAt?: string;
    employerApproval?: {
      partyRole?: string;
      status?: string;
      actedByUserId?: string;
      note?: string;
      actedAt?: string;
    };
    freelancerApproval?: {
      partyRole?: string;
      status?: string;
      actedByUserId?: string;
      note?: string;
      actedAt?: string;
    };
    resolvedByUserId?: string;
    resolutionType?: string;
    resolutionNote?: string;
    resolvedAt?: string;
    executedAt?: string;
  };
};

function readContractNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeMilestoneStatus(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === "IN_ESCROW") return "PENDING";
  if (normalized === "RELEASED") return "APPROVED";
  return normalized;
}

function normalizeRefundApproval(value: unknown) {
  const approval = asRecord(value);
  if (!approval) return undefined;

  const partyRole =
    typeof approval.partyRole === "string" && approval.partyRole.trim()
      ? approval.partyRole.trim().toUpperCase()
      : undefined;
  if (partyRole !== "EMPLOYER" && partyRole !== "FREELANCER") {
    return undefined;
  }

  const status =
    typeof approval.status === "string" && approval.status.trim()
      ? approval.status.trim().toUpperCase()
      : "PENDING";

  return {
    partyRole,
    status,
    actedByUserId:
      typeof approval.actedByUserId === "string" && approval.actedByUserId.trim()
        ? approval.actedByUserId
        : undefined,
    note: typeof approval.note === "string" && approval.note.trim() ? approval.note : undefined,
    actedAt: typeof approval.actedAt === "string" ? approval.actedAt : undefined,
  };
}

function normalizeRefundRequest(value: unknown) {
  const request = asRecord(value);
  if (!request) return undefined;

  const id = typeof request.id === "string" && request.id.trim() ? request.id : undefined;
  const status =
    typeof request.status === "string" && request.status.trim()
      ? request.status.trim().toUpperCase()
      : undefined;
  const amount = readContractNumber(request.amount);
  const currency =
    typeof request.currency === "string" && request.currency.trim() ? request.currency : undefined;

  if (!id || !status || amount === undefined || !currency) {
    return undefined;
  }

  const requestedByRole =
    typeof request.requestedByRole === "string" && request.requestedByRole.trim()
      ? request.requestedByRole.trim().toUpperCase()
      : undefined;

  return {
    id,
    status,
    amount,
    currency,
    note: typeof request.note === "string" && request.note.trim() ? request.note : undefined,
    requestedByUserId:
      typeof request.requestedByUserId === "string" && request.requestedByUserId.trim()
        ? request.requestedByUserId
        : undefined,
    requestedByRole,
    requestedAt: typeof request.requestedAt === "string" ? request.requestedAt : undefined,
    employerApproval: normalizeRefundApproval(request.employerApproval),
    freelancerApproval: normalizeRefundApproval(request.freelancerApproval),
    resolvedByUserId:
      typeof request.resolvedByUserId === "string" && request.resolvedByUserId.trim()
        ? request.resolvedByUserId
        : undefined,
    resolutionType:
      typeof request.resolutionType === "string" && request.resolutionType.trim()
        ? request.resolutionType
        : undefined,
    resolutionNote:
      typeof request.resolutionNote === "string" && request.resolutionNote.trim()
        ? request.resolutionNote
        : undefined,
    resolvedAt: typeof request.resolvedAt === "string" ? request.resolvedAt : undefined,
    executedAt: typeof request.executedAt === "string" ? request.executedAt : undefined,
  };
}

function readContractTermsText(value: unknown, description: unknown, specification: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  const terms = asRecord(value);
  if (terms) {
    const ordered = [
      terms.scope,
      terms.deliverables,
      terms.acceptanceCriteria,
      terms.paymentSchedule,
      terms.confidentiality,
      terms.ipRights,
      terms.terminationClause,
    ]
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      .join("\n\n");

    if (ordered) {
      return ordered;
    }
  }

  if (typeof description === "string" && description.trim()) {
    return description;
  }
  if (typeof specification === "string" && specification.trim()) {
    return specification;
  }
  if (specification && typeof specification === "object") {
    return JSON.stringify(specification, null, 2);
  }
  return undefined;
}

function normalizeContractItem(payload: unknown): Contract | null {
  const root = asRecord(payload);
  if (!root) return null;

  const job = asRecord(root.job);
  const employer = asRecord(root.employer);
  const freelancer = asRecord(root.freelancer);
  const escrow = asRecord(root.escrow);
  const signatures = asRecord(root.signatures);
  const specification = root.specification;
  const refundRequest = normalizeRefundRequest(root.refundRequest);
  const milestones = Array.isArray(root.paymentMilestones)
    ? root.paymentMilestones
    : Array.isArray(root.milestones)
      ? root.milestones
      : [];

  const id =
    (typeof root.id === "string" && root.id.trim() && root.id) ||
    (typeof root.contractId === "string" && root.contractId.trim() && root.contractId) ||
    "";
  if (!id) return null;

  const jobId =
    (typeof root.jobId === "string" && root.jobId.trim() && root.jobId) ||
    (typeof job?.id === "string" && job.id.trim() && job.id) ||
    "";
  const employerId =
    (typeof root.employerId === "string" && root.employerId.trim() && root.employerId) ||
    (typeof employer?.id === "string" && employer.id.trim() && employer.id) ||
    "";
  const freelancerId =
    (typeof root.freelancerId === "string" && root.freelancerId.trim() && root.freelancerId) ||
    (typeof freelancer?.id === "string" && freelancer.id.trim() && freelancer.id) ||
    "";

  const normalizedEscrow = escrow
    ? {
        totalHeld: readContractNumber(escrow.totalHeld ?? root.escrowHeld ?? root.escrowTotalHeld),
        currency:
          (typeof escrow.currency === "string" && escrow.currency.trim() && escrow.currency) ||
          (typeof root.currency === "string" && root.currency.trim() && root.currency) ||
          undefined,
      }
    : readContractNumber(root.escrowTotalHeld ?? root.escrowHeld) !== undefined
      ? {
          totalHeld: readContractNumber(root.escrowTotalHeld ?? root.escrowHeld),
          currency: typeof root.currency === "string" && root.currency.trim() ? root.currency : undefined,
        }
    : undefined;

  const normalizedMilestones = milestones
    .map((entry) => {
      const item = asRecord(entry);
      if (!item) return null;
      const milestoneId =
        (typeof item.id === "string" && item.id.trim() && item.id) ||
        (typeof item.milestoneId === "string" && item.milestoneId.trim() && item.milestoneId) ||
        "";
      if (!milestoneId) return null;
      return {
        id: milestoneId,
        sequence: readContractNumber(item.sequence),
        title: typeof item.title === "string" ? item.title : undefined,
        description:
          (typeof item.description === "string" && item.description) ||
          (typeof item.deliverables === "string" && item.deliverables) ||
          undefined,
        amount: readContractNumber(item.amount),
        dueDate: typeof item.dueDate === "string" ? item.dueDate : undefined,
        status: normalizeMilestoneStatus(item.status),
        submittedAt: typeof item.submittedAt === "string" ? item.submittedAt : undefined,
        approvedAt: typeof item.approvedAt === "string" ? item.approvedAt : undefined,
        releaseDate: typeof item.releaseDate === "string" ? item.releaseDate : undefined,
        submissionNote: typeof item.submissionNote === "string" ? item.submissionNote : undefined,
        feedbackFromEmployer:
          typeof item.feedbackFromEmployer === "string" ? item.feedbackFromEmployer : undefined,
        escrowLocked: typeof item.escrowLocked === "boolean" ? item.escrowLocked : undefined,
        escrowLockedAt: typeof item.escrowLockedAt === "string" ? item.escrowLockedAt : undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    id,
    jobId,
    employerId,
    freelancerId,
    status: typeof root.status === "string" && root.status.trim() ? root.status.toUpperCase() : "DRAFT",
    jobTitle:
      (typeof root.jobTitle === "string" && root.jobTitle.trim() && root.jobTitle) ||
      (typeof root.title === "string" && root.title.trim() && root.title) ||
      (typeof job?.title === "string" && job.title.trim() && job.title) ||
      undefined,
    employerName:
      (typeof root.employerName === "string" && root.employerName.trim() && root.employerName) ||
      (typeof employer?.fullName === "string" && employer.fullName.trim() && employer.fullName) ||
      (typeof employer?.name === "string" && employer.name.trim() && employer.name) ||
      undefined,
    freelancerName:
      (typeof root.freelancerName === "string" && root.freelancerName.trim() && root.freelancerName) ||
      (typeof freelancer?.fullName === "string" && freelancer.fullName.trim() && freelancer.fullName) ||
      (typeof freelancer?.name === "string" && freelancer.name.trim() && freelancer.name) ||
      undefined,
    totalAmount: readContractNumber(root.totalAmount ?? root.amount),
    paidAmount: readContractNumber(root.paidAmount),
    escrowTotalHeld: readContractNumber(root.escrowTotalHeld ?? root.escrowHeld),
    escrowRequiredAmount: readContractNumber(root.escrowRequiredAmount),
    currency:
      (typeof root.currency === "string" && root.currency.trim() && root.currency) ||
      normalizedEscrow?.currency,
    paymentModel:
      typeof root.paymentModel === "string" && root.paymentModel.trim() ? root.paymentModel : undefined,
    escrowProtectionLevel:
      typeof root.escrowProtectionLevel === "string" && root.escrowProtectionLevel.trim()
        ? root.escrowProtectionLevel
        : undefined,
    disputeWindowDays: readContractNumber(root.disputeWindowDays),
    autoReleaseDays: readContractNumber(root.autoReleaseDays),
    requiresEscrow: typeof root.requiresEscrow === "boolean" ? root.requiresEscrow : undefined,
    adminReviewRequired:
      typeof root.adminReviewRequired === "boolean" ? root.adminReviewRequired : undefined,
    startDate:
      (typeof root.startDate === "string" && root.startDate.trim() && root.startDate) ||
      (typeof root.startedAt === "string" && root.startedAt.trim() && root.startedAt) ||
      undefined,
    endDate:
      (typeof root.endDate === "string" && root.endDate.trim() && root.endDate) ||
      (typeof root.endedAt === "string" && root.endedAt.trim() && root.endedAt) ||
      undefined,
    terms: readContractTermsText(root.terms, root.description, specification),
    createdAt: typeof root.createdAt === "string" ? root.createdAt : undefined,
    agreementVersion: readContractNumber(root.agreementVersion),
    escrowLockedAt: typeof root.escrowLockedAt === "string" ? root.escrowLockedAt : undefined,
    agreementEstablishedAt:
      typeof root.agreementEstablishedAt === "string" ? root.agreementEstablishedAt : undefined,
    lastAgreementUpdatedAt:
      typeof root.lastAgreementUpdatedAt === "string" ? root.lastAgreementUpdatedAt : undefined,
    signatures: signatures
      ? {
          employerSigned:
            typeof signatures.employerSigned === "boolean" ? signatures.employerSigned : undefined,
          employerSignedAt:
            typeof signatures.employerSignedAt === "string" ? signatures.employerSignedAt : undefined,
          freelancerSigned:
            typeof signatures.freelancerSigned === "boolean" ? signatures.freelancerSigned : undefined,
          freelancerSignedAt:
            typeof signatures.freelancerSignedAt === "string"
              ? signatures.freelancerSignedAt
              : undefined,
          contractHash: typeof signatures.contractHash === "string" ? signatures.contractHash : undefined,
        }
      : undefined,
    specification:
      typeof specification === "string" || (specification && typeof specification === "object")
        ? (specification as string | Record<string, unknown>)
        : undefined,
    milestones: normalizedMilestones,
    escrow: normalizedEscrow,
    refundRequest,
  };
}

function normalizeContractsCollection(payload: unknown): Contract[] {
  const root = asRecord(payload);
  const collection = Array.isArray(payload)
    ? payload
    : Array.isArray(root?.items)
      ? root.items
      : Array.isArray(root?.contracts)
        ? root.contracts
        : Array.isArray(root?.data)
          ? root.data
          : [];
  return collection
    .map((entry) => normalizeContractItem(entry))
    .filter((entry): entry is Contract => Boolean(entry));
}

export async function listContracts() {
  const { data } = await api.get("/contracts");
  return normalizeContractsCollection(data);
}

export async function createContract(input: Record<string, unknown>) {
  const response = await api.post("/contracts", input, {
    headers: { "X-Active-Role": "EMPLOYER" },
  });
  const data = unwrapResponse(response, "Unable to create contract");
  const contract = normalizeContractItem(data);
  if (contract) return contract;
  throw new Error("Unable to parse created contract payload");
}

export async function getContract(id: string) {
  const response = await api.get(`/contracts/${id}`);
  const data = unwrapResponse(response, "Unable to load contract");
  const contract = normalizeContractItem(data);
  if (contract) return contract;
  throw new Error("Unable to parse contract payload");
}

export async function deliverContract(id: string, input: { note?: string; deliveryAssetId?: string }) {
  const response = await api.post(`/contracts/${id}/deliver`, input);
  const data = unwrapResponse(response, "Unable to deliver contract");
  const contract = normalizeContractItem(data);
  if (contract) return contract;
  throw new Error("Unable to parse contract payload");
}

export async function completeContract(id: string) {
  const response = await api.post(`/contracts/${id}/complete`);
  const data = unwrapResponse(response, "Unable to complete contract");
  const contract = normalizeContractItem(data);
  if (contract) return contract;
  throw new Error("Unable to parse contract payload");
}

export async function acceptContract(id: string) {
  const response = await api.post(`/contracts/${id}/accept`, undefined, {
    headers: { "X-Active-Role": "FREELANCER" },
  });
  const data = unwrapResponse(response, "Unable to establish contract agreement");
  const contract = normalizeContractItem(data);
  if (contract) return contract;
  throw new Error("Unable to parse accepted contract payload");
}

export async function addContractMilestone(
  id: string,
  input: {
    title: string;
    description?: string;
    amount: number;
    dueDate?: string;
    deliverables?: string;
  },
) {
  const response = await api.post(
    `/contracts/${id}/milestones`,
    {
      title: input.title,
      description: input.description,
      amount: input.amount,
      dueDate: input.dueDate,
      deliverables: input.deliverables,
      status: "PENDING",
    },
    {
      headers: { "X-Active-Role": "EMPLOYER" },
    },
  );
  const data = unwrapResponse(response, "Unable to add milestone");
  const contract = normalizeContractItem(data);
  if (contract) return contract;
  throw new Error("Unable to parse contract milestone payload");
}

export async function submitContractMilestone(
  contractId: string,
  milestoneId: string,
  input?: { note?: string },
) {
  const response = await api.post(
    `/contracts/${contractId}/milestones/${milestoneId}/submit`,
    input ?? {},
    {
      headers: { "X-Active-Role": "FREELANCER" },
    },
  );
  const data = unwrapResponse(response, "Unable to submit milestone");
  const contract = normalizeContractItem(data);
  if (contract) return contract;
  throw new Error("Unable to parse milestone submission payload");
}

export async function approveContractMilestone(
  contractId: string,
  milestoneId: string,
  input?: { feedback?: string },
) {
  const response = await api.post(
    `/contracts/${contractId}/milestones/${milestoneId}/approve`,
    input ?? {},
    {
      headers: { "X-Active-Role": "EMPLOYER" },
    },
  );
  const data = unwrapResponse(response, "Unable to approve milestone");
  const contract = normalizeContractItem(data);
  if (contract) return contract;
  throw new Error("Unable to parse milestone approval payload");
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

export type WalletFxSnapshot = {
  provider?: string | null;
  generatedAt?: string | null;
  supportedCurrencies?: WalletCurrencyCode[] | string[] | null;
  rates?: Record<string, number> | null;
};

export type WalletCurrencyBreakdown = {
  currency?: WalletCurrencyCode | string | null;
  balance?: number | null;
  availableBalance?: number | null;
  escrowHeld?: number | null;
  pendingPayouts?: number | null;
  holds?: number | null;
  convertedBalance?: Record<string, number> | null;
  convertedAvailableBalance?: Record<string, number> | null;
};

export type WalletSnapshot = {
  userId?: string | null;
  balance: number;
  availableBalance?: number;
  currency: WalletCurrencyCode | string;
  escrowHeld?: number;
  pendingPayouts?: number;
  holds?: number;
  pendingLocalTopups?: number;
  supportedCurrencies?: WalletCurrencyCode[] | string[] | null;
  balancesByCurrency?: Record<string, WalletCurrencyBreakdown> | null;
  fx?: WalletFxSnapshot | null;
  entries?: Record<string, unknown>[];
  transactions?: WalletTransaction[];
};

export type WalletWithdrawal = {
  id: string;
  userId?: string | null;
  freelancerId?: string | null;
  amount?: number | string | null;
  amountDecimal?: number | null;
  currency?: string | null;
  paymentMethod?: string | null;
  status?: string | null;
  statusEnum?: string | null;
  failureReason?: string | null;
  transactionId?: string | null;
  referenceNumber?: string | null;
  requestedAt?: string | null;
  processedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  notes?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  bankDetails?: Record<string, string> | null;
};

export type WalletForecastPoint = {
  key: string;
  label: string;
  projectedNet: number;
  projectedCumulative: number;
  confidenceLower: number;
  confidenceUpper: number;
  confidenceBand: number;
};

export type WalletForecastResponse = {
  points: WalletForecastPoint[];
  source: "backend" | "heuristic";
  model?: string;
  generatedAt?: string;
};

type WalletForecastOptions = {
  range: "7D" | "14D" | "30D" | "90D" | "1Y";
  currency?: string;
  horizon?: number;
  baselineCumulative?: number;
};

function asFinite(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toForecastPoints(payload: unknown, baselineCumulative = 0): WalletForecastPoint[] {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const collection = Array.isArray(payload)
    ? payload
    : Array.isArray(record?.points)
      ? record?.points
      : Array.isArray(record?.forecast)
        ? record?.forecast
        : record?.forecast && typeof record.forecast === "object" && Array.isArray((record.forecast as Record<string, unknown>).points)
          ? ((record.forecast as Record<string, unknown>).points as unknown[])
          : [];

  let runningCumulative = asFinite(record?.startCumulative) ?? baselineCumulative;

  const points: WalletForecastPoint[] = [];
  collection.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const item = entry as Record<string, unknown>;
    const projectedNet =
      asFinite(item.projectedNet) ??
      asFinite(item.net) ??
      asFinite(item.forecastNet) ??
      asFinite(item.predictedNet) ??
      asFinite(item.value);

    if (projectedNet === null) return;

    const key =
      (typeof item.key === "string" && item.key) ||
      (typeof item.date === "string" && item.date) ||
      (typeof item.timestamp === "string" && item.timestamp) ||
      `p-${index + 1}`;

    const label =
      (typeof item.label === "string" && item.label) ||
      (typeof item.period === "string" && item.period) ||
      (typeof item.bucket === "string" && item.bucket) ||
      key;

    const projectedCumulativeCandidate =
      asFinite(item.projectedCumulative) ?? asFinite(item.cumulative) ?? asFinite(item.forecastCumulative);
    const projectedCumulative = projectedCumulativeCandidate ?? runningCumulative + projectedNet;
    runningCumulative = projectedCumulative;

    const confidenceLower =
      asFinite(item.confidenceLower) ??
      asFinite(item.lowerBound) ??
      asFinite(item.lower) ??
      asFinite(item.p10) ??
      projectedNet;

    const confidenceUpper =
      asFinite(item.confidenceUpper) ??
      asFinite(item.upperBound) ??
      asFinite(item.upper) ??
      asFinite(item.p90) ??
      projectedNet;

    const lower = Math.min(confidenceLower, confidenceUpper);
    const upper = Math.max(confidenceLower, confidenceUpper);

    points.push({
      key,
      label,
      projectedNet,
      projectedCumulative,
      confidenceLower: lower,
      confidenceUpper: upper,
      confidenceBand: upper - lower,
    });
  });

  return points;
}

export async function getWallet() {
  const response = await api.get(`/wallet`);
  return unwrapResponse(response, "Failed to load wallet data") as WalletSnapshot;
}

export async function getWalletForecast(options: WalletForecastOptions) {
  const defaultHorizon =
    options.horizon ?? (options.range === "1Y" ? 6 : options.range === "90D" ? 14 : options.range === "14D" ? 7 : 10);
  const params = {
    range: options.range,
    currency: options.currency,
    horizon: defaultHorizon,
  };

  // Canonical backend contract: GET /wallet/forecast -> { source, model, generatedAt, points[] }
  const primary = await api.get("/wallet/forecast", { params });
  if (primary.status < 400) {
    const points = toForecastPoints(primary.data, options.baselineCumulative ?? 0);
    if (points.length > 0) {
      const data = primary.data as Record<string, unknown> | null;
      const sourceRaw = typeof data?.source === "string" ? data.source.toLowerCase() : "backend";
      return {
        points,
        source: sourceRaw === "heuristic" ? "heuristic" : "backend",
        model: typeof data?.model === "string" ? data.model : undefined,
        generatedAt: typeof data?.generatedAt === "string" ? data.generatedAt : undefined,
      } satisfies WalletForecastResponse;
    }
  }

  // Backward-compatible fallback shapes/routes.
  const endpoints = ["/wallet/analytics/forecast", "/wallet/projection", "/wallet/analytics/projection"];

  for (const endpoint of endpoints) {
    const response = await api.get(endpoint, { params });
    if (response.status >= 400) {
      continue;
    }

    const points = toForecastPoints(response.data, options.baselineCumulative ?? 0);
    if (points.length > 0) {
      const data = response.data as Record<string, unknown> | null;
      const sourceRaw = typeof data?.source === "string" ? data.source.toLowerCase() : "backend";
      return {
        points,
        source: sourceRaw === "heuristic" ? "heuristic" : "backend",
        model: typeof data?.model === "string" ? data.model : undefined,
        generatedAt: typeof data?.generatedAt === "string" ? data.generatedAt : undefined,
      } satisfies WalletForecastResponse;
    }
  }

  throw new Error("Wallet forecast endpoint unavailable");
}

export async function initStripe(input: { amount: number; currency?: string }, idempotencyKey?: string) {
  const response = await api.post(`/payments/stripe/init`, input, {
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
  return unwrapResponse(response, "Failed to initialize Stripe checkout") as {
    transactionId: string;
    providerRef?: string;
    checkoutUrl?: string;
    idempotent?: boolean;
  } & Record<string, any>;
}

export async function initChapa(input: { amount: number; currency?: string }, idempotencyKey?: string) {
  const response = await api.post(`/payments/chapa/init`, input, {
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
  return unwrapResponse(response, "Failed to initialize Chapa payment") as {
    transactionId: string;
    providerRef?: string;
    checkoutUrl?: string;
    idempotent?: boolean;
  } & Record<string, any>;
}

export async function finalizeStripeFunding(input: { transactionId?: string; providerRef?: string }) {
  const response = await api.post(`/payments/stripe/finalize`, input);
  return unwrapResponse(response, "Failed to finalize Stripe funding") as {
    ok: boolean;
    transactionId: string;
    providerRef?: string;
    status?: string;
    walletCredited?: boolean;
    idempotent?: boolean;
  };
}

export async function finalizeChapaFunding(input: { transactionId?: string; providerRef?: string }) {
  const response = await api.post(`/payments/chapa/finalize`, input);
  return unwrapResponse(response, "Failed to finalize Chapa funding") as {
    ok: boolean;
    transactionId: string;
    providerRef?: string;
    status?: string;
    walletCredited?: boolean;
    idempotent?: boolean;
  };
}

export async function localTopupRequest(input: { amount: number; currency?: string; referenceId?: string }, idempotencyKey?: string) {
  const response = await api.post(`/payments/local/request`, input, {
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
  return unwrapResponse(response, "Failed to submit local top-up request") as {
    transactionId: string;
    status?: string;
    message?: string;
  };
}

export async function internalWalletTransfer(
  input: { recipient: string; amount: number; currency?: string; note?: string; adminReviewRequired?: boolean },
  idempotencyKey?: string
) {
  const response = await api.post(`/payments/internal/transfer`, input, {
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
  return unwrapResponse(response, "Failed to send wallet transfer") as {
    ok: boolean;
    transferReference: string;
    transactionId: string;
    amount: number;
    currency: string;
    status?: string;
    senderBalanceAfter?: number;
    recipient: { id: string; email: string; fullName?: string };
    idempotent?: boolean;
  };
}

export async function withdrawFromWallet(input: {
  amount: number;
  currency?: string;
  paymentMethod?: string;
  bankDetails?: Record<string, string>;
}) {
  const response = await api.post(`/v2/wallet/withdraw`, input);
  return unwrapResponse(response, "Failed to submit withdrawal request") as {
    message: string;
    withdrawalId: string;
    amount: number;
    status: string;
  };
}

export async function getWalletWithdrawals(options?: { page?: number; size?: number }) {
  const response = await api.get(`/v2/wallet/withdrawals`, {
    params: {
      page: options?.page ?? 0,
      size: options?.size ?? 50,
    },
  });
  return unwrapResponse(response, "Failed to load wallet withdrawals") as {
    content?: WalletWithdrawal[];
    totalElements?: number;
    totalPages?: number;
    number?: number;
    size?: number;
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

export type AdminPendingInternalTransfer = {
  id: string;
  userId: string;
  provider?: string;
  direction?: "IN" | "OUT";
  amount?: number;
  currency?: string;
  status?: string;
  providerRef?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminPaymentTransaction = {
  id: string;
  userId: string;
  senderUserId?: string;
  senderLabel?: string;
  receiverUserId?: string;
  receiverLabel?: string;
  provider?: string;
  direction?: "IN" | "OUT";
  status?: string;
  amount?: number;
  currency?: string;
  providerRef?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminWithdrawal = {
  id: string;
  freelancerId?: string;
  userId?: string;
  amount?: string | number;
  amountDecimal?: number;
  currency?: string;
  fee?: string | number;
  netAmount?: string | number;
  paymentMethod?: string;
  accountDetails?: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  swiftCode?: string;
  routingNumber?: string;
  bankDetails?: Record<string, string>;
  status?: string;
  statusEnum?: string;
  failureReason?: string;
  transactionId?: string;
  referenceNumber?: string;
  requestedAt?: string;
  processedAt?: string;
  completedAt?: string;
  expectedArrivalDate?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
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

export async function adminListPendingInternalTransfers(options?: { page?: number; size?: number }) {
  const { data } = await api.get(`/admin/payments/internal/pending`, {
    params: { page: options?.page ?? 0, size: options?.size ?? 20 },
  });
  return data as {
    content: AdminPendingInternalTransfer[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

export async function adminListPaymentTransactions(options?: {
  provider?: string;
  status?: string;
  direction?: string;
  userId?: string;
  query?: string;
  page?: number;
  size?: number;
}) {
  const { data } = await api.get(`/admin/payments/transactions`, {
    params: {
      provider: options?.provider,
      status: options?.status,
      direction: options?.direction,
      userId: options?.userId,
      query: options?.query,
      page: options?.page ?? 0,
      size: options?.size ?? 20,
    },
  });
  return data as {
    content: AdminPaymentTransaction[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    generatedAt?: string;
  };
}

export async function adminReviewInternalTransfer(id: string, input: { approved?: boolean; note?: string }) {
  const { data } = await api.post(`/admin/payments/internal/${id}/review`, input);
  return data as {
    ok: boolean;
    transactionId: string;
    status: string;
    message?: string;
    transferReference?: string;
    amount?: number;
    currency?: string;
    senderBalanceAfter?: number;
    recipientBalanceAfter?: number;
    idempotent?: boolean;
  };
}

export async function adminListWithdrawals(options?: { status?: string; page?: number; size?: number }) {
  const { data } = await api.get(`/admin/withdrawals`, {
    params: {
      status: options?.status ?? "PENDING,PROCESSING",
      page: options?.page ?? 0,
      size: options?.size ?? 20,
    },
  });
  return data as {
    content: AdminWithdrawal[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

export async function adminUpdateWithdrawal(id: string, input: { status: string; note?: string }) {
  const { data } = await api.patch(`/admin/withdrawals/${id}`, input);
  return data as AdminWithdrawal;
}

export async function adminWalletTopup(input: { userId: string; amount: number; currency?: string }) {
  const { data } = await api.post(`/v2/wallet/topup`, input);
  return data as { message: string; transactionId: string; amount: number; newBalance: number };
}

export async function adminWalletAdjust(input: {
  userId: string;
  amount: number;
  currency?: string;
  action: "COMMIT" | "ROLLBACK";
  note?: string;
}) {
  const { data } = await api.post(`/admin/wallet/adjust`, input);
  return data as { message: string; transactionId: string; action: "COMMIT" | "ROLLBACK"; amount: number; newBalance: number };
}

// Escrow
export async function escrowFund(input: { contractId: string; amount: number; currency?: string }) {
  const response = await api.post(`/escrow/fund`, input);
  return unwrapResponse(response, "Failed to fund escrow") as Contract;
}

export async function escrowRelease(input: { contractId: string; amount: number; platformFeeAmount?: number }) {
  const response = await api.post(`/escrow/release`, input);
  return unwrapResponse(response, "Failed to release escrow") as Contract;
}

export async function escrowRefund(input: { contractId: string; amount: number }) {
  const response = await api.post(`/escrow/refund`, input);
  return unwrapResponse(response, "Failed to refund escrow") as Contract;
}

export async function requestEscrowRefund(input: { contractId: string; amount: number; note?: string }) {
  const response = await api.post(`/escrow/refund/request`, input);
  return unwrapResponse(response, "Failed to request escrow refund") as Contract;
}

export async function decideEscrowRefund(input: { contractId: string; approve: boolean; note?: string }) {
  const response = await api.post(`/escrow/refund/decision`, input);
  return unwrapResponse(response, "Failed to update escrow refund approval") as Contract;
}

// Assets
export type Asset = {
  id: string;
  url: string;
  downloadUrl?: string;
  scope: string;
  title?: string;
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
export type ChatThread = {
  id: string;
  participantIds: string[];
  threadType?: "DIRECT" | "GROUP" | "CHANNEL";
  groupName?: string;
  channelDescription?: string;
  ownerUserId?: string;
  memberMessagingEnabled?: boolean;
  lastMessageAt?: string;
  lastMessage?: string;
  lastMessageSenderId?: string;
  unreadCount?: number;
  pinnedMessageId?: string | null;
  pinned?: boolean;
  muted?: boolean;
  archived?: boolean;
  lastReadAtByUser?: Record<string, string>;
};
export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  type: "TEXT" | "ASSET";
  text?: string;
  assetId?: string;
  replyToMessageId?: string;
  forwardedFromMessageId?: string;
  editedAt?: string;
  deletedAt?: string;
  deletedForEveryone?: boolean;
  reactions?: Record<string, string[]>;
  createdAt?: string;
};
export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  payload?: Record<string, unknown>;
  read: boolean;
  createdAt?: string;
};

function asChatThreadOrThrow(payload: unknown, fallbackMessage: string) {
  if (
    payload &&
    typeof payload === "object" &&
    typeof (payload as { id?: unknown }).id === "string" &&
    Array.isArray((payload as { participantIds?: unknown }).participantIds)
  ) {
    return payload as ChatThread;
  }

  const message =
    payload &&
    typeof payload === "object" &&
    typeof (payload as { message?: unknown }).message === "string"
      ? (payload as { message: string }).message
      : fallbackMessage;

  throw new Error(message);
}

export async function listThreads() {
  const { data } = await api.get(`/chat/threads`);
  return data as ChatThread[];
}

export async function createThread(input: {
  participantIds: string[];
  threadType?: "DIRECT" | "GROUP" | "CHANNEL";
  groupName?: string;
  channelDescription?: string;
  memberMessagingEnabled?: boolean;
}) {
  const { data } = await api.post(`/chat/threads`, input);
  return asChatThreadOrThrow(data, "Failed to create chat thread.");
}

export async function listMessages(threadId: string) {
  const { data } = await api.get(`/chat/threads/${threadId}/messages`);
  return data as ChatMessage[];
}

export async function sendMessage(threadId: string, message: { type: "TEXT" | "ASSET"; text?: string; assetId?: string; replyToMessageId?: string | null }) {
  const { data } = await api.post(`/chat/threads/${threadId}/messages`, message);
  return data as ChatMessage;
}

export async function updateChatMessage(
  threadId: string,
  messageId: string,
  message: { type?: "TEXT" | "ASSET"; text?: string; assetId?: string; replyToMessageId?: string | null },
) {
  const { data } = await api.patch(`/chat/threads/${threadId}/messages/${messageId}`, message);
  return data as ChatMessage;
}

export async function deleteChatMessage(threadId: string, messageId: string, forEveryone = true) {
  const { data } = await api.delete(`/chat/threads/${threadId}/messages/${messageId}`, { params: { forEveryone } });
  return data as ChatMessage;
}

export async function forwardChatMessage(threadId: string, messageId: string) {
  const { data } = await api.post(`/chat/threads/${threadId}/messages/${messageId}/forward`);
  return data as ChatMessage;
}

export async function toggleChatMessageReaction(threadId: string, messageId: string, emoji: string) {
  const { data } = await api.post(`/chat/threads/${threadId}/messages/${messageId}/reactions`, { emoji });
  return data as ChatMessage;
}

export async function markThreadRead(threadId: string) {
  const { data } = await api.post(`/chat/threads/${threadId}/read`);
  return asChatThreadOrThrow(data, "Failed to update chat thread.");
}

export async function updateThread(
  threadId: string,
  input: {
    groupName?: string;
    channelDescription?: string;
    memberMessagingEnabled?: boolean;
  },
) {
  const { data } = await api.patch(`/chat/threads/${threadId}`, input);
  return asChatThreadOrThrow(data, "Failed to update chat thread.");
}

export async function addThreadParticipants(threadId: string, participantIds: string[]) {
  const { data } = await api.post(`/chat/threads/${threadId}/participants`, { participantIds });
  return asChatThreadOrThrow(data, "Failed to add participants.");
}

export async function removeThreadParticipant(threadId: string, participantId: string) {
  const { data } = await api.delete(`/chat/threads/${threadId}/participants/${encodeURIComponent(participantId)}`);
  return asChatThreadOrThrow(data, "Failed to remove participant.");
}

export async function updateThreadPreferences(
  threadId: string,
  input: {
    pinned?: boolean;
    muted?: boolean;
    archived?: boolean;
  },
) {
  const { data } = await api.patch(`/chat/threads/${threadId}/preferences`, input);
  return asChatThreadOrThrow(data, "Failed to update thread preferences.");
}

export async function pinThreadMessage(threadId: string, messageId: string) {
  const { data } = await api.post(`/chat/threads/${threadId}/pin/${messageId}`);
  return asChatThreadOrThrow(data, "Failed to pin message.");
}

export async function clearPinnedThreadMessage(threadId: string) {
  const { data } = await api.delete(`/chat/threads/${threadId}/pin`);
  return asChatThreadOrThrow(data, "Failed to clear pinned message.");
}

export async function adminGetStorageAnalytics() {
  const { data } = await api.get(`/assets/analytics`);
  return data as {
    totalSize: number;
    totalCount: number;
    sizeByType: Record<string, number>;
    countByType: Record<string, number>;
    storageTotal: number;
  };
}

export async function adminGetMonitoringMetrics() {
  const { data } = await api.get(`/admin/monitoring/metrics`);
  return data as {
    cpuUsage: number;
    memoryUsed: number;
    memoryMax: number;
    memoryPercentage: number;
    uptimeSeconds: number;
    diskTotal: number;
    diskUsed: number;
    diskPercentage: number;
    apiLatencyAvg: number;
    apiRequestsTotal: number;
    dbLatencyAvg: number;
    websocketConnections: number;
    activeContainers: number;
  };
}

export async function adminGetMonitoringLogs(lines = 100) {
  const { data } = await api.get(`/admin/monitoring/logs`, { params: { lines } });
  return data as string[];
}

// Notifications
export async function listNotifications() {
  const { data } = await api.get(`/notifications`);
  return Array.isArray(data) ? (data as AppNotification[]) : [];
}

export async function markNotificationRead(id: string) {
  const { data } = await api.post(`/notifications/${id}/read`);
  return data as AppNotification;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post(`/notifications/read-all`);
  return data as { updated: number };
}

export type BrowserPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function getWebPushPublicKey() {
  const { data } = await api.get(`/push/public-key`);
  const maybeKey =
    data &&
    typeof data === "object" &&
    typeof (data as { publicKey?: unknown }).publicKey === "string"
      ? (data as { publicKey: string }).publicKey
      : "";

  return maybeKey;
}

export async function saveWebPushSubscription(subscription: BrowserPushSubscription) {
  const { data } = await api.post(`/push/subscriptions`, subscription);
  return data as { status: string };
}

export async function deleteWebPushSubscription(endpoint: string) {
  const { data } = await api.delete(`/push/subscriptions`, {
    data: { endpoint },
  });

  return data as { status: string };
}

// Disputes
export type Dispute = {
  id: string;
  contractId: string;
  contractTitle?: string;
  employerId?: string;
  employerName?: string;
  freelancerId?: string;
  freelancerName?: string;
  openedByUserId?: string;
  openedByRole?: "EMPLOYER" | "FREELANCER";
  status: string;
  reason?: string;
  details?: string;
  adminNotes?: string[];
  evidenceAssetIds?: string[];
  adminMessages?: Array<{
    id: string;
    target: "EMPLOYER" | "FREELANCER" | "BOTH";
    content: string;
    sentByUserId?: string;
    sentByName?: string;
    sentAt?: string;
  }>;
  participantControls?: {
    employerAction?: "NONE" | "BLOCK" | "UNBLOCK" | "BAN";
    freelancerAction?: "NONE" | "BLOCK" | "UNBLOCK" | "BAN";
    updatedAt?: string;
    updatedByUserId?: string;
  };
  settlement?: {
    employerPercent?: number;
    freelancerPercent?: number;
    adminPercent?: number;
    employerAmount?: number;
    freelancerAmount?: number;
    adminAmount?: number;
    reserveRecipientUserId?: string;
    currency?: string;
    note?: string;
    decidedAt?: string;
    decidedByUserId?: string;
    decidedByName?: string;
  };
  heldAmount?: number;
  paidAmount?: number;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function openDispute(input: { contractId: string; reason?: string; details?: string; evidenceAssetIds?: string[] }) {
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

export async function adminSendDisputeMessage(
  id: string,
  body: { target: "EMPLOYER" | "FREELANCER" | "BOTH"; content: string },
) {
  const { data } = await api.post(`/admin/disputes/${id}/messages`, body);
  return data as Dispute;
}

export async function adminUpdateDisputeParticipantControl(
  id: string,
  body: { subject: "EMPLOYER" | "FREELANCER"; action: "NONE" | "BLOCK" | "UNBLOCK" | "BAN"; adminNote?: string },
) {
  const { data } = await api.post(`/admin/disputes/${id}/controls`, body);
  return data as Dispute;
}

export async function adminApplyDisputeSettlement(
  id: string,
  body: {
    employerPercent: number;
    freelancerPercent: number;
    adminPercent: number;
    reserveRecipientUserId?: string;
    note?: string;
  },
) {
  const { data } = await api.post(`/admin/disputes/${id}/settlement`, body);
  return data as Dispute;
}

// Content
export type ContentItem = {
  id: string;
  type: string;
  slug?: string;
  title: string;
  body: string;
  status: string;
  mediaAssetIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export async function listContent(type = "FAQ") {
  const { data } = await api.get(`/content`, { params: { type } });
  return data as ContentItem[];
}

export async function adminListContent(options?: { type?: string; status?: string }) {
  const { data } = await api.get(`/admin/content`, {
    params: {
      type: options?.type,
      status: options?.status,
    },
  });
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
export type AppUser = {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  roles: string[];
  suspended?: boolean;
  documentsVerified?: boolean;
  createdAt?: string;
  lastSeenAt?: string;
  online?: boolean;
  accountType?: string;
  companyName?: string | null;
  employerKycStatus?: string | null;
  freelancerVerificationStatus?: string | null;
  identity?: {
    status: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    documentVerified: boolean;
    reviewNote?: string | null;
    kycMethod?: string | null;
    verifiedBy?: string | null;
    verifiedAt?: string | null;
  };
  access?: {
    accessLevel: string;
    accessScope: string;
    permissions: string[];
    privilegeNote?: string | null;
    elevatedUntil?: string | null;
    roleVersion?: string | null;
  };
  security?: {
    mfaRequired: boolean;
    mfaEnabled: boolean;
    oauthEnabled: boolean;
    ssoEnabled: boolean;
    adaptiveAuthEnabled: boolean;
    forcePasswordReset: boolean;
    banned: boolean;
    riskLevel: string;
    riskReason?: string | null;
    failedLoginAttempts: number;
    passwordUpdatedAt?: string | null;
    lastCredentialResetAt?: string | null;
    credentialResetChannel?: string | null;
    lastWarningAt?: string | null;
    blacklistedIps: string[];
    blacklistedDevices: string[];
  };
  warnings?: Array<{
    id: string;
    severity: string;
    reason: string;
    note?: string | null;
    status: string;
    issuedBy?: string | null;
    issuedAt?: string | null;
    resolvedAt?: string | null;
    resolutionNote?: string | null;
  }>;
};

export type AdminIdentityRoleDefinition = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  systemRole: boolean;
  version: number;
  inherits: string[];
  permissions: string[];
  assignedUsers: number;
};

export type AdminIdentityPolicySummary = {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSymbol: boolean;
    expiryDays: number;
    passwordReuseLimit: number;
  };
  authenticationPolicy: {
    mfaRequiredForAdmins: boolean;
    oauthEnabled: boolean;
    ssoEnabled: boolean;
    adaptiveAuthEnabled: boolean;
    zeroTrustEnabled: boolean;
    abacEnabled: boolean;
    rateLimitPerMinute: number;
    maxFailedLoginAttempts: number;
    sessionTimeoutMinutes: number;
  };
  governancePolicy: {
    leastPrivilegeEnforced: boolean;
    auditTrailEnabled: boolean;
    anomalyAlertsEnabled: boolean;
    automatedProvisioningEnabled: boolean;
  };
  updatedAt?: string;
};

export type AdminIdentityWorkspace = {
  generatedAt: string;
  metrics: Array<{
    key: string;
    label: string;
    value: string;
    tone: string;
  }>;
  activityTrend: Array<{
    month: string;
    newUsers: number;
    activeUsers: number;
    credentialResets: number;
    suspensions: number;
  }>;
  roleDistribution: Array<{
    label: string;
    value: number;
    tone: string;
  }>;
  verificationDistribution: Array<{
    label: string;
    value: number;
    tone: string;
  }>;
  stateDistribution: Array<{
    label: string;
    value: number;
    tone: string;
  }>;
  users: AppUser[];
  roles: AdminIdentityRoleDefinition[];
  policies: AdminIdentityPolicySummary;
  alerts: Array<{
    key: string;
    title: string;
    detail: string;
    severity: string;
    userId?: string | null;
    actionHint?: string | null;
  }>;
  auditTrail: Array<{
    id: string;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    actorUserId?: string | null;
    createdAt?: string | null;
    metadata?: Record<string, unknown>;
  }>;
};

export type AdminCreateUserInput = {
  email: string;
  username?: string;
  fullName: string;
  password: string;
  roles: string[];
  suspended?: boolean;
  documentsVerified?: boolean;
};

export type AdminUpdateUserInput = Partial<AppUser> & {
  password?: string;
  roles?: string[];
};

export async function adminListUsers() {
  const { data } = await api.get(`/admin/users`);
  return data as AppUser[];
}

export async function adminUsersWorkspace() {
  const { data } = await api.get(`/admin/users/workspace`);
  return data as AdminIdentityWorkspace;
}

export async function adminPatchUser(id: string, patch: AdminUpdateUserInput) {
  const { data } = await api.patch(`/admin/users/${id}`, patch);
  return data as AppUser;
}

export async function adminCreateUser(input: AdminCreateUserInput) {
  const { data } = await api.post(`/admin/users`, input);
  return data as AppUser;
}

export async function adminDeleteUser(id: string) {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data as { deleted: boolean; id: string };
}

export async function adminGrantUserRole(id: string, role: string) {
  const { data } = await api.post(`/admin/users/${id}/roles/grant`, { role });
  return data as AppUser;
}

export async function adminRevokeUserRole(id: string, role: string) {
  const { data } = await api.post(`/admin/users/${id}/roles/revoke`, { role });
  return data as AppUser;
}

export async function adminCreateRoleDefinition(input: {
  key: string;
  label: string;
  description?: string;
  inherits?: string[];
  permissions?: string[];
}) {
  const { data } = await api.post(`/admin/users/roles`, input);
  return data as AdminIdentityRoleDefinition;
}

export async function adminUpdateRoleDefinition(id: string, patch: {
  label?: string;
  description?: string;
  inherits?: string[];
  permissions?: string[];
}) {
  const { data } = await api.patch(`/admin/users/roles/${id}`, patch);
  return data as AdminIdentityRoleDefinition;
}

export async function adminApplyUserAccessControl(id: string, patch: {
  accessLevel?: string;
  accessScope?: string;
  permissions?: string[];
  privilegeNote?: string;
  elevatedUntil?: string | null;
  mfaRequired?: boolean;
  mfaEnabled?: boolean;
  oauthEnabled?: boolean;
  ssoEnabled?: boolean;
  adaptiveAuthEnabled?: boolean;
  forcePasswordReset?: boolean;
  riskLevel?: string;
  riskReason?: string;
  failedLoginAttempts?: number;
}) {
  const { data } = await api.post(`/admin/users/${id}/access-control`, patch);
  return data as AppUser;
}

export async function adminReviewUserIdentity(id: string, patch: {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  documentVerified?: boolean;
  status?: string;
  reviewNote?: string;
  kycMethod?: string;
}) {
  const { data } = await api.post(`/admin/users/${id}/identity-verification`, patch);
  return data as AppUser;
}

export async function adminResetUserCredentials(id: string, input: {
  newPassword?: string;
  forceReset?: boolean;
  channel?: string;
}) {
  const { data } = await api.post(`/admin/users/${id}/credential-reset`, input);
  return data as AppUser;
}

export async function adminIssueUserWarning(id: string, input: {
  severity?: string;
  reason: string;
  note?: string;
  suspendUser?: boolean;
}) {
  const { data } = await api.post(`/admin/users/${id}/warnings`, input);
  return data as AppUser;
}

export async function adminResolveUserWarning(id: string, warningId: string, input?: { note?: string }) {
  const { data } = await api.post(`/admin/users/${id}/warnings/${warningId}/resolve`, input ?? {});
  return data as AppUser;
}

export async function adminHandleMaliciousUser(id: string, input: {
  action?: string;
  reason: string;
  ipAddresses?: string[];
  deviceIds?: string[];
}) {
  const { data } = await api.post(`/admin/users/${id}/malicious-control`, input);
  return data as AppUser;
}

export async function adminUpdateIdentityPolicies(input: {
  passwordPolicy?: AdminIdentityPolicySummary["passwordPolicy"];
  authenticationPolicy?: AdminIdentityPolicySummary["authenticationPolicy"];
  governancePolicy?: AdminIdentityPolicySummary["governancePolicy"];
}) {
  const { data } = await api.post(`/admin/users/policies`, input);
  return data as AdminIdentityPolicySummary;
}

// Admin Tenants
export type AdminTenantQuota = {
  maxActiveProjects?: number;
  maxTeamMembers?: number;
  storageLimitGb?: number;
  apiRateLimitPerMinute?: number;
};

export type AdminTenantBilling = {
  plan?: string;
  status?: string;
  model?: string;
  billingEmail?: string;
  currency?: string;
  provider?: string;
  accountId?: string;
  renewalDate?: string;
};

export type AdminTenantMigration = {
  status?: string;
  targetRegion?: string;
  note?: string;
  requestedAt?: string;
  completedAt?: string;
};

export type AdminTenantEnvironment = {
  deploymentMode?: string;
  namespace?: string;
  cluster?: string;
  region?: string;
  infrastructureProvider?: string;
  computeProfile?: string;
  storageProfile?: string;
  networkSegment?: string;
  environmentTemplate?: string;
  status?: string;
  autoScalingEnabled?: boolean;
  selfServiceOnboardingEnabled?: boolean;
  provisionedAt?: string;
};

export type AdminTenantUsage = {
  cpuCoresUsed?: number;
  memoryGbUsed?: number;
  storageGbUsed?: number;
  apiRequestsCurrentPeriod?: number;
  bandwidthMbpsUsed?: number;
  anomalyStatus?: string;
  anomalyScore?: number;
  lastCollectedAt?: string;
};

export type AdminTenantResourceLimits = {
  softCpuCores?: number;
  hardCpuCores?: number;
  softMemoryGb?: number;
  hardMemoryGb?: number;
  softStorageGb?: number;
  hardStorageGb?: number;
  softBandwidthMbps?: number;
  hardBandwidthMbps?: number;
  throttlingEnabled?: boolean;
  autoScaleEnabled?: boolean;
};

export type AdminTenantPermissionProfile = {
  accessModel?: string;
  adminRoles?: string[];
  permissions?: string[];
  isolationEnforced?: boolean;
};

export type AdminTenantIsolationProfile = {
  databaseIsolationMode?: string;
  networkPolicy?: string;
  encryptionAtRest?: boolean;
  encryptionInTransit?: boolean;
  crossTenantViolationCount?: number;
  securityPolicy?: string;
};

export type AdminTenantSuspension = {
  status?: string;
  reason?: string;
  note?: string;
  suspendedAt?: string;
  resumedAt?: string;
};

export type AdminTenantSummary = {
  id: string;
  userId?: string;
  ownerName: string;
  ownerEmail?: string;
  ownerUsername?: string;
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  country?: string;
  employeeCount?: number;
  tier?: string;
  active: boolean;
  ownerSuspended?: boolean;
  businessVerified?: boolean;
  paymentVerified?: boolean;
  kycStatus?: string;
  totalProjects?: number;
  openProjects?: number;
  totalJobs?: number;
  activeContracts?: number;
  totalSpent?: number;
  quota?: AdminTenantQuota;
  billing?: AdminTenantBilling;
  migration?: AdminTenantMigration;
  environment?: AdminTenantEnvironment;
  usage?: AdminTenantUsage;
  resourceLimits?: AdminTenantResourceLimits;
  permissionProfile?: AdminTenantPermissionProfile;
  isolationProfile?: AdminTenantIsolationProfile;
  suspension?: AdminTenantSuspension;
  ownerCreatedAt?: string;
  updatedAt?: string;
};

export type AdminTenantWorkspaceResponse = {
  generatedAt?: string;
  tenants: AdminTenantSummary[];
};

export type AdminTenantOperationsWorkspace = {
  generatedAt?: string;
  metrics: Array<{
    key: string;
    label: string;
    value: string;
    tone: string;
  }>;
  lifecycleDistribution: Array<{
    label: string;
    value: number;
    tone: string;
  }>;
  billingDistribution: Array<{
    label: string;
    value: number;
    tone: string;
  }>;
  usageSnapshots: Array<{
    tenantId: string;
    tenantName: string;
    cpuCoresUsed: number;
    memoryGbUsed: number;
    storageGbUsed: number;
    apiRequestsCurrentPeriod: number;
    bandwidthMbpsUsed: number;
  }>;
  alerts: Array<{
    key: string;
    title: string;
    detail: string;
    severity: string;
    tenantId?: string;
    actionHint?: string;
  }>;
  auditTrail: Array<{
    id: string;
    action: string;
    entityType?: string;
    entityId?: string;
    actorUserId?: string;
    createdAt?: string;
  }>;
  tenants: AdminTenantSummary[];
};

export type AdminCreateTenantInput = {
  ownerFullName: string;
  ownerEmail: string;
  ownerUsername?: string;
  ownerPassword: string;
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  country?: string;
  employeeCount?: number;
  tier?: string;
  plan?: string;
  billingModel?: string;
  billingEmail?: string;
  billingCurrency?: string;
  billingProvider?: string;
  billingAccountId?: string;
  maxActiveProjects?: number;
  maxTeamMembers?: number;
  storageLimitGb?: number;
  apiRateLimitPerMinute?: number;
};

export type AdminUpdateTenantInput = {
  ownerFullName?: string;
  ownerEmail?: string;
  ownerUsername?: string;
  companyName?: string;
  companyWebsite?: string;
  industry?: string;
  country?: string;
  employeeCount?: number;
  tier?: string;
  active?: boolean;
  businessVerified?: boolean;
  paymentVerified?: boolean;
  kycStatus?: string;
  verificationNote?: string;
  plan?: string;
  billingStatus?: string;
  billingModel?: string;
  billingEmail?: string;
  billingCurrency?: string;
  billingProvider?: string;
  billingAccountId?: string;
  renewalDate?: string;
  maxActiveProjects?: number;
  maxTeamMembers?: number;
  storageLimitGb?: number;
  apiRateLimitPerMinute?: number;
};

export async function adminListTenants() {
  const { data } = await api.get(`/admin/tenants`);
  return data as AdminTenantWorkspaceResponse;
}

export async function adminTenantWorkspace() {
  const { data } = await api.get(`/admin/tenants/workspace`);
  return data as AdminTenantOperationsWorkspace;
}

export async function adminCreateTenant(input: AdminCreateTenantInput) {
  const { data } = await api.post(`/admin/tenants`, input);
  return data as AdminTenantSummary;
}

export async function adminPatchTenant(id: string, patch: AdminUpdateTenantInput) {
  const { data } = await api.patch(`/admin/tenants/${id}`, patch);
  return data as AdminTenantSummary;
}

export async function adminMigrateTenant(id: string, input: { targetRegion: string; note?: string }) {
  const { data } = await api.post(`/admin/tenants/${id}/migrate`, input);
  return data as AdminTenantSummary;
}

export async function adminDeleteTenant(id: string) {
  const { data } = await api.delete(`/admin/tenants/${id}`);
  return data as AdminTenantSummary;
}

export async function adminProvisionTenantEnvironment(id: string, input: {
  deploymentMode?: string;
  namespace?: string;
  cluster?: string;
  region?: string;
  infrastructureProvider?: string;
  computeProfile?: string;
  storageProfile?: string;
  networkSegment?: string;
  environmentTemplate?: string;
  autoScalingEnabled?: boolean;
  selfServiceOnboardingEnabled?: boolean;
}) {
  const { data } = await api.post(`/admin/tenants/${id}/environment`, input);
  return data as AdminTenantSummary;
}

export async function adminConfigureTenantLimits(id: string, input: {
  softCpuCores?: number;
  hardCpuCores?: number;
  softMemoryGb?: number;
  hardMemoryGb?: number;
  softStorageGb?: number;
  hardStorageGb?: number;
  softBandwidthMbps?: number;
  hardBandwidthMbps?: number;
  throttlingEnabled?: boolean;
  autoScaleEnabled?: boolean;
}) {
  const { data } = await api.post(`/admin/tenants/${id}/limits`, input);
  return data as AdminTenantSummary;
}

export async function adminUpdateTenantPermissions(id: string, input: {
  accessModel?: string;
  adminRoles?: string[];
  permissions?: string[];
  isolationEnforced?: boolean;
}) {
  const { data } = await api.post(`/admin/tenants/${id}/permissions`, input);
  return data as AdminTenantSummary;
}

export async function adminUpdateTenantIsolation(id: string, input: {
  databaseIsolationMode?: string;
  networkPolicy?: string;
  encryptionAtRest?: boolean;
  encryptionInTransit?: boolean;
  crossTenantViolationCount?: number;
  securityPolicy?: string;
}) {
  const { data } = await api.post(`/admin/tenants/${id}/isolation`, input);
  return data as AdminTenantSummary;
}

export async function adminChangeTenantLifecycle(id: string, input: {
  action?: string;
  reason: string;
  note?: string;
}) {
  const { data } = await api.post(`/admin/tenants/${id}/lifecycle`, input);
  return data as AdminTenantSummary;
}

export async function adminRefreshTenantUsage(id: string) {
  const { data } = await api.post(`/admin/tenants/${id}/usage-refresh`);
  return data as AdminTenantSummary;
}

// Admin Jobs
export async function adminListJobs(status?: string) {
  const { data } = await api.get(`/admin/jobs`, { params: status ? { status } : undefined });
  return data as Job[];
}

export const adminListProjects = adminListJobs;

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

export type AdminAnalyticsMetricCard = {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: string;
};

export type AdminAnalyticsTrendPoint = {
  period: string;
  users: number;
  jobs: number;
  proposals: number;
  hires: number;
  revenue: number;
};

export type AdminAnalyticsBreakdownItem = {
  label: string;
  value: number;
  helper: string;
};

export type AdminAnalyticsRevenueSlice = {
  label: string;
  value: number;
  transactions: number;
};

export type AdminAnalyticsInsightItem = {
  title: string;
  detail: string;
  tone: string;
};

export type AdminAnalyticsAiStatus = {
  engine: string;
  version: string;
  mode: string;
  inferenceMode: string;
  pythonBridgeReachable: boolean;
  pythonJobsEnabled: boolean;
  pythonFreelancersEnabled: boolean;
  pythonFraudEnabled: boolean;
  pythonChatEnabled: boolean;
  blendJobs: number;
  blendFreelancers: number;
  blendFraud: number;
  blendChat: number;
};

export type AdminAnalyticsWorkspaceResponse = {
  generatedAt: string;
  windowDays: number;
  headlineMetrics: AdminAnalyticsMetricCard[];
  trend: AdminAnalyticsTrendPoint[];
  roleDistribution: AdminAnalyticsBreakdownItem[];
  hiringFunnel: AdminAnalyticsBreakdownItem[];
  jobStatusBreakdown: AdminAnalyticsBreakdownItem[];
  proposalStatusBreakdown: AdminAnalyticsBreakdownItem[];
  topCategories: AdminAnalyticsBreakdownItem[];
  revenueByProvider: AdminAnalyticsRevenueSlice[];
  engagementMetrics: AdminAnalyticsMetricCard[];
  operationsMetrics: AdminAnalyticsMetricCard[];
  insights: AdminAnalyticsInsightItem[];
  aiStatus: AdminAnalyticsAiStatus;
};

export type AdminAnalyticsReportSection = {
  id: string;
  title: string;
  highlights: string[];
};

export type AdminAnalyticsExecutiveReportResponse = {
  generatedAt: string;
  windowDays: number;
  title: string;
  summary: string;
  headlineMetrics: AdminAnalyticsMetricCard[];
  sections: AdminAnalyticsReportSection[];
  insights: AdminAnalyticsInsightItem[];
  aiStatus: AdminAnalyticsAiStatus;
};

export type AdminAnalyticsExportBundle = {
  generatedAt: string;
  windowDays: number;
  workspace: AdminAnalyticsWorkspaceResponse;
  report: AdminAnalyticsExecutiveReportResponse;
};

export async function adminAnalyticsWorkspace(days = 30) {
  const { data } = await api.get(`/admin/analytics/workspace`, { params: { days } });
  return data as AdminAnalyticsWorkspaceResponse;
}

export async function adminGenerateExecutiveReport(days = 30) {
  const { data } = await api.post(`/admin/analytics/reports/executive`, undefined, { params: { days } });
  return data as AdminAnalyticsExecutiveReportResponse;
}

export async function adminAnalyticsExportJson(days = 30) {
  const { data } = await api.get(`/admin/analytics/export/json`, { params: { days } });
  return data as AdminAnalyticsExportBundle;
}

export async function adminAnalyticsExportCsv(days = 30) {
  const { data } = await api.get(`/admin/analytics/export/csv`, {
    params: { days },
    responseType: "text",
  });
  return data as string;
}

// Admin Announcements
export async function adminBroadcast(message: string) {
  const { data } = await api.post(`/admin/announcements`, { message });
  return data as { ok: boolean };
}

// Enterprise Admin Command Center
export type AdminCommandCenterMetricCard = {
  id: string;
  label: string;
  value: string;
  trend: string;
  tone: string;
};

export type AdminCommandCenterAlert = {
  id: string;
  level: string;
  title: string;
  detail: string;
};

export type AdminCommandCenterDomainSummary = {
  id: string;
  title: string;
  description: string;
  route: string;
  responsibilitiesCount: number;
  status: string;
};

export type AdminCommandCenterOperation = {
  id: string;
  title: string;
  description: string;
  impact: string;
  status: string;
};

export type AdminCommandCenterDomain = {
  id: string;
  title: string;
  description: string;
  route: string;
  responsibilities: string[];
  operations: AdminCommandCenterOperation[];
  status: string;
  owner: string;
};

export type AdminCommandCenterFeatureFlag = {
  key: string;
  enabled: boolean;
  owner: string;
  description: string;
  updatedAt: string;
};

export type AdminCommandCenterOverviewResponse = {
  generatedAt: string;
  metrics: AdminCommandCenterMetricCard[];
  alerts: AdminCommandCenterAlert[];
  domains: AdminCommandCenterDomainSummary[];
  featureFlags: AdminCommandCenterFeatureFlag[];
};

export type AdminCommandCenterDomainResponse = {
  generatedAt: string;
  domain: AdminCommandCenterDomain;
  metrics: AdminCommandCenterMetricCard[];
  alerts: AdminCommandCenterAlert[];
  featureFlags: AdminCommandCenterFeatureFlag[];
};

export type AIInferenceLog = {
  id: string;
  model: string;
  timestamp: string;
  latencyMs: number;
  tokensUsed: number;
  status: "SUCCESS" | "FAILURE";
  promptType: string;
  userId: string;
};

export type AdminCommandCenterCapabilityGroup = {
  id: string;
  title: string;
  objective: string;
  responsibilities: string[];
  operations: AdminCommandCenterOperation[];
  status: string;
  owner: string;
};

export type AdminPlatformControlResponse = {
  generatedAt: string;
  title: string;
  objective: string;
  metrics: AdminCommandCenterMetricCard[];
  capabilityGroups: AdminCommandCenterCapabilityGroup[];
  alerts: AdminCommandCenterAlert[];
  featureFlags: AdminCommandCenterFeatureFlag[];
};

export type AdminThreatDistribution = {
  label: string;
  value: number;
  tone: string;
};

export type AdminThreatTrendPoint = {
  period: string;
  threats: number;
  baseline: number;
};

export type AdminComplianceGauge = {
  id: string;
  label: string;
  value: number;
  tone: string;
};

export type AdminSecurityGovernanceResponse = {
  generatedAt: string;
  title: string;
  objective: string;
  metrics: AdminCommandCenterMetricCard[];
  capabilityGroups: AdminCommandCenterCapabilityGroup[];
  topThreats: AdminThreatDistribution[];
  monthlyThreats: AdminThreatTrendPoint[];
  complianceGauges: AdminComplianceGauge[];
  alerts: AdminCommandCenterAlert[];
  featureFlags: AdminCommandCenterFeatureFlag[];
};

export type AdminSectionSignal = {
  label: string;
  value: string;
  trend: string;
};

export type AdminSectionInsightResponse = {
  generatedAt: string;
  parentKey: string;
  sectionKey: string;
  sectionLabel: string;
  status: string;
  statusNote: string;
  signals: AdminSectionSignal[];
  actions: string[];
  checklist: string[];
};

export async function adminCommandCenterOverview() {
  const { data } = await api.get(`/admin/command-center/overview`);
  return data as AdminCommandCenterOverviewResponse;
}

export async function adminCommandCenterDomains() {
  const { data } = await api.get(`/admin/command-center/domains`);
  return data as AdminCommandCenterDomain[];
}

export async function adminCommandCenterDomain(domainId: string) {
  const { data } = await api.get(`/admin/command-center/domains/${domainId}`);
  return data as AdminCommandCenterDomainResponse;
}

export async function adminCommandCenterFeatureFlags() {
  const { data } = await api.get(`/admin/command-center/feature-flags`);
  return data as AdminCommandCenterFeatureFlag[];
}

export async function adminPlatformControl() {
  const { data } = await api.get(`/admin/command-center/core/platform-control`);
  return data as AdminPlatformControlResponse;
}

export async function adminSecurityGovernance() {
  const { data } = await api.get(`/admin/command-center/core/security-governance`);
  return data as AdminSecurityGovernanceResponse;
}

export async function adminSectionInsight(parentKey: string, sectionKey: string) {
  const { data } = await api.get(`/admin/command-center/sections/${encodeURIComponent(parentKey)}/${encodeURIComponent(sectionKey)}`);
  return data as AdminSectionInsightResponse;
}

export async function adminCommandCenterUpdateFeatureFlag(
  key: string,
  body: Partial<Pick<AdminCommandCenterFeatureFlag, "enabled" | "owner" | "description">>,
) {
  const { data } = await api.patch(`/admin/command-center/feature-flags/${key}`, body);
  return data as AdminCommandCenterFeatureFlag;
}

export async function adminListAIUsageLogs(count = 50) {
  const { data } = await api.get(`/admin/analytics/ai-usage/logs?count=${count}`);
  return data as AIInferenceLog[];
}

export async function adminCommandCenterExecuteOperation(
  domainId: string,
  operationId: string,
  body?: { note?: string; dryRun?: boolean; parameters?: Record<string, unknown> },
) {
  const { data } = await api.post(`/admin/command-center/domains/${domainId}/operations/${operationId}`, body ?? {});
  return data as AdminCommandCenterOperation;
}

// AI features
export type AIJobRecommendation = {
  jobId: string;
  title: string;
  score: number;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  reasons: string[];
};

export type AIFreelancerMatch = {
  freelancerId: string;
  userId?: string;
  professionalTitle?: string;
  score: number;
  reasons: string[];
  jobId: string;
};

export type AIFraudRisk = {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  flags: string[];
  currency: string;
  recommendedAction: string;
};

export type AIChatbotResponse = {
  answer: string;
  contextType: string;
  contextId?: string;
  suggestedActions: string[];
  confidence: number;
  engine?: string;
  engineVersion?: string;
  inferenceMode?: string;
  externalAiApiUsed?: boolean;
};

export type AIEngineStatus = {
  engine: string;
  version: string;
  inferenceMode: string;
  externalAiApiEnabled: boolean;
  externalAiApiUsed: boolean;
  dataSource: string;
  message: string;
};

export type AIModelRelease = {
  version: string;
  path?: string;
  trainedAt?: string;
  trainingSummary?: Record<string, unknown>;
};

export type AIModelVersionsResponse = {
  ok: boolean;
  activeVersion?: string;
  versions: AIModelRelease[];
  count?: number;
  message?: string;
};

export type AIModelOperationResponse = {
  ok: boolean;
  message?: string;
  activeVersion?: string;
  previousVersion?: string;
  release?: AIModelRelease;
  requestedBy?: string;
  requestedAt?: string;
  steps?: number;
  returncode?: number;
  stdout?: string;
  stderr?: string;
};

export type AIDatasetStats = {
  totalRecords: number;
  jobsRecords: number;
  freelancersRecords: number;
  transactionsRecords: number;
  genericRecords: number;
  mode?: string;
};

export type AIDatasetImportResponse = {
  ok: boolean;
  batchId?: string;
  datasetType?: string;
  format?: string;
  sourcePath?: string;
  importedRows?: number;
  engineMode?: string;
  message?: string;
};

export type AITaxonomyLearningTerm = {
  term: string;
  count: number;
  trend_score: number;
  suggested_parent: string;
  types: string[];
  last_seen?: string;
};

export type AITaxonomyLearningSummary = {
  last_updated?: string | null;
  tracked_terms: AITaxonomyLearningTerm[];
};

export async function aiRecommendJobs(limit = 8) {
  const { data } = await api.get(`/ai/recommend/jobs`, { params: { limit } });
  return data as AIJobRecommendation[];
}

export async function aiEngineStatus() {
  const { data } = await api.get(`/ai/engine/status`);
  return data as AIEngineStatus;
}

export async function aiMatchFreelancers(jobId: string, limit = 10) {
  const { data } = await api.get(`/ai/match/freelancers/${jobId}`, { params: { limit } });
  return data as AIFreelancerMatch[];
}

export async function aiCheckFraudRisk(input: {
  amount: number;
  currency?: string;
  paymentMethod?: string;
  recipientCountry?: string;
}) {
  const { data } = await api.post(`/ai/fraud/check`, input);
  return data as AIFraudRisk;
}

export async function aiChatbotAssist(input: {
  prompt: string;
  contextType?: string;
  contextId?: string;
}) {
  const { data } = await api.post(`/ai/chatbot/assist`, input);
  return data as AIChatbotResponse;
}

export async function aiTrainModel(activate = true) {
  const { data } = await api.post(`/ai/model/train`, { activate });
  return data as AIModelOperationResponse;
}

export async function aiListModelVersions() {
  const { data } = await api.get(`/ai/model/versions`);
  return data as AIModelVersionsResponse;
}

export async function aiActivateModel(version: string) {
  const { data } = await api.post(`/ai/model/activate`, { version });
  return data as AIModelOperationResponse;
}

export async function aiRollbackModel(steps = 1) {
  const { data } = await api.post(`/ai/model/rollback`, { steps });
  return data as AIModelOperationResponse;
}

export async function aiReloadModels() {
  const { data } = await api.post(`/ai/model/reload`);
  return data as AIModelOperationResponse;
}

export async function aiDatasetStats() {
  const { data } = await api.get(`/ai/dataset/stats`);
  return data as AIDatasetStats;
}

export async function aiTaxonomyLearningSummary() {
  const { data } = await api.get(`/ai/taxonomy/learning`);
  return data as AITaxonomyLearningSummary;
}

export async function aiImportDataset(input: {
  datasetType: string;
  path: string;
  format?: string;
  delimiter?: string;
  maxRows?: number;
}) {
  const { data } = await api.post(`/ai/dataset/import-local`, input);
  return data as AIDatasetImportResponse;
}

export type AuditLogEntry = {
  id: string;
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export async function adminListAuditLogs(options?: {
  query?: string;
  actorUserId?: string;
  entityType?: string;
  limit?: number;
}) {
  const { data } = await api.get(`/admin/audit-logs`, {
    params: {
      query: options?.query,
      actorUserId: options?.actorUserId,
      entityType: options?.entityType,
      limit: options?.limit ?? 200,
    },
  });
  return data as AuditLogEntry[];
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

export async function searchUserByUsername(username: string) {
  const { data } = await api.get(`/users/search/username`, { params: { username } });
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

export type StreamVisibility = "PUBLIC" | "PRIVATE" | "UNLISTED";
export type StreamStatus = "DRAFT" | "LIVE" | "ENDED" | "TERMINATED";
export type StreamMode = "ONE_TO_ONE" | "ONE_TO_MANY";
export type StreamMediaKind = "AUDIO" | "VIDEO" | "AUDIO_VIDEO";

export type StreamPermissions = {
  canWatch: boolean;
  canChat: boolean;
  canManage: boolean;
  canAdminister: boolean;
};

export type StreamSummary = {
  id: string;
  ownerUserId: string;
  ownerDisplayName: string;
  title: string;
  description: string;
  mode: StreamMode;
  mediaKind: StreamMediaKind;
  visibility: StreamVisibility;
  status: StreamStatus;
  recordingEnabled: boolean;
  lowLatencyEnabled: boolean;
  playbackEnabled: boolean;
  maxParticipants: number;
  viewerCount: number;
  tags: string[];
  primaryRegion?: string | null;
  startedAt?: number | null;
  endedAt?: number | null;
};

export type StreamDetail = StreamSummary & {
  liveHlsUrl?: string | null;
  playbackHlsUrl?: string | null;
  webrtcRoomId?: string | null;
  createdAt?: number | null;
  permissions: StreamPermissions;
};

export type StreamIngestInfo = {
  streamId: string;
  rtmpIngestBaseUrl: string;
  streamKey: string;
  publishUrl: string;
  expectedLiveHlsUrl: string;
};

export type StreamJoinResponse = {
  streamId: string;
  preferredProtocol: string;
  signalingTopic: string;
  signalingSendPath: string;
  chatTopic: string;
  chatSendPath: string;
  presenceTopic: string;
  presenceJoinPath: string;
  presenceLeavePath: string;
  liveHlsUrl?: string | null;
  playbackHlsUrl?: string | null;
  edgeRegion?: string | null;
  turnServers?: Array<Record<string, unknown>> | null;
  janusBootstrap?: Record<string, unknown> | null;
};

export type StreamAdminOverview = {
  liveStreamCount: number;
  activeCallCount: number;
  activeBroadcastCount: number;
  totalViewerCount: number;
  liveStreams: StreamSummary[];
  healthCards: Array<Record<string, unknown>>;
};

export async function listStreams() {
  const response = await api.get("/streams");
  return unwrapResponse(response, "Unable to load streams") as StreamSummary[];
}

export async function getStream(streamId: string) {
  const response = await api.get(`/streams/${encodeURIComponent(streamId)}`);
  return unwrapResponse(response, "Unable to load stream") as StreamDetail;
}

export async function createStream(input: {
  title: string;
  description?: string;
  visibility?: StreamVisibility;
  recordingEnabled?: boolean;
  lowLatencyEnabled?: boolean;
  playbackEnabled?: boolean;
  mode?: StreamMode;
  mediaKind?: StreamMediaKind;
  maxParticipants?: number;
  tags?: string[];
}) {
  const response = await api.post("/streams", input);
  return unwrapResponse(response, "Unable to create stream") as StreamDetail;
}

export async function updateStreamRecord(streamId: string, input: {
  title?: string;
  description?: string;
  visibility?: StreamVisibility;
  recordingEnabled?: boolean;
  lowLatencyEnabled?: boolean;
  playbackEnabled?: boolean;
  mode?: StreamMode;
  mediaKind?: StreamMediaKind;
  maxParticipants?: number;
  tags?: string[];
}) {
  const response = await api.patch(`/streams/${encodeURIComponent(streamId)}`, input);
  return unwrapResponse(response, "Unable to update stream") as StreamDetail;
}

export async function startStreamRecord(streamId: string, input?: {
  recordingEnabled?: boolean;
  lowLatencyEnabled?: boolean;
  playbackEnabled?: boolean;
  targetLatencySeconds?: number;
}) {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/start`, input ?? {});
  return unwrapResponse(response, "Unable to start stream") as StreamDetail;
}

export async function getStreamIngestInfo(streamId: string) {
  const response = await api.get(`/streams/${encodeURIComponent(streamId)}/ingest`);
  return unwrapResponse(response, "Unable to load ingest details") as StreamIngestInfo;
}

export async function stopStreamRecord(streamId: string) {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/stop`);
  return unwrapResponse(response, "Unable to stop stream") as StreamDetail;
}

export async function joinStream(streamId: string, preferredProtocol = "WEBRTC") {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/join`, { preferredProtocol });
  return unwrapResponse(response, "Unable to join stream") as StreamJoinResponse;
}

export async function leaveStreamRecord(streamId: string) {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/leave`);
  return unwrapResponse(response, "Unable to leave stream") as { success?: boolean } | null;
}

export async function muteStreamViewer(streamId: string, input: { targetUserId: string; reason?: string }) {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/moderation/mute`, input);
  return unwrapResponse(response, "Unable to mute viewer");
}

export async function kickStreamViewer(streamId: string, input: { targetUserId: string; reason?: string }) {
  const response = await api.post(`/streams/${encodeURIComponent(streamId)}/moderation/kick`, input);
  return unwrapResponse(response, "Unable to remove viewer");
}

export async function getAdminStreamOverview() {
  const response = await api.get("/admin/streams/overview");
  return unwrapResponse(response, "Unable to load streaming overview") as StreamAdminOverview;
}

export async function terminateStreamRecord(streamId: string, reason: string) {
  const response = await api.post(`/admin/streams/${encodeURIComponent(streamId)}/terminate`, { reason });
  return unwrapResponse(response, "Unable to terminate stream") as StreamDetail;
}

// Admin Bootstrap - Enterprise Admin Initialization
/**
 * Initialize the first admin user in the system.
 * Only callable when NO admin users exist.
 * This is the secure way to set up admin access for a fresh system.
 */
export async function adminBootstrapInitialize(data: { email: string; fullName: string; password: string }) {
  try {
    const response = await api.post(`/admin/bootstrap/initialize`, data);
    return unwrapResponse(
      response,
      "Failed to initialize admin user"
    ) as AdminBootstrapInitializeResponse;
  } catch (error) {
    // 403 means admins already exist
    if (error instanceof Error && error.message.includes("403")) {
      throw new Error("Admin system already initialized. Cannot bootstrap again.");
    }
    throw error;
  }
}

/**
 * Check if the admin system is initialized.
 * Public endpoint - no authentication required.
 * Useful for UI to determine if setup wizard should be shown.
 */
export async function adminBootstrapGetStatus() {
  const response = await api.get(`/admin/bootstrap/status`);
  return unwrapResponse(response, "Unable to check admin system status") as AdminBootstrapStatus;
}

/**
 * Promote an existing user to admin.
 * Requires the caller to have admin privileges.
 * Used for granting admin access to additional users after bootstrap.
 */
export async function adminBootstrapPromoteUser(data: { userId: string; reason: string }) {
  const response = await api.post(`/admin/bootstrap/promote`, data);
  return unwrapResponse(response, "Failed to promote user to admin") as unknown;
}

// Type definitions for Bootstrap API
export type AdminBootstrapInitializeResponse = {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  createdAt: string;
  message: string;
  systemInitialized: boolean;
};

export type AdminBootstrapStatus = {
  initialized: boolean;
  totalAdmins: number;
  systemStatus: "INITIALIZED" | "AWAITING_INITIALIZATION";
  message: string;
  lastUpdated: string;
};
