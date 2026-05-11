export type WorkspaceRole = "EMPLOYER" | "FREELANCER";
export type AppRole = WorkspaceRole | "ADMIN";

export type SessionUser = {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  profilePictureUrl?: string | null;
  roles: string[];
};

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

export type Job = {
  id: string;
  title: string;
  description: string;
  overviewText?: string;
  employerId?: string;
  employerName?: string;
  status?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  skills?: string[];
  createdAt?: string;
};

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
  location?: string | null;
  verified?: boolean;
};

export type StreamVisibility = "PUBLIC" | "PRIVATE" | "UNLISTED";
export type StreamStatus = "DRAFT" | "LIVE" | "ENDED" | "TERMINATED";
export type StreamMode = "ONE_TO_ONE" | "ONE_TO_MANY";
export type MediaKind = "AUDIO" | "VIDEO" | "AUDIO_VIDEO";

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
  mediaKind: MediaKind;
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
  turnServers?: Array<Record<string, unknown>>;
  janusBootstrap?: Record<string, unknown> | null;
};

export type PresenceEvent = {
  streamId: string;
  event: "JOINED" | "LEFT";
  userId: string;
  displayName: string;
  viewerCount: number;
  occurredAt: number;
};

export type SignalEnvelope = {
  streamId: string;
  signalType: "OFFER" | "ANSWER" | "ICE" | "CONTROL";
  senderUserId: string;
  targetPeerId: string;
  payload: Record<string, unknown>;
  occurredAt: number;
};

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

export type UserSettingsProfile = {
  username?: string | null;
  bio?: string | null;
  profilePictureUrl?: string | null;
  country?: string | null;
  location?: string | null;
  timezone?: string | null;
  phoneCountryCode?: string | null;
  phoneNumber?: string | null;
  language?: string | null;
  skills?: string[];
  fullName?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  phoneVerified?: boolean | null;
  twoFactorEnabled?: boolean | null;
  twoFactorMethod?: string | null;
  authenticatorEnabled?: boolean | null;
  authenticatorVerifiedAt?: number | null;
  pinChallengeEnabled?: boolean | null;
  securityPinUpdatedAt?: number | null;
  recoveryCodesRemaining?: number | null;
  recoveryCodesGeneratedAt?: number | null;
};

export type AdminUser = {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  roles: string[];
  suspended?: boolean;
  documentsVerified?: boolean;
  createdAt?: string;
};

export type ContractMilestone = {
  id?: string;
  title?: string;
  description?: string;
  amount?: number | null;
  status?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  submissionNote?: string | null;
  feedbackFromEmployer?: string | null;
  escrowLocked?: boolean | null;
};

export type ContractSummary = {
  id: string;
  title?: string | null;
  description?: string | null;
  employerId?: string | null;
  freelancerId?: string | null;
  status?: string | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
  escrowTotalHeld?: number | null;
  currency?: string | null;
  disputeId?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  paymentMilestones?: ContractMilestone[];
};

export type DisputeAdminMessage = {
  id?: string;
  target?: "EMPLOYER" | "FREELANCER" | "BOTH";
  content?: string;
  sentByUserId?: string;
  sentByName?: string;
  sentAt?: string;
};

export type DisputeSummary = {
  id: string;
  contractId: string;
  contractTitle?: string;
  employerId?: string;
  freelancerId?: string;
  openedByUserId?: string;
  openedByRole?: "EMPLOYER" | "FREELANCER";
  status?: "OPEN" | "UNDER_REVIEW" | "EVIDENCE_REQUIRED" | "SETTLEMENT_PENDING" | "RESOLVED" | "CLOSED";
  reason?: string;
  details?: string;
  evidenceAssetIds?: string[];
  adminNotes?: string[];
  adminMessages?: DisputeAdminMessage[];
  heldAmount?: number | null;
  paidAmount?: number | null;
  currency?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
