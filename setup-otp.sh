#!/bin/bash

# OTP Configuration Setup Script
# This script helps configure AWS SES and Twilio credentials

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          SabaHub OTP Verification Setup Script                 ║"
echo "║     Enterprise Email & SMS Verification Configuration          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env file exists
ENV_FILE="backend-spring/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "📋 This script will help you configure:"
echo "   1. AWS SES (Email Verification)"
echo "   2. Twilio (SMS Verification)"
echo ""

# Function to read input
read_input() {
    read -p "$1: " value
    echo "$value"
}

# AWS Configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 AWS SES Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Get these from AWS Console → IAM → Users → Security Credentials"
echo ""

aws_region=$(read_input "AWS Region (default: us-east-1)")
aws_region=${aws_region:-us-east-1}

aws_access_key=$(read_input "AWS Access Key ID")
if [ -z "$aws_access_key" ]; then
    echo "❌ AWS Access Key ID is required!"
    exit 1
fi

aws_secret_key=$(read_input "AWS Secret Access Key")
if [ -z "$aws_secret_key" ]; then
    echo "❌ AWS Secret Access Key is required!"
    exit 1
fi

aws_ses_email=$(read_input "SES From Email (default: noreply@sabahub.com)")
aws_ses_email=${aws_ses_email:-noreply@sabahub.com}

# Twilio Configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Twilio Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Get these from Twilio Console → Account → API Keys & Tokens"
echo ""

twilio_account_sid=$(read_input "Twilio Account SID")
if [ -z "$twilio_account_sid" ]; then
    echo "❌ Twilio Account SID is required!"
    exit 1
fi

twilio_auth_token=$(read_input "Twilio Auth Token")
if [ -z "$twilio_auth_token" ]; then
    echo "❌ Twilio Auth Token is required!"
    exit 1
fi

twilio_phone=$(read_input "Twilio Phone Number (format: +1234567890)")
if [ -z "$twilio_phone" ]; then
    echo "❌ Twilio Phone Number is required!"
    exit 1
fi

# OTP Settings
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏱️  OTP Settings"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

otp_expiration=$(read_input "OTP Expiration (minutes, default: 10)")
otp_expiration=${otp_expiration:-10}

otp_max_attempts=$(read_input "Max Attempts (default: 5)")
otp_max_attempts=${otp_max_attempts:-5}

# Update .env file
echo ""
echo "📝 Updating $ENV_FILE..."
echo ""

# Create backup
cp "$ENV_FILE" "${ENV_FILE}.backup"
echo "✅ Backup created: ${ENV_FILE}.backup"

# Update credentials
sed -i "s/AWS_REGION=.*/AWS_REGION=$aws_region/" "$ENV_FILE"
sed -i "s/AWS_ACCESS_KEY_ID=.*/AWS_ACCESS_KEY_ID=$aws_access_key/" "$ENV_FILE"
sed -i "s/AWS_SECRET_ACCESS_KEY=.*/AWS_SECRET_ACCESS_KEY=$aws_secret_key/" "$ENV_FILE"
sed -i "s/AWS_SES_FROM_EMAIL=.*/AWS_SES_FROM_EMAIL=$aws_ses_email/" "$ENV_FILE"

sed -i "s/TWILIO_ACCOUNT_SID=.*/TWILIO_ACCOUNT_SID=$twilio_account_sid/" "$ENV_FILE"
sed -i "s/TWILIO_AUTH_TOKEN=.*/TWILIO_AUTH_TOKEN=$twilio_auth_token/" "$ENV_FILE"
sed -i "s/TWILIO_PHONE_NUMBER=.*/TWILIO_PHONE_NUMBER=$twilio_phone/" "$ENV_FILE"

sed -i "s/OTP_EXPIRATION_MINUTES=.*/OTP_EXPIRATION_MINUTES=$otp_expiration/" "$ENV_FILE"
sed -i "s/OTP_MAX_ATTEMPTS=.*/OTP_MAX_ATTEMPTS=$otp_max_attempts/" "$ENV_FILE"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ Setup Complete!                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Configuration Summary:"
echo ""
echo "AWS SES:"
echo "  Region: $aws_region"
echo "  From Email: $aws_ses_email"
echo "  Access Key: ${aws_access_key:0:10}..."
echo ""
echo "Twilio:"
echo "  Account SID: ${twilio_account_sid:0:10}..."
echo "  Phone: $twilio_phone"
echo ""
echo "OTP Settings:"
echo "  Expiration: $otp_expiration minutes"
echo "  Max Attempts: $otp_max_attempts"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Build the backend:"
echo "   cd backend-spring"
echo "   mvn clean install"
echo ""
echo "2. Run the backend:"
echo "   mvn spring-boot:run"
echo ""
echo "3. Run the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "4. Test the registration flow at http://localhost:3000/register"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "  - OTP_IMPLEMENTATION_GUIDE.md (Detailed guide)"
echo "  - OTP_QUICK_REFERENCE.md (Quick reference)"
echo ""
echo "❓ Need help?"
echo "  AWS SES: https://aws.amazon.com/ses/"
echo "  Twilio: https://www.twilio.com/"
echo ""
