# Enterprise OTP Verification System - Implementation Guide

## Overview

This document provides a comprehensive guide to the enterprise-level OTP (One-Time Password) verification system implemented for SabaHub. The system uses **AWS SES for email** and **Twilio for SMS** verification during user registration.

---

## Architecture

### Components

1. **Backend (Spring Boot)**
   - OTP Model & Repository
   - OTP Service (generation, validation, storage)
   - Email Service (AWS SES)
   - SMS Service (Twilio)
   - REST Controllers & DTOs
   - MongoDB storage

2. **Frontend (Next.js)**
   - Multi-step registration component
   - OTP input fields
   - Error handling & validation

---

## Backend Setup

### 1. Dependencies Added to `pom.xml`

```xml
<!-- Twilio SDK for SMS OTP -->
<dependency>
    <groupId>com.twilio.sdk</groupId>
    <artifactId>twilio</artifactId>
    <version>9.2.0</version>
</dependency>

<!-- AWS SDK for SES Email -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>sesv2</artifactId>
    <version>2.20.0</version>
</dependency>

<!-- Spring Boot Mail Support -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

### 2. Database Models

#### OTP Model (`domain/OTP.java`)
- **Fields:**
  - `id` - MongoDB ObjectId
  - `identifier` - Email or phone number
  - `otpCode` - 6-digit code
  - `type` - EMAIL, SMS, or BOTH
  - `purpose` - REGISTRATION, PASSWORD_RESET, etc.
  - `status` - PENDING, VERIFIED, EXPIRED, BLOCKED
  - `createdAt`, `expiresAt`, `verifiedAt`
  - `attemptCount`, `maxAttempts` - Track failed attempts

- **Methods:**
  - `isExpired()` - Check if OTP is expired
  - `isValid()` - Check if OTP is valid
  - `incrementAttempts()` - Track failed attempts
  - `verify()` - Mark as verified

### 3. Services

#### OTPService (`service/OTPService.java`)
**Key Methods:**
- `generateOTP()` - Generate 6-digit OTP
- `verifyOTP()` - Verify OTP code
- `verifyOTPWithAttempts()` - Verify with attempt tracking
- `resendOTP()` - Generate new OTP, invalidate old one
- `recordFailedAttempt()` - Track failed verification attempts
- `cleanupExpiredOTPs()` - Scheduled task to clean up expired OTPs

#### EmailService (`service/EmailService.java`)
**AWS SES Integration:**
- `sendOTPEmail()` - Send registration OTP
- `sendPasswordResetEmail()` - Send password reset OTP
- HTML email templates with professional styling
- Supports AWS IAM credentials

#### SMSService (`service/SMSService.java`)
**Twilio Integration:**
- `sendOTPSMS()` - Send SMS OTP
- `sendPasswordResetSMS()` - Send password reset SMS
- `isValidPhoneNumber()` - E.164 format validation
- `formatPhoneNumber()` - Convert to E.164 format

### 4. REST Endpoints

#### POST `/api/auth/otp/request-registration`
**Request:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "+1234567890",
  "firstName": "John"
}
```
**Response:**
```json
{
  "message": "OTP sent to email and SMS successfully",
  "success": true,
  "data": null
}
```
**Action:** Generates and sends OTP via both email and SMS

#### POST `/api/auth/otp/verify-email`
**Request:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```
**Response:**
```json
{
  "message": "Email verified successfully",
  "success": true,
  "data": null
}
```
**Action:** Verifies email OTP with attempt tracking

#### POST `/api/auth/otp/verify-sms`
**Request:**
```json
{
  "email": "user@example.com",
  "otpCode": "654321"
}
```
**Response:** Similar to email verification

#### POST `/api/auth/otp/resend`
**Request:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "+1234567890",
  "firstName": "John"
}
```
**Action:** Invalidates old OTP and sends new one

#### GET `/api/auth/otp/status/{identifier}`
**Response:**
```json
{
  "message": "OTP status retrieved",
  "success": true,
  "data": "PENDING"
}
```

---

## Configuration

### Environment Variables (`.env`)

```bash
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_SES_FROM_EMAIL=noreply@sabahub.com

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OTP Settings
OTP_EXPIRATION_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

### Application Properties (`application.properties`)

```properties
aws.region=${AWS_REGION:us-east-1}
aws.ses.from-email=${AWS_SES_FROM_EMAIL:noreply@sabahub.com}

twilio.account-sid=${TWILIO_ACCOUNT_SID:}
twilio.auth-token=${TWILIO_AUTH_TOKEN:}
twilio.phone-number=${TWILIO_PHONE_NUMBER:+1234567890}

