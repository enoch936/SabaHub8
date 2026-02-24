# SabaHub System Deployment & Operations Guide
## Production Deployment, Monitoring, and Scaling Strategy

**Version:** 1.0  
**Last Updated:** December 30, 2024  
**Audience:** DevOps Engineers, System Administrators, Operations Team

---

## Table of Contents

1. [Local Development Setup](#1-local-development-setup)
2. [Docker Containerization](#2-docker-containerization)
3. [Staging Environment](#3-staging-environment)
4. [Production Deployment](#4-production-deployment)
5. [Monitoring & Observability](#5-monitoring--observability)
6. [Scaling Strategy](#6-scaling-strategy)
7. [Disaster Recovery](#7-disaster-recovery)
8. [Security Hardening](#8-security-hardening)
9. [Performance Tuning](#9-performance-tuning)
10. [Troubleshooting Guide](#10-troubleshooting-guide)

---

## 1. Local Development Setup

### 1.1 Prerequisites

```bash
# Check required tools
java -version          # OpenJDK 17+
node --version        # Node 18+
npm --version         # npm 9+
docker --version      # Docker 20.10+
docker-compose --version  # Docker Compose 2.0+

# Install additional tools
brew install git                    # macOS
brew install postgresql            # PostgreSQL client
brew install redis-cli              # Redis client
```

### 1.2 Environment Setup

```bash
# Clone repository
git clone https://github.com/sabahub/sabahub.git
cd sabahub

# Backend setup
cd backend-spring
cp .env.example .env
# Edit .env with local development values

# Frontend setup
cd ../frontend
cp .env.example .env.local
# Edit .env.local with development API URLs
```

### 1.3 Backend Local Development

```bash
cd backend-spring

# Start backend with Maven
./mvnw spring-boot:run

# Or with IDE
# In IntelliJ: Run → Edit Configurations → Add Spring Boot Application

# Backend URL: http://localhost:8080
# Actuator: http://localhost:8080/actuator
```

### 1.4 Frontend Local Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend URL: http://localhost:3000
```

### 1.5 Local Database Setup (Docker)

```bash
# Start MongoDB
docker run -d \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  --name sabahub-mongodb \
  mongo:6.0

# Start PostgreSQL (optional for local testing)
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_USER=sabahub \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=sabahub \
  --name sabahub-postgres \
  postgres:15
```

---

## 2. Docker Containerization

### 2.1 Backend Dockerfile

```dockerfile
# Dockerfile (backend-spring/Dockerfile)
FROM eclipse-temurin:17-jdk-focal AS build

WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-focal

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080
ENTRYPOINT ["java", "-Xmx512m", "-jar", "app.jar"]
```

### 2.2 Frontend Dockerfile

```dockerfile
# Dockerfile (frontend/Dockerfile)
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY package.json ./

USER node

EXPOSE 3000
CMD ["npm", "start"]
```

### 2.3 Docker Compose Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend-spring
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATA_MONGODB_URI=mongodb://mongo:27017/sabahub
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_VERIFY_SERVICE_SID=${TWILIO_VERIFY_SERVICE_SID}
    depends_on:
      - mongo
    networks:
      - sabahub-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE=http://localhost:8080
      - BACKEND_URL=http://backend:8080
    depends_on:
      - backend
    networks:
      - sabahub-network

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongo_data:/data/db
    networks:
      - sabahub-network

networks:
  sabahub-network:
    driver: bridge

volumes:
  mongo_data:
```

### 2.4 Build & Run Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

---

## 3. Staging Environment

### 3.1 Staging Deployment on AWS EC2

```bash
#!/bin/bash
# staging-deploy.sh

set -e

echo "Starting SabaHub Staging Deployment..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Clone repository
git clone https://github.com/sabahub/sabahub.git
cd sabahub

# Configure staging environment
cat > .env.staging << EOF
SPRING_PROFILES_ACTIVE=staging
SPRING_DATA_MONGODB_URI=mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}/sabahub
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
TWILIO_VERIFY_SERVICE_SID=${TWILIO_VERIFY_SERVICE_SID}
JWT_SECRET=$(openssl rand -base64 32)
EOF

# Build Docker images
docker-compose -f docker-compose.staging.yml build

# Start services
docker-compose -f docker-compose.staging.yml up -d

# Wait for services to be ready
sleep 30

# Run health checks
curl http://localhost:8080/actuator/health
curl http://localhost:3000

echo "Staging deployment complete!"
echo "Backend: http://staging.api.sabahub.com"
echo "Frontend: http://staging.sabahub.com"
```

### 3.2 Staging Monitoring

```bash
# Health check endpoint
curl http://staging.api.sabahub.com/actuator/health

# Database connectivity
curl http://staging.api.sabahub.com/actuator/health/db

# Application metrics
curl http://staging.api.sabahub.com/actuator/metrics

# Check logs
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 frontend
```

---

## 4. Production Deployment

### 4.1 Kubernetes Cluster Setup

```bash
# Create EKS cluster on AWS
eksctl create cluster \
  --name sabahub-prod \
  --version 1.28 \
  --region us-east-1 \
  --nodegroup-name sabahub-nodes \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --node-type t3.medium

# Configure kubectl
aws eks update-kubeconfig \
  --region us-east-1 \
  --name sabahub-prod
```

### 4.2 Production Kubernetes Manifests

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sabahub-backend
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: sabahub-backend
  template:
    metadata:
      labels:
        app: sabahub-backend
    spec:
      containers:
      - name: backend
        image: sabahub/backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: SPRING_DATA_MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: sabahub-secrets
              key: mongo-uri
        - name: TWILIO_ACCOUNT_SID
          valueFrom:
            secretKeyRef:
              name: sabahub-secrets
              key: twilio-account-sid
        - name: TWILIO_AUTH_TOKEN
          valueFrom:
            secretKeyRef:
              name: sabahub-secrets
              key: twilio-auth-token
        - name: TWILIO_VERIFY_SERVICE_SID
          valueFrom:
            secretKeyRef:
              name: sabahub-secrets
              key: twilio-verify-sid
        
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
        
        volumeMounts:
        - name: logs
          mountPath: /app/logs
      
      volumes:
      - name: logs
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: sabahub-backend-service
  namespace: production
spec:
  selector:
    app: sabahub-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer

---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sabahub-backend-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sabahub-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 4.3 Production Deployment Commands

```bash
# Create secrets
kubectl create secret generic sabahub-secrets \
  --from-literal=mongo-uri="${MONGO_URI}" \
  --from-literal=twilio-account-sid="${TWILIO_ACCOUNT_SID}" \
  --from-literal=twilio-auth-token="${TWILIO_AUTH_TOKEN}" \
  --from-literal=twilio-verify-sid="${TWILIO_VERIFY_SERVICE_SID}" \
  -n production

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Check deployment status
kubectl rollout status deployment/sabahub-backend -n production

# View pods
kubectl get pods -n production

# View logs
kubectl logs -f deployment/sabahub-backend -n production
```

---

## 5. Monitoring & Observability

### 5.1 Prometheus Metrics Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - 'alert_rules.yml'

scrape_configs:
  - job_name: 'sabahub-backend'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/actuator/prometheus'

  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

### 5.2 Alert Rules

```yaml
# alert_rules.yml
groups:
  - name: sabahub_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
      
      - alert: HighCPUUsage
        expr: container_cpu_usage_seconds_total > 0.8
        for: 5m
        annotations:
          summary: "High CPU usage"
      
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85
        for: 5m
        annotations:
          summary: "High memory usage"
      
      - alert: DatabaseConnectionFailed
        expr: up{job="mongodb"} == 0
        for: 1m
        annotations:
          summary: "Database connection failed"
```

### 5.3 Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "SabaHub Production Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_server_requests_seconds_count[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_server_requests_seconds_count{status=~'5..'}[5m])"
          }
        ]
      },
      {
        "title": "Response Time P95",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_server_requests_seconds_bucket)"
          }
        ]
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "gauge_active_users"
          }
        ]
      }
    ]
  }
}
```

### 5.4 ELK Stack Configuration (Elasticsearch, Logstash, Kibana)

```yaml
# logstash.conf
input {
  tcp {
    port => 5000
    codec => json
  }
}

