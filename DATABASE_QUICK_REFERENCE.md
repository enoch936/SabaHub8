# SabaHub8 - Database & Cloudinary Quick Reference Card
**Print this for quick access!**

---

## MongoDB Collections (21 Total)

| # | Collection | Purpose | Indexes |
|---|-----------|---------|---------|
| 1 | users | User accounts | email (unique) |
| 2 | employers | Employer profiles | userId |
| 3 | freelancers | Freelancer profiles | userId |
| 4 | jobs | Job listings | employerId |
| 5 | contracts | Employment contracts | employerId, freelancerId |
| 6 | proposals | Freelancer proposals | jobId |
| 7 | projects | Project management | employerId |
| 8 | timeEntries | Time tracking | contractId |
| 9 | transactions | Payment transactions | userId, idempotencyKey |
| 10 | walletLedgerEntry | Wallet ledger | userId |
| 11 | invoices | Client invoices | contractId |
| 12 | withdrawals | Withdrawal requests | userId |
| 13 | chatThreads | Conversations | participants |
| 14 | chatMessages | Chat messages | threadId |
| 15 | notifications | User notifications | userId |
| 16 | assets | Media metadata | ownerId |
| 17 | disputes | Dispute tracking | contractId |
| 18 | content | Blog/articles | authorId |
| 19 | otp | OTP codes | email |
| 20 | auditLog | System audit trail | userId |
| 21 | userRole | Role definitions | name |

---

## What Gets Saved Where

### User Settings ✅
```
→ MongoDB users collection
→ Embedded in profile object
→ All fields indexed for fast retrieval
```

### Payments ✅
```
→ transactions collection (CHAPA/Stripe)
→ walletLedgerEntry collection (balance)
→ Idempotency keys prevent duplicates
```

### Media ✅
```
→ assets collection (metadata only)
→ Cloudinary (actual files)
→ URLs stored in MongoDB
```

### Contracts & Jobs ✅
```
→ contracts collection
→ jobs collection
→ proposals collection
→ invoices collection
```

### Communication ✅
```
→ chatMessages collection
→ chatThreads collection
→ notifications collection
```

### Audit Trail ✅
```
→ auditLog collection
→ Records all actions
→ Includes user, timestamp, changes
```

---

## Cloudinary Folder Map

```
sabahub/
├── images/
│   ├── profiles/          → User avatars
│   ├── posts/             → Content images
│   ├── gallery/           → Portfolio
│   └── logos/             → Company logos
├── videos/
│   ├── training/          → Training videos
│   ├── promotional/       → Promo videos
│   └── user-content/      → User uploads
├── audios/
│   ├── podcasts/          → Podcasts
│   ├── voice-notes/       → Voice messages
│   └── content/           → Audio files
├── documents/
│   ├── resumes/           → CVs
│   ├── contracts/         → Contracts
│   ├── reports/           → Reports
│   └── certificates/      → Certs
└── files/
    ├── archives/          → ZIPs
    ├── spreadsheets/      → CSVs/XLS
    └── misc/              → Other files
```

---

## Critical API Endpoints

### Settings
```
GET    /api/user/settings          Get profile
PATCH  /api/user/settings          Save settings
PUT    /api/user/settings          Replace settings
```

### Wallet
```
GET    /api/wallet/balance         Get balance
POST   /api/wallet/topup           Add funds
POST   /api/wallet/withdraw        Withdraw funds
GET    /api/wallet/transactions    History
```

### Media
```
POST   /api/media/upload/profile-image
POST   /api/media/upload/portfolio-item
POST   /api/media/upload/document
POST   /api/media/upload/video
```

---

## Troubleshooting Quick Guide

| Problem | Solution |
|---------|----------|
| Settings not saving | Check auth token in localStorage |
| 403 CORS error | Verify backend running on :8080 |
| Media upload fails | Check file size < limit |
| Balance not updating | Check transaction status |
| Cloudinary URLs 404 | Check public_id in assets table |

---

## Environment Variables Needed

```bash
# MongoDB (already configured)
MONGODB_URI=mongodb+srv://...

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Payment Providers
CHAPA_WEBHOOK_SECRET=xxx
STRIPE_API_KEY=xxx

# Email/SMS (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_USER=xxx
SMTP_PASS=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
```

---

## Connection Strings

```
MongoDB: mongodb+srv://SabaHub:***@cluster0.ttsjadt.mongodb.net/SabaHub
Backend: http://localhost:8080
Frontend: http://localhost:3000
Proxy: http://localhost:3000/api/*
```

---

## Performance Tips

1. Use compound indexes for common queries
2. Limit results with pagination
3. Cache frequently accessed data
4. Use Cloudinary transformations
5. Enable gzip compression

---

## Security Checklist

- [ ] Cloudinary credentials in environment
- [ ] MongoDB connection via mongodb+srv
- [ ] HTTPS in production
- [ ] JWT token validation
- [ ] CORS properly configured
- [ ] Passwords hashed with BCrypt
- [ ] Bank details encrypted
- [ ] Audit logging enabled

---

## File Locations

```
Backend: /workspaces/SabaHub8/backend-spring/
  ├── domain/          MongoDB models
  ├── repository/      MongoRepository interfaces
  ├── service/         Business logic
  ├── controller/      REST endpoints
  └── web/             Additional controllers

Frontend: /workspaces/SabaHub8/frontend/
  ├── src/
  │   ├── app/
  │   │   ├── settings/      Settings page
  │   │   ├── wallet/        Wallet page
  │   │   └── media/         Media upload
  │   └── lib/
  │       ├── session.ts     Auth management
  │       └── api.ts         API client
  └── public/            Static assets
```

---

## Test Commands

```bash
# Check backend
curl http://localhost:8080/health

# Check frontend
curl http://localhost:3000

# Test settings save
curl -X PATCH http://localhost:3000/api/user/settings \
  -H "Authorization: Bearer TOKEN" \
  -d '{"bio":"test"}'

# Get wallet
curl -X GET http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer TOKEN"
```

---

## Key Decisions

✅ MongoDB for all data (not SQL)  
✅ Cloudinary for all media  
✅ JWT for authentication  
✅ Microservices architecture  
✅ Event-driven payments  
✅ Audit trail on all operations  

---

**Everything uses MongoDB. Everything uses Cloudinary. 100% covered.**

Last Updated: January 25, 2026
