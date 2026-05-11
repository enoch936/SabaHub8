# SabaHub8

SabaHub8 is a full-stack freelancer marketplace with a **Next.js 16** frontend and a **Spring Boot 3.3** backend. It ships a complete OTP-based auth flow (email + SMS), role-based access, and a modern UI foundation.

## Repository Layout

- backend-spring/ — Spring Boot backend (Java 21, MongoDB, Redis)
- frontend/ — Next.js 16 app (React 19, Tailwind)
- Documentation: see [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for the full suite

## Quick Start (Local)

### 0) Start Entire Main Project (Recommended)

Requirements for this mode: `tmux` installed.

From repository root:

```bash
./start-main.sh
```

This starts:

- Python AI service (`:8090`)
- Spring Boot backend (`:8080`)
- Next.js frontend (`:3000`)

Utility commands:

```bash
./status-main.sh
./stop-main.sh
```

Live log management:

```bash
tmux attach -t sabahub
```

Inside tmux, each service runs in its own window (`python-ai`, `backend-spring`, `frontend`).

### 1) Backend (Maven)

**Requirements:** Java 21, Maven, MongoDB (local or Atlas), Redis (optional)

```bash
./start-backend.sh
```

This command auto-starts:

- Python AI service (`:8090`)
- Spring Boot backend (`:8080`) with hybrid Python AI enabled

It also runs each service in its own tmux window for live logs.

Default backend URL: <http://localhost:8080>

### 2) Backend (Docker)

**Requirements:** Docker + Docker Compose

```bash
cd backend-spring
docker compose up --build
```

### 3) Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Default frontend URL: <http://localhost:3000>

## Environment Configuration

### Backend (.env)

Edit backend-spring/.env and set the following (examples):

- SPRING_DATA_MONGODB_URI — MongoDB connection string (local or Atlas)
- REDIS_HOST / REDIS_PORT — Redis connection (optional)
- JWT_SECRET — JWT signing key
- OTP_FAKE — set true to log OTPs instead of sending
- SMTP_USERNAME / SMTP_PASSWORD — Gmail SMTP credentials
- TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_VERIFY_SERVICE_SID — Twilio Verify

### Frontend (.env.local)

Edit frontend/.env.local and set:

- NEXT_PUBLIC_API_BASE — backend base URL (e.g. <http://localhost:8080>)

## Key Endpoints

### Health

- GET /health
- GET /actuator/health

### Auth / OTP

All OTP endpoints are under /api/auth/otp:

- POST /api/auth/otp/request-registration
- POST /api/auth/otp/verify-email
- POST /api/auth/otp/request-sms
- POST /api/auth/otp/verify-sms
- POST /api/auth/otp/complete-registration
- POST /api/auth/login

### Swagger

- /swagger-ui.html

## Frontend API Proxy

The frontend includes server routes that proxy to the backend to simplify CORS. See:

- frontend/src/app/api/auth/[...path]/route.ts
- frontend/src/app/api/auth-proxy/[...path]/route.ts

## Services & Features

- **Authentication:** JWT + OTP (email/SMS)
- **Roles:** Admin, Employer, Freelancer
- **User Profiles:** profile editing, avatars
- **Notifications:** UI and API scaffolding
- **Chat UI:** frontend scaffolding (backend endpoints designed)

## Troubleshooting

### MongoDB connection issues

- Verify SPRING_DATA_MONGODB_URI in backend-spring/.env
- For local Mongo, ensure mongod is running or use Docker

### OTP not delivered

- Set OTP_FAKE=true for local testing (OTPs are logged)
- Verify SMTP/Twilio credentials in backend-spring/.env

### Ports in use

- Backend defaults to 8080; update SERVER_PORT if needed
- Frontend defaults to 3000; use NEXT_PUBLIC_API_BASE accordingly

## Related Docs

- [COMPLETE_SYSTEM_SUMMARY.md](COMPLETE_SYSTEM_SUMMARY.md)
- [DEPLOYMENT_AND_OPERATIONS_GUIDE.md](DEPLOYMENT_AND_OPERATIONS_GUIDE.md)
- [API_CONTRACT_SPECIFICATION.md](API_CONTRACT_SPECIFICATION.md)
