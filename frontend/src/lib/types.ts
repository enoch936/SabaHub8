// ─── Role & Session ───────────────────────────────────────────────────────────
export type AppRole = 'EMPLOYER' | 'FREELANCER' | 'ADMIN'

// ─── Wallet ───────────────────────────────────────────────────────────────────
export type PaymentMethod = 'SABAHUB' | 'STRIPE' | 'CHAPA'
export type TransactionType = 'SEND' | 'RECEIVE' | 'WITHDRAW' | 'DEPOSIT'
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type WalletCurrencyCode = 'ETB' | 'USD'

export interface WalletFxSnapshot {
  provider?: string
  generatedAt?: string
  supportedCurrencies: WalletCurrencyCode[]
  rates: Partial<Record<string, number>>
}

export interface WalletCurrencyBreakdown {
  currency: WalletCurrencyCode
  balance: number
  availableBalance: number
  escrowHeld: number
  pendingPayouts: number
  holds: number
  convertedBalance?: Partial<Record<WalletCurrencyCode, number>>
  convertedAvailableBalance?: Partial<Record<WalletCurrencyCode, number>>
}

export interface WalletBalance {
  available: number
  pending: number
  currency: WalletCurrencyCode
  total: number
  holds: number
  supportedCurrencies: WalletCurrencyCode[]
  byCurrency: Partial<Record<WalletCurrencyCode, WalletCurrencyBreakdown>>
  fx?: WalletFxSnapshot | null
  lastUpdated: string
}

export interface Transaction {
  id: string
  type: TransactionType
  method: PaymentMethod
  amount: number
  fee: number
  currency: string
  status: TransactionStatus
  fromUserId?: string
  toUserId?: string
  fromName?: string
  toName?: string
  description?: string
  reference: string
  createdAt: string
  completedAt?: string
  metadata?: Record<string, unknown>
}

export interface SendMoneyPayload {
  recipient: string
  amount: number
  method: PaymentMethod
  description?: string
  currency?: WalletCurrencyCode
}

export interface WithdrawPayload {
  amount: number
  method: 'BANK' | 'CARD'
  currency?: WalletCurrencyCode
  accountNumber: string
  bankName?: string
  accountName?: string
  cardExpiry?: string
  cardCvv?: string
}

