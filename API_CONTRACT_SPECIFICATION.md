# SabaHub API Contract Specification
## Complete REST API Reference for Enterprise Marketplace

**Version:** 1.0  
**Last Updated:** December 30, 2024  
**Status:** Production Ready  

---

## Overview

SabaHub provides a comprehensive REST API for managing the complete lifecycle of a global freelancer marketplace. This document specifies all endpoints, request/response formats, authentication, and error handling.

**Base URL:**
- Production: `https://api.sabahub.com`
- Staging: `https://staging-api.sabahub.com`
- Local Dev: `http://localhost:8080`

**Authentication:** Bearer token (JWT)

---

## 1. Authentication Endpoints

### 1.1 User Registration (Step 1: Request OTP)

```http
POST /api/auth/otp/request-registration
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "phoneNumber": "+251918184887",
  "role": "FREELANCER"  // or "EMPLOYER"
}

Response: 200 OK
{
  "success": true,
  "message": "OTP sent to email and SMS",
  "data": {
    "email": "user@example.com",
    "otpStatus": "AWAITING_VERIFICATION",
    "expiresIn": 120,  // seconds
    "deliveryMethod": ["email", "sms"]
  }
}

Error Response: 400 Bad Request
{
  "success": false,
  "error": "INVALID_EMAIL",
  "message": "Email is already registered"
}
```

### 1.2 Verify Email OTP

```http
POST /api/auth/otp/verify-email
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "otpCode": "123456"
}

Response: 200 OK
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "email": "user@example.com",
    "otpStatus": "VERIFIED",
    "verifiedAt": "2024-12-30T10:30:00Z"
  }
}

Error Response: 400 Bad Request
{
  "success": false,
  "error": "INVALID_OTP",
  "message": "OTP code is invalid or expired"
}
```

### 1.3 Complete Registration (Step 2: Create Account)

```http
POST /api/auth/otp/complete-registration
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "password": "SecurePassword123!",
  "role": "FREELANCER"
}

Response: 200 OK
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "user": {
      "id": "usr_123456",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "FREELANCER",
      "createdAt": "2024-12-30T10:35:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_token_123456",
    "expiresIn": 86400  // seconds (24 hours)
  }
}

Error Response: 400 Bad Request
{
  "success": false,
  "error": "OTP_NOT_VERIFIED",
  "message": "Email OTP must be verified first"
}
```

### 1.4 User Login

```http
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123456",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "FREELANCER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_token_123456",
    "expiresIn": 86400
  }
}

Error Response: 401 Unauthorized
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect"
}
```

### 1.5 Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

Request:
{
  "refreshToken": "ref_token_123456"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_token_789012",
    "expiresIn": 86400
  }
}
```

### 1.6 Logout

```http
POST /api/auth/logout
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. User Management Endpoints

### 2.1 Get User Profile

```http
GET /api/users/{userId}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "FREELANCER",
    "phoneNumber": "+251918184887",
    "profileImage": "https://storage.sabahub.com/profiles/usr_123456.jpg",
    "bio": "Experienced web developer",
    "skills": ["JavaScript", "React", "Node.js"],
    "hourlyRate": 50,
    "location": "Addis Ababa, Ethiopia",
    "timezone": "EAT",
    "verified": true,
    "createdAt": "2024-12-30T10:35:00Z",
    "updatedAt": "2024-12-30T10:35:00Z"
  }
}
```

### 2.2 Update User Profile

```http
PUT /api/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "fullName": "John Doe",
  "bio": "Senior web developer with 5+ years experience",
  "skills": ["JavaScript", "React", "Node.js", "TypeScript"],
  "hourlyRate": 75,
  "location": "Addis Ababa, Ethiopia",
  "timezone": "EAT"
}

Response: 200 OK
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "usr_123456",
    "fullName": "John Doe",
    "bio": "Senior web developer with 5+ years experience",
    // ... rest of profile
    "updatedAt": "2024-12-30T11:00:00Z"
  }
}
```

### 2.3 Upload Profile Image

```http
POST /api/users/{userId}/profile-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- image: [file]

Response: 200 OK
{
  "success": true,
  "data": {
    "imageUrl": "https://storage.sabahub.com/profiles/usr_123456.jpg",
    "uploadedAt": "2024-12-30T11:05:00Z"
  }
}
```

---

## 3. Job Management Endpoints

### 3.1 Create Job (Employer Only)

