# SabaHub8 - Complete Database & Media Setup Guide
**Status: ✅ ALL SYSTEMS OPERATIONAL**

---

## Quick Status Check

Run this to verify all services:
```bash
# Check Backend
curl http://localhost:8080/health

# Check Frontend  
curl http://localhost:3000

# Check Settings Endpoint
curl -X GET http://localhost:3000/api/user/settings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtdXNlckBzYWJhaHViLmNvbSIsImVtYWlsIjoiZGV2LXVzZXJAc2FiYWh1Yi5jb20iLCJuYW1lIjoiRGV2ZWxvcG1lbnQgVXNlciIsInJvbGVzIjpbIkZSRUVMQU5DRVIiLCJFTVBMT1lFUiJdLCJpYXQiOjE3Mzg1NTgyMTAsImV4cCI6MTc3MDA5NDIxMH0.mock-signature-for-development"
```

---

## MongoDB Collections (21 Total)

### Core System (3)
```
users              - User accounts & authentication
otp                - One-time passwords for verification
auditLog           - Complete system audit trail
```

### User Profiles (2)
```
employers          - Employer company profiles
freelancers        - Freelancer professional profiles
```

### Work Management (5)
```
jobs               - Job postings
contracts          - Employment contracts
proposals          - Freelancer proposals
projects           - Project management
timeEntries        - Time tracking for hourly contracts
```

### Financial (4)
```
transactions       - Payment transactions (CHAPA/Stripe/Local)
walletLedgerEntry  - Wallet credit/debit entries
invoices           - Client invoices with line items
withdrawals        - Withdrawal requests & status
```

### Communication (3)
```
chatThreads        - Conversation threads
chatMessages       - Individual messages
notifications      - User notifications
```

### Content & Media (2)
```
assets             - Cloudinary media references
content            - Blog posts and articles
```

### Disputes & Issues (1)
```
disputes           - Dispute resolution tracking
```

---

## Cloudinary Folder Organization

```
sabahub/
├── images/
│   ├── profiles/        (user avatars)
│   ├── posts/           (content/blog images)
│   ├── gallery/         (portfolio images)
│   └── logos/           (employer company logos)
├── videos/
│   ├── training/        (instructional videos)
│   ├── promotional/     (promo/marketing videos)
│   └── user-content/    (user-uploaded videos)
├── audios/
│   ├── podcasts/        (podcast episodes)
│   ├── voice-notes/     (user voice messages)
│   └── content/         (background music, etc)
├── documents/
│   ├── resumes/         (freelancer CVs)
│   ├── contracts/       (signed contracts)
│   ├── reports/         (project reports)
│   └── certificates/    (qualification certs)
└── files/
    ├── archives/        (ZIP, RAR files)
    ├── spreadsheets/    (CSV, XLS files)
    └── misc/            (other files)
```

---

## Database Configuration

### Connection String
```
mongodb+srv://SabaHub:ETHIOpia2025@cluster0.ttsjadt.mongodb.net/SabaHub?retryWrites=true&w=majority
```

### Environment Variables Required
```bash
# Cloudinary
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret

# Payment Providers
export CHAPA_WEBHOOK_SECRET=your_chapa_secret
export STRIPE_API_KEY=your_stripe_key

# Email/SMS (OTP)
export SMTP_HOST=smtp.gmail.com
export SMTP_USER=your_email@gmail.com
export SMTP_PASS=your_app_password
export TWILIO_ACCOUNT_SID=your_twilio_sid
export TWILIO_AUTH_TOKEN=your_twilio_token
```

---

## API Endpoints - Complete List

### User Settings (✅ Working)
```
GET    /api/user/settings              Get all user settings
PATCH  /api/user/settings              Update settings (partial)
PUT    /api/user/settings              Replace all settings
```

### Wallet & Payments (✅ Working)
```
GET    /api/wallet/balance             Current balance
GET    /api/wallet/transactions        Transaction history
GET    /api/wallet/escrow-balance      Funds held in escrow
GET    /api/wallet/summary             Complete wallet summary
POST   /api/wallet/topup               Add funds
POST   /api/wallet/withdraw            Request withdrawal
GET    /api/wallet/withdrawals         Withdrawal requests list
```

### Media Uploads (✅ Working - uses Cloudinary)
```
POST   /api/media/upload/profile-image         Profile picture
POST   /api/media/upload/post-image            Content/blog image
POST   /api/media/upload/gallery-image         Portfolio gallery
POST   /api/media/upload/video                 Video content
POST   /api/media/upload/portfolio-item        Portfolio piece
POST   /api/media/upload/document              PDF/documents
POST   /api/media/upload/contract              Contract upload
```

### Jobs & Contracts (✅ Working)
```
GET    /api/jobs                       List all jobs
POST   /api/jobs                       Create new job
GET    /api/jobs/{id}                  Job details
PATCH  /api/jobs/{id}                  Update job
DELETE /api/jobs/{id}                  Remove job

GET    /api/contracts                  User contracts
POST   /api/contracts                  Create contract
GET    /api/contracts/{id}             Contract details
PATCH  /api/contracts/{id}             Update contract
POST   /api/contracts/{id}/accept      Accept contract
```

### Freelancer Profile (✅ Working)
```
GET    /api/freelancer/profile         Get profile
PUT    /api/freelancer/profile         Update profile
POST   /api/freelancer/skills          Add skills
POST   /api/freelancer/portfolio       Add portfolio item
POST   /api/freelancer/certifications  Add certification
```

### Chat & Communication (✅ Working)
```
GET    /api/chat/threads               List conversations
POST   /api/chat/threads               Start conversation
GET    /api/chat/threads/{id}          Thread messages
POST   /api/chat/threads/{id}/message  Send message
```

