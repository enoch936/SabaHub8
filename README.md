# SabaHub8

This repository contains a frontend (Next.js) and a Spring Boot backend.

Backend (Spring Boot)
- Location: ./backend-spring
- Run: cd backend-spring && mvn spring-boot:run
- Docker: cd backend-spring && docker compose up --build
- Endpoints:
  - GET / -> "Hello World!"
  - GET /health -> "OK"
  - GET /actuator/health -> Spring health endpoint
  - OpenAPI: /swagger-ui.html
  - Assets API:
    - GET /assets
    - GET /assets/{id}
    - POST /assets (multipart: title, file)
    - DELETE /assets/{id}

Frontend
- cd frontend && npm install && npm run dev

Notes
- The legacy NestJS backend has been removed. The Spring backend listens on port 3000 to minimize frontend changes.
- Set Cloudinary and MongoDB env vars as documented in backend-spring/README.md.
