import axios from "axios";

// Use Next.js API proxy routes for all backend calls
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
  (r) => r,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      // Optionally redirect to login
      // window.location.href = "/login";
    }
    return Promise.reject(error);
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

export async function me() {
  const { data } = await api.get("/auth/me");
  return data as { email: string; fullName: string; roles: string[] };
}

// Jobs
export type Job = {
  id: string;
  title: string;
  description: string;
  budget?: { min?: number; max?: number; currency?: string };
  status?: string;
};

export async function listJobs() {
  const { data } = await api.get("/jobs");
  return data as Job[];
}

export async function getJob(id: string) {
  const { data } = await api.get(`/jobs/${id}`);
  return data as Job;
}

export async function createJob(job: Partial<Job>) {
  const { data } = await api.post("/employer/jobs", job);
  return data as Job;
}

export async function listEmployerJobs() {
  const { data } = await api.get("/employer/jobs");
  return data as Job[];
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
export async function getWallet() {
  const { data } = await api.get(`/wallet`);
  return data as { balance: number; currency: string } & Record<string, any>;
}

export async function initChapa(input: { amount: number; currency?: string }, idempotencyKey?: string) {
  const { data } = await api.post(`/payments/chapa/init`, input, { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined });
  return data as { transactionId: string } & Record<string, any>;
}

export async function localTopupRequest(input: { amount: number; currency?: string; referenceId?: string }, idempotencyKey?: string) {
  const { data } = await api.post(`/payments/local/request`, input, { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined });
  return data as { transactionId: string };
}

export async function adminVerifyLocal(input: { transactionId: string }, idempotencyKey?: string) {
  const { data } = await api.post(`/admin/payments/local/verify`, input, { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined });
  return data as { ok: boolean };
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
