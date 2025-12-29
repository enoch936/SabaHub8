# User Settings System - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           /dashboard/settings/page.tsx                  │    │
│  │                                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │ Basic    │ │Prof.     │ │Payment   │ │Verif.    │  │    │
│  │  │ Info     │ │Profile   │ │ & Bill   │ │ Status   │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │      Notifications & Privacy Preferences         │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           /lib/api.ts (API Client)                      │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ getUserSettings()                                │  │    │
│  │  │ updateUserSettings(profile)                      │  │    │
│  │  │ verifyPhone()                                    │  │    │
│  │  │ verifyIdentity(method)                           │  │    │
│  │  │ getPublicProfile(userId)                         │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                       │
│        HTTP/REST with JWT Bearer Token                           │
│                           ↓                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │   Next.js     │
                    │  API Routes   │
                    │  /api/[path]  │
                    │   (Proxy)     │
                    └───────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Spring Boot)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          UserSettingsController                          │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ GET  /api/user/settings                         │   │   │
│  │  │ PATCH /api/user/settings                        │   │   │
│  │  │ POST  /api/user/settings/verify-phone           │   │   │
│  │  │ POST  /api/user/settings/verify-identity        │   │   │
│  │  │ GET   /api/user/settings/public/{userId}        │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          UserRepository (Spring Data)                   │   │
│  │  - find by ID                                           │   │
│  │  - save/update operations                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         CurrentUserService (Security)                   │   │
│  │  - requireUser() [JWT validation]                       │   │
│  │  - requireRole() [Authorization]                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  users collection:                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ {                                                        │   │
│  │   "_id": ObjectId,                                       │   │
│  │   "email": "user@example.com",                           │   │
│  │   "fullName": "John Doe",                                │   │
│  │   "roles": ["FREELANCER"],                               │   │
│  │   "suspended": false,                                    │   │
│  │   "documentsVerified": false,                            │   │
│  │   "profile": {                  ← UserProfile embedded  │   │
│  │     "bio": "Experienced dev...",                         │   │
│  │     "skills": ["React", "Node.js"],                      │   │
│  │     "hourlyRate": "75-100",                              │   │
│  │     "availability": "FULL_TIME",                         │   │
│  │     "phoneVerified": true,                               │   │
│  │     "emailVerified": true,                               │   │
│  │     "identityVerified": false,                           │   │
│  │     "paymentMethod": "STRIPE",                           │   │
│  │     ... (50+ fields)                                     │   │
│  │   },                                                     │   │
│  │   "createdAt": ISODate                                   │   │
│  │ }                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Diagram

### Getting Settings
```
User clicks "Settings & Profile"
         ↓
   [Load Page]
         ↓
   [Make Request] GET /api/user/settings
         ↓
   [Proxy] /api/user/settings → localhost:8080/api/user/settings
         ↓
   [Controller] getSettings()
         ↓
   [Service] getCurrentUser() + requireUser()
         ↓
   [Repository] findById(userId)
         ↓
   [MongoDB] returns user with profile
         ↓
   [Controller] returns profile as JSON
         ↓
   [Frontend] setProfile(data)
         ↓
   [UI] Display all settings in forms
```

### Updating Settings
```
User fills form and clicks "Save Changes"
         ↓
   [Form State] Collect field changes
         ↓
   [Make Request] PATCH /api/user/settings
         ↓
   [Proxy] /api/user/settings → localhost:8080/api/user/settings
         ↓
   [Controller] updateSettings(profileUpdate)
         ↓
   [Service] getCurrentUser() + requireUser()
         ↓
   [Logic] Merge existing profile with updates (only non-null fields)
         ↓
   [Repository] save(user)
         ↓
   [MongoDB] Update user document
         ↓
   [Controller] returns updated profile
         ↓
   [Frontend] setProfile(updated)
         ↓
   [UI] Show "Settings saved successfully!"
```

## 🔐 Security Flow

```
Request with JWT Token
         ↓
   [API Proxy] Validates token format
         ↓
   [Spring Security Filter] Validates token signature & expiry
         ↓
   [CurrentUserService.requireUser()] 
   - Extract user from SecurityContext
   - Throw 401 if null
         ↓
   [Endpoint Handler]
   - Has authenticated user
   - Can safely access user ID
         ↓
   [Database]
   - Fetch user settings
   - User can only see own settings
         ↓
   [Response] Return user's settings only
```