export interface TransactionFilters {
  type?: TransactionType
  method?: PaymentMethod
  status?: TransactionStatus
  dateFrom?: string
  dateTo?: string
  search?: string
  sortBy?: 'date' | 'amount'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export type JobType = 'FIXED' | 'HOURLY'
export type ExperienceLevel = 'ENTRY' | 'INTERMEDIATE' | 'EXPERT'
export type JobStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface Job {
  id: string
  title: string
  description: string
  category?: string
  sampleImageUrls?: string[]
  sampleVideoUrls?: string[]
  sampleDocumentUrls?: string[]
  sampleAudioUrls?: string[]
  budget: { min: number; max: number; type: JobType }
  duration: string
  skills: string[]
  experienceLevel: ExperienceLevel
  status: JobStatus
  employerId: string
  employerName: string
  employerVerified: boolean
  applicantCount: number
  maxApplicants: number
  aiMatchScore?: number
  postedAt: string
  deadline?: string
  timezone?: string
  workLocation?: string
  locationLabel?: string
  isRemote: boolean
  isSaved: boolean
}

export interface JobFilters {
  search?: string
  categories?: string[]
  budgetMin?: number
  budgetMax?: number
  jobType?: JobType
  experienceLevel?: ExperienceLevel
  skills?: string[]
  duration?: string
  timezone?: string
  isRemote?: boolean
  employerVerified?: boolean
  savedOnly?: boolean
  mediaFilter?: "ALL" | "VISUAL" | "VIDEO" | "DOCUMENT"
  sortBy?: 'relevance' | 'date' | 'budget'
  page?: number
  pageSize?: number
}

export interface ProposalPayload {
  coverLetter: string
  bidAmount: number
  timelineDays: number
}

export interface FilterPreset {
  id: string
  name: string
  filters: JobFilters
}

// ─── Talent / Freelancer ──────────────────────────────────────────────────────
export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE'

export interface PortfolioItem {
  id: string
  title: string
  description: string
  imageUrl?: string
  tags: string[]
  link?: string
}

export interface FreelancerProfile {
  id: string
  userId: string
  displayName: string
  avatarUrl?: string
  title: string
  bio: string
  skills: string[]
  hourlyRate: number
  rating: number
  reviewCount: number
  isVerified: boolean
  availability: AvailabilityStatus
  completedJobs: number
  successRate: number
  tiers: {
    basic: { price: number; description: string; deliveryDays: number }
    standard: { price: number; description: string; deliveryDays: number }
    premium: { price: number; description: string; deliveryDays: number }
  }
  portfolio: PortfolioItem[]
  timezone: string
  languages: string[]
}

// ─── Contracts ────────────────────────────────────────────────────────────────
export type ContractStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
export type ContractPaymentModel = 'FIXED' | 'MILESTONE' | 'HOURLY'
export type EscrowProtectionLevel = 'FULL' | 'PARTIAL' | 'NONE'

export interface ContractSignatureState {
  employerSigned?: boolean
  employerSignedAt?: string
  freelancerSigned?: boolean
  freelancerSignedAt?: string
  contractHash?: string
}

export type EscrowRefundRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED'
export type EscrowRefundApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface EscrowRefundApproval {
  partyRole: 'EMPLOYER' | 'FREELANCER'
  status: EscrowRefundApprovalStatus
  actedByUserId?: string
  note?: string
  actedAt?: string
}

export interface EscrowRefundRequest {
  id: string
  status: EscrowRefundRequestStatus
  amount: number
  currency: string
  note?: string
  requestedByUserId?: string
  requestedByRole?: 'EMPLOYER' | 'FREELANCER' | 'ADMIN' | 'SYSTEM'
  requestedAt?: string
  employerApproval?: EscrowRefundApproval
  freelancerApproval?: EscrowRefundApproval
  resolvedByUserId?: string
  resolutionType?: string
  resolutionNote?: string
  resolvedAt?: string
  executedAt?: string
}

export interface Milestone {
  id: string
  contractId: string
  sequence?: number
  title: string
  description: string
  amount: number
  dueDate: string
  status: MilestoneStatus
  submittedAt?: string
  approvedAt?: string
  releaseDate?: string
  submissionNote?: string
  feedbackFromEmployer?: string
  escrowLocked?: boolean
  escrowLockedAt?: string
}

export interface EscrowEntry {
  contractId: string
  milestoneId: string
  amount: number
  status: 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED' | 'SETTLED'
  createdAt: string
  settledAt?: string
  settlementNote?: string
  settlementBreakdown?: {
    employerAmount: number
    freelancerAmount: number
    adminAmount: number
  }
}

export interface PlatformContract {
  id: string
  jobId: string
  jobTitle: string
  employerId: string
  freelancerId: string
  employerName: string
  freelancerName: string
  status: ContractStatus
  totalAmount: number
  paidAmount: number
  escrowedAmount?: number
  escrowRequiredAmount?: number
  currency: string
  startDate: string
  endDate?: string
  milestones: Milestone[]
  terms: string
  createdAt: string
  agreementVersion?: number
  escrowLockedAt?: string
  agreementEstablishedAt?: string
  signatures?: ContractSignatureState
  paymentModel?: ContractPaymentModel
  escrowProtectionLevel?: EscrowProtectionLevel
  disputeWindowDays?: number
  autoReleaseDays?: number
  requiresEscrow?: boolean
  adminReviewRequired?: boolean
  available?: boolean
  disputeId?: string
  refundRequest?: EscrowRefundRequest
}

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'EVIDENCE_REQUIRED'
  | 'SETTLEMENT_PENDING'
  | 'RESOLVED'
  | 'CLOSED'

export type DisputeMessageTarget = 'EMPLOYER' | 'FREELANCER' | 'BOTH'
export type RestrictionAction = 'NONE' | 'BLOCK' | 'UNBLOCK' | 'BAN'

export interface DisputeSettlement {
  employerPercent: number
  freelancerPercent: number
  adminPercent: number
  employerAmount: number
  freelancerAmount: number
  adminAmount: number
  currency: string
  note: string
  decidedAt: string
  decidedBy: string
}

export interface DisputeAdminMessage {
  id: string
  target: DisputeMessageTarget
  content: string
  sentAt: string
  sentBy: string
}

export interface DisputeParticipantControl {
  employer: RestrictionAction
  freelancer: RestrictionAction
  updatedAt?: string
}

export interface PlatformDispute {
  id: string
  contractId: string
  contractTitle: string
  employerId: string
  employerName: string
  freelancerId: string
  freelancerName: string
  openedByUserId?: string
  openedByRole?: 'EMPLOYER' | 'FREELANCER'
  status: DisputeStatus
  reason: string
  details?: string
  evidenceAssetIds: string[]
  createdAt: string
  updatedAt?: string
  adminNotes: string[]
  heldAmount: number
  paidAmount: number
  currency: string
  settlement?: DisputeSettlement
  messages: DisputeAdminMessage[]
  participantControls: DisputeParticipantControl
}

// ─── Messaging ────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'JOB_INVITE'
  fileUrl?: string
  fileName?: string
  voiceDuration?: number
  jobInvite?: { jobId: string; jobTitle: string }
  isRead: boolean
  createdAt: string
  isTyping?: boolean
}

