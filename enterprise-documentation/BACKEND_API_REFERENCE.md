# SabaHub Backend API Reference

## Base URL
```
http://localhost:8080/api
```

## Authentication
Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Jobs API

### Get Job Counts
```
GET /jobs/count
Response:
{
  "total": 15,
  "open": 10,
  "in_progress": 3,
  "completed": 2,
  "cancelled": 0
}
```

### List All Jobs
```
GET /jobs?page=0&size=10&status=OPEN&categoryId=design
Response:
{
  "content": [
    {
      "id": "job123",
      "employerId": "emp456",
      "title": "Web Design Project",
      "description": "Need a modern website design",
      "budgetMin": 500,
      "budgetMax": 2000,
      "currency": "USD",
      "categoryId": "design",
      "skills": ["UI Design", "Figma", "Prototyping"],
      "status": "OPEN",
      "createdAt": "2026-01-12T10:00:00Z",
      "updatedAt": "2026-01-12T10:00:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 15,
    "totalPages": 2
  }
}
```

### Search & Filter Jobs (Enterprise)
```
GET /jobs/search?page=0&size=10&q=video&status=OPEN&deliverableType=VIDEO_PRODUCTION&engagementType=PROJECT_BASED&pricingModel=FIXED_PRICE&industry=saas,finance&skills=aftereffects,premiere&enterpriseOnly=true
Response:
{
  "content": [
    {
      "id": "job123",
      "title": "Enterprise Video Production",
      "deliverableType": "VIDEO_PRODUCTION",
      "engagementType": "PROJECT_BASED",
      "pricingModel": "FIXED_PRICE",
      "industry": ["saas", "finance"],
      "skills": ["aftereffects", "premiere"],
      "isEnterpriseOnly": true,
      "status": "OPEN"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

### Get Single Job
```
GET /jobs/{id}
Response: Job object (see above)
```

### Get My Jobs (Employer)
```
GET /jobs/employer/my-jobs?page=0&size=10
Requires: EMPLOYER role
Response: Paginated list of employer's jobs
```

### Create Job (Employer)
```
POST /jobs
Requires: EMPLOYER role
Content-Type: application/json

Request Body:
{
  "title": "iOS App Development",
  "description": "Build a mobile app for iOS",
  "budgetMin": 3000,
  "budgetMax": 10000,
  "currency": "USD",
  "categoryId": "development",
  "skills": ["Swift", "iOS", "Xcode"]
}

Response:
{
  "id": "job789",
  "employerId": "emp456",
  "title": "iOS App Development",
  "description": "Build a mobile app for iOS",
  "budgetMin": 3000,
  "budgetMax": 10000,
  "currency": "USD",
  "categoryId": "development",
  "skills": ["Swift", "iOS", "Xcode"],
  "status": "OPEN",
  "createdAt": "2026-01-12T11:00:00Z",
  "updatedAt": "2026-01-12T11:00:00Z"
}
```

### Update Job (Employer)
```
PUT /jobs/{id}
Requires: EMPLOYER role
Content-Type: application/json

Request Body: (all fields optional)
{
  "title": "Updated Title",
  "budgetMax": 12000,
  "skills": ["Swift", "iOS", "Xcode", "Firebase"]
}

Response: Updated job object
```

### Close/Complete Job (Employer)
```
PUT /jobs/{id}/close
Requires: EMPLOYER role
Response: Job with status = COMPLETED
```

### Cancel Job (Employer)
```
PUT /jobs/{id}/cancel
Requires: EMPLOYER role
Response: Job with status = CANCELLED
```

### Delete Job (Employer)
```
DELETE /jobs/{id}
Requires: EMPLOYER role
Response: 204 No Content
```

---

## Wallet API

### Get Wallet Balance
```
GET /wallet/balance
Requires: Authentication

Response:
{
  "userId": "user123",
  "balance": 5000.00,
  "currency": "USD",
  "totalTransactions": 25,
  "lastUpdated": "2026-01-12T11:30:00Z"
}
```

### Get Wallet Transactions
```
GET /wallet/transactions?page=0&size=20
Requires: Authentication