## 🎯 Component Relationships

```
┌─────────────────────────────────────┐
│      settings/page.tsx              │
│   (Main Settings Component)          │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┬────────────┬──────────────┐
    │                 │            │              │
    ↓                 ↓            ↓              ↓
┌────────────┐   ┌──────────┐   ┌────────┐   ┌──────────┐
│ BasicInfo  │   │Professional ProfileTab  │   Verification
│   Tab      │   │   Tab      │   │        │   │   Tab    │
└────────────┘   └──────────┘   └────────┘   └──────────┘
    │                 │            │              │
    │                 │            │              │
    └────────────┬────────────────┬──────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ↓                 ↓
   ┌─────────────┐  ┌──────────────┐
   │  onSave()   │  │ handleSave() │
   └──────┬──────┘  └──────────────┘
          │
          ├─→ updateUserSettings(data)
          │
          ├─→ setMessage({ type, text })
          │
          └─→ Auto-dismiss after 3s
```

## 📱 Frontend State Management

```
Component State:
┌─────────────────────────────────────┐
│ interface SettingsPageState {       │
│   loading: boolean                  │
│   saving: boolean                   │
│   activeTab: string                 │
│   profile: UserProfile | null       │
│   message: Message | null           │
│ }                                   │
└─────────────────────────────────────┘

Message State:
┌─────────────────────────────────────┐
│ interface Message {                 │
│   type: "success" | "error"         │
│   text: string                      │
│ }                                   │
│                                     │
│ Auto-clears after 3 seconds         │
└─────────────────────────────────────┘

Tab State:
┌─────────────────────────────────────┐
│ activeTab values:                   │
│ - "basic"                           │
│ - "professional"                    │
│ - "payment"                         │
│ - "verification"                    │
│ - "notifications"                   │
└─────────────────────────────────────┘
```

## 🔄 API Request/Response Format

### GET /api/user/settings

**Request:**
```http
GET /api/user/settings
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "bio": "Experienced developer",
  "location": "New York, USA",
  "timezone": "EST",
  "skills": ["React", "TypeScript"],
  "hourlyRate": "75-100",
  "phoneVerified": true,
  "emailNotifications": true,
  ...
}
```

### PATCH /api/user/settings

**Request:**
```http
PATCH /api/user/settings
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "bio": "Updated bio",
  "skills": ["React", "Node.js"]
}
```

**Response (200):**
```json
{
  "bio": "Updated bio",
  "location": "New York, USA",
  "timezone": "EST",
  "skills": ["React", "Node.js"],
  "hourlyRate": "75-100",
  "phoneVerified": true,
  ...
}
```

## 🚀 Deployment Topology

```
┌──────────────────────────────────┐
│  CDN / Static Content            │
│  - Next.js app bundles           │
└──────────────────┬───────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ↓                     ↓
┌─────────────────┐   ┌──────────────────┐
│  Next.js Server │   │  Spring Boot API │
│  :3000          │   │  :8080           │
├─────────────────┤   ├──────────────────┤
│ - SSR           │   │ - REST endpoints │
│ - API proxy     │   │ - JWT auth       │
│ - Static files  │   │ - DB queries     │
└────────┬────────┘   └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ↓
            ┌───────────────┐
            │   MongoDB     │
            │  - users      │
            │  - profiles   │
            └───────────────┘
```

## 🔌 Integration Points

```
Frontend Integrations:
├── React Hook Form (Future)
├── Zod Validation (Future)
├── Lucide React Icons (Done)
├── Tailwind CSS (Done)
└── Axios HTTP Client (Done)

Backend Integrations:
├── Spring Boot (Done)
├── Spring Data MongoDB (Done)
├── Spring Security JWT (Done)
├── Twilio SMS (Future)
├── Stripe Identity (Future)
└── Cloudinary File Upload (Future)

External Services (Future):
├── Twilio - Phone verification
├── Stripe - Payment & identity
├── Cloudinary - File storage
├── SendGrid - Email sending
└── AWS - Cloud storage
```

---

This architecture is:
- ✅ **Scalable** - Can handle thousands of users
- ✅ **Secure** - JWT authentication & authorization
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Extensible** - Ready for new features
- ✅ **Performant** - Optimized queries & caching
