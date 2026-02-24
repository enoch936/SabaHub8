# 🚀 SabaHub OTP Verification - Setup Checklist

**Project:** SabaHub - Enterprise Freelance Platform  
**Feature:** Email + SMS OTP Verification  
**Status:** ✅ Implementation Complete  
**Date Started:** December 30, 2025

---

## 📋 Prerequisites

- [ ] AWS Account created
- [ ] Twilio Account created
- [ ] Backend Spring Boot project available
- [ ] MongoDB connection working
- [ ] Docker & Docker Compose installed
- [ ] Maven installed (for building backend)

---

## 🔧 AWS SES Setup (Email OTP)

### Create AWS Account & IAM User
- [ ] Create AWS account at https://aws.amazon.com
- [ ] Go to IAM → Users → Create user
- [ ] Name: `sabahub-ses-user`
- [ ] Enable programmatic access
- [ ] Attach policy: `AmazonSESFullAccess`
- [ ] Copy **Access Key ID**
- [ ] Copy **Secret Access Key**

### Verify Email Address
- [ ] Go to SES Console → Verified Identities
- [ ] Click "Create Identity" → Email address
- [ ] Enter email (e.g., `noreply@sabahub.com`)
- [ ] Verify via link in email
- [ ] Status shows "Verified"

### Request Production Access
- [ ] Go to SES Console → Account dashboard
- [ ] Look for "Send quota"
- [ ] Click "Request production access"
- [ ] Application type: **Transactional emails**
- [ ] Submit request
- [ ] Wait for AWS approval (24 hrs typical)

---

## 📱 Twilio Setup (SMS OTP)

### Create Twilio Account
- [ ] Sign up at https://www.twilio.com/console
- [ ] Verify phone with OTP
- [ ] Get **$15 free trial credit**

### Get Credentials
- [ ] Copy **Account SID**
- [ ] Copy **Auth Token** (keep secret!)
- [ ] Save these credentials

### Get Phone Number
- [ ] Go to Phone Numbers → Get started
- [ ] Choose a number (format: `+1234567890`)
- [ ] Confirm selection
- [ ] Copy phone number

### Verify Test Recipients (Trial Mode)
- [ ] Go to Verified Caller IDs
- [ ] Add your phone number
- [ ] Verify with code sent to phone
- [ ] Repeat for test numbers

---

## 🔑 Update Configuration Files

### Update .env File
Located: `/workspaces/SabaHub8/backend-spring/.env`

```bash
# AWS SES
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@sabahub.com
AWS_ACCESS_KEY_ID=AKIA1234567890EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG+Zx1234567890ABCDEF

# Twilio
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Checklist:**
- [ ] AWS_ACCESS_KEY_ID filled
- [ ] AWS_SECRET_ACCESS_KEY filled
- [ ] TWILIO_ACCOUNT_SID filled
- [ ] TWILIO_AUTH_TOKEN filled
- [ ] TWILIO_PHONE_NUMBER filled
- [ ] All quotes removed (raw values only)
- [ ] File saved

---

## ✅ Validate Configuration

### Run Configuration Checker
```bash
cd /workspaces/SabaHub8
./check-otp-config.sh
```

**Expected Output:**
- ✅ AWS_REGION - us-east-1
- ✅ AWS_SES_FROM_EMAIL - noreply@sabahub.com
- ✅ AWS_ACCESS_KEY_ID - AKIA***EXAMPLE
- ✅ AWS_SECRET_ACCESS_KEY - wJal***ABCDEF
- ✅ TWILIO_ACCOUNT_SID - AC12***abcdef
- ✅ TWILIO_AUTH_TOKEN - your***here
- ✅ TWILIO_PHONE_NUMBER - +1234567890

**Checklist:**
- [ ] All services show ✅ (green checkmarks)
- [ ] No warnings about missing configuration
- [ ] Script says "All services configured!"

---

## 🏗️ Build & Deploy

### Build Backend
```bash
cd /workspaces/SabaHub8/backend-spring
mvn clean package
```

**Checklist:**
- [ ] Build completes without errors
- [ ] `target/backend-spring-0.0.1-SNAPSHOT.jar` created
- [ ] No compilation errors

### Start Services
```bash
cd /workspaces/SabaHub8/backend-spring
docker-compose up
```

**Checklist:**
- [ ] Backend starts on port 8080
- [ ] MongoDB connection successful
- [ ] Application logs show "Started Application"
- [ ] Health endpoint responds: `curl http://localhost:8080/actuator/health`