Response:
{
  "content": [
    {
      "id": "txn123",
      "userId": "user123",
      "type": "CREDIT",
      "reason": "CHAPA_TOPUP",
      "amount": 500.00,
      "currency": "USD",
      "balanceAfter": 5000.00,
      "createdAt": "2026-01-12T10:00:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 25,
    "totalPages": 2
  }
}
```

### Get Escrow Balance
```
GET /wallet/escrow-balance
Requires: Authentication

Response:
{
  "escrowBalance": 500.00,
  "currency": "USD",
  "lastUpdated": "2026-01-12T11:30:00Z"
}
```

### Get Wallet Summary
```
GET /wallet/summary
Requires: Authentication

Response:
{
  "balance": 5000.00,
  "escrowBalance": 500.00,
  "availableBalance": 4500.00,
  "currency": "USD",
  "totalTransactions": 25,
  "pendingWithdrawals": 2,
  "completedWithdrawals": 5,
  "lastUpdated": "2026-01-12T11:30:00Z"
}
```

### Initiate Withdrawal
```
POST /wallet/withdraw
Requires: Authentication
Content-Type: application/json

Request Body:
{
  "amount": 1000.00,
  "currency": "USD",
  "paymentMethod": "BANK_TRANSFER",
  "bankDetails": {
    "accountHolder": "John Doe",
    "accountNumber": "1234567890",
    "bankName": "Bank of America",
    "swiftCode": "BOFA"
  }
}

Response:
{
  "message": "Withdrawal request initiated",
  "withdrawalId": "wd789",
  "amount": 1000.00,
  "status": "PENDING"
}
```

### Get Withdrawals History
```
GET /wallet/withdrawals?page=0&size=10
Requires: Authentication

Response:
{
  "content": [
    {
      "id": "wd789",
      "userId": "user123",
      "amount": 1000.00,
      "currency": "USD",
      "paymentMethod": "BANK_TRANSFER",
      "status": "PENDING",
      "bankDetails": {...},
      "createdAt": "2026-01-12T11:00:00Z"
    }
  ],
  "pageable": {...}
}
```

### Get Withdrawal Status
```
GET /wallet/withdrawals/{withdrawalId}
Requires: Authentication

Response: Withdrawal object (see above)
```

### Top-up Wallet (Admin)
```
POST /wallet/topup
Requires: ADMIN role
Content-Type: application/json

Request Body:
{
  "userId": "user123",
  "amount": 500.00,
  "currency": "USD"
}

Response:
{
  "message": "Wallet topped up successfully",
  "transactionId": "txn456",
  "amount": 500.00,
  "newBalance": 5500.00
}
```

---

## Error Responses

### Authentication Required
```
401 Unauthorized
{
  "error": "User not authenticated"
}
```

### Forbidden
```
403 Forbidden
{
  "error": "You don't have permission to perform this action"
}
```

### Not Found
```
404 Not Found
{
  "error": "Resource not found"
}
```

### Bad Request
```
400 Bad Request
{
  "error": "Invalid request body or parameters"
}
```

### Server Error
```
500 Internal Server Error
{
  "error": "Failed to process request: {details}"
}
```

---

## Transaction Types

- `CREDIT` - Money added to wallet
- `DEBIT` - Money removed from wallet

## Transaction Reasons

- `CHAPA_TOPUP` - Payment gateway top-up (Chapa)
- `LOCAL_TOPUP` - Local bank transfer top-up
- `ESCROW_FUND` - Money held for a job
- `ESCROW_RELEASE` - Money released from escrow
- `REFUND` - Refund to user
- `FEE` - Platform fee charged
- `WITHDRAW` - Withdrawal request

## Withdrawal Statuses

- `PENDING` - Waiting for processing
- `PROCESSING` - Being processed
- `COMPLETED` - Successfully completed
- `FAILED` - Failed to process
- `CANCELLED` - Cancelled by user

## Job Statuses

- `OPEN` - Job is open for proposals
- `IN_PROGRESS` - Job is being worked on
- `COMPLETED` - Job is completed
- `CANCELLED` - Job was cancelled

---

## Common Usage Examples

### Check if jobs are available
```bash
curl http://localhost:8080/api/jobs/count
```

### Get your wallet balance and escrow info
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/wallet/summary
```

### Post a new job
```bash
curl -X POST http://localhost:8080/api/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Web Development",
    "description": "Build a website",
    "budgetMin": 1000,
    "budgetMax": 5000,
    "currency": "USD",
    "categoryId": "development",
    "skills": ["React", "Node.js", "MongoDB"]
  }'
```

### Request a withdrawal
```bash
curl -X POST http://localhost:8080/api/wallet/withdraw \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "currency": "USD",
    "paymentMethod": "BANK_TRANSFER",
    "bankDetails": {
      "accountHolder": "Your Name",
      "accountNumber": "1234567890",
      "bankName": "Your Bank"
    }
  }'
```
