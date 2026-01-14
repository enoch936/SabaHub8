# OTP Services Credentials Setup Guide

## 🎯 Quick Summary

The **ERR_CONNECTION_REFUSED** error has been **FIXED**! ✅

The backend is now running and the frontend can successfully connect to it. However, to fully enable OTP functionality, you need to configure email and/or SMS credentials.

---

## ✅ What Was Fixed

1. **Backend Security Configuration**
   - Added `/api/auth/**` to the permitAll list in SecurityConfig
   - OTP endpoints are now publicly accessible (no authentication required for OTP requests)

2. **Better Error Handling**
   - Services now check for credentials before attempting to send emails/SMS
   - Clear error messages indicate which services need configuration
   - Startup health check shows OTP services status

3. **Graceful Degradation**
   - System will work with only email OR only SMS configured
   - Frontend receives clear error messages instead of generic failures

---

## 📧 Email Service Setup (Gmail - FREE)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security** > **2-Step Verification**
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Visit: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** - enter "SabaHub OTP"
4. Click **Generate**
5. Copy the 16-character password (remove spaces)

### Step 3: Set Environment Variables
```bash
export SMTP_USERNAME="your-email@gmail.com"
export SMTP_PASSWORD="your-16-char-app-password"
```

### Step 4: Restart Backend
```bash
cd /workspaces/SabaHub8/backend-spring
./mvnw spring-boot:run
```

---

## 📱 SMS Service Setup (Twilio)

### Step 1: Create Twilio Account
1. Sign up at: https://www.twilio.com/try-twilio
2. Verify your phone number
3. Get $15.50 free credit (good for ~500 SMS messages)

### Step 2: Get Credentials
1. Go to Twilio Console: https://www.twilio.com/console
2. Find your **Account SID** and **Auth Token**
3. Get a Twilio phone number (free with trial account)

### Step 3: Set Environment Variables
```bash
export TWILIO_ACCOUNT_SID="your-account-sid"
export TWILIO_AUTH_TOKEN="your-auth-token"
export TWILIO_PHONE_NUMBER="+1234567890"  # Your Twilio number
```

### Step 4: Restart Backend
```bash
cd /workspaces/SabaHub8/backend-spring
./mvnw spring-boot:run
```

---

## 🚀 Quick Start (Development)

For development/testing, you only need **email** configured (SMS is optional):

```bash
# Set email credentials
export SMTP_USERNAME="your-email@gmail.com"
export SMTP_PASSWORD="your-app-password"

# Restart backend
cd /workspaces/SabaHub8/backend-spring
./mvnw spring-boot:run

# In another terminal, start frontend
cd /workspaces/SabaHub8/frontend
npm run dev
```

---

## 🔍 Verify Configuration

After setting credentials and restarting, you should see:

```
================================================================================
OTP SERVICES CONFIGURATION CHECK
================================================================================
✅ Email Service: CONFIGURED - OTP emails will be sent
⚠️  SMS Service: NOT CONFIGURED
   → To enable SMS OTP, set these environment variables:
   → TWILIO_ACCOUNT_SID=your-account-sid
   → TWILIO_AUTH_TOKEN=your-auth-token
--------------------------------------------------------------------------------
⚠️  OTP System Status: PARTIALLY OPERATIONAL
   → Only Email service is available
================================================================================
```

---

## 🧪 Test the OTP Endpoint

```bash
# Test registration OTP request
curl -X POST http://localhost:8080/api/auth/otp/request-registration \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "phoneNumber": "+1234567890",
    "firstName": "Test"
  }'

# Expected response (with email configured):
# {
#   "message": "OTP sent to email",
#   "success": true,
#   "data": null
# }
```

---

## 💡 Important Notes

1. **Gmail App Passwords**: Regular Gmail passwords won't work - you MUST use an app password
2. **Twilio Trial**: Free trial only allows sending SMS to verified phone numbers
3. **Production**: For production, consider using:
   - Professional SMTP service (SendGrid, AWS SES, Mailgun)
   - Paid Twilio account for unlimited SMS

---

## 🐛 Troubleshooting

### "Authentication failed" error
- Make sure you're using an **app password**, not your regular Gmail password
- Verify 2FA is enabled on your Google account
- Check for typos in SMTP_USERNAME and SMTP_PASSWORD

### "OTP services not configured" error
- Environment variables not set - run the export commands
- Backend needs restart after setting environment variables
- Check backend logs for the startup health check output

### Connection still refused
- Make sure backend is running: `curl http://localhost:8080/actuator/health`
- Check if port 8080 is available: `lsof -i :8080`
- Review backend logs: `tail -f /tmp/backend.log`

---

## 📚 Related Files

- Backend Security: [SecurityConfig.java](backend-spring/src/main/java/com/sabahub/config/SecurityConfig.java)
- Email Service: [EmailService.java](backend-spring/src/main/java/com/sabahub/service/EmailService.java)
- SMS Service: [SMSService.java](backend-spring/src/main/java/com/sabahub/service/SMSService.java)
- OTP Controller: [OTPController.java](backend-spring/src/main/java/com/sabahub/web/OTPController.java)
- Health Check: [OTPServicesHealthCheck.java](backend-spring/src/main/java/com/sabahub/config/OTPServicesHealthCheck.java)

---

## ✨ Summary

**The main issue (ERR_CONNECTION_REFUSED) is FIXED!** The frontend can now connect to the backend successfully. To fully enable OTP features, simply configure email credentials (easiest with Gmail) and restart the backend. SMS is optional for basic testing.