```http
POST /api/jobs
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "Build E-commerce Website",
  "description": "Need a modern e-commerce website with payment integration",
  "category": "WEB_DEVELOPMENT",
  "subcategory": "Full Stack Development",
  "skills": ["React", "Node.js", "MongoDB", "Stripe"],
  "budget": {
    "type": "FIXED",  // or "HOURLY"
    "amount": 5000,
    "currency": "USD"
  },
  "duration": "1-3 months",
  "level": "EXPERT",  // BEGINNER, INTERMEDIATE, EXPERT
  "attachments": [
    "https://storage.sabahub.com/files/design.pdf"
  ]
}

Response: 201 Created
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "id": "job_123456",
    "title": "Build E-commerce Website",
    "description": "...",
    "status": "OPEN",
    "ownerId": "usr_123456",
    "category": "WEB_DEVELOPMENT",
    "skills": ["React", "Node.js", "MongoDB", "Stripe"],
    "budget": {
      "type": "FIXED",
      "amount": 5000,
      "currency": "USD"
    },
    "proposalsCount": 0,
    "createdAt": "2024-12-30T11:10:00Z",
    "updatedAt": "2024-12-30T11:10:00Z"
  }
}
```

### 3.2 Get Job Details

```http
GET /api/jobs/{jobId}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "job_123456",
    "title": "Build E-commerce Website",
    "description": "...",
    "status": "OPEN",
    "owner": {
      "id": "usr_123456",
      "fullName": "Jane Employer",
      "profileImage": "..."
    },
    "category": "WEB_DEVELOPMENT",
    "skills": ["React", "Node.js", "MongoDB", "Stripe"],
    "budget": {
      "type": "FIXED",
      "amount": 5000,
      "currency": "USD"
    },
    "duration": "1-3 months",
    "level": "EXPERT",
    "proposals": [
      {
        "id": "prop_111",
        "bidAmount": 4500,
        "freelancer": { "id": "usr_456", "fullName": "John Freelancer" },
        "status": "PENDING"
      }
    ],
    "proposalsCount": 5,
    "createdAt": "2024-12-30T11:10:00Z",
    "updatedAt": "2024-12-30T11:10:00Z"
  }
}
```

### 3.3 List Jobs (Search/Filter)

```http
GET /api/jobs?category=WEB_DEVELOPMENT&skills=React&budget_min=1000&budget_max=10000&page=1&limit=20
Authorization: Bearer {token}

Query Parameters:
- category: string (filter by category)
- skills: string (comma-separated skills)
- budget_min: number
- budget_max: number
- level: string (BEGINNER, INTERMEDIATE, EXPERT)
- status: string (OPEN, IN_PROGRESS, COMPLETED)
- sort_by: string (NEWEST, POPULAR, ENDING_SOON)
- page: number (default: 1)
- limit: number (default: 20, max: 100)

Response: 200 OK
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_123456",
        "title": "Build E-commerce Website",
        "category": "WEB_DEVELOPMENT",
        "budget": { "amount": 5000, "currency": "USD" },
        "proposalsCount": 5,
        "createdAt": "2024-12-30T11:10:00Z"
      }
      // ... more jobs
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### 3.4 Update Job

```http
PUT /api/jobs/{jobId}
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "Build E-commerce Website (Updated)",
  "status": "IN_PROGRESS",
  "selectedFreelancerId": "usr_456"
}

Response: 200 OK
{
  "success": true,
  "message": "Job updated successfully",
  "data": { /* updated job */ }
}
```

### 3.5 Delete Job

```http
DELETE /api/jobs/{jobId}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Job deleted successfully"
}
```

---

## 4. Proposal/Bidding Endpoints

### 4.1 Submit Proposal (Freelancer Only)

```http
POST /api/jobs/{jobId}/proposals
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "bidAmount": 4500,
  "currency": "USD",
  "deliveryDays": 30,
  "coverLetter": "I have 5 years of experience in building e-commerce platforms...",
  "attachments": [
    "https://storage.sabahub.com/portfolios/project1.pdf"
  ]
}