filter {
  if [type] == "java-springboot" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "sabahub-%{+YYYY.MM.dd}"
  }
}
```

---

## 6. Scaling Strategy

### 6.1 Horizontal Scaling

```bash
# Scale backend replicas
kubectl scale deployment sabahub-backend \
  --replicas=5 \
  -n production

# Verify scaling
kubectl get deployment sabahub-backend -n production
kubectl get pods -n production
```

### 6.2 Vertical Scaling

```yaml
# Update resource limits
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sabahub-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        resources:
          requests:
            cpu: 1000m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 2Gi
```

### 6.3 Database Scaling

```bash
# PostgreSQL Read Replicas (AWS RDS)
aws rds create-db-instance-read-replica \
  --db-instance-identifier sabahub-prod-read-1 \
  --source-db-instance-identifier sabahub-prod

# MongoDB Sharding Setup
mongosh admin
sh.enableSharding("sabahub")
sh.shardCollection("sabahub.jobs", {"_id": "hashed"})
```

### 6.4 Cache Layer Scaling (Redis)

```bash
# Redis Cluster Setup (6 nodes)
redis-cli --cluster create \
  node1:6379 node2:6379 node3:6379 \
  node4:6379 node5:6379 node6:6379 \
  --cluster-replicas 1

# Connection in Spring Boot
spring:
  redis:
    cluster:
      nodes:
        - node1:6379
        - node2:6379
        - node3:6379
