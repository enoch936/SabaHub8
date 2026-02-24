# User Settings - Quick Reference for Developers

## 🚀 Quick Start

### Files to Know

**Backend:**
```
UserProfile.java              ← Domain model (50+ fields)
UserSettingsController.java   ← REST endpoints
User.java                     ← Updated with profile field
```

**Frontend:**
```
/dashboard/settings/page.tsx  ← Settings UI component
/lib/api.ts                   ← API client functions
/components/Sidebar.tsx       ← Navigation updated
```

## 📡 API Endpoints at a Glance

| Method | Endpoint | Auth | What It Does |
|--------|----------|------|--------------|
| GET | `/api/user/settings` | ✓ | Get user's settings |
| PATCH | `/api/user/settings` | ✓ | Update settings (partial) |
| POST | `/api/user/settings/verify-phone` | ✓ | Send SMS OTP |
| POST | `/api/user/settings/verify-identity` | ✓ | Start identity verification |
| GET | `/api/user/settings/public/{id}` | ✗ | Get public profile |

## 💻 Frontend API Usage

```typescript
import { getUserSettings, updateUserSettings } from '@/lib/api';

// Get settings
const profile = await getUserSettings();

// Update settings
const updated = await updateUserSettings({
  bio: "New bio",
  skills: ["React", "Node.js"]
});

// Verify phone
await verifyPhone();

// Verify identity
await verifyIdentity("DOCUMENT");

// Get public profile
const publicProfile = await getPublicProfile(userId);
```

## 🧪 Testing the API with cURL

```bash
# Get settings (replace TOKEN with actual JWT)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/user/settings

# Update settings
curl -X PATCH \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Updated","skills":["React"]}' \
  http://localhost:8080/api/user/settings

# Get public profile
curl http://localhost:8080/api/user/settings/public/user123
```

## 📋 UserProfile Fields Reference

### Basic Info (6 fields)
- `bio` - Professional description
- `profilePictureUrl` - Avatar URL
- `location` - City, Country
- `timezone` - e.g., "EST", "UTC+3"
- `phoneNumber` - Contact phone
- `language` - Primary language

### Professional (4 fields)
- `skills[]` - Array of skill names
- `certifications[]` - Professional certs
- `expertise` - Level (BEGINNER/INTERMEDIATE/EXPERT/MASTER)
- `yearsOfExperience` - Number of years

### Portfolio (4 fields)
- `portfolioUrls[]` - Links to projects
- `completedProjects` - Project count
- `averageRating` - Average review rating
- `totalReviews` - Total review count

### Freelancer (4 fields)
- `hourlyRate` - e.g., "50-100"
- `availability` - FULL_TIME/PART_TIME/OCCASIONAL
- `preferredCategories[]` - Job categories
- `openToOpportunities` - Boolean

### Payment (2 fields)
- `paymentMethod` - STRIPE/PAYPAL/BANK_TRANSFER/CRYPTOCURRENCY
- `taxId` - Tax identification number

### Preferences (4 fields)
- `emailNotifications` - Boolean
- `smsNotifications` - Boolean
- `hideProfile` - Boolean
- `showEarnings` - Boolean
- `preferredLanguage` - Language code

### Verification (4 fields)
- `phoneVerified` - Boolean
- `emailVerified` - Boolean
- `identityVerified` - Boolean
- `identityVerificationMethod` - Verification type
- `identityVerifiedAt` - Timestamp

### Stats (Read-only)
- `profileViewsCount` - Profile views
- `proposalsSentCount` - Proposals sent
- `contractsCompletedCount` - Completed contracts
- `totalEarnings` - Total earned
- `successRate` - Success percentage

## 🔐 Security Checklist

- ✅ All endpoints require JWT token
- ✅ Users can only edit own settings
- ✅ Public profile respects `hideProfile` toggle
- ✅ Sensitive data can be encrypted
- ✅ Authorization checked via `CurrentUserService`
- ✅ CORS enabled for frontend

## 🐛 Common Debug Tasks

