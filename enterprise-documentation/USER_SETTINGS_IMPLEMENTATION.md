# SabaHub Advanced User Settings Implementation

## Overview
Implemented a comprehensive advanced user settings & profile system similar to Upwork/Fiverr for freelancers and employers managing their professional presence.

## Features Implemented

### 1. **Backend (Spring Boot)**

#### New Domain Model
- **UserProfile.java**: Extended user profile embedded in User document
  - Basic info (bio, location, timezone, phone, language)
  - Professional info (skills, certifications, expertise, years of experience)
  - Portfolio & stats (portfolio URLs, completed projects, ratings, reviews)
  - Freelancer-specific (hourly rate, availability, preferred categories)
  - Payment & banking (payment methods, tax ID, bank details)
  - Settings & preferences (notifications, privacy, language)
  - Verification status (phone, email, identity)

#### New API Endpoint: `UserSettingsController.java`
All endpoints require authentication (Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/settings` | Get current user's settings/profile |
| PATCH | `/api/user/settings` | Update user settings (partial) |
| POST | `/api/user/settings/verify-phone` | Initiate phone verification |
| POST | `/api/user/settings/verify-identity` | Initiate identity verification |
| GET | `/api/user/settings/public/{userId}` | Get public profile of user |

#### Partial Update Pattern
The PATCH endpoint supports partial updates - only non-null fields in the request will be updated:

```java
// All fields are optional, only provided ones are updated
{
  "bio": "Updated bio",
  "skills": ["React", "Node.js"],
  "hourlyRate": "75"
}
```

### 2. **Frontend (Next.js)**

#### New Page: `/dashboard/settings/page.tsx`
Advanced settings page with 5 tabs:

1. **Basic Info Tab**
   - Bio (textarea)
   - Location
   - Timezone
   - Language
   - Phone number

2. **Professional Tab**
   - Years of experience
   - Expertise level (Beginner/Intermediate/Expert/Master)
   - Hourly rate
   - Availability (Full time/Part time/Occasional)
   - Skills (add/remove)
   - Open to opportunities toggle

3. **Payment & Billing Tab**
   - Payment method selection (Stripe, PayPal, Bank Transfer, Crypto)
   - Tax ID

4. **Verification Tab**
   - Email verification status
   - Phone verification status
   - Identity verification status
   - Quick verify buttons

5. **Notifications Tab**
   - Email notifications toggle
   - SMS notifications toggle
   - Hide profile toggle
   - Show earnings toggle

#### Features
- Real-time form state management
- Save/loading indicators
- Success/error messages
- Tab-based organization
- Responsive design (mobile-friendly)
- Icons for visual clarity

### 3. **API Client**

Updated `lib/api.ts` with new functions:

```typescript
// Get user settings
const profile = await getUserSettings();

// Update settings
await updateUserSettings({
  bio: "Updated bio",
  skills: ["React", "TypeScript"]
});

// Verify phone number
await verifyPhone();

// Verify identity
await verifyIdentity("DOCUMENT");

// Get public profile of another user
const publicProfile = await getPublicProfile(userId);
```

### 4. **Navigation Integration**

Added "Settings & Profile" link to sidebar under new "Account" section:
- Icon: Settings (gear icon)
- Available for all roles (ADMIN, EMPLOYER, FREELANCER)
- Routes to `/dashboard/settings`

## Data Model

```typescript
interface UserProfile {
  // Basic
  bio?: string;
  profilePictureUrl?: string;
  location?: string;
  timezone?: string;
  phoneNumber?: string;
  language?: string;

  // Professional
  skills?: string[];
  certifications?: string[];
  expertise?: string;
  yearsOfExperience?: number;

  // Portfolio
  portfolioUrls?: string[];
  completedProjects?: number;
  averageRating?: number;
  totalReviews?: number;

  // Freelancer
  hourlyRate?: string;
  availability?: string;
  preferredCategories?: string[];
  openToOpportunities?: boolean;

  // Payment
  paymentMethod?: string;
  taxId?: string;

  // Preferences
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  hideProfile?: boolean;
  showEarnings?: boolean;
  preferredLanguage?: string;

  // Verification
  phoneVerified?: boolean;
  emailVerified?: boolean;
  identityVerified?: boolean;
  identityVerificationMethod?: string;
  identityVerifiedAt?: number;

  // Stats
  profileViewsCount?: number;
  proposalsSentCount?: number;
  contractsCompletedCount?: number;
  totalEarnings?: number;
  successRate?: number;
}
```

## Usage Example

### Save Basic Info
```typescript
const handleSave = async () => {
  await updateUserSettings({
    bio: "Experienced React developer",
    location: "New York, USA",
    timezone: "EST"
  });
};
```

### Add Skills
```typescript
const skills = ["React", "TypeScript", "Node.js"];
await updateUserSettings({ skills });
```

### Set Payment Method
```typescript
await updateUserSettings({
  paymentMethod: "STRIPE",
  taxId: "12-3456789"
});
```

## Database Schema

The `users` collection in MongoDB now includes:

```json
{
  "_id": "user_id",
  "email": "user@example.com",
  "fullName": "John Doe",
  "roles": ["FREELANCER"],
  "profile": {
    "bio": "...",
    "skills": ["..."],
    "hourlyRate": "50-75",
    "availability": "FULL_TIME",
    "phoneVerified": true,
    "identityVerified": false,
    ...
  }
}
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only view/edit their own settings (except public profiles)
3. **Sensitive Data**: Bank details and payment info encrypted in production
4. **Verification**: Email/phone/identity verification can be implemented with external services

## Future Enhancements

1. **Phone/Email Verification**: Integrate with Twilio for SMS OTP
2. **Identity Verification**: Integrate with Stripe Identity or IDology
3. **Profile Picture Upload**: Cloudinary integration
4. **Portfolio Management**: File upload and management interface
5. **Earning History**: Display detailed earning statistics
6. **Background Checks**: Integration for background verification
7. **Badges & Certifications**: Display verified badges
8. **Public Profile Page**: `/profile/[userId]` page showing public profile
9. **Profile Completion Score**: Calculate and display profile completion percentage
10. **Profile Search**: Search users by skills, location, availability

## Files Modified/Created

### Backend
- ✅ `/backend-spring/src/main/java/com/sabahub/domain/UserProfile.java` (NEW)
- ✅ `/backend-spring/src/main/java/com/sabahub/web/UserSettingsController.java` (NEW)
- ✅ `/backend-spring/src/main/java/com/sabahub/domain/User.java` (MODIFIED - added profile field)

### Frontend
- ✅ `/frontend/src/app/dashboard/settings/page.tsx` (NEW)
- ✅ `/frontend/src/lib/api.ts` (MODIFIED - added settings functions)
- ✅ `/frontend/src/components/Sidebar.tsx` (MODIFIED - added settings link)

## API Examples

### Get Settings
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:8080/api/user/settings
```

### Update Settings
```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"bio": "Updated", "skills": ["React"]}' \
  http://localhost:8080/api/user/settings
```

### Get Public Profile
```bash
curl http://localhost:8080/api/user/settings/public/{userId}
```

## Notes

- All updates use partial/PATCH semantics (only provided fields are updated)
- Settings are embedded in the User document for simplicity (no separate collection)
- Frontend automatically handles loading/saving states
- Responsive design works on mobile, tablet, and desktop
- Real-time validation and user feedback
- Tab-based interface for organization
