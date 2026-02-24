# Enterprise Job Posting API Documentation

**Base URL:** `http://localhost:8080/api/jobs`

---

## Endpoints Overview

### Job Management
- `POST /` - Create job (Employer)
- `GET /{id}` - Get job details
- `PATCH /{id}` - Update job (Employer)
- `POST /{id}/publish` - Publish job (Employer)
- `POST /{id}/close` - Close job (Employer)

### Job Discovery
- `GET /browse/open` - Get all open jobs
- `GET /browse/by-type` - Filter by engagement type
- `GET /browse/by-deliverable` - Filter by deliverable type
- `GET /trending` - Trending jobs

### Search & Discovery
- `POST /search` - Advanced search with filters

### Employer Dashboard
- `GET /employer/my-jobs` - Get employer's jobs
- `GET /employer/stats` - Job statistics

---

## Detailed Endpoints

### POST /api/jobs
**Create a new job posting (Draft)**

**Authentication:** Required (Employer role)

**Request Body:**
```json
{
  "title": "Senior Media Production Vendor — Enterprise-Scale Content Delivery",
  "description": "We are seeking qualified media production vendors...",
  "overviewText": "Enterprise-scale online work platform serving global clients",
  "engagementType": "PROJECT_BASED",
  "deliverableType": "VIDEO_PRODUCTION",
  "deliverableScopes": [
    "Corporate video development",
    "Explainer video creation",
    "Post-production services"
  ],
  "workLocation": "Remote",
  "budgetMin": 5000,
  "budgetMax": 50000,
  "currency": "USD",
  "pricingModel": "FIXED_PRICE",
  "slaDeliveryDays": 15,
  "maxConcurrentProjects": 3,
  "includedRevisionRounds": 2,
  "qualityStandards": [
    "WCAG 2.1 AA",
    "Brand Compliance",
    "4K Resolution"
  ],
  "requiredFormats": [
    "MP4",
    "MOV",
    "WebP"
  ],
  "minYearsExperience": 5,
  "requiredSkills": [
    "Video Editing",
    "Motion Graphics",
    "Color Grading"
  ],
  "requiredTools": [
    "Adobe Premiere Pro",
    "DaVinci Resolve",
    "After Effects"
  ],
  "requiredQualifications": [
    "Professional portfolio",
    "5+ years experience",
    "Team management capability"
  ],
  "preferredExperience": [
    "Fortune 500 clients",
    "High-volume production",
    "Structured workflows"
  ],
  "requiresPortfolio": true,
  "requiresReferences": true,
  "minReferenceCount": 2,
  "requiresNDA": true,
  "requiresBGCheck": false,
  "requiresInsurance": false,
  "complianceRequirements": [
    "GDPR",
    "CCPA",
    "Data Protection"
  ],
  "dataClassifications": [
    "Confidential",
    "Proprietary"
  ],
  "pilotProjectRequired": true,
  "pilotProjectScope": "Single explainer video (200 words, 2-3 min)",
  "pilotEstimatedHours": 40,
  "preferredVendorOpportunity": true,
  "minimumMonthlyCommitment": 80,
  "contractTermMonths": 12,
  "rateStabilityGuarantee": true,
  "categoryId": "media-production",
  "skills": ["video", "editing", "motion-graphics"],
  "industry": ["SaaS", "Technology", "Enterprise"],
  "teamSize": ["Team", "Studio"],
  "companyName": "Enterprise Platform Inc.",
  "closingDate": "2026-02-25T00:00:00Z",
  "evaluationProcess": "Portfolio review → References check → Pilot project → Contract negotiation"
}
```

**Response:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "employerId": "507f1f77bcf86cd799439012",
  "title": "Senior Media Production Vendor...",
  "status": "DRAFT",
  "createdAt": "2026-01-25T10:00:00Z",
  "updatedAt": "2026-01-25T10:00:00Z",
  "...": "...other fields..."
}
```

---

### GET /api/jobs/{id}
**Get job details by ID**

**Authentication:** Not required (public read)

**Path Parameters:**
- `id` (string, required): Job ID

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Senior Media Production Vendor...",
  "description": "We are seeking qualified...",
  "budgetMin": 5000,
  "budgetMax": 50000,
  "...": "...complete job object..."
}
```

