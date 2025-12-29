# User Settings Quick Start Guide

## 🎯 Overview
Advanced user settings management system for SabaHub - enabling users to manage their professional profiles like on Upwork/Fiverr.

## 📍 Access Points

### For Users
1. **Sidebar Navigation**
   - Click "Settings & Profile" under "Account" section
   - Direct link: `/dashboard/settings`

2. **Navbar User Menu**
   - Click user avatar
   - Select "Settings"
   - Redirects to settings page

## 🎨 Available Settings Sections

### 1️⃣ Basic Information
- Bio (professional description)
- Location (city, country)
- Timezone
- Language(s)
- Phone number

### 2️⃣ Professional Profile
- Years of experience
- Expertise level
- Hourly rate
- Availability status
- Skills management (add/remove)
- Open to opportunities toggle

### 3️⃣ Payment & Billing
- Payment method selection
- Tax ID management
- Bank details (encrypted)

### 4️⃣ Verification
- Email verification status
- Phone verification status
- Identity verification status
- One-click verification buttons

### 5️⃣ Notification Preferences
- Email notifications
- SMS notifications
- Profile privacy (hide/show)
- Earnings visibility
- Language preference

## 💾 Saving Changes

All changes are saved individually:
1. Fill in form fields
2. Click "Save Changes" button
3. See success/error message
4. Settings persist across sessions

## 🔒 Security & Privacy

- **Authentication**: Only logged-in users can access settings
- **Authorization**: Users can only edit their own settings
- **Public Profile**: Controlled visibility via privacy toggle
- **Encrypted Data**: Payment details encrypted in database
- **Verification**: Phone/email/identity verification with secure methods

## 📱 Responsive Design

Settings work perfectly on:
- Desktop (full width)
- Tablet (adjusted layout)
- Mobile (stacked layout)

## 🚀 Key Features

✅ **Tab-based Organization** - Grouped related settings
✅ **Real-time Feedback** - Success/error messages
✅ **Partial Updates** - Save only what you change
✅ **Skill Management** - Add/remove skills dynamically
✅ **Verification Status** - Clear visibility of verification state
✅ **Privacy Controls** - Hide profile or earnings
✅ **Multi-language Support** - International users

## 🔗 Related APIs

| Feature | Endpoint |
|---------|----------|
| Get Settings | `GET /api/user/settings` |
| Update Settings | `PATCH /api/user/settings` |
| Verify Phone | `POST /api/user/settings/verify-phone` |
| Verify Identity | `POST /api/user/settings/verify-identity` |
| Public Profile | `GET /api/user/settings/public/{userId}` |

## 💡 Tips for Users

1. **Complete Your Profile** - Higher completion = more job opportunities
2. **Set Hourly Rate** - Clients want to see your rates
3. **Add Skills** - Help clients find you faster
4. **Enable Notifications** - Stay updated on opportunities
5. **Verify Identity** - Increases trust with clients
6. **Use Professional Bio** - First impression matters

## ⚙️ Technical Stack

### Backend
- Spring Boot REST Controller
- MongoDB embedded document model
- JWT authentication
- Role-based access control (RBAC)

### Frontend
- Next.js App Router
- React hooks (useState, useEffect)
- Tailwind CSS styling
- Lucide React icons
- Axios for API calls

## 📊 Data Persistence

All settings are saved in the `users` collection under the `profile` field:

```json
{
  "_id": "user_123",
  "email": "user@example.com",
  "profile": {
    "bio": "Experienced developer...",
    "skills": ["React", "Node.js"],
    "hourlyRate": "75",
    ...
  }
}
```

## 🎓 Example Workflows

### Scenario 1: New Freelancer Setup
1. Access Settings
2. Fill Basic Info
3. Add Professional Details
4. Set Skills & Hourly Rate
5. Enable Notifications
6. Save and complete profile

### Scenario 2: Updating Payment Method
1. Go to Settings
2. Switch to "Payment & Billing" tab
3. Select new payment method
4. Add tax information
5. Save changes

### Scenario 3: Verifying Identity
1. Go to Verification tab
2. Click "Verify" button
3. Follow verification process
4. Status updates to "Verified"
5. Increased trust badge shown

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Settings won't save | Check internet connection, refresh page |
| Verification fails | Ensure valid documents, try again later |
| Changes not appearing | Clear browser cache, re-login |
| Can't find Settings | Check Sidebar under "Account" section |

## 📈 Best Practices

- ✅ Keep profile updated regularly
- ✅ Use professional photos/avatars
- ✅ Write clear, concise bio
- ✅ Verify all possible identity methods
- ✅ Respond to opportunities quickly
- ✅ Maintain high success rate

## 🔄 Future Enhancements

- Portfolio file uploads
- Embedded portfolio links
- Certification uploads
- Background check integration
- Professional badges
- Rating history
- Earnings breakdown
- Activity logs
