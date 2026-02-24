# Quick Start Guide: Testing SabaHub Backend APIs

## Status Check
- ✅ **Compilation**: BUILD SUCCESS
- ✅ **New APIs**: 16 endpoints implemented
- ✅ **Redis**: Configured with graceful fallback
- ✅ **MongoDB**: Configured and ready
- 🟡 **Docker**: Pre-existing service issues (unrelated to new APIs)

---

## Fast Track: Start Backend Locally

### Step 1: Start Services (if Docker available)
```bash
cd /workspaces/SabaHub8/backend-spring
docker-compose up -d
```

Or use environment variables for cloud services if available.

### Step 2: Run Backend
```bash
cd /workspaces/SabaHub8/backend-spring
mvn spring-boot:run
```

**Expected Output**: `Started BackendSpringApplication in X.XXX seconds`

### Step 3: Test an Endpoint
```bash
# Test Jobs API
curl http://localhost:8080/api/v2/jobs/count

# Expected response:
# {"total": 0, "open": 0, "in_progress": 0, "completed": 0, "cancelled": 0}
```

---

## API Examples

### Authentication Token (Required for most endpoints)
First, get a JWT token (assuming existing auth endpoint):
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Save the token
export TOKEN="<your-token-here>"
```

### Jobs API Endpoints

**1. Get Job Count by Status**
```bash
curl http://localhost:8080/api/v2/jobs/count
```

**2. List All Jobs (Paginated)**
```bash
curl "http://localhost:8080/api/v2/jobs?page=0&size=10&status=OPEN"
```

**3. Create New Job (Requires EMPLOYER role)**
```bash
curl -X POST http://localhost:8080/api/v2/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Web Developer Needed",
    "description": "Need experienced web developer",
    "budgetMin": 500,
    "budgetMax": 2000,
    "currency": "USD",
    "categoryId": "web-dev",
    "skills": ["React", "Node.js"]
  }'
```

**4. Get Specific Job**
```bash
curl http://localhost:8080/api/v2/jobs/{jobId}
```

**5. Update Job**
```bash
curl -X PUT http://localhost:8080/api/v2/jobs/{jobId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
```

---

### Wallet API Endpoints

**1. Get Wallet Balance**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v2/wallet/balance
```

**2. Get Wallet Summary (All Metrics)**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v2/wallet/summary
```

**3. Get Transaction History**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v2/wallet/transactions?page=0&size=20"
```

**4. Initiate Withdrawal**
```bash
curl -X POST http://localhost:8080/api/v2/wallet/withdraw \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "paymentMethod": "BANK_TRANSFER",
    "bankDetails": {
      "accountNumber": "123456789",
      "routingNumber": "021000021"
    }
  }'
```

**5. Get Escrow Balance**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v2/wallet/escrow-balance
```

---

## Frontend Integration (Next Step)

Update `frontend/src/lib/api.ts` to wire the new endpoints:

```typescript
// Add these functions
export async function getJobCounts() {
  const response = await fetch('/api/v2/jobs/count');
  return response.json();
}

export async function getWalletSummary(token: string) {
  const response = await fetch('/api/v2/wallet/summary', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

export async function listJobs(page: number, size: number) {
  const response = await fetch(`/api/v2/jobs?page=${page}&size=${size}`);
  return response.json();
}
```

Then update dashboard pages to call these functions instead of showing "Beta" messages.

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 8080 is available
lsof -i :8080

# Try with different port
java -Dserver.port=9090 -jar target/backend-spring-0.0.1-SNAPSHOT.jar
```

### Redis connection errors
These are expected on first run if Redis is not available. The application will continue without token blacklisting (graceful fallback).

### Docker build fails
The Docker build has pre-existing issues in other service classes (EmployerService). These are unrelated to our new APIs. The backend still compiles with Maven for direct development.

### API returns 401 Unauthorized
Ensure you're including the Authorization header with a valid JWT token:
```bash
-H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## File Locations

**New Controllers**:
- `/workspaces/SabaHub8/backend-spring/src/main/java/com/sabahub/controller/JobsController.java` (270 lines)
- `/workspaces/SabaHub8/backend-spring/src/main/java/com/sabahub/controller/WalletAPIController.java` (330 lines)

**New DTOs**:
- `/workspaces/SabaHub8/backend-spring/src/main/java/com/sabahub/dto/JobDTO.java`
- `/workspaces/SabaHub8/backend-spring/src/main/java/com/sabahub/dto/WalletDTO.java`

**Documentation**:
- [BACKEND_VERIFICATION_COMPLETE.md](BACKEND_VERIFICATION_COMPLETE.md) - Complete verification report
- [BACKEND_API_REFERENCE.md](BACKEND_API_REFERENCE.md) - Full API documentation with examples
- [BACKEND_FIX_SUMMARY.md](BACKEND_FIX_SUMMARY.md) - Problem solutions
- [BACKEND_SETUP_GUIDE.md](BACKEND_SETUP_GUIDE.md) - Setup instructions

---

## Key Information

**API Base Path**: `/api/v2/`  
**Port**: 8080 (default)  
**Authentication**: JWT Bearer token required for protected endpoints  
**Database**: MongoDB 7 (localhost:27017)  
**Cache**: Redis 7 (localhost:6379, optional)

---

For detailed API documentation, see **BACKEND_API_REFERENCE.md**
