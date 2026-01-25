# SabaHub - Complete Setup & Configuration Guide

Complete guide to clone, configure, and run the SabaHub application from scratch.

---

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Repository Setup](#repository-setup)
4. [Database Configuration](#database-configuration)
5. [Third-Party Services Setup](#third-party-services-setup)
6. [Environment Configuration](#environment-configuration)
7. [Backend Setup](#backend-setup)
8. [Frontend Setup](#frontend-setup)
9. [Running the Application](#running-the-application)
10. [Verification & Testing](#verification--testing)
11. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Specifications
- **OS**: Linux, macOS, or Windows (with WSL2)
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 10GB minimum
- **CPU**: Dual-core minimum (4+ cores recommended)

### Supported Environments
- Ubuntu 22.04 LTS or later
- macOS 12 or later
- Windows 11 with WSL2 + Ubuntu 22.04

---

## Prerequisites Installation

### 1. Install Java Development Kit (JDK 21)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
java -version  # Verify installation
```

**macOS (using Homebrew):**
```bash
brew install openjdk@21
java -version  # Verify installation
```

**Windows (using Chocolatey):**
```bash
choco install openjdk21
java -version  # Verify installation
```

### 2. Install Maven 3.9+

**Ubuntu/Debian:**
```bash
sudo apt install -y maven
mvn -version  # Verify installation
```

**macOS:**
```bash
brew install maven
mvn -version  # Verify installation
```

**Windows:**
```bash
choco install maven
mvn -version  # Verify installation
```

### 3. Install Node.js 18+ and npm

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v  # Verify installation
```

**macOS:**
```bash
brew install node@18
node -v && npm -v  # Verify installation
```

**Windows:**
Download from [https://nodejs.org/](https://nodejs.org/) and install v18 LTS

### 4. Install pnpm (Node Package Manager)

```bash
npm install -g pnpm
pnpm -v  # Verify installation (should be v8.x or later)
```

### 5. Install Git

**Ubuntu/Debian:**
```bash
sudo apt install -y git
git --version  # Verify installation
```

**macOS:**
```bash
brew install git
git --version  # Verify installation
```

**Windows:**
Download from [https://git-scm.com/download/win](https://git-scm.com/download/win)

### 6. Install Docker (for MongoDB if running locally)

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
docker --version  # Verify installation
```

**macOS:**
```bash
brew install docker --cask
docker --version  # Verify installation
```

### 7. Install curl (HTTP Client)

**Ubuntu/Debian:**
```bash
sudo apt install -y curl
curl --version  # Verify installation
```

**macOS:**
```bash
# curl comes pre-installed on macOS
curl --version
```

---

## Repository Setup

### 1. Clone the Repository

```bash
git clone https://github.com/enoch936/SabaHub8.git
cd SabaHub8
```

### 2. Verify Directory Structure

```bash
ls -la
# Should show: backend-spring/, frontend/, *.md files
```

---

## Database Configuration

### Option A: MongoDB Atlas (Cloud - Recommended)

1. **Create MongoDB Atlas Account**
   - Visit [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free tier
   - Create a cluster

2. **Get Connection String**
   - In Atlas dashboard, click "Connect"
   - Choose "Connection string" (URI)
   - Copy connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

3. **Note credentials for later configuration**

### Option B: Local MongoDB with Docker

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7.0

# Verify container is running
docker ps | grep mongodb
```

### Database Collections Auto-Created
The application creates 21+ collections automatically:
- jobs
- job_applications
- users
- employers
- freelancers
- proposals
- projects
- transactions
- wallet_ledgers
- invoices
- contracts
- disputes
- notifications
- otp_codes
- audit_logs
- time_entries
- chat_threads
- chat_messages
- withdrawals
- and more...

---

## Third-Party Services Setup

### 1. Cloudinary (Media Management)

1. **Create Account**
   - Visit [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
   - Sign up for free tier

2. **Get Credentials**
   - Dashboard → Settings → API Keys
   - Copy:
     - `Cloud Name`
     - `API Key`
     - `API Secret`

3. **Create Upload Preset** (optional but recommended)
   - Settings → Upload → Add upload preset
   - Create preset named "default" (or custom name)

### 2. SendGrid (Email Service)

1. **Create Account**
   - Visit [https://sendgrid.com/](https://sendgrid.com/)
   - Sign up for free tier (100 emails/day)

2. **Get API Key**
   - Settings → API Keys → Create API Key
   - Select "Full Access"
   - Copy and save API key

3. **Verify Sender Email**
   - Marketing → Senders → Add Sender
   - Verify your domain or use default sender

### 3. Twilio (SMS/OTP Service)

1. **Create Account**
   - Visit [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Sign up for free trial account

2. **Get Credentials**
   - Console → Settings
   - Copy:
     - `Account SID`
     - `Auth Token`

3. **Get Phone Number**
   - Console → Phone Numbers → Buy a Number
   - Select country (US, GB, etc.)
   - Note the phone number

### 4. Stripe (Payment Processing)

1. **Create Account**
   - Visit [https://stripe.com/](https://stripe.com/)
   - Sign up for free

2. **Get API Keys**
   - Developers → API Keys
   - Copy:
     - `Publishable Key`
     - `Secret Key` (Restricted key for backend only)

3. **Enable Test Mode**
   - Use test API keys for development
   - Test mode toggle in API Keys page

### 5. Auth0 (Optional - Single Sign-On)

1. **Create Account** (Optional)
   - Visit [https://auth0.com/](https://auth0.com/)
   - Sign up for free

2. **Create Application**
   - Applications → Create Application
   - Select "Regular Web Application"
   - Get Domain and Client ID

---

## Environment Configuration

### Backend Environment Setup

1. **Create `.env` file in backend-spring root**

```bash
cd /workspaces/SabaHub8/backend-spring
touch .env
```

2. **Populate `.env` file**

```env
# MongoDB Configuration
SPRING_DATA_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sabahub?retryWrites=true&w=majority
MONGO_DB_NAME=sabahub

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=default

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@sabahub.com

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters

# Application Configuration
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=dev
SPRING_JPA_HIBERNATE_DDL_AUTO=update

# Logging
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_COM_SABAHUB=DEBUG
```

### Frontend Environment Setup

1. **Create `.env.local` file in frontend root**

```bash
cd /workspaces/SabaHub8/frontend
touch .env.local
```

2. **Populate `.env.local` file**

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_API_V2_URL=http://localhost:8080/api/v2

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=default

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Application Configuration
NEXT_PUBLIC_APP_NAME=SabaHub
NEXT_PUBLIC_APP_ENVIRONMENT=development
```

### Getting Strong JWT Secret

```bash
# Generate a strong JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd /workspaces/SabaHub8/backend-spring
```

### 2. Clean and Build

```bash
# Clean previous builds
mvn clean

# Download dependencies and compile
mvn compile

# Run all tests (optional)
mvn test

# Build the application
mvn package
```

### 3. Expected Build Output

```
[INFO] BUILD SUCCESS
[INFO] Total time: X minutes Y seconds
```

### 4. Verify Java Version

```bash
javac -version
# Should output: javac 21.x.x
```

### 5. Verify Spring Boot Version

```bash
grep '<version>' pom.xml | head -5
# Should show spring-boot-starter-parent 3.3.4
```

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd /workspaces/SabaHub8/frontend
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 3. Build TypeScript

```bash
pnpm run build
```

### 4. Verify Node Modules

```bash
# Check if node_modules exists and has dependencies
ls node_modules | wc -l
# Should be > 500 packages
```

### 5. Check Frontend Configuration

```bash
cat next.config.ts
cat tsconfig.json
cat package.json | grep '"version"'
```

---

## Running the Application

### Terminal Setup

You'll need 3 terminal windows/tabs:
- Terminal 1: Backend (Spring Boot)
- Terminal 2: Frontend (Next.js)
- Terminal 3: Utilities/Testing

### Backend Startup

**Terminal 1: Start Spring Boot**

```bash
cd /workspaces/SabaHub8/backend-spring

# Run with Maven
mvn spring-boot:run

# Or run JAR directly (after build)
java -jar target/backend-spring-1.0.0.jar
```

**Expected Output:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| ._ |_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.3.4)

2026-01-25 XX:XX:XX.XXX  INFO 12345 --- [main] com.sabahub.Application: Starting Application

... (more logs)

2026-01-25 XX:XX:XX.XXX  INFO 12345 --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer: Tomcat started on port(s): 8080
```

**Backend is ready when you see:**
- ✅ "Tomcat started on port(s): 8080"
- ✅ MongoDB connection successful logs

### Frontend Startup

**Terminal 2: Start Next.js**

```bash
cd /workspaces/SabaHub8/frontend

# Using pnpm
pnpm dev

# Or using npm
npm run dev
```

**Expected Output:**
```
> frontend@1.0.0 dev
> next dev

  ▲ Next.js 16.0.5
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

**Frontend is ready when you see:**
- ✅ "Ready in X.Xs"
- ✅ "Local: http://localhost:3000"

---

## Verification & Testing

### Terminal 3: Testing Commands

### 1. Verify Backend is Running

```bash
# Check if port 8080 is listening
netstat -tlnp 2>/dev/null | grep 8080

# Test health endpoint
curl http://localhost:8080/actuator/health

# Test jobs endpoint
curl http://localhost:8080/api/v2/jobs/search?page=0&size=10
```

### 2. Verify Frontend is Running

```bash
# Check if port 3000 is listening
netstat -tlnp 2>/dev/null | grep 3000

# Check HTML response
curl http://localhost:3000 | head -20
```

### 3. Verify Database Connection

```bash
# Check MongoDB connection in backend logs
grep -i "mongodb\|mongo" /path/to/logs

# Or from MongoDB Atlas:
# - Go to Collections → View data
# - Verify collections are created
```

### 4. Verify Services Integration

```bash
# Check if environment variables are loaded
echo $SENDGRID_API_KEY
echo $CLOUDINARY_CLOUD_NAME
echo $TWILIO_ACCOUNT_SID
```

### 5. Full System Test

**Access Application:**
- Open browser: http://localhost:3000
- You should see SabaHub home page
- Features to test:
  - Browse jobs at `/jobs`
  - View job details at `/jobs/[id]`
  - Admin analytics at `/admin/analytics`
  - Advanced search at `/jobs/advanced-search`

---

## Troubleshooting

### Backend Issues

#### Issue: "Port 8080 already in use"
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or change port in application.properties
spring.server.port=8081
```

#### Issue: "MongoDB connection refused"
```bash
# Check MongoDB URI in .env
echo $SPRING_DATA_MONGODB_URI

# Verify Atlas IP Whitelist
# - Go to Security → Network Access
# - Add your IP (0.0.0.0/0 for dev only)

# Test MongoDB connection
mongo "mongodb+srv://user:pass@cluster.mongodb.net/sabahub"
```

#### Issue: "NoClassDefFoundError" or compilation errors
```bash
# Clean and rebuild
mvn clean package

# Clear Maven cache
rm -rf ~/.m2/repository

# Reinstall dependencies
mvn dependency:resolve
```

#### Issue: "JWT token expired" errors
```bash
# Regenerate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env with new secret
# Restart backend
```

### Frontend Issues

#### Issue: "Port 3000 already in use"
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or run on different port
pnpm dev -p 3001
```

#### Issue: "Module not found" errors
```bash
# Clear dependencies and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Or with npm
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "TypeScript compilation errors"
```bash
# Check TypeScript version
npx tsc --version

# Rebuild TypeScript
pnpm run build

# Check for type errors
pnpm run type-check
```

### API Issues

#### Issue: "403 Forbidden" on protected endpoints
```bash
# Ensure JWT token is included in header
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/protected

# Or login first to get token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

#### Issue: "CORS errors" in browser console
```bash
# Check CORS configuration in SecurityConfig.java
# Should allow http://localhost:3000

# Update backend CORS if needed:
# @CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
```

#### Issue: "Cloudinary upload fails"
```bash
# Verify Cloudinary credentials
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY

# Test Cloudinary connection
curl -u "apikey:$CLOUDINARY_API_KEY" \
  "https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/resources/image"
```

### Database Issues

#### Issue: "Database collections not created"
```bash
# Check MongoDB logs
docker logs mongodb

# Manually check collections
mongo "mongodb+srv://user:pass@cluster.mongodb.net/sabahub" \
  --eval "db.getCollectionNames()"

# Restart application to trigger collection creation
```

#### Issue: "Duplicate key error"
```bash
# Drop collection and restart
# WARNING: This deletes all data in collection
db.collection_name.drop()

# Or delete specific indexes
db.collection_name.dropIndex("index_name")
```

---

## Database Backups

### MongoDB Atlas Automatic Backups
- Atlas handles automated daily backups
- Restore: Atlas Dashboard → Backup → Restore
- Retention: 7 days (free tier)

### Manual Backup

```bash
# Export all data
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/sabahub" \
  --out ./backup

# Import data
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/sabahub" \
  ./backup
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Update all environment variables for production
- [ ] Set JWT_SECRET to a strong random value
- [ ] Enable MongoDB replica sets (required for transactions)
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up proper database backups
- [ ] Configure logging and monitoring
- [ ] Set CORS to specific domain only
- [ ] Enable rate limiting on API endpoints
- [ ] Set up health check monitoring
- [ ] Configure auto-scaling policies
- [ ] Test all payment integrations
- [ ] Verify email delivery with SendGrid
- [ ] Test SMS delivery with Twilio

---

## Performance Optimization

### Backend
```bash
# Run with optimized JVM settings
java -Xmx2g -Xms1g \
  -XX:+UseParallelGC \
  -XX:GCTimeRatio=4 \
  -jar target/backend-spring-1.0.0.jar
```

### Frontend
```bash
# Build production bundle
pnpm run build

# Analyze bundle size
pnpm run analyze
```

### Database
- Ensure MongoDB indexes are created
- Monitor query performance
- Archive old data periodically

---

## Useful Commands Reference

### Maven Commands
```bash
mvn clean                    # Clean build artifacts
mvn compile                  # Compile source code
mvn test                     # Run unit tests
mvn package                  # Build JAR file
mvn spring-boot:run          # Run application
mvn dependency:tree          # Show dependency tree
```

### NPM/PNPM Commands
```bash
pnpm install                 # Install dependencies
pnpm run dev                 # Start dev server
pnpm run build               # Build for production
pnpm run type-check          # Check TypeScript types
pnpm run lint                # Run linter
pnpm run test                # Run tests
```

### Git Commands
```bash
git clone <repo>             # Clone repository
git pull origin main         # Get latest changes
git status                   # Check status
git add .                    # Stage all changes
git commit -m "message"      # Commit changes
git push origin main         # Push to remote
```

### Docker Commands
```bash
docker ps                    # List running containers
docker logs <container>      # View container logs
docker stop <container>      # Stop container
docker rm <container>        # Remove container
docker exec -it <container> bash  # Access container shell
```

---

## Support & Documentation

- **SabaHub Documentation**: See README.md
- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **Next.js Docs**: https://nextjs.org/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **API Documentation**: http://localhost:8080/swagger-ui/index.html (when running)

---

## Quick Start Summary

```bash
# 1. Clone repository
git clone https://github.com/enoch936/SabaHub8.git
cd SabaHub8

# 2. Setup backend
cd backend-spring
cp .env.example .env  # Configure your variables
mvn clean package

# 3. Setup frontend
cd ../frontend
pnpm install

# 4. Run backend (Terminal 1)
cd backend-spring
mvn spring-boot:run

# 5. Run frontend (Terminal 2)
cd frontend
pnpm dev

# 6. Access application
# Frontend: http://localhost:3000
# API Docs: http://localhost:8080/swagger-ui/index.html
```

---

**Last Updated**: January 25, 2026  
**Version**: 1.0  
**Status**: Production Ready
