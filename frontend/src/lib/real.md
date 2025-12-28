# SabaHub (Freelance Platform) — Implementation Spec (Next.js + Spring Boot + MongoDB)

## 0) Purpose
 
Build an enterprise-grade freelance marketplace (Upwork/Fiverr-like) with **Admin / Employer / Freelancer** roles, **secure auth**, **escrow payments**, **real-time chat**, **Cloudinary file uploads**, **CRP (Customer Relationship Portal)**, **CMP (Content Management Portal)**, analytics, and strong security.

This document is written as an **implementation-ready plan**: scope, architecture, data model, APIs, security, workflows, and milestones.

---

## 1) Roles & Permissions (RBAC)

### 1.1 Admin
- Manage users (view, suspend/ban, verify documents)
- Moderate jobs/projects and proposals
- Monitor transactions, escrow status, payouts, refunds
- Admin↔User chat + broadcast announcements
- CRP: disputes, tickets, user interaction history, escalation
- CMP: manage site content (categories, FAQs, pages, blog posts)
- Analytics dashboard (users, jobs, revenue, activity)
- Audit log access

### 1.2 Employer
- Register/login; manage profile & KYC/verification
- Create jobs/projects; review proposals; hire freelancer
- Fund escrow and release payments
- Secure chat and file exchange
- Rate/review freelancers

### 1.3 Freelancer
- Register/login; manage profile, skills, portfolio
- Apply to jobs (proposals/bids)
- Deliver work milestones; submit files
- Receive payouts; track earnings
- Rate/review employers (optional)

### 1.4 RBAC rules (minimum)
- Enforce role-based endpoints (Admin-only, Employer-only, Freelancer-only)
- Object-level authorization:
  - Employers can only manage their jobs/contracts
  - Freelancers can only manage their proposals/deliverables
  - Chat threads only accessible to participants (or admin)

---

## 2) Core Modules

### 2.1 Authentication & Security
- JWT access token + refresh token rotation
- Password hashing (BCrypt)
- Email verification + password reset
- Optional 2FA (TOTP) later
- Rate limiting (login, OTP, sensitive endpoints)
- Input validation + sanitization
- Secure headers, CORS hardening, CSRF strategy (see §7)

### 2.2 Jobs & Proposals
- Employer posts job (title, description, budget, skills, category)
- Freelancer submits proposal (cover letter, bid amount, timeline)
- Employer accepts proposal → contract created

### 2.3 Contracts, Milestones, Delivery
- Contract links: employerId, freelancerId, jobId, status
- Optional milestones with escrow funding per milestone
- Delivery submission with file uploads + completion request

### 2.4 Payments (Wallet + Chapa + Local Transfer)
- Internal wallet ledger (authoritative source)
- Funding methods:
  - Chapa payment intent → verify callback → credit wallet
  - Manual/local transfer: admin verification → credit wallet
- Escrow:
  - Employer funds escrow (wallet debit → escrow hold)
  - Release escrow to freelancer (escrow release → freelancer wallet credit)
  - Refund/cancel flows with admin controls

### 2.5 Chat (Real-time)
- WebSocket (Spring) for real-time messages
- Persist messages to MongoDB
- Support attachments (Cloudinary)
- Admin broadcast announcements (separate channel)
- Encryption: TLS in transit; optional message payload encryption at rest

### 2.6 File Uploads (Cloudinary)
- Signed upload preferred (backend issues signature) OR backend proxy upload
- Validate file type/size server-side
- Store Asset metadata in DB: url, type, ownerId, scope (portfolio, job, chat)

### 2.7 CRP (Customer Relationship Portal)
- Disputes/tickets tied to job/contract/transaction
- Status workflow: Open → Investigating → Resolved → Closed
- Evidence attachments + admin notes
- SLA metrics (optional)

### 2.8 CMP (Content Management Portal)
- Manage categories, skills, FAQs, static pages, announcements, blog posts
- Draft/publish workflow

### 2.9 Notifications
- In-app notifications (real-time via WebSocket)
- Email notifications for critical events (verification, payment, dispute)

### 2.10 Analytics & Audit Logs
- Aggregate metrics for Admin dashboard
- Audit log for security-sensitive actions

---

## 3) Frontend (Next.js App Router)

### 3.1 Pages/Routes (minimum)
- Public: Landing, Browse Jobs, Browse Freelancers (optional)
- Auth: /login, /register, /verify-email, /forgot-password
- Dashboards:
  - /dashboard (role-aware)
  - Employer: jobs, proposals, contracts, escrow/wallet
  - Freelancer: proposals, contracts, portfolio, earnings
  - Admin: users, jobs, transactions, disputes (CRP), content (CMP), analytics