export interface Conversation {
  id: string
  participants: Array<{ userId: string; name: string; avatarUrl?: string }>
  lastMessage?: ChatMessage
  unreadCount: number
  updatedAt: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export type TimeFrame = '7d' | '30d' | '90d' | '1y'

export interface AnalyticsDataPoint {
  label: string
  income: number
  expenses: number
  balance: number
  transactions: number
  earnings?: number
  hires?: number
}

export interface AnalyticsSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  totalTransactions: number
  avgTransactionValue: number
  hiringSuccessRate?: number
  freelancerPerformanceScore?: number
  periodChange: {
    income: number
    expenses: number
    profit: number
  }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export type SentimentLabel = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'

export interface Review {
  id: string
  contractId: string
  reviewerId: string
  reviewerName: string
  reviewerAvatar?: string
  targetId: string
  rating: number
  comment: string
  sentiment: SentimentLabel
  isVerified: boolean
  createdAt: string
  tags: string[]
}

// ─── Projects / Kanban ────────────────────────────────────────────────────────
export type KanbanColumnId = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'

export interface KanbanCard {
  id: string
  projectId: string
  columnId: KanbanColumnId
  title: string
  description?: string
  assigneeId?: string
  assigneeName?: string
  dueDate?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  tags: string[]
  order: number
}

export interface Project {
  id: string
  contractId?: string
  title: string
  description: string
  ownerId: string
  memberIds: string[]
  columns: Record<KanbanColumnId, KanbanCard[]>
  createdAt: string
  deadline?: string
}

// ─── Team / Enterprise ────────────────────────────────────────────────────────
export type TeamRole = 'ADMIN' | 'RECRUITER' | 'VIEWER'

export interface TeamMember {
  userId: string
  name: string
  email: string
  avatarUrl?: string
  teamRole: TeamRole
  joinedAt: string
}

export interface Team {
  id: string
  name: string
  ownerId: string
  members: TeamMember[]
  createdAt: string
}

// ─── Marketplace Search ──────────────────────────────────────────────────────
export type MarketplaceSort = 'relevance' | 'date' | 'budget' | 'rating'
export type MarketplaceMediaFilter = 'ALL' | 'VISUAL' | 'VIDEO' | 'DOCUMENT'

export type MarketplaceSearchTalent = {
  freelancerId: string
  userId: string
  name: string
  professionalTitle?: string
  rating?: number
  reviewCount?: number
  successRate?: number
  skills?: string[]
  profilePicture?: string
  coverImage?: string
  portfolioThumbnailUrl?: string
  portfolioImageUrls?: string[]
  availability?: string
  languages?: string[]
  timezone?: string
}

export type MarketplaceSearchProjectPost = {
  projectPostId?: string
  id?: string // legacy
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'OPEN'
  title: string
  description?: string
  category?: string
  skills?: string[]
  budgetMin: number
  budgetMax?: number
  currency: string
  deliveryDays?: number
  thumbnailUrl?: string
  sampleImageUrls?: string[]
  sampleVideoUrls?: string[]
  sampleDocumentUrls?: string[]
  freelancerId?: string
  freelancerUserId?: string
  freelancerName?: string
  postedAt?: string
}

export type MarketplaceSearchGig = {
  gigId?: string
  id?: string // legacy
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'OPEN'
  title: string
  description?: string
  skills?: string[]
  price: number
  currency: string
  deliveryDays?: number
  thumbnailUrl?: string
  sampleImageUrls?: string[]
  sampleVideoUrls?: string[]
  sampleDocumentUrls?: string[]
  freelancerId?: string
  freelancerUserId?: string
  freelancerName?: string
}

export type MarketplaceSearchStory = {
  storyId?: string
  id?: string // legacy
  status?: 'PUBLISHED'
  title: string
  description?: string
  category?: string
  technologies?: string[]
  imageUrls?: string[]
  projectUrl?: string
  completedAt?: string
  freelancerId?: string
  freelancerUserId?: string
  freelancerName?: string
  profilePicture?: string
}

export type MarketplaceSearchResponse = {
  query: string
  talents: MarketplaceSearchTalent[]
  projectPosts: MarketplaceSearchProjectPost[]
  gigs: MarketplaceSearchGig[]
  stories: MarketplaceSearchStory[]
  counts: {
    talents: number
    projectPosts: number
    gigs: number
    stories: number
  }
}

