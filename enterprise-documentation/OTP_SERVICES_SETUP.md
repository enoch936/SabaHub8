# OTP Verification Services Setup Guide

This guide explains how to configure **AWS SES** (Email) and **Twilio** (SMS) for OTP verification in SabaHub.

---

## 🚀 Quick Overview

| Service | Purpose | Cost | Setup Time |
|---------|---------|------|-----------|
| **AWS SES** | Send OTP verification emails | Free tier: 62,000 emails/month | 15 mins |
| **Twilio** | Send OTP verification SMS | Free trial: $15 credit | 10 mins |

---

## 📧 AWS SES Configuration (Email OTP)

### Step 1: Create AWS Account
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Sign up or log in
3. Navigate to **Simple Email Service (SES)**

### Step 2: Verify Your Email Address
1. In SES Console → **Verified Identities**
2. Click **Create Identity** → Select **Email address**
3. Enter your email (e.g., `noreply@sabahub.com`)
4. Click verification link in your inbox
5. Status should now show as **Verified**

### Step 3: Create IAM User with SES Permissions
1. Go to **IAM Console** → **Users** → **Create user**
2. Username: `sabahub-ses-user`
3. Enable **Programmatic access** (creates Access Key ID & Secret)
4. Click **Next: Permissions**
5. Click **Attach existing policies directly**
6. Search and attach: `AmazonSESFullAccess`
7. Review and create
8. **Copy the Access Key ID and Secret Access Key**

### Step 4: Update `.env` File
```bash
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@sabahub.com
AWS_ACCESS_KEY_ID=AKIA1234567890EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG+Zx1234567890ABCDEF
```

### Step 5: Request SES Production Access
⚠️ **By default, SES is in sandbox mode** (limited sending)

To send to any email:
1. Go to **SES Console** → **Account dashboard**
2. Look for **Send quota**
3. Click **Request production access**
4. In Application description, write: "OTP verification for SabaHub platform"
5. Select **Transactional emails**
6. Submit request
7. AWS typically approves within 24 hours

---

## 📱 Twilio Configuration (SMS OTP)

### Step 1: Create Twilio Account
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Sign up with your phone number
3. Verify your phone with OTP
4. Get **$15 free trial credit**

### Step 2: Get Your Credentials
1. In Twilio Console → **Account Info**
2. Copy **Account SID** and **Auth Token**
3. These are like your username and password (keep them secret!)

```
Account SID:   AC1234567890abcdef1234567890abcdef
Auth Token:    your_auth_token_here
```

### Step 3: Get a Phone Number
1. Go to **Phone Numbers** → **Manage Numbers**
2. Click **Get your first Twilio phone number**
3. Choose a number (format: `+1234567890`)
4. Click **Choose this number**
5. Copy the phone number

### Step 4: Update `.env` File
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 5: Add Recipients (Sandbox Mode)
⚠️ **In trial mode, you must add recipient numbers**

1. Go to **Phone Numbers** → **Verified Caller IDs**
2. Click **Add a Verified Caller ID**
3. Enter your phone number
4. Verify with code sent to your phone
5. Repeat for any test numbers

To upgrade to production:
- Purchase SMS credits ($0.0075 per SMS in US)
- Remove restrictions on recipient numbers

---

## 🔌 API Endpoints

### Request OTP (Email + SMS)
```bash
POST /api/auth/otp/request-registration
Content-Type: application/json

{
  "email": "user@example.com",
  "phoneNumber": "+1234567890",
  "firstName": "John"
}

Response:
{
  "message": "OTP sent to email and SMS successfully",
  "success": true,
  "data": null
}
```

### Verify Email OTP
```bash
POST /api/auth/otp/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

### Verify SMS OTP
```bash
POST /api/auth/otp/verify-sms
Content-Type: application/json

{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

### Resend OTP
```bash
POST /api/auth/otp/resend
Content-Type: application/json

{
  "email": "user@example.com",
  "phoneNumber": "+1234567890",
  "firstName": "John"
}
```

### Check OTP Status
```bash
GET /api/auth/otp/status/{identifier}

Response:
{
  "message": "OTP status retrieved",
  "success": true,
  "data": "PENDING"  // or VERIFIED, EXPIRED, BLOCKED
}
```

---

## 🧪 Testing with cURL

### 1. Request OTP
```bash
curl -X POST http://localhost:8080/api/auth/otp/request-registration \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "firstName": "Test User"
  }'
```

### 2. Verify Email OTP
```bash
curl -X POST http://localhost:8080/api/auth/otp/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otpCode": "123456"
  }'
```

### 3. Verify SMS OTP
```bash
curl -X POST http://localhost:8080/api/auth/otp/verify-sms \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otpCode": "123456"
  }'
```

---

## 🛠️ Troubleshooting

### Email OTP Not Arriving
| Issue | Solution |
|-------|----------|
| Still in SES sandbox | Request production access |
| Email not verified | Verify sender email in SES |
| Invalid credentials | Check AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY |

### SMS OTP Not Arriving
| Issue | Solution |
|-------|----------|
| Phone not verified (trial mode) | Add phone to Verified Caller IDs |
| Invalid phone format | Use E.164 format: `+1234567890` |
| Out of trial credits | Add payment method and purchase credits |
| Wrong Twilio credentials | Verify TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN |

### OTP Expired
- OTP expires after **10 minutes** by default
- User can click **Resend OTP** to get a new one
- After **5 failed attempts**, OTP is blocked

### Check Logs
```bash
# Backend logs
cd /workspaces/SabaHub8/backend-spring
tail -f logs/application.log

# Check for specific errors
grep "OTP" logs/application.log
grep "AWS" logs/application.log
grep "Twilio" logs/application.log
```

---

## 📋 Environment Variables Checklist

✅ **Email (AWS SES)**
- [ ] `AWS_REGION` - Set to `us-east-1` or your region
- [ ] `AWS_SES_FROM_EMAIL` - Verified sender email
- [ ] `AWS_ACCESS_KEY_ID` - From IAM user
- [ ] `AWS_SECRET_ACCESS_KEY` - From IAM user

✅ **SMS (Twilio)**
- [ ] `TWILIO_ACCOUNT_SID` - From Twilio console
- [ ] `TWILIO_AUTH_TOKEN` - From Twilio console
- [ ] `TWILIO_PHONE_NUMBER` - Verified Twilio number

✅ **OTP Settings**
- [ ] `OTP_EXPIRATION_MINUTES=10`
- [ ] `OTP_MAX_ATTEMPTS=5`

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] AWS SES: Production access approved
- [ ] Twilio: Production credentials (remove trial mode)
- [ ] Credentials stored in secure secrets manager (not in `.env`)
- [ ] CORS origins updated in `application.properties`
- [ ] Rate limiting configured in `application.properties`
- [ ] Email templates reviewed and branded
- [ ] SMS message length optimized (160 chars)
- [ ] Monitoring/alerts configured for failed OTPs
- [ ] Database cleanup job running (expired OTP cleanup)

---

## 📚 Additional Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Spring Boot Mail Configuration](https://spring.io/guides/gs/sending-email/)

---

## ❓ Support

For issues:
1. Check logs: `docker logs sabahub-backend`
2. Verify credentials in `.env`
3. Check service status dashboards:
   - AWS: https://status.aws.amazon.com
   - Twilio: https://status.twilio.com