Response: 201 Created
{
  "success": true,
  "message": "Proposal submitted successfully",
  "data": {
    "id": "prop_111",
    "jobId": "job_123456",
    "freelancerId": "usr_456",
    "bidAmount": 4500,
    "currency": "USD",
    "deliveryDays": 30,
    "coverLetter": "...",
    "status": "PENDING",
    "createdAt": "2024-12-30T11:30:00Z"
  }
}
```

### 4.2 Get Proposal Details

```http
GET /api/proposals/{proposalId}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "prop_111",
    "job": {
      "id": "job_123456",
      "title": "Build E-commerce Website"
    },
    "freelancer": {
      "id": "usr_456",
      "fullName": "John Freelancer",
      "hourlyRate": 50,
      "rating": 4.8,
      "reviews": 25
    },
    "bidAmount": 4500,
    "deliveryDays": 30,
    "coverLetter": "...",
    "status": "PENDING",
    "createdAt": "2024-12-30T11:30:00Z"
  }
}
```

### 4.3 List Proposals for Job

```http
GET /api/jobs/{jobId}/proposals?status=PENDING&sort_by=RECENT
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "proposals": [
      {
        "id": "prop_111",
        "freelancer": { "id": "usr_456", "fullName": "John" },
        "bidAmount": 4500,
        "status": "PENDING",
        "createdAt": "2024-12-30T11:30:00Z"
      }
    ],
    "total": 5
  }
}
```

### 4.4 Accept Proposal (Employer Only)

```http
POST /api/proposals/{proposalId}/accept
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Proposal accepted successfully",
  "data": {
    "proposal": {
      "id": "prop_111",
      "status": "ACCEPTED"
    },
    "contract": {
      "id": "contract_789",
      "status": "ACTIVE",
      "startDate": "2024-12-30T12:00:00Z",
      "endDate": "2025-01-29T12:00:00Z"
    }
  }
}
```

### 4.5 Reject Proposal

```http
POST /api/proposals/{proposalId}/reject
Authorization: Bearer {token}

Request:
{
  "reason": "Budget exceeded our limit"
}

Response: 200 OK
{
  "success": true,
  "message": "Proposal rejected",
  "data": {
    "id": "prop_111",
    "status": "REJECTED"
  }
}
```

---

## 5. Chat/Messaging Endpoints

### 5.1 Create Conversation

```http
POST /api/conversations
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "participantId": "usr_456",
  "subject": "Discussion about Job #123456"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "conv_111",
    "participants": [
      { "id": "usr_123", "fullName": "Jane" },
      { "id": "usr_456", "fullName": "John" }
    ],
    "lastMessage": null,
    "createdAt": "2024-12-30T12:00:00Z"
  }
}
```

### 5.2 Get Conversations

```http
GET /api/conversations?page=1&limit=20
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_111",
        "participants": [ /* ... */ ],
        "lastMessage": {
          "id": "msg_555",
          "text": "Let's discuss the timeline",
          "sender": { "id": "usr_456" },
          "createdAt": "2024-12-30T12:15:00Z"
        },
        "unreadCount": 2,
        "updatedAt": "2024-12-30T12:15:00Z"
      }
    ],
    "total": 10
  }
}
```

### 5.3 Get Conversation Messages

```http
GET /api/conversations/{conversationId}/messages?page=1&limit=50
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_555",
        "conversationId": "conv_111",
        "sender": { "id": "usr_456", "fullName": "John" },
        "text": "Let's discuss the timeline",
        "attachments": [],
        "readAt": "2024-12-30T12:20:00Z",
        "createdAt": "2024-12-30T12:15:00Z"
      }
    ],
    "total": 50
  }
}
```

### 5.4 Send Message (WebSocket)

```javascript
// WebSocket Connection
const ws = new WebSocket('wss://api.sabahub.com/ws?token=<JWT_TOKEN>');

// Send Message
ws.send(JSON.stringify({
  type: "SEND_MESSAGE",
  conversationId: "conv_111",
  text: "When can you start the project?",
  attachments: []
}));

// Receive Message
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
  // {
  //   "id": "msg_556",
  //   "conversationId": "conv_111",
  //   "sender": { "id": "usr_123" },
  //   "text": "I can start tomorrow",
  //   "createdAt": "2024-12-30T12:25:00Z"
  // }
};
```

---

## 6. Payment Endpoints

### 6.1 Create Payment Intent

```http
POST /api/payments/create-intent
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "contractId": "contract_789",
  "amount": 4500,
  "currency": "USD",
  "description": "Payment for E-commerce Website Project"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_123456",
    "clientSecret": "pi_123456_secret_abcdef",
    "amount": 4500,
    "currency": "USD",
    "status": "requires_payment_method"
  }
}
```

### 6.2 Confirm Payment

```http
POST /api/payments/confirm
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "paymentIntentId": "pi_123456",
  "paymentMethodId": "pm_123456"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "transactionId": "txn_123456",
    "status": "succeeded",
    "amount": 4500,
    "fee": 180,  // platform fee (4%)
    "net": 4320,
    "createdAt": "2024-12-30T12:30:00Z"
  }
}
```

### 6.3 Get Payment History

```http
GET /api/payments/history?page=1&limit=20
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123456",
        "type": "PAYMENT",  // PAYMENT, REFUND, PAYOUT
        "amount": 4500,
        "fee": 180,
        "net": 4320,
        "status": "succeeded",
        "relatedUser": { "id": "usr_456", "fullName": "John" },
        "contract": { "id": "contract_789" },
        "createdAt": "2024-12-30T12:30:00Z"
      }
    ],
    "total": 50
  }
}
```

---

## 7. Admin Endpoints

### 7.1 List All Users (Admin Only)

```http
GET /api/admin/users?page=1&limit=50&role=FREELANCER
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "usr_123456",
        "email": "user@example.com",
        "fullName": "John Doe",
        "role": "FREELANCER",
        "status": "ACTIVE",
        "createdAt": "2024-12-30T10:35:00Z"
      }
    ],
    "total": 1200
  }
}
```

### 7.2 Suspend User (Admin Only)

```http
POST /api/admin/users/{userId}/suspend
Authorization: Bearer {admin_token}
Content-Type: application/json