---

## 🧪 Test API Endpoints

### 1. Request OTP
```bash
curl -X POST http://localhost:8080/api/auth/otp/request-registration \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "firstName": "Test"
  }'
```

**Expected Response:**
```json
{
  "message": "OTP sent to email and SMS successfully",
  "success": true,
  "data": null
}
```

**Checklist:**
- [ ] Response code 200 OK
- [ ] Email received (check inbox)
- [ ] SMS received (check phone)
- [ ] OTP codes visible in messages

### 2. Verify Email OTP
```bash
curl -X POST http://localhost:8080/api/auth/otp/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otpCode": "123456"
  }'
```

**Expected Response:**
```json
{
  "message": "Email verified successfully",
  "success": true,
  "data": null
}
```

**Checklist:**
- [ ] Response code 200 OK
- [ ] Message says "verified successfully"
- [ ] success = true

### 3. Verify SMS OTP
Same as email verification but with SMS OTP code

**Checklist:**
- [ ] Response code 200 OK
- [ ] Both email and SMS verified

### 4. Resend OTP
```bash
curl -X POST http://localhost:8080/api/auth/otp/resend \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "firstName": "Test"
  }'
```

**Checklist:**
- [ ] Response code 200 OK
- [ ] New OTP codes received
- [ ] Old codes are invalidated

### 5. Check Status
```bash
curl http://localhost:8080/api/auth/otp/status/test@example.com
```

**Expected Statuses:**
- `PENDING` - Waiting for verification
- `VERIFIED` - Successfully verified
- `EXPIRED` - OTP expired after 10 mins
- `BLOCKED` - Max attempts (5) reached

**Checklist:**
- [ ] Status endpoint returns valid status

---

## 🔍 Verify Features

### Basic Functionality
- [ ] OTP is 6 digits
- [ ] OTP expires after 10 minutes
- [ ] Can resend OTP before expiry
- [ ] Cannot resend after max attempts
- [ ] Both email and SMS OTPs required for registration

### Security
- [ ] Failed verification attempts tracked
- [ ] OTP blocked after 5 failed attempts
- [ ] Expired OTPs cannot be verified
- [ ] No sensitive data in logs

### Email
- [ ] Professional HTML template
- [ ] From address is verified
- [ ] Subject line clear and professional
- [ ] OTP code highlighted
- [ ] Expiry warning included

### SMS
- [ ] Message is concise (< 160 chars)
- [ ] OTP code clearly visible
- [ ] Expiry time mentioned
- [ ] Security warning included

---

## 📊 Testing with Postman

### Import Collection
1. Open Postman
2. Click "Import" → "File"
3. Select `SabaHub_OTP_API.postman_collection.json`
4. Collection imported successfully

### Test All Endpoints
- [ ] Request Registration OTP - Test
- [ ] Verify Email OTP - Test
- [ ] Verify SMS OTP - Test
- [ ] Resend OTP - Test
- [ ] Get OTP Status - Test
- [ ] Health Check - Test

**All should return 200 OK**

---

## 🎯 Integration Checklist

### With User Registration
- [ ] Update User registration endpoint to require OTP verification
- [ ] Add OTP verification to registration DTO
- [ ] Validate both email and SMS OTPs during registration
- [ ] Create user only after OTP verification

### With Login
- [ ] Add optional OTP verification on login
- [ ] Generate OTP for users on login request
- [ ] Require OTP before issuing JWT token
- [ ] Store verified flag in session