```

---

## 7. Disaster Recovery

### 7.1 Backup Strategy

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/sabahub"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# MongoDB backup
mongodump \
  --uri="${MONGO_URI}" \
  --out="${BACKUP_DIR}/mongo_${TIMESTAMP}"

# PostgreSQL backup
pg_dump \
  -h "${PG_HOST}" \
  -U "${PG_USER}" \
  -d sabahub \
  > "${BACKUP_DIR}/pg_${TIMESTAMP}.sql"

# Upload to S3
aws s3 sync \
  "${BACKUP_DIR}" \
  "s3://sabahub-backups/" \
  --delete

# Keep only last 30 days
find "${BACKUP_DIR}" -type f -mtime +30 -delete

echo "Backup completed: ${TIMESTAMP}"
```

### 7.2 Restore from Backup

```bash
#!/bin/bash
# restore.sh

BACKUP_TIMESTAMP=$1  # e.g., 20241230_120000

# Restore MongoDB
mongorestore \
  --uri="${MONGO_URI}" \
  "/backups/sabahub/mongo_${BACKUP_TIMESTAMP}"

# Restore PostgreSQL
psql \
  -h "${PG_HOST}" \
  -U "${PG_USER}" \
  -d sabahub \
  < "/backups/sabahub/pg_${BACKUP_TIMESTAMP}.sql"

echo "Restore completed from backup: ${BACKUP_TIMESTAMP}"
```

### 7.3 Multi-Region Failover

```yaml
# AWS Route53 Health Check
{
  "Type": "health_check",
  "Properties": {
    "HealthCheckConfig": {
      "Type": "HTTPS",
      "ResourcePath": "/actuator/health",
      "FullyQualifiedDomainName": "api-us-east-1.sabahub.com",
      "Port": 443,
      "RequestInterval": 30,
      "FailureThreshold": 3
    }
  }
}

# Route53 Failover Policy
{
  "Action": "failover",
  "Region": "us-west-2",
  "OnFailure": "activate"
}
```

---

## 8. Security Hardening

### 8.1 SSL/TLS Certificate Management

```bash
# Let's Encrypt with Cert-Manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create Certificate
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: sabahub-tls
  namespace: production
spec:
  secretName: sabahub-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - api.sabahub.com
    - sabahub.com
```

### 8.2 Network Security

```yaml
# Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sabahub-network-policy
spec:
  podSelector:
    matchLabels:
      app: sabahub-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: production
    - podSelector:
        matchLabels:
          app: sabahub-frontend
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 27017  # MongoDB
    - protocol: TCP
      port: 5432   # PostgreSQL
```

### 8.3 Secrets Management (HashiCorp Vault)

```bash
# Initialize Vault
vault operator init \
  -key-shares=5 \
  -key-threshold=3

# Store secrets
vault kv put secret/sabahub/prod \
  mongo-uri="${MONGO_URI}" \
  twilio-account-sid="${TWILIO_ACCOUNT_SID}" \
  jwt-secret=$(openssl rand -base64 32)

# Retrieve secrets
vault kv get secret/sabahub/prod
```

---

## 9. Performance Tuning

### 9.1 Spring Boot JVM Tuning