- Chat: /chat (threads + messages)

### 3.2 State & Data
- Use server actions or route handlers for auth proxying if needed
- Client state: React Query or Zustand
- Forms: React Hook Form + Zod

### 3.3 UX Requirements
- Role-based navigation
- Loading states, empty states, error boundaries
- File upload UI with progress + validation feedback

---

## 4) Backend (Spring Boot)

### 4.1 Architecture
- REST APIs for CRUD, auth, payments, assets
- WebSocket endpoint for chat + notifications
- Spring Security with JWT filter
- DTOs for request/response; validation annotations
- Global exception handling with consistent error format

### 4.2 Services
- AuthService: register/login/refresh/logout
- UserService: profile, admin user management
- JobService, ProposalService, ContractService
- PaymentService: wallet ledger, escrow, chapa integration
- AssetService: Cloudinary, metadata
- ChatService: threads/messages, authorization
- CRPService: disputes/tickets
- CMPService: content management
- AuditService: append-only audit events

---

## 5) MongoDB Data Model (Collections)

> Use `ObjectId` for ids. Add `createdAt/updatedAt` and indexes for query-critical fields.

### 5.1 users
- _id
- email (unique, indexed)
- passwordHash
- role: ADMIN | EMPLOYER | FREELANCER
- status: ACTIVE | SUSPENDED | BANNED
- profile: name, bio, skills[], location, profilePicUrl
- verification: emailVerified, kycStatus (PENDING/APPROVED/REJECTED)
- walletBalance (derived optional) OR compute from ledger (preferred)
- createdAt, updatedAt

### 5.2 jobs
- _id
- employerId (indexed)
- title, description
- budget: { min, max, currency }
- categoryId, skills[]
- status: OPEN | IN_PROGRESS | COMPLETED | CANCELLED
- createdAt, updatedAt

### 5.3 proposals
- _id
- jobId (indexed)
- freelancerId (indexed)
- coverLetter
- bidAmount, timelineDays
- status: SUBMITTED | SHORTLISTED | ACCEPTED | REJECTED | WITHDRAWN
- createdAt, updatedAt

### 5.4 contracts
- _id
- jobId, employerId, freelancerId (indexed)
- status: ACTIVE | DELIVERED | COMPLETED | DISPUTED | CANCELLED
- escrow: { totalHeld, currency }
- createdAt, updatedAt

### 5.5 milestones (optional)
- _id
- contractId (indexed)
- title, amount, dueDate
- status: PENDING | FUNDED | SUBMITTED | APPROVED | RELEASED

### 5.6 wallet_ledger (authoritative)
- _id
- userId (indexed)
- type: CREDIT | DEBIT
- reason: CHAPA_TOPUP | LOCAL_TOPUP | ESCROW_FUND | ESCROW_RELEASE | REFUND | FEE | WITHDRAW
- amount, currency
- referenceId (transaction/contract/milestone)
- balanceAfter (optional)
- createdAt

### 5.7 transactions
- _id
- userId (payer/owner)
- provider: CHAPA | LOCAL | INTERNAL
- direction: IN | OUT
- amount, currency
- status: PENDING | SUCCESS | FAILED | CANCELLED
- providerRef
- metadata
- createdAt, updatedAt

### 5.8 chat_threads
- _id
- participantIds[] (indexed)
- lastMessageAt

### 5.9 chat_messages
- _id
- threadId (indexed)
- senderId
- type: TEXT | ASSET
- text
- assetId
- createdAt

### 5.10 assets
- _id
- ownerId (indexed)
- scope: PROFILE | PORTFOLIO | JOB | CHAT | DISPUTE | CONTENT
- resourceType: image | raw | video
- mimeType, size
- cloudinaryPublicId
- url
- createdAt

### 5.11 disputes (CRP)
- _id
- contractId (indexed)
- openedByUserId
- status: OPEN | INVESTIGATING | RESOLVED | CLOSED
- reason
- adminNotes[]
- evidenceAssetIds[]
- createdAt, updatedAt

### 5.12 content (CMP)
- _id
- type: FAQ | PAGE | BLOG | CATEGORY | ANNOUNCEMENT
- slug (unique for pages/blog)
- title
- body
- status: DRAFT | PUBLISHED
- mediaAssetIds[]
- createdAt, updatedAt