---

### PATCH /api/jobs/{id}
**Update existing job posting**

**Authentication:** Required (Employer, job owner)

**Path Parameters:**
- `id` (string, required): Job ID

**Request Body:** (Send only fields to update)
```json
{
  "title": "Updated Job Title",
  "budgetMax": 60000,
  "slaDeliveryDays": 20,
  "requiredSkills": ["Video Editing", "Color Grading"]
}
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Updated Job Title",
  "status": "DRAFT",
  "updatedAt": "2026-01-25T11:30:00Z",
  "...": "...updated job object..."
}
```

**Errors:**
- `403 Forbidden` - Not job owner
- `400 Bad Request` - Cannot update closed/completed job

---

### POST /api/jobs/{id}/publish
**Publish job from DRAFT to OPEN status**

**Authentication:** Required (Employer, job owner)

**Path Parameters:**
- `id` (string, required): Job ID

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "status": "OPEN",
  "updatedAt": "2026-01-25T11:45:00Z",
  "...": "...job object..."
}
```

---

### POST /api/jobs/{id}/close
**Close a job posting**

**Authentication:** Required (Employer, job owner)

**Path Parameters:**
- `id` (string, required): Job ID

**Query Parameters:**
- `reason` (string, optional): Reason for closing

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "status": "CLOSED",
  "updatedAt": "2026-01-25T12:00:00Z",
  "...": "...job object..."
}
```

---

### GET /api/jobs/browse/open
**Get all open job postings (paginated)**

**Authentication:** Not required

**Query Parameters:**
- `page` (integer, default: 0): Page number
- `size` (integer, default: 20): Results per page

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Senior Media Production Vendor...",
      "deliverableType": "VIDEO_PRODUCTION",
      "budgetMax": 50000,
      "...": "...job summary..."
    }
  ],
  "totalElements": 45,
  "totalPages": 3,
  "currentPage": 0,
  "pageSize": 20
}
```

---

### GET /api/jobs/browse/by-type
**Get jobs by engagement type**

**Authentication:** Not required

**Query Parameters:**
- `engagementType` (string, required): `PROJECT_BASED`, `CONTRACT`, `LONG_TERM_PARTNERSHIP`, `RETAINER`
- `page` (integer, default: 0): Page number
- `size` (integer, default: 20): Results per page

**Example:**
```
GET /api/jobs/browse/by-type?engagementType=PROJECT_BASED&page=0&size=20
```

**Response:** `200 OK`
```json
{
  "content": [...],
  "totalElements": 12,
  "totalPages": 1,
  "currentPage": 0
}
```

---

### GET /api/jobs/browse/by-deliverable
**Get jobs by deliverable type**

**Authentication:** Not required

**Query Parameters:**
- `deliverableType` (string, required): `IMAGE_DESIGN`, `VIDEO_PRODUCTION`, `AUDIO_PRODUCTION`, `DOCUMENT_DEVELOPMENT`, `MIXED`
- `page` (integer, default: 0): Page number
- `size` (integer, default: 20): Results per page

**Example:**
```
GET /api/jobs/browse/by-deliverable?deliverableType=VIDEO_PRODUCTION&page=0&size=20
```

---

### GET /api/jobs/trending
**Get trending jobs (most recent, high budget)**

**Authentication:** Not required

**Query Parameters:**
- `limit` (integer, default: 10): Number of results

**Response:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Senior Media Production Vendor...",
    "budgetMax": 50000,
    "createdAt": "2026-01-25T10:00:00Z",
    "...": "..."
  }
]
```

---

### POST /api/jobs/search
**Advanced search with multiple filters**

**Authentication:** Not required

**Query Parameters:**
- `page` (integer, default: 0): Page number
- `size` (integer, default: 20): Results per page

**Request Body:**
```json
{
  "deliverableType": "VIDEO_PRODUCTION",
  "engagementType": "PROJECT_BASED",
  "requiredSkills": ["Video Editing", "Motion Graphics"],
  "budgetMin": 10000,
  "budgetMax": 100000,
  "industry": ["SaaS", "Technology"],
  "minYearsExperience": 5,
  "pricingModel": "FIXED_PRICE",
  "teamSize": ["Studio", "Agency"]
}
```

