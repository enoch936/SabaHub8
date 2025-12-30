#!/bin/bash

# OTP Services Configuration Validator
# This script checks if all required OTP verification services are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}OTP Services Configuration Check${NC}"
echo -e "${BLUE}================================${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found!${NC}"
    exit 1
fi

# Function to check variable
check_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env | cut -d '=' -f 2- || echo "")
    
    if [ -z "$var_value" ] || [ "$var_value" = "YOUR_${var_name}_HERE" ] || [[ "$var_value" =~ ^YOUR_.* ]]; then
        echo -e "${RED}✗ ${var_name}${NC} - Not configured"
        return 1
    else
        # Mask sensitive values for display
        if [[ "$var_name" =~ (SECRET|TOKEN|KEY) ]]; then
            masked="${var_value:0:6}***${var_value: -4}"
            echo -e "${GREEN}✓ ${var_name}${NC} - $masked"
        else
            echo -e "${GREEN}✓ ${var_name}${NC} - $var_value"
        fi
        return 0
    fi
}

# ========== AWS SES Configuration ==========
echo -e "${BLUE}📧 AWS SES Configuration (Email OTP)${NC}"
echo "─────────────────────────────────────"

aws_ses_ok=true
check_var "AWS_REGION" || aws_ses_ok=false
check_var "AWS_SES_FROM_EMAIL" || aws_ses_ok=false
check_var "AWS_ACCESS_KEY_ID" || aws_ses_ok=false
check_var "AWS_SECRET_ACCESS_KEY" || aws_ses_ok=false

if [ "$aws_ses_ok" = true ]; then
    echo -e "${GREEN}✓ AWS SES: Ready${NC}\n"
else
    echo -e "${YELLOW}⚠ AWS SES: Incomplete - See OTP_SERVICES_SETUP.md${NC}\n"
fi

# ========== Twilio Configuration ==========
echo -e "${BLUE}📱 Twilio Configuration (SMS OTP)${NC}"
echo "─────────────────────────────────────"

twilio_ok=true
check_var "TWILIO_ACCOUNT_SID" || twilio_ok=false
check_var "TWILIO_AUTH_TOKEN" || twilio_ok=false
check_var "TWILIO_PHONE_NUMBER" || twilio_ok=false

if [ "$twilio_ok" = true ]; then
    echo -e "${GREEN}✓ Twilio: Ready${NC}\n"
else
    echo -e "${YELLOW}⚠ Twilio: Incomplete - See OTP_SERVICES_SETUP.md${NC}\n"
fi

# ========== OTP Settings ==========
echo -e "${BLUE}⚙️  OTP Settings${NC}"
echo "─────────────────────────────────────"

check_var "OTP_EXPIRATION_MINUTES"
check_var "OTP_MAX_ATTEMPTS"
echo ""

# ========== Summary ==========
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Configuration Summary${NC}"
echo -e "${BLUE}================================${NC}\n"

if [ "$aws_ses_ok" = true ] && [ "$twilio_ok" = true ]; then
    echo -e "${GREEN}✓ All services configured!${NC}"
    echo -e "${GREEN}Ready to start OTP verification.${NC}\n"
    
    echo -e "Next steps:"
    echo -e "1. Start backend: ${BLUE}docker-compose up${NC}"
    echo -e "2. Test API: ${BLUE}curl -X POST http://localhost:8080/api/auth/otp/request-registration${NC}"
    echo -e "3. Check logs: ${BLUE}docker logs sabahub-backend${NC}\n"
    
    exit 0
else
    echo -e "${YELLOW}⚠ Some services not configured${NC}\n"
    
    if [ "$aws_ses_ok" = false ]; then
        echo -e "${YELLOW}Missing AWS SES configuration:${NC}"
        echo -e "  1. Go to https://console.aws.amazon.com"
        echo -e "  2. Create IAM user with SES access"
        echo -e "  3. Verify email in SES Console"
        echo -e "  4. Update .env with credentials\n"
    fi
    
    if [ "$twilio_ok" = false ]; then
        echo -e "${YELLOW}Missing Twilio configuration:${NC}"
        echo -e "  1. Sign up at https://www.twilio.com/console"
        echo -e "  2. Get Account SID and Auth Token"
        echo -e "  3. Get a Twilio phone number"
        echo -e "  4. Update .env with credentials\n"
    fi
    
    echo -e "📖 Full setup guide: ${BLUE}OTP_SERVICES_SETUP.md${NC}\n"
    
    exit 1
fi
