# OTP Verification - Quick Reference

## 📋 What Was Implemented

✅ Enterprise-level OTP verification system  
✅ AWS SES for Email (sends beautiful HTML emails)  
✅ Twilio for SMS (industry-standard SMS delivery)  
✅ MongoDB storage with automatic cleanup  
✅ Attempt limiting & blocking  
✅ Front-end React component  

---

## 🔧 Configuration Checklist

### Backend

- [ ] Add AWS credentials to `.env`:
  ```
  AWS_ACCESS_KEY_ID=xxx
  AWS_SECRET_ACCESS_KEY=xxx
  AWS_SES_FROM_EMAIL=noreply@sabahub.com
  ```

- [ ] Add Twilio credentials to `.env`:
  ```
  TWILIO_ACCOUNT_SID=xxx
  TWILIO_AUTH_TOKEN=xxx
  TWILIO_PHONE_NUMBER=+1234567890
  ```

- [ ] Build backend:
  ```bash
  cd backend-spring
  mvn clean install
  ```

### Frontend

- [ ] Ensure API endpoints are correct
- [ ] Install dependencies:
  ```bash
  npm install
  ```

- [ ] Use the component:
  ```tsx
  import OTPRegistration from '@/components/OTPRegistration';
  
  export default function RegisterPage() {
    return <OTPRegistration />;
  }
  ```

---

## 🚀 Key Files

| File | Purpose |
|------|---------|
| `domain/OTP.java` | OTP data model with validation logic |
| `repository/OTPRepository.java` | MongoDB queries |
| `service/OTPService.java` | OTP generation & verification |
| `service/EmailService.java` | AWS SES email sending |
| `service/SMSService.java` | Twilio SMS sending |
| `web/OTPController.java` | REST endpoints |
| `dto/*.java` | Request/Response DTOs |
| `components/OTPRegistration.tsx` | Frontend component |

---

## 📡 REST Endpoints

```
POST   /api/auth/otp/request-registration    → Send OTP to email & SMS
POST   /api/auth/otp/verify-email            → Verify email OTP
POST   /api/auth/otp/verify-sms              → Verify SMS OTP
POST   /api/auth/otp/resend                  → Resend both OTPs
GET    /api/auth/otp/status/{identifier}     → Check OTP status
```

---

## 🔐 Security Features

- 6-digit OTP codes
- 10-minute expiration
- 5 max failed attempts
- Auto-blocking after max attempts
- Scheduled cleanup of expired OTPs
- Rate limiting ready

---

## 🧪 Quick Test

1. **Start backend:**
   ```bash
   cd backend-spring
   mvn spring-boot:run
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to registration page** (typically `/register`)

4. **Enter credentials** - OTP will be sent to your email & phone

5. **Check inbox** - Copy OTP from email and SMS

6. **Enter both codes** - System verifies and completes registration

---

## 📞 AWS SES Setup (5 minutes)

1. Go to https://aws.amazon.com/ses/
2. Create an account or login
3. Go to SES Console → Email Addresses
4. Click "Verify Email Address"
5. Verify the email: `noreply@sabahub.com` (or your domain)
6. Create IAM user with SES permissions
7. Copy Access Key ID & Secret Access Key to `.env`

**Cost:** ~$0.10 per 1,000 emails

---

## 📱 Twilio Setup (5 minutes)

1. Go to https://www.twilio.com/console
2. Sign up or login
3. Get **Account SID** and **Auth Token**
4. Purchase a phone number (or use trial)
5. Copy credentials to `.env`

**Cost:** ~$1/month for phone number + $0.0075 per SMS

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Email not sending | Check AWS SES verification & credentials |
| SMS not received | Verify phone format (+country_code_number) |
| OTP expired | Check system time, default is 10 minutes |
| Too many attempts | User needs to resend OTP after 5 failures |
| Service won't start | Ensure MongoDB is running |

---

## 📊 Database Collections

**Collection: `otps`**
```json
{
  "_id": "ObjectId",
  "identifier": "user@example.com",
  "otpCode": "123456",
  "type": "BOTH",
  "purpose": "REGISTRATION",
  "status": "PENDING",
  "createdAt": "2025-12-30T10:00:00",
  "expiresAt": "2025-12-30T10:10:00",
  "attemptCount": 0,
  "maxAttempts": 5
}
```

---

## 📈 Next Steps

1. **Testing** - Test the full flow with real email/phone
2. **Integration** - Integrate with your user registration endpoint
3. **Customization** - Modify email templates and OTP expiration
4. **Monitoring** - Set up alerts for failed deliveries
5. **Scaling** - Consider Redis for high-volume scenarios

---

## 🔗 Useful Links

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Twilio SMS Guide](https://www.twilio.com/docs/sms)
- [OTP Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Need Help?** Check `OTP_IMPLEMENTATION_GUIDE.md` for detailed documentation.
