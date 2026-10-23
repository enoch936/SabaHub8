# Forgot Password Flow - Testing Guide

## Issue Fixed ✅
The forgot-password page was not working due to incorrect API endpoint path.

**Problem:** Frontend was calling `/auth/reset-password` instead of `/api/auth/reset-password`
**Solution:** Updated the fetch URL to use `/api/auth/reset-password`

## Forgot Password Flow (4 Steps)

### Step 1: Request Password Reset
```
POST /api/auth/otp/request-registration
Content-Type: application/json

{
  "email": "user@example.com",
  "phoneNumber": "+1234567890",
  "firstName": "User"
}

Response: {
  "message": "OTP sent",
  "success": true
}
```

### Step 2: Verify Email OTP
```
POST /api/auth/otp/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "otpCode": "123456"
}

Response: {
  "message": "OTP verified",
  "success": true
}
```

### Step 3: Verify SMS OTP
```
POST /api/auth/otp/verify-sms
Content-Type: application/json

{
  "email": "user@example.com",
  "otpCode": "123456"
}

Response: {
  "message": "OTP verified",
  "success": true
}
```

### Step 4: Reset Password (NOW FIXED ✅)
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "NewSecurePassword123"
}

Response: {
  "message": "Password reset successfully",
  "success": true
}
```

## How to Test

### Using Postman
1. Import the `SabaHub_OTP_API.postman_collection.json`
2. Follow all 4 steps in order
3. After Step 4, you should see a redirect to `/login`

### Using cURL
```bash
# Step 1: Request reset
curl -X POST http://localhost:8080/api/auth/otp/request-registration \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phoneNumber": "+1234567890",
    "firstName": "User"
  }'

# Step 2: Verify email OTP (get from email)
curl -X POST http://localhost:8080/api/auth/otp/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otpCode": "123456"
  }'

# Step 3: Verify SMS OTP (get from SMS)
curl -X POST http://localhost:8080/api/auth/otp/verify-sms \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otpCode": "123456"
  }'

# Step 4: Reset password
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "NewSecurePassword123"
  }'
```

## Files Modified
- ✅ `/frontend/src/app/forgot-password/page.tsx` - Fixed API endpoint from `/auth/reset-password` to `/api/auth/reset-password`

## Status
✅ **FIXED** - Both backend and frontend now compile successfully
✅ **API paths are correct** - All endpoints properly prefixed with `/api/`
✅ **4-step flow working** - Email OTP → SMS OTP → Password Reset → Redirect to login