```bash
# JVM Options
JAVA_OPTS="-Xms512m -Xmx2g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+ParallelRefProcEnabled \
  -XX:+AlwaysPreTouch \
  -XX:+UnlockDiagnosticVMOptions \
  -XX:G1SummarizeRSetStatsPeriod=1"
```

### 9.2 Database Query Optimization

```sql
-- Add indexes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_proposals_job_id ON proposals(job_id);
CREATE INDEX idx_proposals_freelancer_id ON proposals(freelancer_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at);

-- Monitor slow queries
EXPLAIN ANALYZE
SELECT * FROM jobs 
WHERE category = 'WEB_DEVELOPMENT' 
  AND status = 'OPEN'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

### 9.3 Nginx Configuration for Frontend

```nginx
# /etc/nginx/nginx.conf
upstream frontend {
    server frontend-pod-1:3000;
    server frontend-pod-2:3000;
    server frontend-pod-3:3000;
}

server {
    listen 80;
    server_name sabahub.com www.sabahub.com;

    # Compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1000;

    # Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 10. Troubleshooting Guide

### 10.1 Common Issues & Solutions

**Issue: Backend Pod Not Starting**
```bash
# Check pod status
kubectl describe pod sabahub-backend-xxxx -n production

# Check logs
kubectl logs sabahub-backend-xxxx -n production --previous

# Solution: Usually environment variables or resource constraints
kubectl edit deployment sabahub-backend -n production
```

**Issue: High Latency**
```bash
# Check database connection
curl http://localhost:8080/actuator/health/db

# Check cache hit ratio
redis-cli INFO stats | grep keyspace_hits

# Solution: Add caching or optimize queries
```

**Issue: Memory Leak**
```bash
# Check memory usage over time
kubectl top pod sabahub-backend-xxxx -n production --containers

# Generate heap dump
jmap -dump:live,format=b,file=heap.bin <pid>

# Analyze with Eclipse Memory Analyzer
```

**Issue: Database Replication Lag**
```bash
# Check replica status
psql -c "SELECT slot_name, active FROM pg_replication_slots;"

# Check lag in MongoDB
db.runCommand( { dbStats: 1 } )

# Solution: Increase replication buffer or optimize writes
```

### 10.2 Performance Diagnosis

```bash
# Check all metrics
kubectl top nodes
kubectl top pods -n production

# CPU profiling
jcmd <pid> JFR.start duration=60s filename=profile.jfr
jcmd <pid> JFR.dump filename=profile.jfr

# Analyze with JFR
java -jar jfr-viewer.jar profile.jfr
```

---

## 11. Deployment Checklist

Before deploying to production:

```
Pre-Deployment:
  ✅ Code review complete
  ✅ All tests passing (unit, integration, e2e)
  ✅ Security scan passed (no critical vulnerabilities)
  ✅ Performance tested (load test passed)
  ✅ Database migrations tested on staging
  ✅ Backup taken before deployment
  ✅ Incident response team on standby
  ✅ Communication sent to stakeholders

Deployment:
  ✅ Deploy to staging first
  ✅ Run smoke tests on staging
  ✅ Get approval for production deployment
  ✅ Update DNS/load balancer during maintenance window
  ✅ Monitor deployment progress
  ✅ Verify all services are healthy
  ✅ Run post-deployment tests

Post-Deployment:
  ✅ Monitor error rates
  ✅ Check database replication
  ✅ Verify payment processing
  ✅ Monitor user sessions
  ✅ Update status page
  ✅ Send confirmation to stakeholders
  ✅ Keep team available for 2 hours
```

---

## 12. Runbooks

### Emergency Rollback

```bash
# Quick rollback to previous version
kubectl rollout undo deployment/sabahub-backend -n production
kubectl rollout status deployment/sabahub-backend -n production
```

### Database Emergency Restore

```bash
# If data corruption detected
kubectl exec -it mongo-pod -- mongorestore \
  --uri="${MONGO_URI}" \
  --drop \
  /backup/mongo_latest
```

### Enable Maintenance Mode

```yaml
# scale down to single instance for maintenance
kubectl patch deployment sabahub-backend \
  -p '{"spec":{"replicas":1}}' \
  -n production
```

---

**Document Version:** 1.0  
**Last Updated:** December 30, 2024  
**Owner:** DevOps & Infrastructure Team  
**Next Review:** January 31, 2025  

For support: devops@sabahub.com | #devops Slack channel