---

## Data Models - Key Fields

### User Model (Persisted)
```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "fullName": "John Doe",
  "passwordHash": "bcrypt_hash",
  "roles": ["FREELANCER", "EMPLOYER"],
  "suspended": false,
  "documentsVerified": false,
  "createdAt": "2026-01-25T10:00:00Z",
  "profile": {
    "bio": "Experienced developer",
    "location": "Addis Ababa, Ethiopia",
    "timezone": "Africa/Addis_Ababa",
    "profilePictureUrl": "https://res.cloudinary.com/...",
    "skills": ["React", "Spring Boot", "MongoDB"],
    "hourlyRate": "$50",
    "phoneVerified": true,
    "emailVerified": true,
    "bankDetails": "encrypted_data",
    "paymentMethod": "BANK_TRANSFER"
  }
}
```

### Transaction Model (Persisted)
```json
{
  "_id": "ObjectId",
  "userId": "user_id",
  "provider": "CHAPA",
  "direction": "IN",
  "amount": 1000,
  "currency": "ETB",
  "status": "SUCCESS",
  "providerRef": "chapa_ref_123",
  "idempotencyKey": "unique_key",
  "createdAt": "2026-01-25T10:00:00Z"
}
```

### Invoice Model (Persisted)
```json
{
  "_id": "ObjectId",
  "invoiceNumber": "INV-2026-001",
  "contractId": "contract_id",
  "freelancerId": "freelancer_id",
  "employerId": "employer_id",
  "items": [
    {
      "description": "Development work",
      "quantity": 40,
      "rate": 50,
      "amount": 2000
    }
  ],
  "subtotal": 2000,
  "tax": 240,
  "total": 2240,
  "status": "PAID",
  "issueDate": "2026-01-01T00:00:00Z",
  "dueDate": "2026-02-01T00:00:00Z"
}
```

---

## Testing

### Test Authentication
```bash
# Get mock token (auto-generated in dev mode)
curl http://localhost:3000/test-auth

# Copy token from page and use in requests:
curl -X GET http://localhost:8080/api/user/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Settings Save
```bash
# Update settings
curl -X PATCH http://localhost:3000/api/user/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bio": "I am a full-stack developer",
    "location": "Addis Ababa",
    "skills": ["React", "Spring Boot", "MongoDB"],
    "hourlyRate": "50"
  }'

# Expected: HTTP 200 with updated profile
```

### Test Media Upload
```bash
# Upload profile image
curl -X POST http://localhost:3000/api/media/upload/profile-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"

# Response includes Cloudinary URL
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "sabahub/images/profiles/..."
}
```

### Test Wallet
```bash
# Check balance
curl -X GET http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
{
  "userId": "user_id",
  "balance": 5000,
  "currency": "ETB",
  "entries": [...]
}
```

---

## Troubleshooting

### Settings Not Saving?
```
1. Check CORS headers:
   curl -X OPTIONS http://localhost:8080/api/user/settings -v
   
2. Verify auth token in frontend:
   Open browser DevTools → Application → localStorage → auth_token
   
3. Check backend logs:
   tail -f backend-spring/backend.log
   
4. Verify MongoDB connection:
   mongosh "mongodb+srv://..." --username SabaHub
```

### Media Upload Failing?
```
1. Check Cloudinary credentials in environment
2. Verify file size < limits (images: 10MB, videos: 100MB)
3. Check allowed format: jpg, jpeg, png, gif, webp, svg, bmp, ico
4. Look for 413 Payload Too Large error
```

### Transaction Not Appearing?
```
1. Check CHAPA webhook URL configured
2. Verify webhook secret in environment
3. Check transaction idempotency key
4. Look in MongoDB: db.transactions.find({userId: "..."})
```

---

## Performance Optimization

### MongoDB Indexes (Auto-created)
```
users: { email: 1 } - unique
transactions: { userId: 1 } - for wallet queries
transactions: { userId: 1, idempotencyKey: 1 } - prevent duplicates
invoices: { contractId: 1, freelancerId: 1, employerId: 1 }
contracts: { projectId: 1, employerId: 1, freelancerId: 1 }
```

### Recommended Compound Indexes
```
db.transactions.createIndex({userId: 1, createdAt: -1})
db.walletLedgerEntry.createIndex({userId: 1, createdAt: -1})
db.invoices.createIndex({employerId: 1, createdAt: -1})
db.assets.createIndex({ownerId: 1, scope: 1})
```

---

## Backup Strategy

### MongoDB Atlas Backup
```
✅ Automated daily snapshots
✅ Retention: 30 days default
✅ On-demand backup capability
✅ Point-in-time restore available
```

### Cloudinary Backup
```
✅ Automatic replication across CDN
✅ Secure_url always available
✅ Public_id recorded for recovery
✅ Resource versioning supported
```

---

## Security Checklist

- [x] MongoDB connection string uses credentials
- [x] Cloudinary API keys in environment variables
- [x] Bank details encrypted in database
- [x] JWT tokens include expiration
- [x] CORS properly configured
- [x] HTTPS enforced in production
- [x] Password hashed with BCrypt
- [x] Audit trail maintained for all transactions
- [x] OTP verification for sensitive operations
- [x] Rate limiting implemented

---

## Compliance

- [x] GDPR - User data deletion supported
- [x] PCI-DSS - No card data stored (delegated to providers)
- [x] Transaction logging - Complete audit trail
- [x] User consent - Settings for notifications/communications
- [x] Data retention - Configurable policies

---

**Last Updated:** January 25, 2026
**Status:** ✅ PRODUCTION READY
**All data persisted to MongoDB ✅**
**All media via Cloudinary ✅**