### 5.13 notifications
- _id
- userId (indexed)
- type
- payload
- read: boolean
- createdAt

### 5.14 audit_logs
- _id
- actorUserId
- action
- entityType
- entityId
- ip
- userAgent
- metadata
- createdAt

---

## 6) API Contract (REST) — Minimal Set

### 6.1 Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### 6.2 Users
- GET /api/me
- PATCH /api/me
- (Admin) GET /api/admin/users
- (Admin) PATCH /api/admin/users/{id}/status

### 6.3 Jobs & Proposals
- GET /api/jobs
- POST /api/employer/jobs
- GET /api/jobs/{id}
- POST /api/jobs/{id}/proposals (freelancer)
- GET /api/employer/jobs/{id}/proposals
- POST /api/employer/proposals/{id}/accept

### 6.4 Contracts
- GET /api/contracts
- GET /api/contracts/{id}
- POST /api/contracts/{id}/deliver
- POST /api/contracts/{id}/complete

### 6.5 Payments / Wallet
- GET /api/wallet
- POST /api/payments/chapa/init
- POST /api/payments/chapa/webhook
- POST /api/payments/local/request
- (Admin) POST /api/admin/payments/local/verify
- POST /api/escrow/fund
- POST /api/escrow/release
- POST /api/escrow/refund

### 6.6 Assets
- POST /api/assets/signature (signed upload)
- POST /api/assets (save metadata)
- GET /api/assets/{id}

### 6.7 Chat
- REST:
  - GET /api/chat/threads
  - POST /api/chat/threads
  - GET /api/chat/threads/{id}/messages
- WebSocket:
  - /ws (connect)
  - events: message.send, message.new, thread.join, notification.new, admin.broadcast

### 6.8 CRP (Disputes)
- POST /api/disputes
- GET /api/disputes
- (Admin) PATCH /api/admin/disputes/{id}

### 6.9 CMP (Content)
- GET /api/content
- (Admin) POST /api/admin/content
- (Admin) PATCH /api/admin/content/{id}

---

## 7) Security Requirements (non-negotiable)

### 7.1 Token Strategy
- Short-lived access token (e.g., 10–15 min)
- Refresh token stored as **httpOnly secure cookie**
- Refresh token rotation + revoke on logout

### 7.2 CORS / CSRF
- If using cookies for refresh:
  - SameSite=Lax/Strict where possible
  - CSRF token for state-changing cookie-auth endpoints OR keep access token in memory and use Authorization header for APIs

### 7.3 Validation & Rate Limits
- Validate all DTOs (size limits, allowed enums)
- Rate limit login, password reset, chapa webhook verification, upload signature

### 7.4 File Upload Safety
- Server checks:
  - allowed mime types
  - max size
  - scan/deny dangerous extensions
- Use Cloudinary resource type rules

### 7.5 Audit
- Log: login attempts, role changes, escrow release/refund, admin overrides

---

## 8) Critical Workflows (must be correct)

### 8.1 Employer hires freelancer
1) Employer creates job
2) Freelancer submits proposal
3) Employer accepts proposal → contract ACTIVE
4) Employer funds escrow (wallet debit → escrow hold)

### 8.2 Delivery & release
1) Freelancer submits delivery
2) Employer approves
3) Escrow released to freelancer wallet
4) Fees recorded (platform fee) + ledger entries

### 8.3 Dispute
1) Either party opens dispute
2) Contract status → DISPUTED
3) Admin reviews evidence and decides: release/refund/split
4) Ledger + escrow updates + audit logs

---

## 9) Milestones / Delivery Plan

### Phase 1 (Foundation)
- Auth (JWT + refresh), RBAC, user profiles
- Basic job posting + proposals

### Phase 2 (Contracts + Escrow)
- Contract lifecycle
- Wallet ledger + escrow holds/releases

### Phase 3 (Chat + Uploads)
- WebSocket chat
- Cloudinary signed uploads + assets metadata

### Phase 4 (Admin + CRP/CMP)
- Admin moderation
- Disputes + content management
- Analytics basics

### Phase 5 (Hardening)
- Rate limits, audit logs, alerts
- Pen-test checklist, security review

---

## 10) Definition of Done (DoD)
- All endpoints documented (OpenAPI/Swagger)
- Role and object authorization tested
- Payments: webhook verification + idempotency keys
- File uploads validated + assets tracked
- Chat authorization enforced
- Audit logs for critical actions
- Deployment-ready configuration (env vars, secrets, CORS)