Request:
{
  "reason": "Violation of community guidelines",
  "duration": "30d"  // 30 days, or "permanent"
}

Response: 200 OK
{
  "success": true,
  "message": "User suspended successfully",
  "data": {
    "userId": "usr_123456",
    "status": "SUSPENDED",
    "suspendedUntil": "2025-01-29T12:00:00Z"
  }
}
```

### 7.3 Resolve Dispute (Admin Only)

```http
POST /api/admin/disputes/{disputeId}/resolve
Authorization: Bearer {admin_token}
Content-Type: application/json

Request:
{
  "resolution": "REFUND_TO_EMPLOYER",  // or "RELEASE_TO_FREELANCER"
  "reason": "Insufficient work delivery"
}

Response: 200 OK
{
  "success": true,
  "message": "Dispute resolved",
  "data": {
    "id": "disp_123",
    "status": "RESOLVED",
    "resolution": "REFUND_TO_EMPLOYER",
    "resolvedAt": "2024-12-30T12:45:00Z"
  }
}
```

---

## 8. Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "email",
    "reason": "Email is already registered"
  },
  "timestamp": "2024-12-30T12:50:00Z",
  "requestId": "req_123456"
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| INVALID_REQUEST | 400 | Request validation failed |
| INVALID_EMAIL | 400 | Email format invalid |
| EMAIL_EXISTS | 400 | Email already registered |
| INVALID_OTP | 400 | OTP is invalid or expired |
| OTP_NOT_VERIFIED | 400 | Email OTP not verified yet |
| INVALID_CREDENTIALS | 401 | Email or password incorrect |
| UNAUTHORIZED | 401 | No valid authentication token |
| FORBIDDEN | 403 | User lacks required permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## 9. Rate Limiting

```
Default Rate Limits:
- Authenticated users: 100 requests per minute
- Admin users: 1000 requests per minute
- Auth endpoints: 10 requests per minute per IP
- Payment endpoints: 5 requests per minute

Response Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704013200
```

---

## 10. JWT Token Claims

```json
{
  "iss": "sabahub.com",
  "sub": "usr_123456",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "FREELANCER",
  "roles": ["ROLE_FREELANCER"],
  "permissions": ["read:jobs", "write:proposals"],
  "iat": 1704009600,
  "exp": 1704096000,
  "aud": "sabahub-web"
}
```

---

## 11. Webhook Events

### Webhook Payload Format

```json
{
  "id": "evt_123456",
  "type": "JOB_CREATED",
  "timestamp": "2024-12-30T12:55:00Z",
  "data": {
    "jobId": "job_123456",
    "title": "Build E-commerce Website",
    "owner": { "id": "usr_123456" }
  }
}
```

### Webhook Events

| Event | When |
|-------|------|
| USER_REGISTERED | New user completes registration |
| JOB_CREATED | New job posted |
| PROPOSAL_SUBMITTED | Freelancer submits proposal |
| PROPOSAL_ACCEPTED | Employer accepts proposal |
| PAYMENT_COMPLETED | Payment successfully processed |
| DISPUTE_CREATED | Customer creates dispute |
| DISPUTE_RESOLVED | Admin resolves dispute |

---

## 12. Versioning

API uses date-based versioning. Current version: `v1.0` (December 30, 2024)

For new API versions, use header:
```
Accept: application/vnd.sabahub.v2+json
```

---

**API Contract Maintained By:** Backend Engineering Team  
**Last Review:** December 30, 2024  
**Next Review:** January 31, 2025
