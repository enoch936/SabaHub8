# Backend Setup & Deployment Guide

## Prerequisites

- Java 21+
- Maven 3.8+
- Docker & Docker Compose
- MongoDB (or use Docker)
- Redis (or use Docker)

## Quick Start with Docker Compose

### 1. Navigate to Backend Directory
```bash
cd backend-spring
```

### 2. Build the Docker Image
```bash
docker build -t sabahub-backend:latest .
```

### 3. Start All Services
```bash
docker-compose up -d
```

This will start:
- **Redis** on port 6379
- **MongoDB** on port 27017
- **Spring Boot App** on port 8080

### 4. Verify Services

Check if all services are running:
```bash
docker-compose ps
```

Expected output:
```
NAME                      STATUS       PORTS
sabahub-redis            Up           6379/tcp
sabahub-mongo            Up           27017/tcp
sabahub-backend-spring   Up           8080/tcp
```

### 5. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f sabahub-backend-spring
```

---

## Local Development Setup (Without Docker)

### 1. Prerequisites
- Java 21 installed
- Maven installed
- MongoDB running locally on port 27017
- Redis running locally on port 6379

### 2. Install Dependencies
```bash
cd backend-spring
mvn clean install
```

### 3. Set Environment Variables
```bash
export APP_JWT_SECRET="MzJieXRlc2VjcmV0Zm9yZGV2dXNlMTIzNDU2Nzg5MDEyMzQ1Njc4OTA="
export APP_CORS_ALLOWED_ORIGINS="http://localhost:3000"
export SPRING_REDIS_HOST="localhost"
export SPRING_REDIS_PORT="6379"
```

### 4. Run the Application
```bash
mvn spring-boot:run
```

Or build and run JAR:
```bash
mvn clean package
java -jar target/backend-spring-0.0.1-SNAPSHOT.jar
```

---

## Environment Variables

### Required for Production
```
APP_JWT_SECRET=<base64-encoded-32-byte-secret>
APP_CORS_ALLOWED_ORIGINS=<comma-separated-origins>
```

### Optional (Docker Compose defaults provided)
```
SPRING_REDIS_HOST=redis              # Default: localhost
SPRING_REDIS_PORT=6379               # Default: 6379
SPRING_DATA_MONGODB_URI=mongodb://mongo:27017/sabahub
```

### Email (OTP Service)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@sabahub.com
SMTP_AUTH=true
SMTP_TLS_ENABLED=true
```

### SMS (Twilio)
```
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_VERIFY_SERVICE_SID=your-service-sid
TWILIO_PHONE_NUMBER=+1234567890
```

### Cloudinary (Image Upload)
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Admin Account
```
ADMIN_EMAIL=admin@sabahub.local
ADMIN_PASSWORD=Admin@123456
```

---

## Docker Compose Configuration

### File: docker-compose.yml
```yaml
version: "3.9"
services:
  redis:
    image: redis:7-alpine
    container_name: sabahub-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mongo:
    image: mongo:7
    container_name: sabahub-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  app:
    build: .
    container_name: sabahub-backend-spring
    environment:
      - SPRING_REDIS_HOST=redis
      - SPRING_REDIS_PORT=6379
      - SPRING_DATA_MONGODB_URI=mongodb://mongo:27017/sabahub
    ports:
      - "8080:8080"
    depends_on:
      - mongo
      - redis

volumes:
  mongo_data:
  redis_data:
```

---

## Health Checks

### Check Application Health
```bash
curl http://localhost:8080/actuator/health
```

Response:
```json
{
  "status": "UP",
  "components": {
    "redis": {
      "status": "UP"
    },
    "mongoDb": {
      "status": "UP"
    }
  }
}
```

### Test Jobs API
```bash
curl http://localhost:8080/api/jobs/count
```

### Test Wallet API (Requires Auth)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/wallet/balance
```

---

## Troubleshooting

### Redis Connection Error
**Error:** `Unable to connect to Redis at localhost:6379`

**Solution:**
```bash
# Check if Redis is running
docker-compose ps

# Restart Redis
docker-compose restart redis

# Or start all services
docker-compose up -d
```

### MongoDB Connection Error
**Error:** `Unable to connect to MongoDB`

**Solution:**
```bash
# Check MongoDB status
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo
```

### Port Already in Use
**Error:** `Port 8080 is already in use`

**Solution:**
```bash
# Kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Or change port in docker-compose.yml
# Change "8080:8080" to "8081:8080"
```

### JWT Secret Invalid
**Error:** `Invalid JWT secret size`

**Solution:**
Generate a proper base64-encoded 32-byte secret:
```bash
openssl rand -base64 32
```

---

## Production Deployment

### 1. Build Production Docker Image
```bash
docker build -t sabahub-backend:prod -f Dockerfile.prod .
```

### 2. Push to Docker Registry
```bash
docker tag sabahub-backend:prod your-registry/sabahub-backend:prod
docker push your-registry/sabahub-backend:prod
```

### 3. Deploy to Kubernetes (if using)
```bash
kubectl apply -f k8s/deployment.yaml
```

### 4. Set Up SSL/TLS
Use nginx reverse proxy with Let's Encrypt:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Monitoring & Logging

### View Real-time Logs
```bash
docker-compose logs -f sabahub-backend-spring
```

### Check Performance Metrics
```bash
curl http://localhost:8080/actuator/metrics
```

### Database Monitoring
```bash
# MongoDB shell
docker exec -it sabahub-mongo mongosh

# Check collections
db.jobs.find()
db.wallet_ledger.find()
db.withdrawals.find()
```

### Redis Monitoring
```bash
# Redis CLI
docker exec -it sabahub-redis redis-cli

# Check keys
KEYS *
DBSIZE
```

---

## Backup & Recovery

### Backup MongoDB Data
```bash
docker exec sabahub-mongo mongodump --out /backup
docker cp sabahub-mongo:/backup ./mongodb-backup
```

### Restore MongoDB Data
```bash
docker cp ./mongodb-backup sabahub-mongo:/
docker exec sabahub-mongo mongorestore /mongodb-backup
```

### Backup Redis Data
```bash
docker exec sabahub-redis redis-cli BGSAVE
docker cp sabahub-redis:/data/dump.rdb ./redis-backup.rdb
```

---

## Performance Optimization

### Redis Persistence
By default, Redis is configured with `appendonly yes` for data persistence.

### MongoDB Indexing
Indexes are automatically created for common queries:
- `jobs`: employerId, status, categoryId
- `wallet_ledger`: userId
- `withdrawals`: userId, status

### Application Caching
- JWT tokens cached in Redis
- User sessions stored in Redis
- Frequently accessed data cached

---

## Security Checklist

- [x] Redis password protected (should be added in production)
- [x] MongoDB authentication enabled (should be added in production)
- [x] JWT secret stored as environment variable
- [x] CORS properly configured
- [x] SQL injection prevention (using ORM)
- [x] CSRF protection enabled
- [x] Rate limiting configured
- [ ] SSL/TLS enabled (add for production)
- [ ] API key rotation (implement)
- [ ] Regular security audits (schedule)

---

## Support & Documentation

For detailed API documentation, see: [BACKEND_API_REFERENCE.md](./BACKEND_API_REFERENCE.md)

For full implementation details, see: [BACKEND_INTEGRATION_COMPLETE.md](./BACKEND_INTEGRATION_COMPLETE.md)
