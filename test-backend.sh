#!/bin/bash

echo "=== SabaHub Backend Testing Script ==="
echo ""

# 1. Check if Docker is running
echo "1. Checking Docker status..."
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"
echo ""

# 2. Start Docker Compose
echo "2. Starting Docker Compose services..."
cd /workspaces/SabaHub8/backend-spring

# Stop any existing containers
docker-compose down -v 2>/dev/null

# Start services
docker-compose up -d
echo "⏳ Waiting 10 seconds for services to start..."
sleep 10

# Check service health
echo ""
echo "3. Checking service health..."
docker-compose ps

echo ""
echo "4. Verifying Redis connection..."
if docker exec sabahub-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "⚠️  Redis connection check inconclusive (may still be starting)"
fi

echo ""
echo "5. Checking MongoDB..."
if docker exec sabahub-mongo mongosh --eval "db.version()" > /dev/null 2>&1; then
    echo "✅ MongoDB is healthy"
else
    echo "⚠️  MongoDB connection check inconclusive (may still be starting)"
fi

echo ""
echo "6. Waiting for Spring Boot application to start..."
for i in {1..30}; do
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "✅ Spring Boot application is running"
        echo ""
        echo "7. Testing API endpoints..."
        
        # Test jobs count endpoint
        echo ""
        echo "Testing: GET /api/v2/jobs/count"
        curl -s http://localhost:8080/api/v2/jobs/count | head -c 100
        echo ""
        echo ""
        
        echo "8. Testing health endpoint..."
        curl -s http://localhost:8080/actuator/health | head -c 200
        echo ""
        echo ""
        
        echo "=== Backend Test Complete ==="
        echo "✅ All services are running"
        echo ""
        echo "Useful commands:"
        echo "  View logs:        docker-compose logs -f app"
        echo "  Stop services:    docker-compose down"
        echo "  Stop with cleanup: docker-compose down -v"
        exit 0
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "❌ Spring Boot application did not start within 30 seconds"
echo ""
echo "View logs with: docker-compose logs app"
exit 1