**Response:** `200 OK`
```json
{
  "content": [...],
  "totalElements": 8,
  "totalPages": 1,
  "currentPage": 0
}
```

---

### GET /api/jobs/employer/my-jobs
**Get logged-in employer's jobs**

**Authentication:** Required (Employer)

**Query Parameters:**
- `limit` (integer, optional): Max results to return

**Response:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Senior Media Production Vendor...",
    "status": "OPEN",
    "createdAt": "2026-01-25T10:00:00Z",
    "...": "..."
  }
]
```

---

### GET /api/jobs/employer/stats
**Get job statistics for employer dashboard**

**Authentication:** Required (Employer)

**Response:** `200 OK`
```json
{
  "totalJobs": 15,
  "openJobs": 3,
  "inProgressJobs": 2,
  "completedJobs": 8,
  "closedJobs": 2
}
```

---

## Enums & Constants

### Engagement Types
```
PROJECT_BASED
CONTRACT
LONG_TERM_PARTNERSHIP
RETAINER
```

### Deliverable Types
```
IMAGE_DESIGN
VIDEO_PRODUCTION
AUDIO_PRODUCTION
DOCUMENT_DEVELOPMENT
MIXED
```

### Pricing Models
```
FIXED_PRICE
HOURLY
RETAINER
VOLUME_BASED
```

### Job Status
```
DRAFT          (Created, not published)
OPEN           (Published, accepting applications)
IN_PROGRESS    (Vendor selected, work ongoing)
COMPLETED      (Work finished, vendor paid)
CLOSED         (No longer accepting applications)
CANCELLED      (Terminated)
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Job title is required",
  "timestamp": "1674648000000"
}
```

### 403 Forbidden
```json
{
  "error": "You can only update your own jobs",
  "timestamp": "1674648000000"
}
```

### 404 Not Found
```json
{
  "error": "Job not found",
  "timestamp": "1674648000000"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create job: Database connection error",
  "timestamp": "1674648000000"
}
```

---

## Example Workflows

### Workflow 1: Employer Creates and Publishes a Job

1. **Create Job (Draft)**
   ```bash
   POST /api/jobs
   Authorization: Bearer {token}
   Content-Type: application/json
   
   {
     "title": "Senior Media Production Vendor",
     "description": "...",
     "engagementType": "PROJECT_BASED",
     ...
   }
   ```
   Response: `201 Created` with job ID

2. **Review and Update (Optional)**
   ```bash
   PATCH /api/jobs/{id}
   Authorization: Bearer {token}
   
   {
     "budgetMax": 60000
   }
   ```

3. **Publish Job**
   ```bash
   POST /api/jobs/{id}/publish
   Authorization: Bearer {token}
   ```
   Response: `200 OK` with status = "OPEN"

### Workflow 2: Vendor Searches and Views Jobs

1. **Browse Open Jobs**
   ```bash
   GET /api/jobs/browse/open?page=0&size=20
   ```

2. **Filter by Deliverable Type**
   ```bash
   GET /api/jobs/browse/by-deliverable?deliverableType=VIDEO_PRODUCTION&page=0&size=20
   ```

3. **Advanced Search**
   ```bash
   POST /api/jobs/search?page=0&size=20
   Content-Type: application/json
   
   {
     "deliverableType": "VIDEO_PRODUCTION",
     "budgetMin": 10000,
     "requiredSkills": ["Video Editing"]
   }
   ```

4. **View Job Details**
   ```bash
   GET /api/jobs/{id}
   ```

---

## Rate Limiting

- **Tier 1:** 100 requests per minute (public endpoints)
- **Tier 2:** 300 requests per minute (authenticated endpoints)
- **Headers:** Includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Pagination Format

All paginated endpoints return:
```json
{
  "content": [...],
  "totalElements": 45,
  "totalPages": 3,
  "numberOfElements": 20,
  "size": 20,
  "number": 0,
  "first": true,
  "last": false
}
```

---

## Authentication

All endpoints requiring authentication use Bearer tokens in the `Authorization` header:

```
Authorization: Bearer {jwt_token}
```

Employer-only endpoints require the user to have the `EMPLOYER` role.

---

**API Version:** 1.0  
**Last Updated:** January 25, 2026
