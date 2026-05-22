#!/bin/bash
# SabaHub Admin Bootstrap Setup Script
# This script helps set up the first admin user in the system

set -e

echo "================================================"
echo "  SabaHub Enterprise Admin Bootstrap Setup"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get user inputs
echo -e "${BLUE}Please enter the following details to create the first admin account:${NC}"
echo ""

read -p "Admin Email (e.g., admin@company.com): " ADMIN_EMAIL
read -p "Admin Full Name (e.g., John Administrator): " ADMIN_FULLNAME
read -sp "Admin Password (minimum 8 characters): " ADMIN_PASSWORD
echo ""
read -sp "Confirm Password: " ADMIN_PASSWORD_CONFIRM
echo ""

# Validation
if [ -z "$ADMIN_EMAIL" ]; then
    echo -e "${RED}Error: Email cannot be empty${NC}"
    exit 1
fi

if [ -z "$ADMIN_FULLNAME" ]; then
    echo -e "${RED}Error: Full name cannot be empty${NC}"
    exit 1
fi

if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
    echo -e "${RED}Error: Password must be at least 8 characters${NC}"
    exit 1
fi

if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}Error: Passwords do not match${NC}"
    exit 1
fi

# Validate email format
if ! [[ "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${RED}Error: Invalid email format${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Attempting to initialize admin account...${NC}"
echo ""

# Determine backend URL
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"

# First, check status
echo -e "${BLUE}Checking system status...${NC}"
STATUS_RESPONSE=$(curl -s "$BACKEND_URL/api/admin/bootstrap/status")

# Extract initialized status
INITIALIZED=$(echo "$STATUS_RESPONSE" | grep -o '"initialized":[^,}]*' | cut -d':' -f2 | tr -d ' ')

if [ "$INITIALIZED" = "true" ]; then
    echo -e "${YELLOW}ℹ System is already initialized with existing admin account(s)${NC}"
    TOTAL_ADMINS=$(echo "$STATUS_RESPONSE" | grep -o '"totalAdmins":[^,}]*' | cut -d':' -f2 | tr -d ' ')
    echo -e "${YELLOW}Total admins in system: $TOTAL_ADMINS${NC}"
    echo ""
    echo -e "${BLUE}To promote additional users to admin, use the User Management workspace${NC}"
    exit 0
fi

echo -e "${GREEN}✓ System is ready for bootstrap${NC}"
echo ""

# Make API request to initialize admin
echo -e "${BLUE}Creating admin account...${NC}"
echo ""

INIT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/admin/bootstrap/initialize" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"fullName\": \"$ADMIN_FULLNAME\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

# Check if successful (contains userId)
if echo "$INIT_RESPONSE" | grep -q '"userId"'; then
    echo -e "${GREEN}✓ Admin account created successfully!${NC}"
    echo ""
    
    # Extract details
    USER_ID=$(echo "$INIT_RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
    EMAIL=$(echo "$INIT_RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
    FULL_NAME=$(echo "$INIT_RESPONSE" | grep -o '"fullName":"[^"]*"' | cut -d'"' -f4)
    
    echo -e "${YELLOW}Account Details:${NC}"
    echo "  Email: $EMAIL"
    echo "  Name: $FULL_NAME"
    echo "  User ID: $USER_ID"
    echo ""
    
    echo -e "${YELLOW}Important Next Steps:${NC}"
    echo "  1. ✅ Log in at http://localhost:3000 with your admin credentials"
    echo "  2. 🔐 Set up MFA (Multi-Factor Authentication) on first login"
    echo "  3. 📋 Review the Admin Bootstrap Guide in enterprise-documentation/"
    echo "  4. 👥 Start managing the platform from the Admin Dashboard"
    echo ""
    
    echo -e "${GREEN}Bootstrap setup complete!${NC}"
    echo ""
    
else
    # Check for specific error messages
    if echo "$INIT_RESPONSE" | grep -q "already has"; then
        echo -e "${YELLOW}⚠ System already has admin(s). Bootstrap is locked.${NC}"
        exit 0
    fi
    
    if echo "$INIT_RESPONSE" | grep -q "already exists"; then
        echo -e "${RED}✗ Email already exists in the system${NC}"
        echo "  Please use a different email address"
        exit 1
    fi
    
    if echo "$INIT_RESPONSE" | grep -q "403"; then
        echo -e "${YELLOW}⚠ System already initialized (403 Forbidden)${NC}"
        echo "  To add more admins, use the User Management workspace"
        exit 0
    fi
    
    echo -e "${RED}✗ Failed to create admin account${NC}"
    echo "  Response: $INIT_RESPONSE"
    exit 1
fi