### With Password Reset
- [ ] Generate OTP when password reset requested
- [ ] Send OTP via email and SMS
- [ ] Require OTP verification before password change
- [ ] Invalidate old tokens after password change

---

## 🚨 Troubleshooting

### Email Not Arriving
- [ ] Check AWS SES sandbox status (not in production)
- [ ] Verify sender email is verified in SES
- [ ] Check spam/junk folder
- [ ] Verify AWS credentials in .env
- [ ] Check backend logs for errors

### SMS Not Arriving
- [ ] Verify phone number in trial mode recipient list
- [ ] Check phone number format is E.164 (+1234567890)
- [ ] Check Twilio trial credits remaining
- [ ] Verify Twilio credentials in .env
- [ ] Check backend logs for errors

### OTP Endpoint Returns Error
- [ ] Run: `./check-otp-config.sh`
- [ ] Verify backend is running
- [ ] Check MongoDB connection
- [ ] Review backend logs: `docker logs sabahub-backend`

### Configuration Checker Shows Warnings
- [ ] AWS_ACCESS_KEY_ID must not contain "YOUR_"
- [ ] AWS_SECRET_ACCESS_KEY must not contain "YOUR_"
- [ ] TWILIO_ACCOUNT_SID must not contain "YOUR_"
- [ ] TWILIO_AUTH_TOKEN must not contain "YOUR_"
- [ ] TWILIO_PHONE_NUMBER must be in +1234567890 format

---

## 📈 Production Readiness

### Before Going Live
- [ ] AWS SES production access approved
- [ ] Twilio upgraded to production plan
- [ ] All 5 failed attempts handled gracefully
- [ ] OTP expiry (10 min) is reasonable
- [ ] Email templates branded with company logo
- [ ] SMS templates are concise and professional
- [ ] Monitoring/alerts configured
- [ ] Error logging enabled
- [ ] Database backups configured
- [ ] Rate limiting enabled on endpoints

### Performance
- [ ] Database queries optimized
- [ ] OTP cleanup job running
- [ ] No N+1 queries in OTPService
- [ ] Response times < 200ms
- [ ] Handles 1000+ concurrent OTP requests

### Security
- [ ] No hardcoded secrets in code
- [ ] All credentials in environment variables
- [ ] HTTPS enforced in production
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting per IP address
- [ ] Audit logging for OTP verification

---

## 📚 Documentation

- [ ] Read: `OTP_SERVICES_SETUP.md` - Full setup guide
- [ ] Read: `OTP_IMPLEMENTATION_SUMMARY.md` - Architecture overview
- [ ] Check: `check-otp-config.sh` - Configuration validator
- [ ] Import: `SabaHub_OTP_API.postman_collection.json` - API testing

---

## ✨ Final Steps

- [ ] All checkboxes above completed
- [ ] Backend running successfully
- [ ] All 5 API endpoints working
- [ ] Email and SMS OTPs received
- [ ] Verification successful
- [ ] Documentation reviewed
- [ ] Team trained on OTP flow
- [ ] Deployed to staging environment
- [ ] Deployed to production environment
- [ ] Monitoring active in production

---

## 🎉 Success Criteria

✅ **Implementation is successful when:**
1. Users can request OTP via `/api/auth/otp/request-registration`
2. OTP email is received within 30 seconds
3. OTP SMS is received within 30 seconds
4. Users can verify OTP via `/api/auth/otp/verify-email` and `/api/auth/otp/verify-sms`
5. Failed attempts are tracked and OTP is blocked after 5 attempts
6. OTP expires after 10 minutes
7. Users can resend OTP before expiry
8. Frontend successfully integrates with OTP APIs
9. All tests pass in production environment
10. Monitoring alerts configured for failures

---

**Status: READY FOR IMPLEMENTATION** 🚀

All files created, configuration documented, and ready for production deployment!

---

**Questions?** Check `OTP_SERVICES_SETUP.md` or contact DevOps team.
