SabaHub Spring Boot backend

Features
- REST endpoints:
  - GET / -> "Hello World!"
  - GET /health -> "OK"
  - GET /actuator/health -> Spring health endpoint
  - Assets API:
    - GET /assets -> list stored assets (from Mongo)
    - POST /assets (multipart) -> upload a file to Cloudinary and store metadata in MongoDB
- MongoDB persistence via Spring Data MongoDB
- Cloudinary integration for media uploads
- CORS enabled for localhost frontends
- OpenAPI at /swagger-ui.html
- Runs on port 3000

Requirements
- Java 17+
- Maven 3.9+
- MongoDB (local or cloud) accessible via MONGODB_URI
- Cloudinary account and API credentials

Configuration (env vars)
- MONGODB_URI=mongodb://localhost:27017/sabahub
- CLOUDINARY_CLOUD_NAME=your_cloud
- CLOUDINARY_API_KEY=your_key
- CLOUDINARY_API_SECRET=your_secret
- APP_CORS_ALLOWED_ORIGINS (optional): comma-separated list, defaults to http://localhost:3000,http://localhost:5173

Run
- mvn spring-boot:run

Test endpoints
- curl http://localhost:3000/
- curl http://localhost:3000/health
- curl http://localhost:3000/actuator/health
- curl http://localhost:3000/assets
- curl -X POST http://localhost:3000/assets \
  -F title="example" \
  -F file=@/path/to/file.png

Build a jar
- mvn -DskipTests package
- java -jar target/backend-spring-0.0.1-SNAPSHOT.jar

Notes on migration
- Keep the old Nest backend (./backend) until you fully switch the frontend and infra to the Spring service.
- The Spring app listens on port 3000 matching the previous Nest dev setup, minimizing frontend changes.