otp.expiration-minutes=10
otp.max-attempts=5
```

---

## Frontend Implementation

### OTPRegistration Component

**Location:** `src/components/OTPRegistration.tsx`

**Two-Step Flow:**

1. **Step 1: Registration Form**
   - Collect user information
   - Password validation
   - Request OTP endpoint

2. **Step 2: OTP Verification**
   - Email OTP input (6 digits)
   - SMS OTP input (6 digits)
   - Verify both codes
   - Complete registration

**Features:**
- Real-time validation
- Attempt limiting (UI-side)
- Resend OTP functionality
- Professional UI with Tailwind CSS
- Toast notifications for user feedback

---

## Security Features

### 1. OTP Generation
- 6-digit random codes
- 10-minute expiration (configurable)
- Time-based validation

### 2. Attempt Limiting
- Maximum 5 failed attempts (configurable)
- After max attempts, OTP is blocked
- Users must request new OTP

### 3. Email Security
- AWS SES ensures delivery reliability
- Professional HTML templates
- No sensitive data in subject line

### 4. SMS Security
- Twilio enterprise service
- End-to-end encryption
- No sensitive data in OTP message

### 5. Database Security
- MongoDB encryption at rest
- OTP codes never stored in plain text (implementation recommended)
- Automatic cleanup of expired OTPs

---

## Setup Instructions

### Prerequisites

1. **AWS Account**
   - Create IAM user with SES permissions
   - Verify sender email address in SES
   - Generate access keys

2. **Twilio Account**
   - Create account at https://www.twilio.com
   - Get Account SID and Auth Token
   - Purchase phone number or use trial number

3. **Java 21+**
4. **Maven**
5. **Node.js 18+**
6. **MongoDB Atlas**

### Backend Setup

1. **Add credentials to `.env`:**
   ```bash
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   ```

2. **Build and run:**
   ```bash
   cd backend-spring
   mvn clean install
   mvn spring-boot:run
   ```

### Frontend Setup

1. **Update API endpoints in component**
2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

---

## Testing

### Test Scenarios

1. **Happy Path**
   - User registers with email and phone
   - Receives OTP on both channels
   - Enters correct codes
   - Registration completes

2. **Invalid OTP**
   - User enters wrong code
   - System shows error
   - Attempt counter increments
   - After 5 attempts, OTP is blocked

3. **Expired OTP**
   - User waits 10+ minutes
   - Tries to use OTP
   - System shows "Expired" error
   - User can resend

4. **Resend OTP**
   - User requests resend
   - Old OTP is invalidated
   - New OTP is generated
   - Both emails/SMS are sent

### cURL Testing Examples

```bash
# Request OTP
curl -X POST http://localhost:8080/api/auth/otp/request-registration \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "firstName": "John"
  }'

# Verify Email OTP
curl -X POST http://localhost:8080/api/auth/otp/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otpCode": "123456"
  }'

# Get OTP Status
curl http://localhost:8080/api/auth/otp/status/test@example.com
```

---

## Monitoring & Maintenance

### Log Files
- Check `logs/` directory for OTP service logs
- Monitor failed attempt patterns
- Track delivery failures

### Scheduled Tasks
- `cleanupExpiredOTPs()` runs every hour
- Removes OTPs expired more than 1 hour ago
- Prevents database bloat

### Metrics to Monitor
- OTP delivery success rate
- Verification attempt rates
- Failed verification patterns
- Average time to verify

---

## Troubleshooting

### Issue: OTP not sending via email
**Solutions:**
- Verify AWS SES credentials
- Check sender email is verified in AWS SES
- Ensure service has SES permissions
- Check logs for AWS errors

### Issue: SMS not being received
**Solutions:**
- Verify Twilio credentials
- Check phone number format (E.164)
- Ensure Twilio account has credits
- Check phone number country support

### Issue: OTP expired too quickly
**Solutions:**
- Check `otp.expiration-minutes` setting
- Verify system clock is synchronized
- Check MongoDB server time

---

## Future Enhancements

1. **TOTP Support**
   - Time-based one-time passwords
   - Authenticator app integration

2. **Multi-factor Authentication**
   - Biometric verification
   - Security key support

3. **Advanced Analytics**
   - OTP delivery metrics
   - User verification patterns
   - Fraud detection

4. **Rate Limiting**
   - Prevent OTP request flooding
   - IP-based rate limiting

5. **Internationalization**
   - Multi-language email templates
   - Country-specific phone validation

---

## References

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Last Updated:** December 30, 2025
**Version:** 1.0.0