### Debug: Settings not saving
1. Check browser network tab for 401/403 errors
2. Verify JWT token is valid
3. Check `currentUserService.requireUser()` is working
4. Look for validation errors in response

### Debug: Settings not loading
1. Verify user ID is correct
2. Check MongoDB connection
3. Look for null profile (create new UserProfile if null)
4. Check for database query errors

### Debug: Frontend showing old data
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+Shift+R)
3. Check React DevTools for state
4. Verify API response in network tab

## 📊 Database Query Examples

### Find user with profile
```javascript
db.users.findOne({ email: "user@example.com" })
```

### Update user profile
```javascript
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { "profile.bio": "New bio" } }
)
```

### Find users by skill
```javascript
db.users.find({ "profile.skills": "React" })
```

### Find freelancers available
```javascript
db.users.find({ 
  "profile.availability": "FULL_TIME",
  "profile.openToOpportunities": true 
})
```

## 🔧 Extension Points

### Adding New Fields

1. **Backend**: Add to `UserProfile.java`
```java
private String newField;
public String getNewField() { return newField; }
public void setNewField(String newField) { this.newField = newField; }
```

2. **Frontend**: Add to form
```tsx
<input
  value={data.newField || ""}
  onChange={(e) => setData({ ...data, newField: e.target.value })}
/>
```

3. **Done!** PATCH endpoint auto-supports it

### Adding New Endpoint

1. **Backend**: Add to `UserSettingsController`
```java
@PostMapping("/custom-action")
public ResponseEntity<?> customAction() {
  User user = currentUserService.requireUser();
  // Your logic
  return ResponseEntity.ok(result);
}
```

2. **Frontend**: Add to `lib/api.ts`
```typescript
export async function customAction() {
  const { data } = await api.post("/user/settings/custom-action");
  return data;
}
```

### Adding New Tab

1. **Frontend**: Create new tab component
```tsx
function NewTab({ profile, onSave, saving }) {
  // Tab content
}
```

2. Add to tab navigation
```tsx
{ id: "newtab", label: "New Tab", icon: NewIcon },
```

3. Add case to render
```tsx
{activeTab === "newtab" && <NewTab {...props} />}
```

## 📈 Performance Tips

- Cache profile in Context/Zustand (TODO)
- Lazy load profile picture (TODO)
- Debounce form changes before save (TODO)
- Implement optimistic UI updates (TODO)
- Use React Query for caching (TODO)

## 🎓 Learning Resources

- Spring Boot REST: https://spring.io/projects/spring-boot
- MongoDB Embedded Documents: https://docs.mongodb.com/manual/core/model-embedded-documents/
- JWT Auth: https://jwt.io/introduction
- Next.js Data Fetching: https://nextjs.org/docs/basic-features/data-fetching

## 📞 Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Check JWT token, verify it's not expired |
| 403 Forbidden | Ensure user has permission to edit settings |
| Empty profile | Create new UserProfile() if null |
| CORS error | Verify backend CORS settings |
| Settings not persist | Check MongoDB connection, look for save errors |
| Slow API response | Add database indexes, check queries |

## ✨ Pro Tips

1. **Test with curl** before writing React code
2. **Check network tab** to see actual API responses
3. **Use MongoDB Compass** to inspect database
4. **Enable Spring Debug logging** for troubleshooting
5. **Use Postman** for complex API testing
6. **Profile the database** to find slow queries
7. **Cache public profiles** to improve performance
8. **Encrypt sensitive fields** in production

## 🎯 Next Features to Build

1. Profile picture upload to Cloudinary
2. Public profile page at `/profile/[userId]`
3. Portfolio item management
4. Skill endorsements
5. Background check integration
6. Badge system for verified users
7. Profile completion scoring
8. Email verification flow

---

**Need help?** Check the implementation docs:
- Technical Details: `USER_SETTINGS_IMPLEMENTATION.md`
- User Guide: `USER_SETTINGS_GUIDE.md`
- Architecture: `SETTINGS_ARCHITECTURE.md`
- Checklist: `USER_SETTINGS_CHECKLIST.md`
